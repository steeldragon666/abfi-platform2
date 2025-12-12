import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedstockWizard } from "./wizard";

export const metadata = {
  title: "Add Feedstock",
};

export default async function NewFeedstockPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get supplier
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!supplier) {
    redirect("/supplier/settings?setup=required");
  }

  if (supplier.verification_status !== "verified") {
    redirect("/supplier?notice=verification_required");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Feedstock</h1>
        <p className="text-muted-foreground mt-2">
          Register a new feedstock source. Complete all steps to get your ABFI Score.
        </p>
      </div>
      <FeedstockWizard supplierId={supplier.id} />
    </div>
  );
}
