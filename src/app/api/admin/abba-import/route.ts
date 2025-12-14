import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseCSV,
  parseMarketPrices,
  parseFeedstockData,
} from "@/lib/abba/parser";
import type { ABBAImportResult } from "@/lib/abba/types";

/**
 * GET /api/admin/abba-import
 * Get import history
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get import logs
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const { data: logs, error } = await supabase
      .from("abba_import_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error("Error fetching import logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch import logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/abba-import
 * Import ABBA data from CSV
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const importType = (formData.get("import_type") as string) || "price";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const startedAt = new Date().toISOString();
    const csvContent = await file.text();
    const records = parseCSV(csvContent);

    // Create import log
    const { data: importLog, error: logError } = await supabase
      .from("abba_import_logs")
      .insert({
        import_type: importType,
        source_file: file.name,
        status: "processing",
        started_at: startedAt,
        imported_by: user.id,
        records_processed: records.length,
      })
      .select()
      .single();

    if (logError) {
      throw logError;
    }

    const result: ABBAImportResult = {
      success: false,
      import_type: importType as ABBAImportResult["import_type"],
      records_processed: records.length,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      errors: [],
      started_at: startedAt,
      completed_at: "",
    };

    try {
      if (importType === "price") {
        // Parse and import market prices
        const { prices, errors } = parseMarketPrices(records);
        result.errors = errors;
        result.records_failed = errors.length;

        for (const price of prices) {
          // Upsert price data
          const { error: upsertError } = await supabase
            .from("abba_market_prices")
            .upsert(
              {
                feedstock_category: price.feedstock_category,
                region: price.region,
                price_date: price.price_date,
                price_aud_per_tonne: price.price_aud_per_tonne,
                price_usd_per_tonne: price.price_usd_per_tonne,
                price_low: price.price_low,
                price_high: price.price_high,
                volume_available_tonnes: price.volume_available_tonnes,
                source: price.source,
              },
              {
                onConflict: "feedstock_category,region,price_date",
                ignoreDuplicates: false,
              }
            );

          if (upsertError) {
            result.records_failed++;
            result.errors.push({
              row: 0,
              message: `Database error: ${upsertError.message}`,
              raw_data: price,
            });
          } else {
            result.records_created++;
          }
        }
      } else if (importType === "feedstock") {
        // Parse feedstock data (for reference, actual feedstock creation would go through suppliers)
        const { feedstocks, errors } = parseFeedstockData(records);
        result.errors = errors;
        result.records_failed = errors.length;

        // For now, just validate - actual feedstock creation requires supplier context
        result.records_processed = feedstocks.length + errors.length;
        result.records_created = feedstocks.length; // Would be inserted if creating feedstocks
      }

      result.success = result.records_failed === 0 || result.records_created > 0;
      result.completed_at = new Date().toISOString();

      // Update import log
      await supabase
        .from("abba_import_logs")
        .update({
          status: result.success ? "completed" : "failed",
          records_created: result.records_created,
          records_updated: result.records_updated,
          records_failed: result.records_failed,
          errors: result.errors,
          completed_at: result.completed_at,
        })
        .eq("id", importLog.id);

      return NextResponse.json(result);
    } catch (processingError) {
      // Update log on failure
      await supabase
        .from("abba_import_logs")
        .update({
          status: "failed",
          errors: [
            {
              row: 0,
              message: `Processing error: ${processingError instanceof Error ? processingError.message : "Unknown error"}`,
            },
          ],
          completed_at: new Date().toISOString(),
        })
        .eq("id", importLog.id);

      throw processingError;
    }
  } catch (error) {
    console.error("Error importing ABBA data:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}
