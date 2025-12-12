import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditFeedstockForm } from "./form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: feedstock } = await supabase
    .from("feedstocks")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: feedstock?.name ? `Edit ${feedstock.name}` : "Edit Feedstock",
  };
}

export default async function EditFeedstockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
    redirect("/supplier/settings");
  }

  // Get feedstock
  const { data: feedstock } = await supabase
    .from("feedstocks")
    .select("*")
    .eq("id", id)
    .eq("supplier_id", supplier.id)
    .single();

  if (!feedstock) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <EditFeedstockForm feedstock={feedstock} />
    </div>
  );
}
