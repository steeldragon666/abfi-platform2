/**
 * ABFI Rating Certificate PDF Generator
 * Generates professional PDF certificates for ABFI feedstock ratings
 * Revenue: $3,000 - $15,000 per certificate
 */

import { jsPDF } from "jspdf";

export interface CertificateData {
  // Feedstock details
  feedstockId: number;
  feedstockName: string;
  feedstockCategory: string;
  supplierName: string;
  supplierABN: string;
  location: string;
  state: string;

  // ABFI Rating
  abfiScore: number;
  sustainabilityScore: number;
  carbonIntensityScore: number;
  qualityScore: number;
  reliabilityScore: number;

  // Rating grade
  ratingGrade: string; // e.g., "A+", "A", "B+"

  // Certificate metadata
  certificateNumber: string;
  issueDate: string;
  validUntil: string;
  assessmentDate: string;

  // Additional metrics
  carbonIntensity?: number; // gCO2e/MJ
  annualVolume?: number; // tonnes
  certifications?: string[]; // ISCC, RSB, etc.
}

/**
 * Generate ABFI Rating Certificate PDF
 */
export async function generateABFICertificate(data: CertificateData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryGreen = "#10b981"; // emerald-500
  const darkGreen = "#047857"; // emerald-700
  const lightGray = "#f3f4f6";
  const darkGray = "#374151";

  // === HEADER SECTION ===
  // Green header bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 35, "F");

  // ABFI Logo/Text (white)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("ABFI", 20, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Australian Bioenergy Feedstock Institute", 20, 25);

  // Certificate title
  doc.setTextColor(55, 65, 81); // gray-700
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("FEEDSTOCK RATING CERTIFICATE", pageWidth / 2, 50, { align: "center" });

  // Certificate number
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(`Certificate No: ${data.certificateNumber}`, pageWidth / 2, 58, { align: "center" });

  // === RATING BADGE ===
  const badgeX = pageWidth / 2;
  const badgeY = 75;
  const badgeRadius = 25;

  // Badge circle
  doc.setFillColor(16, 185, 129);
  doc.circle(badgeX, badgeY, badgeRadius, "F");

  // Rating grade
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text(data.ratingGrade, badgeX, badgeY + 3, { align: "center" });

  // ABFI Score below badge
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(14);
  doc.text(`ABFI Score: ${data.abfiScore}/100`, badgeX, badgeY + badgeRadius + 10, { align: "center" });

  // === FEEDSTOCK DETAILS SECTION ===
  let yPos = 120;

  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(15, yPos, pageWidth - 30, 50, "F");

  doc.setTextColor(55, 65, 81);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Certified Feedstock", 20, yPos + 8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  yPos += 15;
  doc.text(`Feedstock Name:`, 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(data.feedstockName, 65, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Category:`, 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(data.feedstockCategory, 65, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Supplier:`, 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(data.supplierName, 65, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`ABN:`, 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(data.supplierABN, 65, yPos);

  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Location:`, 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.location}, ${data.state}`, 65, yPos);

  // === PILLAR SCORES SECTION ===
  yPos += 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("ABFI 4-Pillar Assessment", 20, yPos);

  yPos += 8;

  const pillars = [
    { name: "Sustainability", score: data.sustainabilityScore, color: [34, 197, 94] }, // green-500
    { name: "Carbon Intensity", score: data.carbonIntensityScore, color: [59, 130, 246] }, // blue-500
    { name: "Quality", score: data.qualityScore, color: [168, 85, 247] }, // purple-500
    { name: "Reliability", score: data.reliabilityScore, color: [234, 179, 8] }, // yellow-500
  ];

  pillars.forEach((pillar, index) => {
    const barY = yPos + index * 12;
    const barWidth = (pillar.score / 100) * 120;

    // Pillar name
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.text(pillar.name, 20, barY + 4);

    // Score bar background
    doc.setFillColor(229, 231, 235); // gray-200
    doc.rect(75, barY, 120, 6, "F");

    // Score bar fill
    doc.setFillColor(pillar.color[0], pillar.color[1], pillar.color[2]);
    doc.rect(75, barY, barWidth, 6, "F");

    // Score value
    doc.setFont("helvetica", "bold");
    doc.text(`${pillar.score}`, 198, barY + 4, { align: "right" });
  });

  // === ADDITIONAL METRICS ===
  yPos += 60;

  if (data.carbonIntensity || data.annualVolume || data.certifications) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text("Key Metrics", 20, yPos);

    yPos += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    if (data.carbonIntensity) {
      doc.text(`Carbon Intensity:`, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(`${data.carbonIntensity} gCO₂e/MJ`, 70, yPos);
      yPos += 6;
    }

    if (data.annualVolume) {
      doc.setFont("helvetica", "normal");
      doc.text(`Annual Volume:`, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(`${data.annualVolume.toLocaleString()} tonnes/year`, 70, yPos);
      yPos += 6;
    }

    if (data.certifications && data.certifications.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.text(`Certifications:`, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(data.certifications.join(", "), 70, yPos);
      yPos += 6;
    }
  }

  // === VALIDITY SECTION ===
  yPos = pageHeight - 50;

  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPos, pageWidth - 30, 25, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);

  doc.text(`Assessment Date:`, 20, yPos + 8);
  doc.setFont("helvetica", "bold");
  doc.text(data.assessmentDate, 60, yPos + 8);

  doc.setFont("helvetica", "normal");
  doc.text(`Issue Date:`, 20, yPos + 14);
  doc.setFont("helvetica", "bold");
  doc.text(data.issueDate, 60, yPos + 14);

  doc.setFont("helvetica", "normal");
  doc.text(`Valid Until:`, 20, yPos + 20);
  doc.setFont("helvetica", "bold");
  doc.text(data.validUntil, 60, yPos + 20);

  // === FOOTER ===
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    "This certificate verifies the ABFI rating assessment conducted by the Australian Bioenergy Feedstock Institute.",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );
  doc.text(
    "For verification, visit abfi.org.au/verify or contact info@abfi.org.au",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

/**
 * Calculate rating grade from ABFI score
 */
export function calculateRatingGrade(abfiScore: number): string {
  if (abfiScore >= 95) return "A+";
  if (abfiScore >= 90) return "A";
  if (abfiScore >= 85) return "A-";
  if (abfiScore >= 80) return "B+";
  if (abfiScore >= 75) return "B";
  if (abfiScore >= 70) return "B-";
  if (abfiScore >= 65) return "C+";
  if (abfiScore >= 60) return "C";
  if (abfiScore >= 55) return "C-";
  return "D";
}
