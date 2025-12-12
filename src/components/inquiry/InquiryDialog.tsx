"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface InquiryDialogProps {
  feedstockId: string;
  feedstockName: string;
  supplierId: string;
  supplierName: string;
  availableVolume?: number;
  children: React.ReactNode;
}

export function InquiryDialog({
  feedstockId,
  feedstockName,
  supplierId,
  supplierName,
  availableVolume,
  children,
}: InquiryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    volume_requested: "",
    delivery_location: "",
    delivery_timeline: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedstock_id: feedstockId,
          supplier_id: supplierId,
          volume_requested: formData.volume_requested
            ? parseInt(formData.volume_requested)
            : null,
          delivery_location: formData.delivery_location || null,
          delivery_timeline: formData.delivery_timeline || null,
          message: formData.message || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send inquiry");
      }

      toast.success("Inquiry sent successfully");
      setOpen(false);
      setFormData({
        volume_requested: "",
        delivery_location: "",
        delivery_timeline: "",
        message: "",
      });
      router.refresh();
    } catch (error) {
      console.error("Error sending inquiry:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send inquiry"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Inquiry</DialogTitle>
          <DialogDescription>
            Contact {supplierName} about {feedstockName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="volume">Requested Volume (tonnes)</Label>
            <Input
              id="volume"
              type="number"
              value={formData.volume_requested}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  volume_requested: e.target.value,
                }))
              }
              placeholder={
                availableVolume
                  ? `Up to ${availableVolume.toLocaleString()} available`
                  : "Enter quantity needed"
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Delivery Location</Label>
            <Input
              id="location"
              value={formData.delivery_location}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  delivery_location: e.target.value,
                }))
              }
              placeholder="City, State or Port"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Delivery Timeline</Label>
            <Select
              value={formData.delivery_timeline}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, delivery_timeline: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="When do you need delivery?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate (within 2 weeks)</SelectItem>
                <SelectItem value="1_month">Within 1 month</SelectItem>
                <SelectItem value="3_months">Within 3 months</SelectItem>
                <SelectItem value="6_months">Within 6 months</SelectItem>
                <SelectItem value="annual">Annual supply contract</SelectItem>
                <SelectItem value="flexible">Flexible / Negotiable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Introduce yourself and provide any additional requirements or questions..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Inquiry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
