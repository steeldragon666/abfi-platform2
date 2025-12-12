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
  Search,
  Star,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Clock,
  MapPin,
} from "lucide-react";

export const metadata = {
  title: "Buyer Dashboard",
};

export default async function BuyerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get buyer data
  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  // Get shortlist count
  const { count: shortlistCount } = await supabase
    .from("shortlists")
    .select("*", { count: "exact", head: true })
    .eq("buyer_id", buyer?.id || "");

  // Get active inquiries count
  const { count: activeInquiries } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("buyer_id", buyer?.id || "")
    .in("status", ["pending", "responded"]);

  // Get total feedstocks count (for discovery)
  const { count: totalFeedstocks } = await supabase
    .from("feedstocks")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const needsSetup = !buyer;

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{buyer?.company_name ? `, ${buyer.company_name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Discover verified feedstock suppliers for your bioenergy production
          </p>
        </div>
        <Button asChild>
          <Link href="/buyer/search">
            <Search className="mr-2 h-4 w-4" />
            Search Feedstocks
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
              Set up your company profile to start searching for feedstocks and
              contacting suppliers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/buyer/settings">Complete Setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification status */}
      {buyer && buyer.verification_status === "pending" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5" />
              Verification Pending
            </CardTitle>
            <CardDescription className="text-blue-700">
              Your company profile is under review. You can browse feedstocks
              while waiting.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Feedstocks
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedstocks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active listings on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shortlistCount || 0}</div>
            <p className="text-xs text-muted-foreground">Saved feedstocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInquiries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ongoing conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. ABFI Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72</div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search by category */}
        <Card>
          <CardHeader>
            <CardTitle>Search by Category</CardTitle>
            <CardDescription>
              Find feedstocks by type for your production needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Oilseed", query: "oilseed", emoji: "🌻" },
                { name: "Used Cooking Oil", query: "UCO", emoji: "🍳" },
                { name: "Tallow", query: "tallow", emoji: "🥩" },
                { name: "Lignocellulosic", query: "lignocellulosic", emoji: "🌾" },
                { name: "Waste", query: "waste", emoji: "♻️" },
                { name: "Algae", query: "algae", emoji: "🌿" },
              ].map((category) => (
                <Button
                  key={category.query}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  asChild
                >
                  <Link href={`/buyer/search?category=${category.query}`}>
                    <span className="mr-2">{category.emoji}</span>
                    {category.name}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to find the right feedstock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Complete your profile</p>
                  <p className="text-sm text-muted-foreground">
                    Add your facility location and requirements
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Search for feedstocks</p>
                  <p className="text-sm text-muted-foreground">
                    Filter by type, location, and certification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Contact suppliers</p>
                  <p className="text-sm text-muted-foreground">
                    Send inquiries to verified suppliers
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
