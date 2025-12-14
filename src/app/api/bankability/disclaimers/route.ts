import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/bankability/disclaimers
 * Get disclaimer templates by context (stress_test, projection, certificate, etc.)
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
    const context = url.searchParams.get("context");
    const requiredOnly = url.searchParams.get("required") === "true";

    let query = supabase
      .from("disclaimer_templates")
      .select("*")
      .order("is_required", { ascending: false })
      .order("title", { ascending: true });

    // Filter by context if provided
    if (context) {
      query = query.contains("applies_to", [context]);
    }

    // Filter by required only
    if (requiredOnly) {
      query = query.eq("is_required", true);
    }

    const { data: disclaimers, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ disclaimers: disclaimers || [] });
  } catch (error) {
    console.error("Error fetching disclaimers:", error);
    return NextResponse.json(
      { error: "Failed to fetch disclaimers" },
      { status: 500 }
    );
  }
}
