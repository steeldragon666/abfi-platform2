"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Package,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { AbfiScoreBadge } from "@/components/rating/AbfiScoreCard";

interface Supplier {
  id: string;
  abn: string;
  company_name: string;
  trading_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  address_line1: string;
  city: string;
  state: string;
  postcode: string;
  description: string | null;
  verification_status: string;
  created_at: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
  } | null;
}

interface Feedstock {
  id: string;
  feedstock_id: string;
  name: string;
  category: string;
  type: string;
  state: string;
  region: string | null;
  abfi_score: number;
  available_volume_current: number;
  annual_capacity_tonnes: number;
  status: string;
  created_at: string;
  supplier: {
    id: string;
    company_name: string;
    verification_status: string;
  } | null;
}

interface AdminVerificationClientProps {
  pendingSuppliers: Supplier[];
  pendingFeedstocks: Feedstock[];
  initialTab: "suppliers" | "feedstocks";
}

export function AdminVerificationClient({
  pendingSuppliers,
  pendingFeedstocks,
  initialTab,
}: AdminVerificationClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [, setSelectedFeedstock] = useState<Feedstock | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{
    type: "supplier" | "feedstock";
    id: string;
  } | null>(null);

  const handleApproveSupplier = async (supplierId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("suppliers")
        .update({
          verification_status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("id", supplierId);

      if (error) throw error;

      toast.success("Supplier approved successfully");
      router.refresh();
      setSelectedSupplier(null);
    } catch {
      toast.error("Failed to approve supplier");
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveFeedstock = async (feedstockId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("feedstocks")
        .update({
          status: "active",
          verified_at: new Date().toISOString(),
        })
        .eq("id", feedstockId);

      if (error) throw error;

      toast.success("Feedstock approved successfully");
      router.refresh();
      setSelectedFeedstock(null);
    } catch {
      toast.error("Failed to approve feedstock");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      if (rejectTarget.type === "supplier") {
        const { error } = await supabase
          .from("suppliers")
          .update({ verification_status: "rejected" })
          .eq("id", rejectTarget.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feedstocks")
          .update({ status: "suspended" })
          .eq("id", rejectTarget.id);

        if (error) throw error;
      }

      toast.success(
        `${rejectTarget.type === "supplier" ? "Supplier" : "Feedstock"} rejected`
      );
      router.refresh();
      setShowRejectDialog(false);
      setRejectTarget(null);
      setRejectReason("");
      setSelectedSupplier(null);
      setSelectedFeedstock(null);
    } catch {
      toast.error("Failed to reject");
    } finally {
      setProcessing(false);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
        <p className="text-muted-foreground">
          Review and approve pending registrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="suppliers" className="gap-2">
            <Building2 className="h-4 w-4" />
            Suppliers
            {pendingSuppliers.length > 0 && (
              <Badge variant="secondary">{pendingSuppliers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedstocks" className="gap-2">
            <Package className="h-4 w-4" />
            Feedstocks
            {pendingFeedstocks.length > 0 && (
              <Badge variant="secondary">{pendingFeedstocks.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Pending Supplier Verifications</CardTitle>
              <CardDescription>
                Review supplier registrations and verify their details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500/50" />
                  <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No pending supplier verifications
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>ABN</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {supplier.company_name}
                            </div>
                            {supplier.trading_name && (
                              <div className="text-sm text-muted-foreground">
                                Trading as: {supplier.trading_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {supplier.abn}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{supplier.profile?.full_name || "N/A"}</div>
                            <div className="text-muted-foreground">
                              {supplier.contact_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.city}, {supplier.state}
                        </TableCell>
                        <TableCell>
                          {format(new Date(supplier.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSupplier(supplier)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveSupplier(supplier.id)}
                              disabled={processing}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setRejectTarget({
                                  type: "supplier",
                                  id: supplier.id,
                                });
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedstocks Tab */}
        <TabsContent value="feedstocks">
          <Card>
            <CardHeader>
              <CardTitle>Pending Feedstock Reviews</CardTitle>
              <CardDescription>
                Review feedstock listings before they go live
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingFeedstocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500/50" />
                  <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No pending feedstock reviews
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feedstock</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">ABFI Score</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFeedstocks.map((feedstock) => (
                      <TableRow key={feedstock.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{feedstock.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {feedstock.feedstock_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCategoryLabel(feedstock.category)}
                        </TableCell>
                        <TableCell>
                          {feedstock.supplier?.company_name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {feedstock.state}
                          {feedstock.region && `, ${feedstock.region}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <AbfiScoreBadge score={feedstock.abfi_score} size="sm" />
                        </TableCell>
                        <TableCell>
                          {format(new Date(feedstock.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFeedstock(feedstock)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                handleApproveFeedstock(feedstock.id)
                              }
                              disabled={processing}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setRejectTarget({
                                  type: "feedstock",
                                  id: feedstock.id,
                                });
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supplier Detail Dialog */}
      <Dialog
        open={!!selectedSupplier}
        onOpenChange={() => setSelectedSupplier(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
            <DialogDescription>
              Review supplier information before approval
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{selectedSupplier.company_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ABN</Label>
                  <p className="font-mono">{selectedSupplier.abn}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trading Name</Label>
                  <p>{selectedSupplier.trading_name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Person</Label>
                  <p>{selectedSupplier.profile?.full_name || "N/A"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{selectedSupplier.contact_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{selectedSupplier.contact_phone || "-"}</p>
                </div>
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p>
                    {selectedSupplier.address_line1}, {selectedSupplier.city},{" "}
                    {selectedSupplier.state} {selectedSupplier.postcode}
                  </p>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p>
                    Registered:{" "}
                    {format(
                      new Date(selectedSupplier.created_at),
                      "dd MMM yyyy 'at' HH:mm"
                    )}
                  </p>
                </div>
              </div>
              {selectedSupplier.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{selectedSupplier.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRejectTarget({
                  type: "supplier",
                  id: selectedSupplier!.id,
                });
                setShowRejectDialog(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleApproveSupplier(selectedSupplier!.id)}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.type}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the
              user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for rejection</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Incomplete documentation, ABN verification failed..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
