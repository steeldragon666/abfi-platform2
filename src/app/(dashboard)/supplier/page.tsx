import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
import {
  Package,
  Plus,
  Eye,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Supplier Dashboard",
};

export default async function SupplierDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get supplier data
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  // Get feedstock stats
  const { data: feedstocks, count: feedstockCount } = await supabase
    .from("feedstocks")
    .select("*", { count: "exact" })
    .eq("supplier_id", supplier?.id || "");

  // Get pending inquiries count
  const { count: pendingInquiries } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("supplier_id", supplier?.id || "")
    .eq("status", "pending");

  // Calculate average ABFI score
  const avgScore =
    feedstocks && feedstocks.length > 0
      ? Math.round(
          feedstocks.reduce((sum, f) => sum + (f.abfi_score || 0), 0) /
            feedstocks.length
        )
      : 0;

  // Get active feedstocks count
  const activeFeedstocks =
    feedstocks?.filter((f) => f.status === "active").length || 0;

  const needsSetup = !supplier;

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{supplier?.company_name ? `, ${supplier.company_name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your feedstock listings
          </p>
        </div>
        <Button asChild>
          <Link href="/supplier/feedstocks/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Feedstock
          </Link>
        </Button>
      </div>

      {/* Setup prompt if needed */}
      {needsSetup && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-amber-700">
              Set up your company profile to start listing feedstocks and
              receiving inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/supplier/settings">Complete Setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification status */}
      {supplier && supplier.verification_status === "pending" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5" />
              Verification Pending
            </CardTitle>
            <CardDescription className="text-blue-700">
              Your company profile is under review. This usually takes 1-3
              business days.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Feedstocks
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedstockCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeFeedstocks} active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. ABFI Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Inquiries
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInquiries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent feedstocks and inquiries */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Feedstocks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Feedstocks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/supplier/feedstocks">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {feedstocks && feedstocks.length > 0 ? (
              <div className="space-y-4">
                {feedstocks.slice(0, 5).map((feedstock) => (
                  <div
                    key={feedstock.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{feedstock.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {feedstock.feedstock_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          feedstock.status === "active"
                            ? "default"
                            : feedstock.status === "pending_review"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {feedstock.status === "active" && (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        {feedstock.status === "pending_review" && (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {feedstock.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm font-medium">
                        {feedstock.abfi_score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No feedstocks yet
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/supplier/feedstocks/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first feedstock
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Inquiries</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/supplier/inquiries">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No inquiries yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Inquiries from buyers will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
