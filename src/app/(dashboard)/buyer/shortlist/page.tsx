import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShortlistClient } from "./client";

export default async function ShortlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "buyer") {
    redirect("/dashboard");
  }

  // Get buyer data
  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!buyer) {
    redirect("/buyer/settings");
  }

  // Get shortlisted feedstocks with full details
  const { data: shortlistData } = await supabase
    .from("shortlists")
    .select(`
      id,
      notes,
      created_at,
      feedstock:feedstocks (
        id,
        feedstock_id,
        name,
        description,
        category,
        type,
        state,
        region,
        latitude,
        longitude,
        abfi_score,
        sustainability_score,
        carbon_intensity_score,
        quality_score,
        reliability_score,
        carbon_intensity_value,
        available_volume_current,
        annual_capacity_tonnes,
        price_indicative,
        price_currency,
        supplier:suppliers (
          id,
          company_name,
          verification_status
        ),
        certificates (
          id,
          type,
          status,
          expiry_date
        )
      )
    `)
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false });

  const shortlist = shortlistData || [];

  return (
    <div className="container max-w-6xl py-8">
      <ShortlistClient shortlist={shortlist} buyerId={buyer.id} />
    </div>
  );
}
