import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// POST /api/inquiries - Create a new inquiry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      feedstock_id,
      supplier_id,
      volume_requested,
      delivery_location,
      delivery_timeline,
      message,
    } = body;

    if (!feedstock_id || !supplier_id) {
      return NextResponse.json(
        { error: "feedstock_id and supplier_id are required" },
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
      .select("id, company_name")
      .eq("profile_id", user.id)
      .single();

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Verify feedstock exists and is active
    const { data: feedstock } = await supabase
      .from("feedstocks")
      .select("id, name, status, supplier_id")
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
        { error: "Feedstock is not available for inquiry" },
        { status: 400 }
      );
    }

    if (feedstock.supplier_id !== supplier_id) {
      return NextResponse.json(
        { error: "Supplier does not match feedstock" },
        { status: 400 }
      );
    }

    // Generate inquiry ID
    const inquiry_id = `INQ-${randomBytes(4).toString("hex").toUpperCase()}`;

    // Create inquiry
    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        inquiry_id,
        buyer_id: buyer.id,
        supplier_id,
        feedstock_id,
        volume_requested: volume_requested || null,
        delivery_location: delivery_location || null,
        delivery_timeline: delivery_timeline || null,
        initial_message: message || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating inquiry:", error);
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: 500 }
      );
    }

    // Update inquiry count on feedstock
    await supabase.rpc("increment_inquiry_count", {
      feedstock_id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/inquiries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/inquiries - Get inquiries (for buyer or supplier)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // "buyer" or "supplier"

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role === "buyer") {
      // Get buyer's inquiries
      const { data: buyer } = await supabase
        .from("buyers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!buyer) {
        return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
      }

      const { data, error } = await supabase
        .from("inquiries")
        .select(
          `
          *,
          feedstock:feedstocks(id, feedstock_id, name, category),
          supplier:suppliers(id, company_name)
        `
        )
        .eq("buyer_id", buyer.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching buyer inquiries:", error);
        return NextResponse.json(
          { error: "Failed to fetch inquiries" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } else if (role === "supplier") {
      // Get supplier's inquiries
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }

      const { data, error } = await supabase
        .from("inquiries")
        .select(
          `
          *,
          feedstock:feedstocks(id, feedstock_id, name, category),
          buyer:buyers(id, company_name)
        `
        )
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching supplier inquiries:", error);
        return NextResponse.json(
          { error: "Failed to fetch inquiries" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: "role parameter must be 'buyer' or 'supplier'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in GET /api/inquiries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
