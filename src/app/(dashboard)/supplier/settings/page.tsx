import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SupplierSettingsForm } from "./form";

export const metadata = {
  title: "Company Settings",
};

export default async function SupplierSettingsPage() {
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

  // Get supplier (may not exist yet)
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">
          Manage your supplier profile and company information
        </p>
      </div>

      <SupplierSettingsForm
        profile={profile}
        supplier={supplier}
        userEmail={user.email || ""}
      />
    </div>
  );
}
