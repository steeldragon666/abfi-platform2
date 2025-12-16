/**
 * Evidence Chain Utilities
 * Cryptographic file hashing, upload, and integrity verification
 * Enhanced with timestamped confidence hashing for audit trails
 */

import crypto from "crypto";
import { storagePut } from "./storage.js";

// =============================================================================
// ENHANCED TIMESTAMPED HASHING SYSTEM
// =============================================================================

/**
 * Timestamp proof structure for immutable audit trail
 */
export interface TimestampProof {
  hash: string;
  timestamp: string; // ISO 8601 format
  timestampUnix: number; // Unix timestamp for efficient comparison
  nonce: string; // Random nonce for uniqueness
  algorithm: "SHA-256";
  version: "1.0";
  chainHash?: string; // Optional link to previous hash in chain
  metadata?: {
    source: string;
    entityType: string;
    entityId: string | number;
  };
}

/**
 * Confidence-weighted hash result
 */
export interface ConfidenceHash {
  proof: TimestampProof;
  confidenceScore: number; // 0-100
  confidenceFactors: {
    temporalProximity: number; // How recent is the data?
    dataCompleteness: number; // How complete is the dataset?
    verificationLevel: number; // Third-party vs self-declared
    chainIntegrity: number; // Is the hash chain unbroken?
  };
  signature: string; // HMAC signature for tamper detection
}

/**
 * Generate cryptographically secure nonce
 */
function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Get current timestamp in ISO 8601 format with microseconds
 */
function getTimestamp(): { iso: string; unix: number } {
  const now = new Date();
  return {
    iso: now.toISOString(),
    unix: now.getTime(),
  };
}

/**
 * Calculate SHA-256 hash with timestamp embedding
 * Creates an immutable proof that data existed at a specific time
 */
export function calculateTimestampedHash(
  data: Buffer | string,
  metadata?: { source: string; entityType: string; entityId: string | number },
  chainHash?: string
): TimestampProof {
  const timestamp = getTimestamp();
  const nonce = generateNonce();

  // Create deterministic input: data + timestamp + nonce + optional chain
  const dataBuffer = typeof data === "string" ? Buffer.from(data) : data;
  const timestampBuffer = Buffer.from(timestamp.iso);
  const nonceBuffer = Buffer.from(nonce);
  const chainBuffer = chainHash ? Buffer.from(chainHash) : Buffer.alloc(0);

  // Concatenate all components
  const combined = Buffer.concat([
    dataBuffer,
    timestampBuffer,
    nonceBuffer,
    chainBuffer,
  ]);

  const hash = crypto.createHash("sha256").update(combined).digest("hex");

  return {
    hash,
    timestamp: timestamp.iso,
    timestampUnix: timestamp.unix,
    nonce,
    algorithm: "SHA-256",
    version: "1.0",
    chainHash,
    metadata,
  };
}

/**
 * Verify a timestamped hash proof
 * Recreates the hash from components to verify integrity
 */
export function verifyTimestampedHash(
  data: Buffer | string,
  proof: TimestampProof
): { valid: boolean; error?: string } {
  try {
    const dataBuffer = typeof data === "string" ? Buffer.from(data) : data;
    const timestampBuffer = Buffer.from(proof.timestamp);
    const nonceBuffer = Buffer.from(proof.nonce);
    const chainBuffer = proof.chainHash
      ? Buffer.from(proof.chainHash)
      : Buffer.alloc(0);

    const combined = Buffer.concat([
      dataBuffer,
      timestampBuffer,
      nonceBuffer,
      chainBuffer,
    ]);

    const expectedHash = crypto
      .createHash("sha256")
      .update(combined)
      .digest("hex");

    if (expectedHash !== proof.hash) {
      return { valid: false, error: "Hash mismatch - data may have been tampered" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Verification failed: ${error}` };
  }
}

/**
 * Calculate confidence score based on temporal and data factors
 */
export function calculateConfidenceScore(
  proof: TimestampProof,
  options: {
    dataCompleteness?: number; // 0-100, percentage of required fields present
    verificationLevel?: "self_declared" | "platform_verified" | "third_party_verified";
    hasValidChain?: boolean;
    maxAgeHours?: number; // Data older than this gets reduced confidence
  } = {}
): {
  score: number;
  factors: ConfidenceHash["confidenceFactors"];
} {
  const {
    dataCompleteness = 100,
    verificationLevel = "self_declared",
    hasValidChain = true,
    maxAgeHours = 24 * 30, // 30 days default
  } = options;

  // Calculate temporal proximity (100 = just now, decreases over time)
  const ageMs = Date.now() - proof.timestampUnix;
  const ageHours = ageMs / (1000 * 60 * 60);
  const temporalProximity = Math.max(
    0,
    Math.min(100, 100 - (ageHours / maxAgeHours) * 100)
  );

  // Verification level scoring
  const verificationScores = {
    self_declared: 40,
    platform_verified: 70,
    third_party_verified: 100,
  };
  const verificationScore = verificationScores[verificationLevel];

  // Chain integrity score
  const chainIntegrity = hasValidChain ? 100 : 50;

  // Weighted average (verification has highest weight for financial applications)
  const weights = {
    temporalProximity: 0.15,
    dataCompleteness: 0.25,
    verificationLevel: 0.40,
    chainIntegrity: 0.20,
  };

  const score = Math.round(
    temporalProximity * weights.temporalProximity +
      dataCompleteness * weights.dataCompleteness +
      verificationScore * weights.verificationLevel +
      chainIntegrity * weights.chainIntegrity
  );

  return {
    score,
    factors: {
      temporalProximity: Math.round(temporalProximity),
      dataCompleteness: Math.round(dataCompleteness),
      verificationLevel: verificationScore,
      chainIntegrity,
    },
  };
}

/**
 * Generate HMAC signature for tamper detection
 */
function generateHmacSignature(
  proof: TimestampProof,
  secretKey: string = process.env.HASH_SECRET_KEY || "abfi-default-key"
): string {
  const payload = JSON.stringify({
    hash: proof.hash,
    timestamp: proof.timestamp,
    nonce: proof.nonce,
  });

  return crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
}

/**
 * Create a full confidence hash with all components
 */
export function createConfidenceHash(
  data: Buffer | string,
  options: {
    metadata?: { source: string; entityType: string; entityId: string | number };
    chainHash?: string;
    dataCompleteness?: number;
    verificationLevel?: "self_declared" | "platform_verified" | "third_party_verified";
  } = {}
): ConfidenceHash {
  const proof = calculateTimestampedHash(
    data,
    options.metadata,
    options.chainHash
  );

  const { score, factors } = calculateConfidenceScore(proof, {
    dataCompleteness: options.dataCompleteness,
    verificationLevel: options.verificationLevel,
    hasValidChain: !!options.chainHash || true,
  });

  const signature = generateHmacSignature(proof);

  return {
    proof,
    confidenceScore: score,
    confidenceFactors: factors,
    signature,
  };
}

/**
 * Verify a confidence hash including signature
 */
export function verifyConfidenceHash(
  data: Buffer | string,
  confidenceHash: ConfidenceHash,
  secretKey?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verify the timestamped proof
  const proofResult = verifyTimestampedHash(data, confidenceHash.proof);
  if (!proofResult.valid) {
    errors.push(proofResult.error || "Proof verification failed");
  }

  // Verify HMAC signature
  const expectedSignature = generateHmacSignature(
    confidenceHash.proof,
    secretKey
  );
  if (expectedSignature !== confidenceHash.signature) {
    errors.push("HMAC signature mismatch - proof may have been tampered");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build a hash chain for sequential evidence items
 */
export function buildHashChain(
  items: Array<{ id: string | number; data: Buffer | string }>,
  metadata: { source: string; entityType: string }
): TimestampProof[] {
  const chain: TimestampProof[] = [];
  let previousHash: string | undefined;

  for (const item of items) {
    const proof = calculateTimestampedHash(
      item.data,
      { ...metadata, entityId: item.id },
      previousHash
    );
    chain.push(proof);
    previousHash = proof.hash;
  }

  return chain;
}

/**
 * Verify integrity of entire hash chain
 */
export function verifyHashChain(
  items: Array<{ id: string | number; data: Buffer | string }>,
  chain: TimestampProof[]
): { valid: boolean; brokenAt?: number; error?: string } {
  if (items.length !== chain.length) {
    return { valid: false, error: "Chain length mismatch" };
  }

  for (let i = 0; i < items.length; i++) {
    const expectedChainHash = i > 0 ? chain[i - 1].hash : undefined;

    // Verify chain linkage
    if (chain[i].chainHash !== expectedChainHash) {
      return {
        valid: false,
        brokenAt: i,
        error: `Chain broken at index ${i}: expected chainHash ${expectedChainHash}, got ${chain[i].chainHash}`,
      };
    }

    // Verify individual proof
    const result = verifyTimestampedHash(items[i].data, chain[i]);
    if (!result.valid) {
      return { valid: false, brokenAt: i, error: result.error };
    }
  }

  return { valid: true };
}

// =============================================================================
// ORIGINAL EVIDENCE FUNCTIONS (ENHANCED)
// =============================================================================

/**
 * Calculate SHA-256 hash of file buffer
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Verify file integrity by comparing hash
 */
export function verifyFileHash(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = calculateFileHash(buffer);
  return actualHash === expectedHash;
}

/**
 * Upload evidence file to S3 with hash-based key
 * Returns { fileUrl, fileHash, fileSize }
 */
export async function uploadEvidenceFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<{ fileUrl: string; fileHash: string; fileSize: number }> {
  // Calculate hash first
  const fileHash = calculateFileHash(buffer);
  const fileSize = buffer.length;

  // Generate S3 key using hash (prevents enumeration, ensures uniqueness)
  const extension = originalFilename.split(".").pop() || "bin";
  const fileKey = `evidence/${fileHash.substring(0, 2)}/${fileHash}.${extension}`;

  // Upload to S3
  const { url } = await storagePut(fileKey, buffer, mimeType);

  return {
    fileUrl: url,
    fileHash,
    fileSize,
  };
}

/**
 * Generate snapshot hash for certificate immutability
 * Combines score data and evidence set into deterministic hash
 */
export function generateSnapshotHash(
  frozenScoreData: Record<string, any>,
  frozenEvidenceSet: Array<{ evidenceId: number; fileHash: string }>
): string {
  // Create deterministic JSON string (sorted keys)
  const scoreString = JSON.stringify(
    frozenScoreData,
    Object.keys(frozenScoreData).sort()
  );
  const evidenceString = JSON.stringify(
    frozenEvidenceSet
      .map(e => ({ id: e.evidenceId, hash: e.fileHash }))
      .sort((a, b) => a.id - b.id)
  );

  const combined = scoreString + evidenceString;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Verify snapshot integrity
 */
export function verifySnapshotHash(
  frozenScoreData: Record<string, any>,
  frozenEvidenceSet: Array<{ evidenceId: number; fileHash: string }>,
  expectedHash: string
): boolean {
  const actualHash = generateSnapshotHash(frozenScoreData, frozenEvidenceSet);
  return actualHash === expectedHash;
}

/**
 * Evidence type metadata schemas
 * Defines required fields for each evidence type
 */
export const EVIDENCE_TYPE_SCHEMAS = {
  lab_test: {
    required: ["testMethod", "standardReference", "sampleId"],
    optional: ["testResults", "labAccreditation"],
  },
  audit_report: {
    required: ["auditStandard", "auditScope", "findingsSummary"],
    optional: ["nonConformities", "recommendations"],
  },
  registry_cert: {
    required: ["certificationScheme", "registryNumber", "scope"],
    optional: ["accreditationBody"],
  },
  contract: {
    required: ["contractType", "parties", "effectiveDate"],
    optional: ["terminationDate", "keyTerms"],
  },
  insurance_policy: {
    required: ["policyNumber", "insurer", "coverageType", "coverageAmount"],
    optional: ["deductible", "exclusions"],
  },
  financial_statement: {
    required: ["statementType", "fiscalYear", "audited"],
    optional: ["auditorName", "opinion"],
  },
  land_title: {
    required: ["titleNumber", "registryAuthority", "landArea"],
    optional: ["encumbrances", "zoning"],
  },
  sustainability_cert: {
    required: ["certificationScheme", "certNumber", "scope"],
    optional: ["ghgReduction", "sustainabilityMetrics"],
  },
  quality_test: {
    required: ["testType", "parameters", "results"],
    optional: ["labName", "methodology"],
  },
  delivery_record: {
    required: ["deliveryDate", "volume", "destination"],
    optional: ["qualityAtDelivery", "transportDetails"],
  },
};

/**
 * Validate evidence metadata against schema
 */
export function validateEvidenceMetadata(
  evidenceType: string,
  metadata: Record<string, any>
): { valid: boolean; errors: string[] } {
  const schema =
    EVIDENCE_TYPE_SCHEMAS[evidenceType as keyof typeof EVIDENCE_TYPE_SCHEMAS];

  if (!schema) {
    return { valid: false, errors: [`Unknown evidence type: ${evidenceType}`] };
  }

  const errors: string[] = [];

  // Check required fields
  for (const field of schema.required) {
    if (
      !(field in metadata) ||
      metadata[field] === null ||
      metadata[field] === undefined
    ) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if evidence is expiring soon
 */
export function isEvidenceExpiringSoon(
  expiryDate: Date | null,
  daysThreshold: number = 30
): boolean {
  if (!expiryDate) return false;

  const now = new Date();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);

  return expiryDate <= threshold && expiryDate > now;
}

/**
 * Check if evidence is expired
 */
export function isEvidenceExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return false;
  return expiryDate < new Date();
}

/**
 * Generate evidence lineage (version history)
 */
export function buildEvidenceLineage(
  currentEvidence: any,
  allEvidence: any[]
): Array<{ id: number; version: number; date: Date; supersededBy?: number }> {
  const lineage: Array<{
    id: number;
    version: number;
    date: Date;
    supersededBy?: number;
  }> = [];

  // Start from current and walk backwards
  let current = currentEvidence;
  while (current) {
    lineage.unshift({
      id: current.id,
      version: current.versionNumber,
      date: current.createdAt,
      supersededBy: current.supersededById,
    });

    // Find predecessor (evidence that was superseded by current)
    const predecessor = allEvidence.find(e => e.supersededById === current.id);
    current = predecessor;
  }

  return lineage;
}
