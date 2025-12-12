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
  Inbox,
  AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Inquiries",
};

export default async function SupplierInquiriesPage() {
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

  // Get inquiries
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select(
      `
      *,
      feedstock:feedstocks(id, feedstock_id, name, category),
      buyer:buyers(id, company_name)
    `
    )
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false });

  const pendingCount = inquiries?.filter((i) => i.status === "pending").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Needs Response
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
            Declined
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
          <p className="text-muted-foreground">
            Manage buyer inquiries for your feedstocks
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-base px-3 py-1">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Inquiries</CardDescription>
            <CardTitle className="text-2xl">{inquiries?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Response</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {pendingCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Negotiation</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {inquiries?.filter((i) => i.status === "negotiating").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Accepted</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {inquiries?.filter((i) => i.status === "accepted").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inquiries</CardTitle>
          <CardDescription>
            Review and respond to buyer inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries && inquiries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inquiry</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Feedstock</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow
                    key={inquiry.id}
                    className={inquiry.status === "pending" ? "bg-yellow-50" : ""}
                  >
                    <TableCell className="font-mono text-sm">
                      {inquiry.inquiry_id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {inquiry.buyer?.company_name || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {inquiry.feedstock?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {inquiry.feedstock?.feedstock_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {inquiry.volume_requested
                        ? `${inquiry.volume_requested.toLocaleString()} t`
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {inquiry.created_at
                            ? format(new Date(inquiry.created_at), "dd MMM")
                            : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {inquiry.created_at
                            ? formatDistanceToNow(new Date(inquiry.created_at), {
                                addSuffix: true,
                              })
                            : ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={
                          inquiry.status === "pending" ? "default" : "ghost"
                        }
                        size="sm"
                        asChild
                      >
                        <Link href={`/supplier/inquiries/${inquiry.id}`}>
                          {inquiry.status === "pending" ? "Respond" : "View"}
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
              <Inbox className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No inquiries yet</h3>
              <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
                When buyers express interest in your feedstocks, their inquiries
                will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
