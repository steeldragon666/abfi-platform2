import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/users
 * Get all users with filters (admin only)
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

    // Check admin role
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const search = url.searchParams.get("search");
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sortBy") || "created_at";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Build query for profiles table (Supabase auth profiles)
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    // Search by email or name
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Filter by role
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    // Filter by status (is_active field if exists)
    if (status && status !== "all") {
      if (status === "active") {
        query = query.eq("is_active", true);
      } else if (status === "suspended") {
        query = query.eq("is_active", false);
      }
    }

    const { data: users, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get linked supplier/buyer info for each user
    const userIds = users?.map((u) => u.id) || [];

    // Fetch suppliers
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("id, profile_id, company_name, verification_status")
      .in("profile_id", userIds);

    // Fetch buyers
    const { data: buyers } = await supabase
      .from("buyers")
      .select("id, profile_id, company_name, verification_status")
      .in("profile_id", userIds);

    // Create lookup maps
    const supplierMap = new Map(suppliers?.map((s) => [s.profile_id, s]) || []);
    const buyerMap = new Map(buyers?.map((b) => [b.profile_id, b]) || []);

    // Enrich user data
    const enrichedUsers = users?.map((u) => ({
      ...u,
      supplier: supplierMap.get(u.id) || null,
      buyer: buyerMap.get(u.id) || null,
    }));

    return NextResponse.json({
      users: enrichedUsers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update user (role, status)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "userId and updates are required" },
        { status: 400 }
      );
    }

    // Prevent self-demotion from admin
    if (userId === user.id && updates.role && updates.role !== "admin") {
      return NextResponse.json(
        { error: "Cannot change your own admin role" },
        { status: 400 }
      );
    }

    // Get current user data for audit log
    const { data: currentUser } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      user_role: "admin",
      action: updates.role ? "change_user_role" : updates.is_active !== undefined ? "change_user_status" : "update_user",
      action_category: "admin",
      entity_type: "user",
      entity_id: userId,
      entity_name: currentUser?.email || userId,
      old_values: currentUser,
      new_values: updatedUser,
      success: true,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
