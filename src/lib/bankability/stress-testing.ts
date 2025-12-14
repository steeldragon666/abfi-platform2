/**
 * Stress Testing Engine for ABFI Bankability Module
 *
 * Provides scenario analysis for lenders and buyers to assess:
 * - Price shock impacts
 * - Supply disruption risks
 * - Covenant breach scenarios
 * - Regulatory change impacts
 */

import type {
  ScenarioType,
  StressTestParameters,
  StressTestBaseline,
  StressTestResults,
  FeedstockCategory,
} from "@/types/database";

// Constants for stress testing
export const STRESS_TEST_CONSTANTS = {
  // Default price shock scenarios (percentage)
  PRICE_SHOCKS: {
    mild: 15,
    moderate: 30,
    severe: 50,
    extreme: 100,
  },

  // Supply disruption scenarios (percentage reduction)
  SUPPLY_DISRUPTIONS: {
    minor: 10,
    moderate: 25,
    major: 50,
    critical: 75,
  },

  // Carbon price scenarios (AUD per tonne CO2)
  CARBON_PRICES: {
    current: 35,
    moderate_increase: 75,
    high: 150,
    eu_parity: 100, // Approximate EU ETS parity
  },

  // Covenant thresholds
  COVENANT_THRESHOLDS: {
    supply_concentration_max: 0.4, // Max 40% from single supplier
    price_variance_max: 0.25, // Max 25% price variance
    volume_shortfall_max: 0.15, // Max 15% volume shortfall
    ci_threshold_max: 30, // Max CI value gCO2e/MJ
  },

  // Risk score weights
  RISK_WEIGHTS: {
    financial_impact: 0.35,
    supply_security: 0.30,
    price_stability: 0.20,
    regulatory_compliance: 0.15,
  },

  // Alternative sourcing premium (percentage above market)
  ALTERNATIVE_SOURCING_PREMIUM: {
    spot: 1.15, // 15% premium for spot purchases
    urgent: 1.35, // 35% premium for urgent sourcing
    international: 1.25, // 25% premium for international sourcing
  },
};

/**
 * Run a price shock stress test scenario
 */
export function runPriceShockScenario(
  baseline: StressTestBaseline,
  parameters: StressTestParameters
): StressTestResults {
  const shockPercentage = parameters.price_shock_percentage || 30;
  const durationMonths = parameters.duration_months || 12;

  // Calculate new price after shock
  const shockedPrice = baseline.current_average_price * (1 + shockPercentage / 100);

  // Financial impact = additional cost over duration
  const annualVolume = baseline.annual_volume_required;
  const monthlyVolume = annualVolume / 12;
  const affectedVolume = monthlyVolume * durationMonths;
  const additionalCostPerTonne = shockedPrice - baseline.current_average_price;
  const financialImpact = -1 * affectedVolume * additionalCostPerTonne;

  // Risk score based on shock severity and duration
  const severityScore = Math.min(shockPercentage / 100, 1) * 50;
  const durationScore = Math.min(durationMonths / 24, 1) * 30;
  const concentrationScore = baseline.concentration_top_supplier_percentage * 20;
  const riskScore = Math.min(severityScore + durationScore + concentrationScore, 100);

  // Covenant status
  const priceVariance = shockPercentage / 100;
  const covenantStatus =
    priceVariance > STRESS_TEST_CONSTANTS.COVENANT_THRESHOLDS.price_variance_max * 1.5
      ? "breach"
      : priceVariance > STRESS_TEST_CONSTANTS.COVENANT_THRESHOLDS.price_variance_max
      ? "warning"
      : "compliant";

  // Mitigation options
  const mitigationOptions = [
    {
      option: "Negotiate longer-term fixed-price contracts",
      cost_impact: financialImpact * 0.3, // Can reduce impact by 30%
      implementation_time_days: 60,
      effectiveness_score: 75,
    },
    {
      option: "Diversify supplier base to reduce concentration",
      cost_impact: financialImpact * 0.2,
      implementation_time_days: 90,
      effectiveness_score: 65,
    },
    {
      option: "Implement price hedging instruments",
      cost_impact: financialImpact * 0.4,
      implementation_time_days: 30,
      effectiveness_score: 80,
    },
    {
      option: "Increase strategic inventory buffer",
      cost_impact: -baseline.current_average_price * annualVolume * 0.1 * 0.05, // 10% buffer, 5% carrying cost
      implementation_time_days: 14,
      effectiveness_score: 60,
    },
  ];

  // Sensitivity analysis
  const sensitivityAnalysis = [
    {
      variable: "Price Shock Magnitude (%)",
      base_value: shockPercentage,
      impact_per_unit: (affectedVolume * baseline.current_average_price) / 100,
    },
    {
      variable: "Duration (months)",
      base_value: durationMonths,
      impact_per_unit: monthlyVolume * additionalCostPerTonne,
    },
    {
      variable: "Annual Volume (tonnes)",
      base_value: annualVolume,
      impact_per_unit: additionalCostPerTonne * (durationMonths / 12),
    },
  ];

  return {
    financial_impact: financialImpact,
    supply_gap_tonnes: 0, // No supply gap in price shock
    alternative_cost_per_tonne: shockedPrice,
    risk_score: riskScore,
    covenant_status: covenantStatus,
    mitigation_options: mitigationOptions,
    sensitivity_analysis: sensitivityAnalysis,
  };
}

/**
 * Run a supply disruption stress test scenario
 */
export function runSupplyDisruptionScenario(
  baseline: StressTestBaseline,
  parameters: StressTestParameters
): StressTestResults {
  const reductionPercentage = parameters.supply_reduction_percentage || 25;
  const durationMonths = parameters.duration_months || 6;
  const affectedCategories = parameters.affected_categories || [];

  // Calculate supply gap
  const annualVolume = baseline.annual_volume_required;
  const monthlyVolume = annualVolume / 12;
  const supplyGapMonthly = monthlyVolume * (reductionPercentage / 100);
  const totalSupplyGap = supplyGapMonthly * durationMonths;

  // Alternative sourcing cost (spot market premium)
  const spotPremium = STRESS_TEST_CONSTANTS.ALTERNATIVE_SOURCING_PREMIUM.spot;
  const urgentPremium = STRESS_TEST_CONSTANTS.ALTERNATIVE_SOURCING_PREMIUM.urgent;

  // Assume 60% can be sourced at spot premium, 40% at urgent premium
  const spotSourcedVolume = totalSupplyGap * 0.6;
  const urgentSourcedVolume = totalSupplyGap * 0.4;

  const spotCost = spotSourcedVolume * baseline.current_average_price * spotPremium;
  const urgentCost = urgentSourcedVolume * baseline.current_average_price * urgentPremium;
  const normalCost = totalSupplyGap * baseline.current_average_price;

  const financialImpact = -1 * (spotCost + urgentCost - normalCost);
  const alternativeCostPerTonne =
    (spotSourcedVolume * baseline.current_average_price * spotPremium +
      urgentSourcedVolume * baseline.current_average_price * urgentPremium) /
    totalSupplyGap;

  // Risk score
  const volumeScore = (reductionPercentage / 100) * 40;
  const durationScore = Math.min(durationMonths / 12, 1) * 25;
  const concentrationScore = baseline.concentration_top_supplier_percentage * 35;
  const riskScore = Math.min(volumeScore + durationScore + concentrationScore, 100);

  // Covenant status
  const volumeShortfall = reductionPercentage / 100;
  const covenantStatus =
    volumeShortfall > STRESS_TEST_CONSTANTS.COVENANT_THRESHOLDS.volume_shortfall_max * 2
      ? "breach"
      : volumeShortfall > STRESS_TEST_CONSTANTS.COVENANT_THRESHOLDS.volume_shortfall_max
      ? "warning"
      : "compliant";

  const mitigationOptions = [
    {
      option: "Activate backup supplier agreements",
      cost_impact: financialImpact * 0.5,
      implementation_time_days: 7,
      effectiveness_score: 85,
    },
    {
      option: "Source from international markets",
      cost_impact: financialImpact * 0.3,
      implementation_time_days: 21,
      effectiveness_score: 70,
    },
    {
      option: "Reduce production/blending temporarily",
      cost_impact: -baseline.annual_volume_required * 0.1 * baseline.current_average_price * 0.2, // Lost margin
      implementation_time_days: 1,
      effectiveness_score: 40,
    },
    {
      option: "Draw down strategic inventory",
      cost_impact: 0,
      implementation_time_days: 1,
      effectiveness_score: 90,
    },
  ];

  const sensitivityAnalysis = [
    {
      variable: "Supply Reduction (%)",
      base_value: reductionPercentage,
      impact_per_unit:
        (monthlyVolume * durationMonths * baseline.current_average_price * (spotPremium - 1)) / 100,
    },
    {
      variable: "Duration (months)",
      base_value: durationMonths,
      impact_per_unit: supplyGapMonthly * baseline.current_average_price * (spotPremium - 1),
    },
    {
      variable: "Spot Market Premium (%)",
      base_value: (spotPremium - 1) * 100,
      impact_per_unit: (spotSourcedVolume * baseline.current_average_price) / 100,
    },
  ];

  return {
    financial_impact: financialImpact,
    supply_gap_tonnes: totalSupplyGap,
    alternative_cost_per_tonne: alternativeCostPerTonne,
    risk_score: riskScore,
    covenant_status: covenantStatus,
    mitigation_options: mitigationOptions,
    sensitivity_analysis: sensitivityAnalysis,
  };
}

/**
 * Run a covenant breach stress test scenario
 */
export function runCovenantBreachScenario(
  baseline: StressTestBaseline,
  parameters: StressTestParameters
): StressTestResults {
  // Simulate multiple covenant pressures
  const priceIncrease = parameters.price_shock_percentage || 20;
  const supplyReduction = parameters.supply_reduction_percentage || 15;
  const carbonPriceIncrease = parameters.carbon_price_increase || 50;

  // Calculate combined financial impact
  const annualVolume = baseline.annual_volume_required;

  // Price impact
  const priceImpact = annualVolume * baseline.current_average_price * (priceIncrease / 100);

  // Supply gap impact (premium sourcing)
  const supplyGap = annualVolume * (supplyReduction / 100);
  const supplyImpact =
    supplyGap *
    baseline.current_average_price *
    (STRESS_TEST_CONSTANTS.ALTERNATIVE_SOURCING_PREMIUM.spot - 1);

  // Carbon price impact (if carbon credits are part of the model)
  const newCarbonPrice = baseline.carbon_credit_price * (1 + carbonPriceIncrease / 100);
  const carbonCreditVolume = annualVolume * 0.5; // Assume 50% generates credits
  const carbonImpact = carbonCreditVolume * (newCarbonPrice - baseline.carbon_credit_price);

  const financialImpact = -1 * (priceImpact + supplyImpact) + carbonImpact;

  // Covenant assessment
  const covenantBreaches = [];
  if (baseline.concentration_top_supplier_percentage > STRESS_TEST_CONSTANTS.COVENANT_THRESHOLDS.supply_concentration_max) {
    covenantBreaches.push("Supply concentration exceeds 40% threshold");
  }
  if (priceIncrease / 100 > STRESS_TEST_CONSTANTS.COVENANT_THRESHOLDS.price_variance_max) {
    covenantBreaches.push("Price variance exceeds 25% threshold");
  }
  if (supplyReduction / 100 > STRESS_TEST_CONSTANTS.COVENANT_THRESHOLDS.volume_shortfall_max) {
    covenantBreaches.push("Volume shortfall exceeds 15% threshold");
  }

  const covenantStatus =
    covenantBreaches.length >= 2 ? "breach" : covenantBreaches.length === 1 ? "warning" : "compliant";

  // Risk score - higher for covenant breach scenarios
  const riskScore = Math.min(
    30 + // Base risk for covenant scenario
      (priceIncrease / 100) * 25 +
      (supplyReduction / 100) * 25 +
      baseline.concentration_top_supplier_percentage * 20,
    100
  );

  const mitigationOptions = [
    {
      option: "Proactive lender communication and covenant waiver request",
      cost_impact: -50000, // Legal and admin costs
      implementation_time_days: 14,
      effectiveness_score: 70,
    },
    {
      option: "Accelerate supplier diversification program",
      cost_impact: financialImpact * 0.25,
      implementation_time_days: 90,
      effectiveness_score: 80,
    },
    {
      option: "Implement cost reduction measures to offset impact",
      cost_impact: financialImpact * 0.15,
      implementation_time_days: 30,
      effectiveness_score: 55,
    },
    {
      option: "Raise additional equity or subordinated debt",
      cost_impact: -100000, // Financing costs
      implementation_time_days: 60,
      effectiveness_score: 85,
    },
  ];

  const sensitivityAnalysis = [
    {
      variable: "Price Increase (%)",
      base_value: priceIncrease,
      impact_per_unit: (annualVolume * baseline.current_average_price) / 100,
    },
    {
      variable: "Supply Reduction (%)",
      base_value: supplyReduction,
      impact_per_unit:
        (annualVolume *
          baseline.current_average_price *
          (STRESS_TEST_CONSTANTS.ALTERNATIVE_SOURCING_PREMIUM.spot - 1)) /
        100,
    },
    {
      variable: "Carbon Price Increase (%)",
      base_value: carbonPriceIncrease,
      impact_per_unit: (carbonCreditVolume * baseline.carbon_credit_price) / 100,
    },
  ];

  return {
    financial_impact: financialImpact,
    supply_gap_tonnes: supplyGap,
    alternative_cost_per_tonne:
      baseline.current_average_price * STRESS_TEST_CONSTANTS.ALTERNATIVE_SOURCING_PREMIUM.spot,
    risk_score: riskScore,
    covenant_status: covenantStatus,
    mitigation_options: mitigationOptions,
    sensitivity_analysis: sensitivityAnalysis,
  };
}

/**
 * Run a regulatory change stress test scenario
 */
export function runRegulatoryScenario(
  baseline: StressTestBaseline,
  parameters: StressTestParameters
): StressTestResults {
  const thresholdChange = parameters.regulatory_threshold_change || -10; // e.g., -10 means CI threshold drops by 10 gCO2e/MJ
  const carbonPriceIncrease = parameters.carbon_price_increase || 100;

  const annualVolume = baseline.annual_volume_required;

  // Assume 20% of current supply may become non-compliant
  const nonCompliantPercentage = Math.abs(thresholdChange) * 2; // 2% per 1 gCO2e/MJ reduction
  const nonCompliantVolume = annualVolume * (nonCompliantPercentage / 100);

  // Cost to source compliant alternatives (30% premium for certified low-CI feedstock)
  const compliantPremium = 1.3;
  const switchingCost =
    nonCompliantVolume * baseline.current_average_price * (compliantPremium - 1);

  // Carbon price impact
  const newCarbonPrice = baseline.carbon_credit_price * (1 + carbonPriceIncrease / 100);
  const carbonValueChange = annualVolume * 0.5 * (newCarbonPrice - baseline.carbon_credit_price);

  // Net impact (switching cost minus carbon value increase)
  const financialImpact = carbonValueChange - switchingCost;

  // Risk score
  const regulatoryRisk = Math.min(Math.abs(thresholdChange) * 5, 50);
  const complianceRisk = nonCompliantPercentage * 1.5;
  const riskScore = Math.min(regulatoryRisk + complianceRisk + 10, 100);

  // Covenant status
  const covenantStatus =
    nonCompliantPercentage > 30 ? "breach" : nonCompliantPercentage > 15 ? "warning" : "compliant";

  const mitigationOptions = [
    {
      option: "Accelerate transition to certified low-CI feedstocks",
      cost_impact: switchingCost * -0.5, // Long-term, reduces premium by 50%
      implementation_time_days: 180,
      effectiveness_score: 90,
    },
    {
      option: "Invest in supplier carbon reduction programs",
      cost_impact: -500000, // Capital investment
      implementation_time_days: 365,
      effectiveness_score: 85,
    },
    {
      option: "Lock in forward contracts with compliant suppliers",
      cost_impact: switchingCost * -0.3,
      implementation_time_days: 60,
      effectiveness_score: 75,
    },
    {
      option: "Develop in-house feedstock processing capability",
      cost_impact: -2000000, // Major capital investment
      implementation_time_days: 730,
      effectiveness_score: 95,
    },
  ];

  const sensitivityAnalysis = [
    {
      variable: "CI Threshold Change (gCO2e/MJ)",
      base_value: thresholdChange,
      impact_per_unit: (annualVolume * 0.02 * baseline.current_average_price * (compliantPremium - 1)),
    },
    {
      variable: "Carbon Price Increase (%)",
      base_value: carbonPriceIncrease,
      impact_per_unit: (annualVolume * 0.5 * baseline.carbon_credit_price) / 100,
    },
    {
      variable: "Compliant Feedstock Premium (%)",
      base_value: (compliantPremium - 1) * 100,
      impact_per_unit: (nonCompliantVolume * baseline.current_average_price) / 100,
    },
  ];

  return {
    financial_impact: financialImpact,
    supply_gap_tonnes: nonCompliantVolume,
    alternative_cost_per_tonne: baseline.current_average_price * compliantPremium,
    risk_score: riskScore,
    covenant_status: covenantStatus,
    mitigation_options: mitigationOptions,
    sensitivity_analysis: sensitivityAnalysis,
  };
}

/**
 * Run custom stress test with combined parameters
 */
export function runCustomScenario(
  baseline: StressTestBaseline,
  parameters: StressTestParameters
): StressTestResults {
  // Combine impacts from all parameter types
  let totalFinancialImpact = 0;
  let totalSupplyGap = 0;
  let combinedRiskScore = 0;
  const allMitigationOptions: StressTestResults["mitigation_options"] = [];
  const allSensitivityAnalysis: StressTestResults["sensitivity_analysis"] = [];

  if (parameters.price_shock_percentage) {
    const priceResult = runPriceShockScenario(baseline, {
      price_shock_percentage: parameters.price_shock_percentage,
      duration_months: parameters.duration_months,
    });
    totalFinancialImpact += priceResult.financial_impact;
    combinedRiskScore += priceResult.risk_score * 0.3;
    allMitigationOptions.push(...priceResult.mitigation_options.slice(0, 2));
    allSensitivityAnalysis.push(...priceResult.sensitivity_analysis);
  }

  if (parameters.supply_reduction_percentage) {
    const supplyResult = runSupplyDisruptionScenario(baseline, {
      supply_reduction_percentage: parameters.supply_reduction_percentage,
      duration_months: parameters.duration_months,
      affected_categories: parameters.affected_categories,
    });
    totalFinancialImpact += supplyResult.financial_impact;
    totalSupplyGap += supplyResult.supply_gap_tonnes;
    combinedRiskScore += supplyResult.risk_score * 0.35;
    allMitigationOptions.push(...supplyResult.mitigation_options.slice(0, 2));
    allSensitivityAnalysis.push(...supplyResult.sensitivity_analysis);
  }

  if (parameters.carbon_price_increase || parameters.regulatory_threshold_change) {
    const regResult = runRegulatoryScenario(baseline, {
      carbon_price_increase: parameters.carbon_price_increase,
      regulatory_threshold_change: parameters.regulatory_threshold_change,
    });
    totalFinancialImpact += regResult.financial_impact;
    totalSupplyGap += regResult.supply_gap_tonnes;
    combinedRiskScore += regResult.risk_score * 0.35;
    allMitigationOptions.push(...regResult.mitigation_options.slice(0, 2));
    allSensitivityAnalysis.push(...regResult.sensitivity_analysis);
  }

  // Normalize risk score
  const riskScore = Math.min(combinedRiskScore, 100);

  // Determine covenant status based on combined impact
  const impactPercentage = Math.abs(totalFinancialImpact) / (baseline.annual_volume_required * baseline.current_average_price);
  const covenantStatus =
    impactPercentage > 0.25 ? "breach" : impactPercentage > 0.1 ? "warning" : "compliant";

  return {
    financial_impact: totalFinancialImpact,
    supply_gap_tonnes: totalSupplyGap,
    alternative_cost_per_tonne:
      baseline.current_average_price * STRESS_TEST_CONSTANTS.ALTERNATIVE_SOURCING_PREMIUM.spot,
    risk_score: riskScore,
    covenant_status: covenantStatus,
    mitigation_options: allMitigationOptions,
    sensitivity_analysis: allSensitivityAnalysis,
  };
}

/**
 * Main function to run a stress test scenario
 */
export function runStressTest(
  scenarioType: ScenarioType,
  baseline: StressTestBaseline,
  parameters: StressTestParameters
): StressTestResults {
  switch (scenarioType) {
    case "price_shock":
      return runPriceShockScenario(baseline, parameters);
    case "supply_disruption":
      return runSupplyDisruptionScenario(baseline, parameters);
    case "covenant_breach":
      return runCovenantBreachScenario(baseline, parameters);
    case "regulatory":
      return runRegulatoryScenario(baseline, parameters);
    case "custom":
      return runCustomScenario(baseline, parameters);
    default:
      return runCustomScenario(baseline, parameters);
  }
}

/**
 * Generate default baseline assumptions from buyer data
 */
export function generateDefaultBaseline(buyerData: {
  annual_volume_requirement?: number;
  average_price?: number;
  top_supplier_percentage?: number;
  supplier_count?: number;
}): StressTestBaseline {
  return {
    annual_volume_required: buyerData.annual_volume_requirement || 10000,
    current_average_price: buyerData.average_price || 850,
    carbon_credit_price: STRESS_TEST_CONSTANTS.CARBON_PRICES.current,
    fuel_blend_mandate: 7.5, // Default Australian mandate
    current_supplier_count: buyerData.supplier_count || 3,
    concentration_top_supplier_percentage: buyerData.top_supplier_percentage || 0.4,
  };
}

/**
 * Get predefined scenario templates
 */
export function getScenarioTemplates(): {
  type: ScenarioType;
  name: string;
  description: string;
  parameters: StressTestParameters;
}[] {
  return [
    {
      type: "price_shock",
      name: "Moderate Price Shock",
      description: "30% price increase over 12 months",
      parameters: {
        price_shock_percentage: 30,
        duration_months: 12,
      },
    },
    {
      type: "price_shock",
      name: "Severe Price Shock",
      description: "50% price increase over 6 months",
      parameters: {
        price_shock_percentage: 50,
        duration_months: 6,
      },
    },
    {
      type: "supply_disruption",
      name: "Major Supplier Failure",
      description: "Loss of 40% supply for 6 months",
      parameters: {
        supply_reduction_percentage: 40,
        duration_months: 6,
      },
    },
    {
      type: "supply_disruption",
      name: "Category Shortage",
      description: "25% UCO supply reduction for 12 months",
      parameters: {
        supply_reduction_percentage: 25,
        duration_months: 12,
        affected_categories: ["UCO"],
      },
    },
    {
      type: "covenant_breach",
      name: "Combined Stress Event",
      description: "20% price increase + 15% supply reduction",
      parameters: {
        price_shock_percentage: 20,
        supply_reduction_percentage: 15,
        duration_months: 6,
      },
    },
    {
      type: "regulatory",
      name: "RED III Tightening",
      description: "CI threshold reduced by 10 gCO2e/MJ, carbon price doubles",
      parameters: {
        regulatory_threshold_change: -10,
        carbon_price_increase: 100,
      },
    },
    {
      type: "custom",
      name: "Black Swan Event",
      description: "Extreme scenario: 50% price + 50% supply + regulatory change",
      parameters: {
        price_shock_percentage: 50,
        supply_reduction_percentage: 50,
        carbon_price_increase: 200,
        regulatory_threshold_change: -15,
        duration_months: 12,
      },
    },
  ];
}
