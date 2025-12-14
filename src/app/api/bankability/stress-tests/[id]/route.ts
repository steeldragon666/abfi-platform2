import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runStressTest } from "@/lib/bankability/stress-testing";
import type { StressTestParameters, StressTestBaseline, ScenarioType } from "@/types/database";

/**
 * GET /api/bankability/stress-tests/[id]
 * Get a single stress test scenario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get the scenario
    const { data: scenario, error } = await supabase
      .from("stress_test_scenarios")
      .select("*")
      .eq("id", id)
      .eq("buyer_id", buyer.id)
      .single();

    if (error || !scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    // Get methodology provenance if exists
    const { data: provenance } = await supabase
      .from("methodology_provenance")
      .select("*")
      .eq("entity_type", "stress_test")
      .eq("entity_id", id)
      .single();

    return NextResponse.json({
      scenario,
      provenance,
    });
  } catch (error) {
    console.error("Error fetching stress test:", error);
    return NextResponse.json(
      { error: "Failed to fetch stress test" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bankability/stress-tests/[id]
 * Update a stress test scenario (draft only) or re-run
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, parameters, rerun } = body as {
      name?: string;
      description?: string;
      parameters?: StressTestParameters;
      rerun?: boolean;
    };

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

    // Get existing scenario
    const { data: existingScenario, error: fetchError } = await supabase
      .from("stress_test_scenarios")
      .select("*")
      .eq("id", id)
      .eq("buyer_id", buyer.id)
      .single();

    if (fetchError || !existingScenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (parameters) updates.parameters = parameters;

    // Re-run the scenario if requested
    if (rerun) {
      const baseline = existingScenario.baseline_assumptions as StressTestBaseline;
      const scenarioParams = parameters || (existingScenario.parameters as StressTestParameters);
      const scenarioType = existingScenario.scenario_type as ScenarioType;

      updates.results = runStressTest(scenarioType, baseline, scenarioParams);
      updates.status = "completed";
      updates.run_at = new Date().toISOString();
      updates.completed_at = new Date().toISOString();
    }

    // Update the scenario
    const { data: scenario, error } = await supabase
      .from("stress_test_scenarios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Error updating stress test:", error);
    return NextResponse.json(
      { error: "Failed to update stress test" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bankability/stress-tests/[id]
 * Delete a stress test scenario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Delete the scenario (RLS will prevent deleting other buyers' scenarios)
    const { error } = await supabase
      .from("stress_test_scenarios")
      .delete()
      .eq("id", id)
      .eq("buyer_id", buyer.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stress test:", error);
    return NextResponse.json(
      { error: "Failed to delete stress test" },
      { status: 500 }
    );
  }
}
