import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Package,
  MapPin,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { AbfiScoreBadge } from "@/components/rating/AbfiScoreCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("inquiry_id")
    .eq("id", id)
    .single();

  return {
    title: inquiry?.inquiry_id || "Inquiry Details",
  };
}

export default async function BuyerInquiryDetailPage({
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

  // Get buyer
  const { data: buyer } = await supabase
    .from("buyers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!buyer) {
    redirect("/buyer/settings");
  }

  // Get inquiry with related data
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select(
      `
      *,
      feedstock:feedstocks(
        id,
        feedstock_id,
        name,
        category,
        state,
        region,
        abfi_score,
        carbon_intensity_value,
        carbon_intensity_rating,
        available_volume_current,
        price_aud_per_tonne
      ),
      supplier:suppliers(
        id,
        company_name,
        contact_name,
        contact_email,
        contact_phone,
        verification_status
      )
    `
    )
    .eq("id", id)
    .eq("buyer_id", buyer.id)
    .single();

  if (!inquiry) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Awaiting Response
          </Badge>
        );
      case "responded":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <MessageSquare className="mr-1 h-3 w-3" />
            Response Received
          </Badge>
        );
      case "negotiating":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            In Negotiation
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Declined by Supplier
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      oilseed: "Oilseed",
      UCO: "Used Cooking Oil",
      tallow: "Tallow",
      lignocellulosic: "Lignocellulosic",
      waste: "Waste",
      algae: "Algae",
      bamboo: "Bamboo",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/buyer/inquiries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {inquiry.inquiry_id}
              </h1>
              {getStatusBadge(inquiry.status)}
            </div>
            <p className="text-muted-foreground">
              Sent{" "}
              {inquiry.created_at
                ? format(new Date(inquiry.created_at), "dd MMM yyyy 'at' HH:mm")
                : "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">
                    {inquiry.supplier?.company_name || "-"}
                  </div>
                  {inquiry.supplier?.verification_status === "verified" && (
                    <Badge className="bg-green-100 text-green-800 mt-1">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified Supplier
                    </Badge>
                  )}
                </div>
              </div>
              {inquiry.status !== "pending" && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Contact Name
                    </div>
                    <div className="mt-1">
                      {inquiry.supplier?.contact_name || "-"}
                    </div>
                  </div>
                  {inquiry.supplier?.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${inquiry.supplier.contact_email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {inquiry.supplier.contact_email}
                      </a>
                    </div>
                  )}
                  {inquiry.supplier?.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${inquiry.supplier.contact_phone}`}
                        className="text-sm"
                      >
                        {inquiry.supplier.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
              {inquiry.status === "pending" && (
                <p className="text-sm text-muted-foreground">
                  Contact details will be visible once the supplier responds to
                  your inquiry.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Your Inquiry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Inquiry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Requested Volume
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {inquiry.volume_requested
                      ? `${inquiry.volume_requested.toLocaleString()} tonnes`
                      : "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Delivery Timeline
                  </div>
                  <div className="mt-1">
                    {inquiry.delivery_timeline || "Not specified"}
                  </div>
                </div>
              </div>
              {inquiry.delivery_location && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Delivery Location
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {inquiry.delivery_location}
                  </div>
                </div>
              )}
              {inquiry.initial_message && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Your Message
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-sm">
                    {inquiry.initial_message}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Response */}
          {inquiry.status === "responded" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Supplier Response
                </CardTitle>
                <CardDescription>
                  Received{" "}
                  {inquiry.responded_at
                    ? format(new Date(inquiry.responded_at), "dd MMM yyyy")
                    : "-"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  The supplier has responded to your inquiry. You can now contact
                  them directly using the information above.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button asChild>
                    <a href={`mailto:${inquiry.supplier?.contact_email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Supplier
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {inquiry.status === "rejected" && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Inquiry Declined
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">
                  Unfortunately, the supplier has declined this inquiry. You may
                  want to explore other feedstock options or submit a new inquiry
                  with different requirements.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/buyer/search">Browse Other Feedstocks</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Feedstock Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Feedstock Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{inquiry.feedstock?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {inquiry.feedstock?.feedstock_id}
                  </div>
                </div>
                {inquiry.feedstock?.abfi_score && (
                  <AbfiScoreBadge score={inquiry.feedstock.abfi_score} size="sm" />
                )}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>
                    {inquiry.feedstock?.category
                      ? getCategoryLabel(inquiry.feedstock.category)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>
                    {inquiry.feedstock?.state}, {inquiry.feedstock?.region || ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carbon Intensity</span>
                  <span>
                    {inquiry.feedstock?.carbon_intensity_value
                      ? `${inquiry.feedstock.carbon_intensity_value} gCO2e/MJ`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span>
                    {inquiry.feedstock?.available_volume_current?.toLocaleString() ||
                      0}{" "}
                    t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium text-green-700">
                    {inquiry.feedstock?.price_aud_per_tonne
                      ? `$${inquiry.feedstock.price_aud_per_tonne}/t`
                      : "Contact"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Inquiry Sent</div>
                  <div className="text-xs text-muted-foreground">
                    {inquiry.created_at
                      ? format(new Date(inquiry.created_at), "dd MMM yyyy")
                      : "-"}
                  </div>
                </div>
              </div>
              {inquiry.responded_at ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Supplier Responded</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(inquiry.responded_at), "dd MMM yyyy")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Awaiting Response
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
