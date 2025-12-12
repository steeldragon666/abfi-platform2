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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { AbfiScoreBadge } from "@/components/rating/AbfiScoreCard";

export const metadata = {
  title: "My Feedstocks",
};

export default async function SupplierFeedstocksPage() {
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

  // Get feedstocks
  const { data: feedstocks } = await supabase
    .from("feedstocks")
    .select("*, certificates(*)")
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Feedstocks</h1>
          <p className="text-muted-foreground">
            Manage your feedstock listings and availability
          </p>
        </div>
        <Button asChild>
          <Link href="/supplier/feedstocks/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Feedstock
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedstock Listings</CardTitle>
          <CardDescription>
            {feedstocks?.length || 0} feedstock(s) registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedstocks && feedstocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feedstock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">ABFI Score</TableHead>
                  <TableHead className="text-right">Volume (t)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedstocks.map((feedstock) => (
                  <TableRow key={feedstock.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{feedstock.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {feedstock.feedstock_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryLabel(feedstock.category)}</TableCell>
                    <TableCell>
                      {feedstock.state}, {feedstock.region || ""}
                    </TableCell>
                    <TableCell className="text-center">
                      <AbfiScoreBadge score={feedstock.abfi_score} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      {feedstock.available_volume_current?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>{getStatusBadge(feedstock.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/supplier/feedstocks/${feedstock.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/supplier/feedstocks/${feedstock.id}/edit`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No feedstocks yet</h3>
              <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
                Start by adding your first feedstock listing. Provide details
                about your feedstock source, quality data, and certifications.
              </p>
              <Button asChild className="mt-6">
                <Link href="/supplier/feedstocks/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Feedstock
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
