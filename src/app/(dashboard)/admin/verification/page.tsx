import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminVerificationClient } from "./client";

export const metadata = {
  title: "Verification Queue",
};

export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const type = (params.type as string) || "suppliers";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get pending suppliers
  const { data: pendingSuppliers } = await supabase
    .from("suppliers")
    .select(
      `
      *,
      profile:profiles(id, email, full_name, created_at)
    `
    )
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  // Get pending feedstocks
  const { data: pendingFeedstocks } = await supabase
    .from("feedstocks")
    .select(
      `
      *,
      supplier:suppliers(id, company_name, verification_status)
    `
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  return (
    <AdminVerificationClient
      pendingSuppliers={pendingSuppliers || []}
      pendingFeedstocks={pendingFeedstocks || []}
      initialTab={type as "suppliers" | "feedstocks"}
    />
  );
}
