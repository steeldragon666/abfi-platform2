import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BuyerSearchClient } from "./client";

export const metadata = {
  title: "Search Feedstocks",
};

export default async function BuyerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get buyer data
  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  // Build query
  let query = supabase
    .from("feedstocks")
    .select(
      `
      *,
      supplier:suppliers(id, company_name, verification_status),
      certificates(id, type, status)
    `
    )
    .eq("status", "active");

  // Apply filters from searchParams
  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.state) {
    query = query.eq("state", params.state);
  }

  if (params.min_score) {
    query = query.gte("abfi_score", parseInt(params.min_score as string));
  }

  if (params.max_ci) {
    query = query.lte(
      "carbon_intensity_value",
      parseFloat(params.max_ci as string)
    );
  }

  // Execute query
  const { data: feedstocks } = await query.order("abfi_score", {
    ascending: false,
  });

  // Get buyer's shortlist
  const { data: shortlist } = await supabase
    .from("shortlists")
    .select("feedstock_id")
    .eq("buyer_id", buyer?.id || "");

  const shortlistedIds = new Set(shortlist?.map((s) => s.feedstock_id) || []);

  return (
    <BuyerSearchClient
      feedstocks={feedstocks || []}
      shortlistedIds={shortlistedIds}
      buyerId={buyer?.id}
      initialFilters={{
        category: params.category as string,
        state: params.state as string,
        min_score: params.min_score as string,
        max_ci: params.max_ci as string,
      }}
    />
  );
}
