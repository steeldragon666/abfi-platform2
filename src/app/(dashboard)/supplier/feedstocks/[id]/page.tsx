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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Package,
  Calendar,
  Truck,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Leaf,
  Gauge,
  FlaskConical,
} from "lucide-react";
import { AbfiScoreCard, CarbonRatingBadge } from "@/components/rating/AbfiScoreCard";
import { format } from "date-fns";

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
    title: feedstock?.name || "Feedstock Details",
  };
}

export default async function FeedstockDetailPage({
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

  // Get feedstock with certificates and quality tests
  const { data: feedstock } = await supabase
    .from("feedstocks")
    .select(`
      *,
      certificates(*),
      quality_tests(*)
    `)
    .eq("id", id)
    .eq("supplier_id", supplier.id)
    .single();

  if (!feedstock) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "pending_review":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline">
            <Edit className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Suspended
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

  const getCertStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/supplier/feedstocks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {feedstock.name}
              </h1>
              {getStatusBadge(feedstock.status)}
            </div>
            <p className="text-muted-foreground">
              {feedstock.feedstock_id} &bull; {getCategoryLabel(feedstock.category)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/supplier/feedstocks/${feedstock.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Feedstock Type
                </div>
                <div className="mt-1">{feedstock.type || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Production Method
                </div>
                <div className="mt-1">{feedstock.production_method || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Collection Method
                </div>
                <div className="mt-1">{feedstock.collection_method || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Storage Method
                </div>
                <div className="mt-1">{feedstock.storage_method || "-"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  State
                </div>
                <div className="mt-1">{feedstock.state}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Region
                </div>
                <div className="mt-1">{feedstock.region || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Coordinates
                </div>
                <div className="mt-1">
                  {feedstock.latitude && feedstock.longitude
                    ? `${feedstock.latitude}, ${feedstock.longitude}`
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Distance to Port
                </div>
                <div className="mt-1">
                  {feedstock.distance_to_port_km
                    ? `${feedstock.distance_to_port_km} km`
                    : "-"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Volume & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Volume & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Current Available Volume
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {feedstock.available_volume_current?.toLocaleString() || 0} tonnes
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Annual Capacity
                </div>
                <div className="mt-1">
                  {feedstock.available_volume_annual?.toLocaleString() || 0} tonnes/year
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Minimum Order
                </div>
                <div className="mt-1">
                  {feedstock.minimum_order_tonnes?.toLocaleString() || "-"} tonnes
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Lead Time
                </div>
                <div className="mt-1">
                  {feedstock.lead_time_days ? `${feedstock.lead_time_days} days` : "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Price (Ex-Works)
                </div>
                <div className="mt-1 text-lg font-semibold text-green-700">
                  {feedstock.price_aud_per_tonne
                    ? `$${feedstock.price_aud_per_tonne.toLocaleString()} AUD/tonne`
                    : "Contact for pricing"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Delivery Options
                </div>
                <div className="mt-1">{feedstock.delivery_options || "-"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Quality Parameters
              </CardTitle>
              <CardDescription>
                Category-specific quality specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedstock.quality_parameters ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {Object.entries(
                    feedstock.quality_parameters as Record<string, number>
                  ).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="mt-1 font-mono">{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No quality parameters recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sustainability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Sustainability & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Carbon Intensity:</span>
                {feedstock.carbon_intensity_value ? (
                  <>
                    <span>{feedstock.carbon_intensity_value} gCO2e/MJ</span>
                    {feedstock.carbon_intensity_rating && (
                      <CarbonRatingBadge
                        rating={feedstock.carbon_intensity_rating}
                        value={feedstock.carbon_intensity_value}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">Not measured</span>
                )}
              </div>

              {feedstock.sustainability_data ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(
                    feedstock.sustainability_data as Record<string, boolean>
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-sm capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No sustainability data recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Certificates
              </CardTitle>
              <CardDescription>
                Certifications and accreditations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedstock.certificates && feedstock.certificates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedstock.certificates.map((cert: {
                      id: string;
                      type: string;
                      certificate_number?: string;
                      issue_date?: string;
                      expiry_date?: string;
                      status: string;
                    }) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">
                          {cert.type}
                        </TableCell>
                        <TableCell>{cert.certificate_number || "-"}</TableCell>
                        <TableCell>
                          {cert.issue_date
                            ? format(new Date(cert.issue_date), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {cert.expiry_date
                            ? format(new Date(cert.expiry_date), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>{getCertStatusBadge(cert.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No certificates uploaded yet
                  </p>
                  <Button variant="outline" className="mt-4" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Certificate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Quality Test History
              </CardTitle>
              <CardDescription>
                Laboratory test results and quality reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedstock.quality_tests && feedstock.quality_tests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Date</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedstock.quality_tests.map((test: {
                      id: string;
                      test_date?: string;
                      laboratory_name?: string;
                      batch_reference?: string;
                      verification_status: string;
                    }) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          {test.test_date
                            ? format(new Date(test.test_date), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>{test.laboratory_name || "-"}</TableCell>
                        <TableCell>{test.batch_reference || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              test.verification_status === "verified"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {test.verification_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No quality tests recorded yet
                  </p>
                  <Button variant="outline" className="mt-4" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Test Results
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* ABFI Score Card */}
          <AbfiScoreCard
            abfiScore={feedstock.abfi_score || 0}
            sustainabilityScore={feedstock.sustainability_score || 0}
            carbonIntensityScore={feedstock.carbon_intensity_score || 0}
            qualityScore={feedstock.quality_score || 0}
            reliabilityScore={feedstock.reliability_score || 0}
            carbonIntensityValue={feedstock.carbon_intensity_value}
            carbonRating={feedstock.carbon_intensity_rating}
          />

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Views</span>
                <span className="font-medium">{feedstock.view_count || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inquiries</span>
                <span className="font-medium">{feedstock.inquiry_count || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Times Shortlisted
                </span>
                <span className="font-medium">
                  {feedstock.shortlist_count || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="text-sm">
                    {feedstock.created_at
                      ? format(new Date(feedstock.created_at), "dd MMM yyyy")
                      : "-"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Last Updated
                  </div>
                  <div className="text-sm">
                    {feedstock.updated_at
                      ? format(new Date(feedstock.updated_at), "dd MMM yyyy")
                      : "-"}
                  </div>
                </div>
              </div>
              {feedstock.last_verified_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Last Verified
                    </div>
                    <div className="text-sm">
                      {format(
                        new Date(feedstock.last_verified_at),
                        "dd MMM yyyy"
                      )}
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
