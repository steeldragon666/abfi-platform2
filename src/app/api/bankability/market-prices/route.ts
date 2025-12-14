import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/bankability/market-prices
 * Get market prices for feedstock categories
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
    const category = url.searchParams.get("category");
    const region = url.searchParams.get("region") || "AU";
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const latest = url.searchParams.get("latest") === "true";

    let query = supabase
      .from("abba_market_prices")
      .select("*")
      .eq("region", region)
      .order("price_date", { ascending: false });

    if (category) {
      query = query.eq("feedstock_category", category);
    }

    if (startDate) {
      query = query.gte("price_date", startDate);
    }

    if (endDate) {
      query = query.lte("price_date", endDate);
    }

    if (latest) {
      // Get only the latest price for each category
      query = query.limit(100);
    }

    const { data: prices, error } = await query;

    if (error) {
      throw error;
    }

    // If latest requested, dedupe to get only most recent per category
    let result = prices || [];
    if (latest) {
      const latestByCategory: Record<string, typeof result[0]> = {};
      for (const price of result) {
        if (!latestByCategory[price.feedstock_category]) {
          latestByCategory[price.feedstock_category] = price;
        }
      }
      result = Object.values(latestByCategory);
    }

    return NextResponse.json({ prices: result });
  } catch (error) {
    console.error("Error fetching market prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch market prices" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bankability/market-prices
 * Manually add a market price (admin only)
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

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      feedstock_category,
      region,
      price_date,
      price_aud_per_tonne,
      price_usd_per_tonne,
      price_low,
      price_high,
      volume_available_tonnes,
    } = body;

    if (!feedstock_category || !price_date || !price_aud_per_tonne) {
      return NextResponse.json(
        { error: "feedstock_category, price_date, and price_aud_per_tonne are required" },
        { status: 400 }
      );
    }

    const { data: price, error } = await supabase
      .from("abba_market_prices")
      .upsert(
        {
          feedstock_category,
          region: region || "AU",
          price_date,
          price_aud_per_tonne,
          price_usd_per_tonne,
          price_low,
          price_high,
          volume_available_tonnes,
          source: "manual",
        },
        {
          onConflict: "feedstock_category,region,price_date",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(price, { status: 201 });
  } catch (error) {
    console.error("Error creating market price:", error);
    return NextResponse.json(
      { error: "Failed to create market price" },
      { status: 500 }
    );
  }
}
