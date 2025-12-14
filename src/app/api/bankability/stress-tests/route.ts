import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  runStressTest,
  generateDefaultBaseline,
  getScenarioTemplates,
} from "@/lib/bankability/stress-testing";
import type { ScenarioType, StressTestParameters, StressTestBaseline } from "@/types/database";

/**
 * GET /api/bankability/stress-tests
 * List stress test scenarios for the current buyer, or get templates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const templates = url.searchParams.get("templates");

    // Return scenario templates if requested
    if (templates === "true") {
      return NextResponse.json({
        templates: getScenarioTemplates(),
      });
    }

    // Get buyer profile
    const { data: buyer } = await supabase
      .from("buyers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!buyer) {
      return NextResponse.json(
        { error: "Buyer profile not found" },
        { status: 404 }
      );
    }

    // Get stress test scenarios for this buyer
    const { data: scenarios, error } = await supabase
      .from("stress_test_scenarios")
      .select("*")
      .eq("buyer_id", buyer.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ scenarios: scenarios || [] });
  } catch (error) {
    console.error("Error fetching stress tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch stress tests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bankability/stress-tests
 * Create and run a new stress test scenario
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      scenario_type,
      parameters,
      baseline_assumptions,
      run_immediately = true,
    } = body as {
      name: string;
      description?: string;
      scenario_type: ScenarioType;
      parameters: StressTestParameters;
      baseline_assumptions?: Partial<StressTestBaseline>;
      run_immediately?: boolean;
    };

    if (!name || !scenario_type) {
      return NextResponse.json(
        { error: "Name and scenario_type are required" },
        { status: 400 }
      );
    }

    // Get buyer profile
    const { data: buyer } = await supabase
      .from("buyers")
      .select(`
        id,
        annual_volume_requirement,
        procurement_preferences
      `)
      .eq("profile_id", user.id)
      .single();

    if (!buyer) {
      return NextResponse.json(
        { error: "Buyer profile not found" },
        { status: 404 }
      );
    }

    // Get buyer's transaction history for baseline calculation
    const { data: transactions } = await supabase
      .from("transactions")
      .select("volume_tonnes, price_per_tonne, supplier_id")
      .eq("buyer_id", buyer.id)
      .eq("status", "completed");

    // Calculate supplier concentration
    let topSupplierPercentage = 0.4; // Default
    let averagePrice = 850; // Default
    let supplierCount = 3; // Default

    if (transactions && transactions.length > 0) {
      const totalVolume = transactions.reduce((sum, t) => sum + (t.volume_tonnes || 0), 0);
      const totalValue = transactions.reduce(
        (sum, t) => sum + ((t.volume_tonnes || 0) * (t.price_per_tonne || 0)),
        0
      );
      averagePrice = totalVolume > 0 ? totalValue / totalVolume : 850;

      // Calculate supplier concentration
      const supplierVolumes: Record<string, number> = {};
      transactions.forEach((t) => {
        if (t.supplier_id) {
          supplierVolumes[t.supplier_id] =
            (supplierVolumes[t.supplier_id] || 0) + (t.volume_tonnes || 0);
        }
      });

      supplierCount = Object.keys(supplierVolumes).length || 1;
      const maxSupplierVolume = Math.max(...Object.values(supplierVolumes), 0);
      topSupplierPercentage = totalVolume > 0 ? maxSupplierVolume / totalVolume : 0.4;
    }

    // Generate baseline
    const baseline = generateDefaultBaseline({
      annual_volume_requirement: buyer.annual_volume_requirement || 10000,
      average_price: averagePrice,
      top_supplier_percentage: topSupplierPercentage,
      supplier_count: supplierCount,
      ...baseline_assumptions,
    });

    // Run the stress test if requested
    let results = null;
    let status: "draft" | "completed" = "draft";
    let runAt = null;
    let completedAt = null;

    if (run_immediately) {
      runAt = new Date().toISOString();
      results = runStressTest(scenario_type, baseline, parameters || {});
      status = "completed";
      completedAt = new Date().toISOString();
    }

    // Save to database
    const { data: scenario, error } = await supabase
      .from("stress_test_scenarios")
      .insert({
        buyer_id: buyer.id,
        created_by: user.id,
        name,
        description,
        scenario_type,
        parameters: parameters || {},
        baseline_assumptions: baseline,
        results,
        status,
        run_at: runAt,
        completed_at: completedAt,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log methodology provenance for legal defensibility
    if (results) {
      await supabase.from("methodology_provenance").insert({
        entity_type: "stress_test",
        entity_id: scenario.id,
        methodology_name: "ABFI Stress Testing Engine",
        methodology_version: "1.0.0",
        input_data: {
          scenario_type,
          parameters,
          baseline,
        },
        input_sources: [
          {
            source: "Buyer Transaction History",
            date: new Date().toISOString().split("T")[0],
            verified: true,
          },
          {
            source: "Platform Market Data",
            date: new Date().toISOString().split("T")[0],
            verified: true,
          },
        ],
        calculation_steps: [
          { step: 1, operation: `Run ${scenario_type} scenario`, result: results.financial_impact },
          { step: 2, operation: "Calculate risk score", result: results.risk_score },
          { step: 3, operation: "Assess covenant status", result: results.covenant_status === "compliant" ? 1 : 0 },
        ],
        output_data: results,
        confidence_level: "medium",
        uncertainty_notes:
          "Results based on historical data and market assumptions. Actual outcomes may vary significantly.",
      });
    }

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error("Error creating stress test:", error);
    return NextResponse.json(
      { error: "Failed to create stress test" },
      { status: 500 }
    );
  }
}
