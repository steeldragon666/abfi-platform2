import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/feedstocks/[id] - Delete a feedstock
export async function DELETE(
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

    // Get supplier
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

    // Verify feedstock belongs to supplier
    const { data: feedstock } = await supabase
      .from("feedstocks")
      .select("id, supplier_id")
      .eq("id", id)
      .single();

    if (!feedstock) {
      return NextResponse.json(
        { error: "Feedstock not found" },
        { status: 404 }
      );
    }

    if (feedstock.supplier_id !== supplier.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this feedstock" },
        { status: 403 }
      );
    }

    // Delete feedstock (cascades to certificates, quality_tests, shortlists)
    const { error } = await supabase.from("feedstocks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting feedstock:", error);
      return NextResponse.json(
        { error: "Failed to delete feedstock" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/feedstocks/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/feedstocks/[id] - Update feedstock status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

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
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Verify feedstock belongs to supplier
    const { data: feedstock } = await supabase
      .from("feedstocks")
      .select("id, supplier_id")
      .eq("id", id)
      .single();

    if (!feedstock) {
      return NextResponse.json(
        { error: "Feedstock not found" },
        { status: 404 }
      );
    }

    if (feedstock.supplier_id !== supplier.id) {
      return NextResponse.json(
        { error: "Not authorized to update this feedstock" },
        { status: 403 }
      );
    }

    // Only allow updating certain fields via this endpoint
    const allowedFields = ["status", "available_volume_current"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("feedstocks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating feedstock:", error);
      return NextResponse.json(
        { error: "Failed to update feedstock" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/feedstocks/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
