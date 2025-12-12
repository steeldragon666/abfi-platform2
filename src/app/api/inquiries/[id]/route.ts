import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/inquiries/[id] - Get inquiry details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's buyer and supplier records
    const { data: buyer } = await supabase
      .from("buyers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    // Get inquiry with related data
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .select(
        `
        *,
        feedstock:feedstocks(
          id,
          feedstock_id,
          name,
          category,
          state,
          region,
          abfi_score,
          available_volume_current,
          price_aud_per_tonne
        ),
        buyer:buyers(id, company_name, contact_name, contact_email),
        supplier:suppliers(id, company_name, contact_name, contact_email),
        messages:inquiry_messages(*)
      `
      )
      .eq("id", id)
      .single();

    if (error || !inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this inquiry
    const isBuyer = buyer?.id === inquiry.buyer_id;
    const isSupplier = supplier?.id === inquiry.supplier_id;

    if (!isBuyer && !isSupplier) {
      return NextResponse.json(
        { error: "Not authorized to view this inquiry" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...inquiry,
      userRole: isBuyer ? "buyer" : "supplier",
    });
  } catch (error) {
    console.error("Error in GET /api/inquiries/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/inquiries/[id] - Update inquiry status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { status, response_message } = body;

    const validStatuses = [
      "pending",
      "responded",
      "negotiating",
      "accepted",
      "rejected",
      "expired",
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get supplier
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!supplier) {
      return NextResponse.json(
        { error: "Only suppliers can update inquiry status" },
        { status: 403 }
      );
    }

    // Verify inquiry belongs to supplier
    const { data: inquiry } = await supabase
      .from("inquiries")
      .select("id, supplier_id, status")
      .eq("id", id)
      .single();

    if (!inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    if (inquiry.supplier_id !== supplier.id) {
      return NextResponse.json(
        { error: "Not authorized to update this inquiry" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === "responded" && inquiry.status === "pending") {
        updateData.responded_at = new Date().toISOString();
      }
    }

    // Update inquiry
    const { data, error } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating inquiry:", error);
      return NextResponse.json(
        { error: "Failed to update inquiry" },
        { status: 500 }
      );
    }

    // If there's a response message, add it to inquiry_messages
    if (response_message) {
      await supabase.from("inquiry_messages").insert({
        inquiry_id: id,
        sender_id: user.id,
        sender_type: "supplier",
        message: response_message,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/inquiries/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
