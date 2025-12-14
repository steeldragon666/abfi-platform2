import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminMarketsClient } from "./client";

export const metadata = {
  title: "Market Monitoring | ABFI Admin",
  description: "Monitor and manage market signals across the platform",
};

export default async function AdminMarketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile and verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Get all market signals with user info
  const { data: signals } = await supabase
    .from("market_signals")
    .select(`
      *,
      profiles:user_id (
        full_name,
        email,
        company_name
      )
    `)
    .order("created_at", { ascending: false });

  // Get market matches
  const { data: matches } = await supabase
    .from("market_matches")
    .select(`
      *,
      buy_signal:buy_signal_id (
        commodity_name,
        volume,
        unit,
        user_id,
        profiles:user_id (full_name, company_name)
      ),
      sell_signal:sell_signal_id (
        commodity_name,
        volume,
        unit,
        user_id,
        profiles:user_id (full_name, company_name)
      )
    `)
    .order("created_at", { ascending: false });

  // Get signal stats
  const { count: totalSignals } = await supabase
    .from("market_signals")
    .select("*", { count: "exact", head: true });

  const { count: activeSignals } = await supabase
    .from("market_signals")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: buySignals } = await supabase
    .from("market_signals")
    .select("*", { count: "exact", head: true })
    .eq("signal_type", "buy")
    .eq("status", "active");

  const { count: sellSignals } = await supabase
    .from("market_signals")
    .select("*", { count: "exact", head: true })
    .eq("signal_type", "sell")
    .eq("status", "active");

  return (
    <div className="container max-w-7xl py-8">
      <AdminMarketsClient
        signals={signals || []}
        matches={matches || []}
        stats={{
          total: totalSignals || 0,
          active: activeSignals || 0,
          buySignals: buySignals || 0,
          sellSignals: sellSignals || 0,
        }}
      />
    </div>
  );
}
