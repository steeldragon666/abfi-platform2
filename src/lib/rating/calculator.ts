// ABFI Score Calculation Engine
// Composite score (0-100) from four weighted pillars

import type {
  FeedstockCategory,
  CertificationType,
  SustainabilityInputs,
  QualityInputs,
  ReliabilityInputs,
  AbfiScoreResult,
} from "@/types/database";

// Weights for each pillar
const WEIGHTS = {
  sustainability: 0.3,
  carbonIntensity: 0.3,
  quality: 0.25,
  reliability: 0.15,
};

// Certification tier points
const CERTIFICATION_POINTS: Record<CertificationType | "none", number> = {
  ISCC_EU: 40,
  ISCC_PLUS: 40,
  RSB: 38,
  RED_II: 25,
  ABFI: 30,
  GO: 20,
  OTHER: 10,
  none: 0,
};

/**
 * Calculate Sustainability Score (0-100)
 */
export function calculateSustainabilityScore(
  inputs: SustainabilityInputs
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  // Certification tier (0-40)
  breakdown.certification =
    CERTIFICATION_POINTS[inputs.certification_type || "none"];

  // Land use compliance (0-25)
  breakdown.no_deforestation = inputs.no_deforestation_verified ? 10 : 0;
  breakdown.no_hcv_conversion = inputs.no_hcv_land_conversion ? 8 : 0;
  breakdown.no_peatland = inputs.no_peatland_drainage ? 5 : 0;
  breakdown.indigenous_rights = inputs.indigenous_rights_compliance ? 2 : 0;

  // Social compliance (0-20)
  breakdown.fair_work = inputs.fair_work_certified ? 10 : 0;
  breakdown.community_benefit = inputs.community_benefit_documented ? 5 : 0;
  breakdown.supply_chain_transparency = inputs.supply_chain_transparent ? 5 : 0;

  // Biodiversity & Soil (0-15)
  breakdown.regenerative = inputs.regenerative_practice_certified ? 8 : 0;
  breakdown.soil_carbon = inputs.soil_carbon_measured ? 4 : 0;
  breakdown.biodiversity = inputs.biodiversity_corridor_maintained ? 3 : 0;

  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { score: Math.min(100, score), breakdown };
}

/**
 * Calculate Carbon Intensity Score (0-100)
 * Based on gCO2e/MJ, benchmarked against RED II fossil fuel comparator (94 gCO2e/MJ)
 */
export function calculateCarbonIntensityScore(ciValue: number): {
  score: number;
  rating: string;
} {
  let score: number;
  let rating: string;

  if (ciValue < 10) {
    score = 95 + (10 - ciValue) * 0.5;
    rating = "A+";
  } else if (ciValue < 20) {
    score = 85 + (20 - ciValue);
    rating = "A";
  } else if (ciValue < 30) {
    score = 75 + (30 - ciValue);
    rating = "B+";
  } else if (ciValue < 40) {
    score = 65 + (40 - ciValue);
    rating = "B";
  } else if (ciValue < 50) {
    score = 55 + (50 - ciValue);
    rating = "C+";
  } else if (ciValue < 60) {
    score = 45 + (60 - ciValue);
    rating = "C";
  } else if (ciValue < 70) {
    score = 35 + (70 - ciValue);
    rating = "D";
  } else {
    score = Math.max(0, 35 - (ciValue - 70));
    rating = "F";
  }

  return { score: Math.min(100, Math.max(0, score)), rating };
}

// Quality specifications by feedstock category
const QUALITY_SPECS: Record<
  FeedstockCategory,
  Record<
    string,
    { optimal: number; acceptable: number; max: boolean; points: number }
  >
> = {
  oilseed: {
    oil_content: { optimal: 42, acceptable: 38, max: true, points: 25 },
    free_fatty_acid: { optimal: 2, acceptable: 4, max: false, points: 25 },
    moisture: { optimal: 8, acceptable: 10, max: false, points: 20 },
    impurities: { optimal: 2, acceptable: 4, max: false, points: 15 },
    phosphorus: { optimal: 15, acceptable: 30, max: false, points: 15 },
  },
  UCO: {
    free_fatty_acid: { optimal: 5, acceptable: 15, max: false, points: 30 },
    moisture: { optimal: 0.5, acceptable: 1, max: false, points: 25 },
    impurities: { optimal: 1, acceptable: 2, max: false, points: 20 },
    iodine_value: { optimal: 100, acceptable: 80, max: true, points: 15 },
    miu: { optimal: 3, acceptable: 5, max: false, points: 10 },
  },
  tallow: {
    free_fatty_acid: { optimal: 5, acceptable: 15, max: false, points: 30 },
    moisture: { optimal: 0.5, acceptable: 1, max: false, points: 25 },
    titre: { optimal: 43, acceptable: 40, max: true, points: 20 },
    impurities: { optimal: 0.5, acceptable: 1, max: false, points: 15 },
    category: { optimal: 3, acceptable: 2, max: true, points: 10 },
  },
  lignocellulosic: {
    moisture: { optimal: 15, acceptable: 25, max: false, points: 25 },
    ash_content: { optimal: 5, acceptable: 10, max: false, points: 25 },
    calorific_value: { optimal: 18, acceptable: 15, max: true, points: 20 },
    particle_consistency: { optimal: 90, acceptable: 80, max: true, points: 15 },
    contaminants: { optimal: 100, acceptable: 80, max: true, points: 15 },
  },
  waste: {
    contamination_rate: { optimal: 3, acceptable: 8, max: false, points: 30 },
    organic_content: { optimal: 90, acceptable: 80, max: true, points: 25 },
    moisture: { optimal: 60, acceptable: 75, max: false, points: 20 },
    homogeneity: { optimal: 90, acceptable: 70, max: true, points: 15 },
    heavy_metals: { optimal: 100, acceptable: 80, max: true, points: 10 },
  },
  algae: {
    lipid_content: { optimal: 30, acceptable: 20, max: true, points: 30 },
    moisture: { optimal: 10, acceptable: 20, max: false, points: 25 },
    ash_content: { optimal: 10, acceptable: 15, max: false, points: 20 },
    protein_content: { optimal: 50, acceptable: 40, max: true, points: 15 },
    contamination: { optimal: 2, acceptable: 5, max: false, points: 10 },
  },
  bamboo: {
    moisture: { optimal: 12, acceptable: 18, max: false, points: 25 },
    ash_content: { optimal: 3, acceptable: 6, max: false, points: 25 },
    calorific_value: { optimal: 19, acceptable: 16, max: true, points: 25 },
    fiber_content: { optimal: 60, acceptable: 50, max: true, points: 15 },
    lignin_content: { optimal: 25, acceptable: 20, max: true, points: 10 },
  },
  other: {
    general_quality: { optimal: 90, acceptable: 70, max: true, points: 100 },
  },
};

/**
 * Calculate Quality Score (0-100)
 */
export function calculateQualityScore(inputs: QualityInputs): {
  score: number;
  breakdown: Record<string, number>;
} {
  const specs = QUALITY_SPECS[inputs.category];
  const breakdown: Record<string, number> = {};
  let totalScore = 0;

  for (const [param, spec] of Object.entries(specs)) {
    const value = inputs.parameters[param];
    if (value === undefined) {
      breakdown[param] = 0;
      continue;
    }

    let paramScore: number;

    if (spec.max) {
      // Higher is better
      if (value >= spec.optimal) {
        paramScore = spec.points;
      } else if (value >= spec.acceptable) {
        paramScore =
          spec.points *
          ((value - spec.acceptable) / (spec.optimal - spec.acceptable));
      } else {
        paramScore = 0;
      }
    } else {
      // Lower is better
      if (value <= spec.optimal) {
        paramScore = spec.points;
      } else if (value <= spec.acceptable) {
        paramScore =
          spec.points *
          (1 - (value - spec.optimal) / (spec.acceptable - spec.optimal));
      } else {
        paramScore = 0;
      }
    }

    breakdown[param] = Math.round(paramScore);
    totalScore += paramScore;
  }

  return { score: Math.min(100, Math.round(totalScore)), breakdown };
}

/**
 * Calculate Reliability Score (0-100)
 */
export function calculateReliabilityScore(inputs: ReliabilityInputs): {
  score: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};

  // Delivery performance (0-30)
  breakdown.delivery_performance = Math.min(30, (inputs.delivery_performance / 100) * 30);

  // Volume consistency (0-25) - lower variance is better
  const volumeScore = Math.max(0, 25 - inputs.volume_consistency * 2.5);
  breakdown.volume_consistency = Math.round(volumeScore);

  // Quality consistency (0-20) - lower CoV is better
  const qualityScore = Math.max(0, 20 - inputs.quality_consistency * 4);
  breakdown.quality_consistency = Math.round(qualityScore);

  // Response time (0-15) - faster is better
  let responseScore: number;
  if (inputs.response_time_hours <= 4) {
    responseScore = 15;
  } else if (inputs.response_time_hours <= 24) {
    responseScore = 12;
  } else if (inputs.response_time_hours <= 48) {
    responseScore = 8;
  } else {
    responseScore = Math.max(0, 8 - (inputs.response_time_hours - 48) / 24);
  }
  breakdown.response_time = Math.round(responseScore);

  // Platform history (0-10)
  const monthsScore = Math.min(5, inputs.platform_months / 2.4);
  const transactionsScore = Math.min(5, inputs.transaction_count / 2);
  breakdown.platform_history = Math.round(monthsScore + transactionsScore);

  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { score: Math.min(100, Math.round(score)), breakdown };
}

/**
 * Calculate composite ABFI Score
 */
export function calculateAbfiScore(
  sustainabilityInputs: SustainabilityInputs,
  carbonIntensityValue: number,
  qualityInputs: QualityInputs,
  reliabilityInputs: ReliabilityInputs
): AbfiScoreResult {
  const sustainability = calculateSustainabilityScore(sustainabilityInputs);
  const carbon = calculateCarbonIntensityScore(carbonIntensityValue);
  const quality = calculateQualityScore(qualityInputs);
  const reliability = calculateReliabilityScore(reliabilityInputs);

  const compositeScore = Math.round(
    sustainability.score * WEIGHTS.sustainability +
      carbon.score * WEIGHTS.carbonIntensity +
      quality.score * WEIGHTS.quality +
      reliability.score * WEIGHTS.reliability
  );

  return {
    abfi_score: compositeScore,
    sustainability_score: sustainability.score,
    carbon_intensity_score: carbon.score,
    quality_score: quality.score,
    reliability_score: reliability.score,
    breakdown: {
      sustainability: sustainability.breakdown,
      carbon: { value: carbonIntensityValue, rating: carbon.rating },
      quality: quality.breakdown,
      reliability: reliability.breakdown,
    },
  };
}

/**
 * Get score tier label
 */
export function getScoreTier(score: number): {
  tier: string;
  color: string;
  bgColor: string;
} {
  if (score >= 85) {
    return { tier: "Excellent", color: "text-green-700", bgColor: "bg-green-50" };
  } else if (score >= 70) {
    return { tier: "Good", color: "text-emerald-700", bgColor: "bg-emerald-50" };
  } else if (score >= 55) {
    return { tier: "Average", color: "text-yellow-700", bgColor: "bg-yellow-50" };
  } else if (score >= 40) {
    return { tier: "Below Average", color: "text-orange-700", bgColor: "bg-orange-50" };
  } else {
    return { tier: "Poor", color: "text-red-700", bgColor: "bg-red-50" };
  }
}

/**
 * Get carbon intensity rating color
 */
export function getCarbonRatingColor(rating: string): string {
  const colors: Record<string, string> = {
    "A+": "text-green-700 bg-green-50",
    A: "text-green-600 bg-green-50",
    "B+": "text-emerald-600 bg-emerald-50",
    B: "text-yellow-600 bg-yellow-50",
    "C+": "text-orange-500 bg-orange-50",
    C: "text-orange-600 bg-orange-50",
    D: "text-red-500 bg-red-50",
    F: "text-red-700 bg-red-50",
  };
  return colors[rating] || "text-gray-600 bg-gray-50";
}
