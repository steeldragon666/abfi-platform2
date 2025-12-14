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
import {
  Users,
  Package,
  Building2,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Leaf,
  Database,
  FileText,
} from "lucide-react";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get counts
  const { count: totalSuppliers } = await supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true });

  const { count: pendingSuppliers } = await supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true })
    .eq("verification_status", "pending");

  const { count: totalBuyers } = await supabase
    .from("buyers")
    .select("*", { count: "exact", head: true });

  const { count: totalFeedstocks } = await supabase
    .from("feedstocks")
    .select("*", { count: "exact", head: true });

  const { count: pendingFeedstocks } = await supabase
    .from("feedstocks")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // CI Reports metrics
  const { count: totalCIReports } = await supabase
    .from("carbon_intensity_reports")
    .select("*", { count: "exact", head: true });

  const { count: pendingCIReports } = await supabase
    .from("carbon_intensity_reports")
    .select("*", { count: "exact", head: true })
    .in("status", ["submitted", "under_review"]);

  // Stress test metrics
  const { count: totalStressTests } = await supabase
    .from("stress_test_scenarios")
    .select("*", { count: "exact", head: true });

  // Recent ABBA imports
  const { data: recentImports } = await supabase
    .from("abba_import_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Alerts for pending items */}
      {((pendingSuppliers || 0) > 0 || (pendingFeedstocks || 0) > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Items Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {(pendingSuppliers || 0) > 0 && (
              <Button asChild variant="outline">
                <Link href="/admin/verification?type=suppliers">
                  <Clock className="mr-2 h-4 w-4" />
                  {pendingSuppliers} pending supplier(s)
                </Link>
              </Button>
            )}
            {(pendingFeedstocks || 0) > 0 && (
              <Button asChild variant="outline">
                <Link href="/admin/verification?type=feedstocks">
                  <Clock className="mr-2 h-4 w-4" />
                  {pendingFeedstocks} pending feedstock(s)
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingSuppliers || 0} pending verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buyers</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBuyers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered producers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedstocks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedstocks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingFeedstocks || 0} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CI Reports</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCIReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCIReports || 0} awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stress Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStressTests || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scenarios created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ABBA Imports</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentImports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Recent imports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification Queue</CardTitle>
            <CardDescription>
              Review and approve supplier and feedstock submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/verification?type=suppliers">
                <Building2 className="mr-2 h-4 w-4" />
                Supplier Verification
                {(pendingSuppliers || 0) > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                    {pendingSuppliers}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/verification?type=feedstocks">
                <Package className="mr-2 h-4 w-4" />
                Feedstock Review
                {(pendingFeedstocks || 0) > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                    {pendingFeedstocks}
                  </span>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
            <CardDescription>
              Key metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Feedstock Registrations</span>
                </div>
                <span className="text-sm font-medium">+12% this month</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Verification Rate</span>
                </div>
                <span className="text-sm font-medium">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Active Users (30d)</span>
                </div>
                <span className="text-sm font-medium">--</span>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/admin/analytics">View Full Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CI Report Management</CardTitle>
            <CardDescription>
              Review and verify carbon intensity reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/auditor/ci-verification">
                <Leaf className="mr-2 h-4 w-4" />
                CI Verification Queue
                {(pendingCIReports || 0) > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                    {pendingCIReports}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/ci-reports">
                <FileText className="mr-2 h-4 w-4" />
                All CI Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Integration</CardTitle>
            <CardDescription>
              Manage ABBA market data and external integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/abba-import">
                <Database className="mr-2 h-4 w-4" />
                ABBA Data Import
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/market-prices">
                <TrendingUp className="mr-2 h-4 w-4" />
                Market Prices
              </Link>
            </Button>
            {recentImports && recentImports.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">Recent imports:</p>
                {recentImports.map((imp) => (
                  <div key={imp.id} className="flex items-center justify-between text-sm py-1">
                    <span>{imp.import_type} import</span>
                    <span className={imp.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>
                      {imp.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
