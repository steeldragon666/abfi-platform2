/**
 * Biological Asset Data Pack (BADP) Generator
 * 
 * Generates comprehensive documentation packages for biological assets
 * suitable for green bonds, project finance, and institutional investors.
 * 
 * Revenue: $75,000 - $300,000 per asset pack
 */

import { jsPDF } from "jspdf";

export interface BADPAssetData {
  // Asset Definition
  assetId: number;
  assetName: string;
  assetType: string; // bamboo, energy_crop, forestry_residue, etc.
  location: {
    address: string;
    state: string;
    latitude?: number;
    longitude?: number;
    landArea?: number; // hectares
  };
  
  // Lifecycle Parameters
  plantingDate?: string;
  maturityDate?: string;
  harvestCycle?: string; // e.g., "Annual", "3-year rotation"
  expectedLifespan?: number; // years
  
  // Verified Yield Curves
  yieldData: {
    p50: number[]; // tonnes/year for each year
    p75: number[]; // conservative estimate
    p90: number[]; // pessimistic estimate
    methodology: string;
    historicalValidation?: string;
  };
  
  // Carbon Performance
  carbonProfile: {
    intensityGco2eMj: number;
    certificationStatus: string[]; // ISCC, RSB, etc.
    projectionMethodology: string;
    sequestrationRate?: number; // tCO2e/ha/year
  };
  
  // Contracted Offtake
  offtakeContracts: Array<{
    buyer: string;
    volumeTonnes: number;
    priceStructure: string;
    termYears: number;
    startDate: string;
    endDate: string;
  }>;
  
  // Counterparty Risk
  supplierProfile: {
    name: string;
    abn: string;
    operatingHistory: string;
    financialStrength: string;
    creditRating?: string;
  };
  
  // Risk Analysis
  riskAssessment: {
    concentrationRisk: string; // HHI score
    geographicRisk: string[];
    climateRisk: string;
    operationalRisk: string;
  };
  
  // Historical Performance
  historicalData?: {
    actualYields: number[];
    varianceFromProjected: number[];
    deliveryReliability: number; // percentage
  };
  
  // Stress Scenarios
  stressScenarios: Array<{
    scenario: string;
    impact: string;
    mitigationStrategy: string;
  }>;
  
  // ABFI Rating
  abfiRating: {
    score: number;
    grade: string;
    sustainabilityScore: number;
    carbonScore: number;
    qualityScore: number;
    reliabilityScore: number;
  };
  
  // Bankability Assessment
  bankabilityRating?: {
    rating: string; // AAA, AA, A, etc.
    compositeScore: number;
    volumeSecurityScore: number;
    counterpartyScore: number;
    contractScore: number;
  };
  
  // Document Metadata
  badpNumber: string;
  issueDate: string;
  validUntil: string;
  preparedFor: string; // Client name
}

/**
 * Generate Biological Asset Data Pack PDF
 */
export async function generateBADP(data: BADPAssetData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // === COVER PAGE ===
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("BIOLOGICAL ASSET", pageWidth / 2, 25, { align: "center" });
  doc.text("DATA PACK", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`BADP No: ${data.badpNumber}`, pageWidth / 2, 50, { align: "center" });

  yPos = 80;
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.assetName, pageWidth / 2, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.assetType} | ${data.location.state}`, pageWidth / 2, yPos, { align: "center" });

  // Rating badges
  yPos += 20;
  const badgeY = yPos;
  
  // ABFI Rating
  doc.setFillColor(16, 185, 129);
  doc.circle(pageWidth / 2 - 30, badgeY, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.abfiRating.grade, pageWidth / 2 - 30, badgeY + 2, { align: "center" });
  
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(9);
  doc.text("ABFI Rating", pageWidth / 2 - 30, badgeY + 20, { align: "center" });

  // Bankability Rating (if available)
  if (data.bankabilityRating) {
    doc.setFillColor(59, 130, 246); // blue-500
    doc.circle(pageWidth / 2 + 30, badgeY, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(data.bankabilityRating.rating, pageWidth / 2 + 30, badgeY + 2, { align: "center" });
    
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.text("Bankability", pageWidth / 2 + 30, badgeY + 20, { align: "center" });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Prepared for: ${data.preparedFor}`, pageWidth / 2, pageHeight - 30, { align: "center" });
  doc.text(`Issue Date: ${data.issueDate}`, pageWidth / 2, pageHeight - 25, { align: "center" });
  doc.text("CONFIDENTIAL - For Institutional Investors Only", pageWidth / 2, pageHeight - 15, { align: "center" });

  // === PAGE 2: EXECUTIVE SUMMARY ===
  doc.addPage();
  yPos = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Executive Summary", 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Asset Overview Box
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPos, pageWidth - 30, 50, "F");

  yPos += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Asset Overview", 20, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Asset Type:`, 20, yPos);
  doc.text(data.assetType, 60, yPos);

  yPos += 6;
  doc.text(`Location:`, 20, yPos);
  doc.text(`${data.location.address}, ${data.location.state}`, 60, yPos);

  if (data.location.landArea) {
    yPos += 6;
    doc.text(`Land Area:`, 20, yPos);
    doc.text(`${data.location.landArea} hectares`, 60, yPos);
  }

  if (data.plantingDate) {
    yPos += 6;
    doc.text(`Planting Date:`, 20, yPos);
    doc.text(data.plantingDate, 60, yPos);
  }

  if (data.harvestCycle) {
    yPos += 6;
    doc.text(`Harvest Cycle:`, 20, yPos);
    doc.text(data.harvestCycle, 60, yPos);
  }

  // Yield Summary
  yPos += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Projected Annual Yield (P50)", 20, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  const avgYield = data.yieldData.p50.reduce((a, b) => a + b, 0) / data.yieldData.p50.length;
  doc.text(`Average: ${avgYield.toFixed(0)} tonnes/year`, 20, yPos);

  yPos += 6;
  doc.text(`Range: ${Math.min(...data.yieldData.p50)} - ${Math.max(...data.yieldData.p50)} tonnes/year`, 20, yPos);

  // Carbon Performance
  yPos += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Carbon Performance", 20, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Carbon Intensity:`, 20, yPos);
  doc.text(`${data.carbonProfile.intensityGco2eMj} gCO₂e/MJ`, 60, yPos);

  yPos += 6;
  doc.text(`Certifications:`, 20, yPos);
  doc.text(data.carbonProfile.certificationStatus.join(", "), 60, yPos);

  // Offtake Summary
  yPos += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Contracted Offtake", 20, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  const totalContracted = data.offtakeContracts.reduce((sum, c) => sum + c.volumeTonnes, 0);
  doc.text(`Total Contracted Volume:`, 20, yPos);
  doc.text(`${totalContracted.toLocaleString()} tonnes/year`, 70, yPos);

  yPos += 6;
  doc.text(`Number of Buyers:`, 20, yPos);
  doc.text(`${data.offtakeContracts.length}`, 70, yPos);

  // === PAGE 3: YIELD CURVES ===
  doc.addPage();
  yPos = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Verified Yield Curves", 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Yield table
  doc.text("Year", 20, yPos);
  doc.text("P90 (Conservative)", 50, yPos);
  doc.text("P75", 90, yPos);
  doc.text("P50 (Expected)", 120, yPos);

  yPos += 5;
  doc.setDrawColor(229, 231, 235);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 5;
  const maxYears = Math.min(data.yieldData.p50.length, 15); // Show max 15 years
  for (let i = 0; i < maxYears; i++) {
    doc.text(`Year ${i + 1}`, 20, yPos);
    doc.text(`${data.yieldData.p90[i] || 0} t`, 50, yPos);
    doc.text(`${data.yieldData.p75[i] || 0} t`, 90, yPos);
    doc.text(`${data.yieldData.p50[i]} t`, 120, yPos);
    yPos += 6;
  }

  yPos += 5;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Methodology: ${data.yieldData.methodology}`, 20, yPos);

  if (data.yieldData.historicalValidation) {
    yPos += 5;
    doc.text(`Historical Validation: ${data.yieldData.historicalValidation}`, 20, yPos);
  }

  // === PAGE 4: RISK ASSESSMENT ===
  doc.addPage();
  yPos = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Risk Assessment", 20, yPos);

  yPos += 12;
  doc.setFontSize(11);
  doc.text("Concentration Risk", 20, yPos);

  yPos += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.riskAssessment.concentrationRisk, 20, yPos);

  yPos += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Geographic Risk", 20, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  data.riskAssessment.geographicRisk.forEach(risk => {
    doc.text(`• ${risk}`, 20, yPos);
    yPos += 6;
  });

  yPos += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Climate Risk", 20, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(data.riskAssessment.climateRisk, 20, yPos);

  yPos += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Operational Risk", 20, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(data.riskAssessment.operationalRisk, 20, yPos);

  // Stress Scenarios
  yPos += 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Stress Scenarios", 20, yPos);

  yPos += 7;
  doc.setFontSize(9);
  data.stressScenarios.forEach(scenario => {
    doc.setFont("helvetica", "bold");
    doc.text(`${scenario.scenario}:`, 20, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Impact: ${scenario.impact}`, 25, yPos);
    yPos += 5;
    doc.text(`Mitigation: ${scenario.mitigationStrategy}`, 25, yPos);
    yPos += 8;
  });

  // === FOOTER ON ALL PAGES ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `BADP ${data.badpNumber} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

/**
 * Generate BADP Excel workbook with detailed data tables
 * (For future implementation - would include detailed financial models, sensitivity analysis, etc.)
 */
export async function generateBADPExcel(data: BADPAssetData): Promise<Buffer> {
  // TODO: Implement Excel generation with openpyxl or similar
  // Would include:
  // - Yield projections (P10-P90)
  // - Cash flow models
  // - Sensitivity analysis tables
  // - Contract schedules
  // - Risk matrices
  throw new Error("Excel generation not yet implemented");
}
