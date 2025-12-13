/**
 * Evidence Chain Utilities
 * Cryptographic file hashing, upload, and integrity verification
 */

import crypto from "crypto";
import { storagePut } from "./storage.js";

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
  const scoreString = JSON.stringify(frozenScoreData, Object.keys(frozenScoreData).sort());
  const evidenceString = JSON.stringify(
    frozenEvidenceSet.map(e => ({ id: e.evidenceId, hash: e.fileHash })).sort((a, b) => a.id - b.id)
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
  const schema = EVIDENCE_TYPE_SCHEMAS[evidenceType as keyof typeof EVIDENCE_TYPE_SCHEMAS];
  
  if (!schema) {
    return { valid: false, errors: [`Unknown evidence type: ${evidenceType}`] };
  }
  
  const errors: string[] = [];
  
  // Check required fields
  for (const field of schema.required) {
    if (!(field in metadata) || metadata[field] === null || metadata[field] === undefined) {
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
export function isEvidenceExpiringSoon(expiryDate: Date | null, daysThreshold: number = 30): boolean {
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
  const lineage: Array<{ id: number; version: number; date: Date; supersededBy?: number }> = [];
  
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
