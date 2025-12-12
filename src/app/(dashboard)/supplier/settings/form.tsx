"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  User,
  Mail,
  MapPin,
  Shield,
  Bell,
  Save,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { Profile, Supplier } from "@/types/database";

interface SupplierSettingsFormProps {
  profile: Profile | null;
  supplier: Supplier | null;
  userEmail: string;
}

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

const SUPPLIER_TYPES = [
  { value: "farm", label: "Farm / Agricultural Producer" },
  { value: "collector", label: "Waste Oil Collector" },
  { value: "processor", label: "Processor / Refiner" },
  { value: "aggregator", label: "Aggregator / Trader" },
  { value: "cooperative", label: "Cooperative" },
  { value: "other", label: "Other" },
];

export function SupplierSettingsForm({
  profile,
  supplier,
  userEmail,
}: SupplierSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    // Profile fields
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    // Supplier fields
    company_name: supplier?.company_name || "",
    abn: supplier?.abn || "",
    supplier_type: supplier?.supplier_type || "",
    contact_name: supplier?.contact_name || "",
    contact_email: supplier?.contact_email || userEmail,
    contact_phone: supplier?.contact_phone || "",
    address_line1: supplier?.address_line1 || "",
    address_line2: supplier?.address_line2 || "",
    city: supplier?.city || "",
    state: supplier?.state || "",
    postcode: supplier?.postcode || "",
    website: supplier?.website || "",
    description: supplier?.description || "",
    // Notifications
    notify_new_inquiry: supplier?.notify_new_inquiry ?? true,
    notify_inquiry_response: supplier?.notify_inquiry_response ?? true,
  });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.company_name) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id);

      if (profileError) throw profileError;

      // Upsert supplier
      const supplierData = {
        profile_id: profile?.id,
        company_name: formData.company_name,
        abn: formData.abn || null,
        supplier_type: formData.supplier_type || null,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postcode: formData.postcode || null,
        website: formData.website || null,
        description: formData.description || null,
        notify_new_inquiry: formData.notify_new_inquiry,
        notify_inquiry_response: formData.notify_inquiry_response,
        updated_at: new Date().toISOString(),
      };

      if (supplier) {
        const { error: supplierError } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", supplier.id);

        if (supplierError) throw supplierError;
      } else {
        const { error: supplierError } = await supabase
          .from("suppliers")
          .insert(supplierData);

        if (supplierError) throw supplierError;
      }

      toast.success("Settings saved successfully");
      router.refresh();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = () => {
    if (!supplier) return null;

    switch (supplier.verification_status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending Verification
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Verification Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" />
            Not Verified
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={userEmail} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="Your full name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+61 4XX XXX XXX"
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Your business details visible to buyers
              </CardDescription>
            </div>
            {getVerificationBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abn">ABN</Label>
              <Input
                id="abn"
                value={formData.abn}
                onChange={(e) => updateField("abn", e.target.value)}
                placeholder="XX XXX XXX XXX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_type">Supplier Type</Label>
            <Select
              value={formData.supplier_type}
              onValueChange={(v) => updateField("supplier_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your supplier type" />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Tell buyers about your company and feedstock operations..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Details
          </CardTitle>
          <CardDescription>
            How buyers can reach you regarding inquiries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => updateField("contact_name", e.target.value)}
                placeholder="Primary contact person"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => updateField("contact_email", e.target.value)}
                placeholder="sales@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => updateField("contact_phone", e.target.value)}
              placeholder="+61 X XXXX XXXX"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => updateField("address_line1", e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => updateField("address_line2", e.target.value)}
              placeholder="Suite, unit, building (optional)"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={formData.state}
                onValueChange={(v) => updateField("state", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => updateField("postcode", e.target.value)}
                placeholder="0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">New Inquiry Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive email when a buyer sends an inquiry
              </div>
            </div>
            <Switch
              checked={formData.notify_new_inquiry}
              onCheckedChange={(c) => updateField("notify_new_inquiry", c)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Inquiry Response Updates</div>
              <div className="text-sm text-muted-foreground">
                Receive email when buyers respond to your messages
              </div>
            </div>
            <Switch
              checked={formData.notify_inquiry_response}
              onCheckedChange={(c) => updateField("notify_inquiry_response", c)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Verification */}
      {supplier && supplier.verification_status !== "verified" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Supplier Verification
            </CardTitle>
            <CardDescription>
              Get verified to build trust with buyers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verified suppliers receive a badge on their profile and listings,
              which helps build trust with potential buyers. Verification includes
              ABN validation and business documentation review.
            </p>
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Request Verification
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
