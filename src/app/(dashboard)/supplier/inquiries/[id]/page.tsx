import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
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
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { InquiryResponseForm } from "./response-form";

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

export default async function SupplierInquiryDetailPage({
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
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!supplier) {
    redirect("/supplier/settings");
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
        available_volume_current,
        price_aud_per_tonne
      ),
      buyer:buyers(
        id,
        company_name,
        contact_name,
        contact_email,
        contact_phone,
        company_type,
        annual_volume_requirement
      )
    `
    )
    .eq("id", id)
    .eq("supplier_id", supplier.id)
    .single();

  if (!inquiry) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending Response
          </Badge>
        );
      case "responded":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <MessageSquare className="mr-1 h-3 w-3" />
            Responded
          </Badge>
        );
      case "negotiating":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            Negotiating
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
            Declined
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
            <Link href="/supplier/inquiries">
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
              Received{" "}
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
          {/* Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Buyer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Company Name
                </div>
                <div className="mt-1 font-medium">
                  {inquiry.buyer?.company_name || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Company Type
                </div>
                <div className="mt-1 capitalize">
                  {inquiry.buyer?.company_type?.replace(/_/g, " ") || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Contact Name
                </div>
                <div className="mt-1">{inquiry.buyer?.contact_name || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Annual Volume Need
                </div>
                <div className="mt-1">
                  {inquiry.buyer?.annual_volume_requirement
                    ? `${inquiry.buyer.annual_volume_requirement.toLocaleString()} t/year`
                    : "-"}
                </div>
              </div>
              {inquiry.buyer?.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${inquiry.buyer.contact_email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {inquiry.buyer.contact_email}
                  </a>
                </div>
              )}
              {inquiry.buyer?.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${inquiry.buyer.contact_phone}`}
                    className="text-sm"
                  >
                    {inquiry.buyer.contact_phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Inquiry Details
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
                    Message from Buyer
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-sm">
                    {inquiry.initial_message}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Form */}
          {inquiry.status === "pending" && (
            <InquiryResponseForm inquiryId={inquiry.id} />
          )}

          {/* Response History */}
          {inquiry.responded_at && (
            <Card>
              <CardHeader>
                <CardTitle>Response History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Responded on{" "}
                  {format(new Date(inquiry.responded_at), "dd MMM yyyy 'at' HH:mm")}
                </div>
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
                Feedstock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">{inquiry.feedstock?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {inquiry.feedstock?.feedstock_id}
                </div>
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
                  <span className="text-muted-foreground">ABFI Score</span>
                  <span className="font-medium">
                    {inquiry.feedstock?.abfi_score || 0}/100
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
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/supplier/feedstocks/${inquiry.feedstock?.id}`}>
                  View Feedstock
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inquiry.status === "responded" && (
                <>
                  <Button className="w-full" variant="default">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Accepted
                  </Button>
                  <Button className="w-full" variant="outline">
                    Continue Negotiation
                  </Button>
                </>
              )}
              {inquiry.buyer?.contact_email && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${inquiry.buyer.contact_email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Buyer
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Received</div>
                  <div className="text-sm">
                    {inquiry.created_at
                      ? format(new Date(inquiry.created_at), "dd MMM yyyy")
                      : "-"}
                  </div>
                </div>
              </div>
              {inquiry.responded_at && (
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Responded</div>
                    <div className="text-sm">
                      {format(new Date(inquiry.responded_at), "dd MMM yyyy")}
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
