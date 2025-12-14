import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FacilitiesForm } from "./form";

export default async function FacilitiesPage() {
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

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Facility Location</h1>
        <p className="text-muted-foreground mt-2">
          Manage your production facility location. This helps suppliers calculate
          delivery logistics and optimize routes.
        </p>
      </div>

      <FacilitiesForm buyer={buyer} />
    </div>
  );
}
