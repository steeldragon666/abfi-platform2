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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Send,
} from "lucide-react";
import { format } from "date-fns";

export const metadata = {
  title: "My Inquiries",
};

export default async function BuyerInquiriesPage() {
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

  // Get inquiries
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select(
      `
      *,
      feedstock:feedstocks(id, feedstock_id, name, category),
      supplier:suppliers(id, company_name)
    `
    )
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
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
            <ArrowRight className="mr-1 h-3 w-3" />
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
            Rejected
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Expired
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
          <h1 className="text-3xl font-bold tracking-tight">My Inquiries</h1>
          <p className="text-muted-foreground">
            Track your feedstock inquiries and supplier responses
          </p>
        </div>
        <Button asChild>
          <Link href="/buyer/search">
            <Send className="mr-2 h-4 w-4" />
            Browse Feedstocks
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inquiry History</CardTitle>
          <CardDescription>
            {inquiries?.length || 0} inquiry(ies) sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries && inquiries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inquiry ID</TableHead>
                  <TableHead>Feedstock</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-mono text-sm">
                      {inquiry.inquiry_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {inquiry.feedstock?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {inquiry.feedstock?.category
                            ? getCategoryLabel(inquiry.feedstock.category)
                            : ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{inquiry.supplier?.company_name || "-"}</TableCell>
                    <TableCell>
                      {inquiry.volume_requested
                        ? `${inquiry.volume_requested.toLocaleString()} t`
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                    <TableCell>
                      {inquiry.created_at
                        ? format(new Date(inquiry.created_at), "dd MMM yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/buyer/inquiries/${inquiry.id}`}>
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No inquiries yet</h3>
              <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
                Browse available feedstocks and send inquiries to suppliers you
                are interested in working with.
              </p>
              <Button asChild className="mt-6">
                <Link href="/buyer/search">
                  <Send className="mr-2 h-4 w-4" />
                  Browse Feedstocks
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
