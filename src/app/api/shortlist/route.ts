import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/shortlist - Add feedstock to shortlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { feedstock_id } = body;

    if (!feedstock_id) {
      return NextResponse.json(
        { error: "feedstock_id is required" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get buyer
    const { data: buyer } = await supabase
      .from("buyers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Check if already shortlisted
    const { data: existing } = await supabase
      .from("shortlists")
      .select("id")
      .eq("buyer_id", buyer.id)
      .eq("feedstock_id", feedstock_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Already shortlisted" },
        { status: 409 }
      );
    }

    // Verify feedstock exists and is active
    const { data: feedstock } = await supabase
      .from("feedstocks")
      .select("id, status")
      .eq("id", feedstock_id)
      .single();

    if (!feedstock) {
      return NextResponse.json(
        { error: "Feedstock not found" },
        { status: 404 }
      );
    }

    if (feedstock.status !== "active") {
      return NextResponse.json(
        { error: "Feedstock is not available" },
        { status: 400 }
      );
    }

    // Add to shortlist
    const { data, error } = await supabase
      .from("shortlists")
      .insert({
        buyer_id: buyer.id,
        feedstock_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to shortlist:", error);
      return NextResponse.json(
        { error: "Failed to add to shortlist" },
        { status: 500 }
      );
    }

    // Update shortlist count on feedstock
    await supabase.rpc("increment_shortlist_count", {
      feedstock_id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/shortlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/shortlist - Remove feedstock from shortlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const feedstock_id = searchParams.get("feedstock_id");

    if (!feedstock_id) {
      return NextResponse.json(
        { error: "feedstock_id is required" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get buyer
    const { data: buyer } = await supabase
      .from("buyers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Remove from shortlist
    const { error } = await supabase
      .from("shortlists")
      .delete()
      .eq("buyer_id", buyer.id)
      .eq("feedstock_id", feedstock_id);

    if (error) {
      console.error("Error removing from shortlist:", error);
      return NextResponse.json(
        { error: "Failed to remove from shortlist" },
        { status: 500 }
      );
    }

    // Decrement shortlist count on feedstock
    await supabase.rpc("decrement_shortlist_count", {
      feedstock_id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/shortlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/shortlist - Get buyer's shortlist
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get buyer
    const { data: buyer } = await supabase
      .from("buyers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Get shortlist with feedstock details
    const { data, error } = await supabase
      .from("shortlists")
      .select(
        `
        id,
        created_at,
        feedstock:feedstocks(
          id,
          feedstock_id,
          name,
          category,
          state,
          region,
          abfi_score,
          carbon_intensity_value,
          carbon_intensity_rating,
          available_volume_current,
          price_aud_per_tonne,
          status,
          supplier:suppliers(id, company_name, verification_status)
        )
      `
      )
      .eq("buyer_id", buyer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shortlist:", error);
      return NextResponse.json(
        { error: "Failed to fetch shortlist" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/shortlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
