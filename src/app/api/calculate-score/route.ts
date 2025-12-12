import { NextRequest, NextResponse } from "next/server";
import {
  calculateAbfiScore,
  calculateSustainabilityScore,
  calculateCarbonIntensityScore,
  calculateQualityScore,
  calculateReliabilityScore,
} from "@/lib/rating/calculator";
import type {
  SustainabilityInputs,
  QualityInputs,
  ReliabilityInputs,
} from "@/types/database";

// POST /api/calculate-score - Calculate ABFI score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sustainability,
      carbonIntensityValue,
      quality,
      reliability,
      calculateOnly,
    } = body;

    // Handle partial calculations
    if (calculateOnly) {
      switch (calculateOnly) {
        case "sustainability":
          if (!sustainability) {
            return NextResponse.json(
              { error: "sustainability data required" },
              { status: 400 }
            );
          }
          const sustResult = calculateSustainabilityScore(
            sustainability as SustainabilityInputs
          );
          return NextResponse.json(sustResult);

        case "carbonIntensity":
          if (carbonIntensityValue === undefined) {
            return NextResponse.json(
              { error: "carbonIntensityValue required" },
              { status: 400 }
            );
          }
          const carbonResult = calculateCarbonIntensityScore(carbonIntensityValue);
          return NextResponse.json(carbonResult);

        case "quality":
          if (!quality) {
            return NextResponse.json(
              { error: "quality data required" },
              { status: 400 }
            );
          }
          const qualityResult = calculateQualityScore(quality as QualityInputs);
          return NextResponse.json(qualityResult);

        case "reliability":
          if (!reliability) {
            return NextResponse.json(
              { error: "reliability data required" },
              { status: 400 }
            );
          }
          const reliabilityResult = calculateReliabilityScore(
            reliability as ReliabilityInputs
          );
          return NextResponse.json(reliabilityResult);

        default:
          return NextResponse.json(
            { error: "Invalid calculateOnly value" },
            { status: 400 }
          );
      }
    }

    // Full composite score calculation
    if (!sustainability || carbonIntensityValue === undefined || !quality) {
      return NextResponse.json(
        {
          error:
            "sustainability, carbonIntensityValue, and quality are required for full calculation",
        },
        { status: 400 }
      );
    }

    // Default reliability values for new feedstocks
    const reliabilityData: ReliabilityInputs = reliability || {
      delivery_performance: 95,
      volume_consistency: 5,
      quality_consistency: 3,
      response_time_hours: 24,
      platform_months: 0,
      transaction_count: 0,
    };

    const result = calculateAbfiScore(
      sustainability as SustainabilityInputs,
      carbonIntensityValue,
      quality as QualityInputs,
      reliabilityData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/calculate-score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/calculate-score/carbon - Quick carbon intensity calculation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ciValue = searchParams.get("ci");

    if (!ciValue) {
      return NextResponse.json(
        { error: "ci parameter required" },
        { status: 400 }
      );
    }

    const carbonIntensityValue = parseFloat(ciValue);

    if (isNaN(carbonIntensityValue)) {
      return NextResponse.json(
        { error: "ci must be a valid number" },
        { status: 400 }
      );
    }

    const result = calculateCarbonIntensityScore(carbonIntensityValue);

    return NextResponse.json({
      value: carbonIntensityValue,
      ...result,
    });
  } catch (error) {
    console.error("Error in GET /api/calculate-score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
