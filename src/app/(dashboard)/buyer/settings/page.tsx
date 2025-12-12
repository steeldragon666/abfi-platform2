import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BuyerSettingsForm } from "./form";

export const metadata = {
  title: "Company Settings",
};

export default async function BuyerSettingsPage() {
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

  // Get buyer (may not exist yet)
  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">
          Manage your buyer profile and procurement preferences
        </p>
      </div>

      <BuyerSettingsForm
        profile={profile}
        buyer={buyer}
        userEmail={user.email || ""}
      />
    </div>
  );
}
