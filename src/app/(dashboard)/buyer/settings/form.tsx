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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  User,
  Mail,
  Target,
  Bell,
  Save,
  Loader2,
} from "lucide-react";
import type { Profile, Buyer, FeedstockCategory } from "@/types/database";

interface BuyerSettingsFormProps {
  profile: Profile | null;
  buyer: Buyer | null;
  userEmail: string;
}

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

const BUYER_TYPES = [
  { value: "biofuel_producer", label: "Biofuel Producer" },
  { value: "saf_producer", label: "SAF Producer" },
  { value: "refinery", label: "Refinery" },
  { value: "trader", label: "Trader / Aggregator" },
  { value: "research", label: "Research Institution" },
  { value: "other", label: "Other" },
];

const FEEDSTOCK_CATEGORIES: { value: FeedstockCategory; label: string }[] = [
  { value: "oilseed", label: "Oilseed" },
  { value: "UCO", label: "Used Cooking Oil" },
  { value: "tallow", label: "Tallow" },
  { value: "lignocellulosic", label: "Lignocellulosic" },
  { value: "waste", label: "Waste" },
  { value: "algae", label: "Algae" },
  { value: "bamboo", label: "Bamboo" },
];

export function BuyerSettingsForm({
  profile,
  buyer,
  userEmail,
}: BuyerSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    // Profile fields
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    // Buyer fields
    company_name: buyer?.company_name || "",
    abn: buyer?.abn || "",
    company_type: buyer?.company_type || "",
    contact_name: buyer?.contact_name || "",
    contact_email: buyer?.contact_email || userEmail,
    contact_phone: buyer?.contact_phone || "",
    address_line1: buyer?.address_line1 || "",
    address_line2: buyer?.address_line2 || "",
    city: buyer?.city || "",
    state: buyer?.state || "",
    postcode: buyer?.postcode || "",
    website: buyer?.website || "",
    description: buyer?.description || "",
    // Procurement preferences
    preferred_categories: (buyer?.preferred_categories as FeedstockCategory[]) || [],
    annual_volume_requirement: buyer?.annual_volume_requirement?.toString() || "",
    min_abfi_score: buyer?.min_abfi_score?.toString() || "",
    max_carbon_intensity: buyer?.max_carbon_intensity?.toString() || "",
    preferred_states: (buyer?.preferred_states as string[]) || [],
    // Notifications
    notify_new_feedstock: buyer?.notify_new_feedstock ?? true,
    notify_price_change: buyer?.notify_price_change ?? true,
  });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: FeedstockCategory) => {
    setFormData((prev) => {
      const current = prev.preferred_categories;
      if (current.includes(category)) {
        return {
          ...prev,
          preferred_categories: current.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          preferred_categories: [...current, category],
        };
      }
    });
  };

  const toggleState = (state: string) => {
    setFormData((prev) => {
      const current = prev.preferred_states;
      if (current.includes(state)) {
        return {
          ...prev,
          preferred_states: current.filter((s) => s !== state),
        };
      } else {
        return {
          ...prev,
          preferred_states: [...current, state],
        };
      }
    });
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

      // Upsert buyer
      const buyerData = {
        profile_id: profile?.id,
        company_name: formData.company_name,
        abn: formData.abn || null,
        company_type: formData.company_type || null,
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
        preferred_categories: formData.preferred_categories,
        annual_volume_requirement: formData.annual_volume_requirement
          ? parseInt(formData.annual_volume_requirement)
          : null,
        min_abfi_score: formData.min_abfi_score
          ? parseInt(formData.min_abfi_score)
          : null,
        max_carbon_intensity: formData.max_carbon_intensity
          ? parseFloat(formData.max_carbon_intensity)
          : null,
        preferred_states: formData.preferred_states,
        notify_new_feedstock: formData.notify_new_feedstock,
        notify_price_change: formData.notify_price_change,
        updated_at: new Date().toISOString(),
      };

      if (buyer) {
        const { error: buyerError } = await supabase
          .from("buyers")
          .update(buyerData)
          .eq("id", buyer.id);

        if (buyerError) throw buyerError;
      } else {
        const { error: buyerError } = await supabase
          .from("buyers")
          .insert(buyerData);

        if (buyerError) throw buyerError;
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
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Your business details for supplier communication
          </CardDescription>
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
            <Label htmlFor="company_type">Company Type</Label>
            <Select
              value={formData.company_type}
              onValueChange={(v) => updateField("company_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your company type" />
              </SelectTrigger>
              <SelectContent>
                {BUYER_TYPES.map((type) => (
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
              placeholder="Tell suppliers about your company and feedstock requirements..."
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
            How suppliers can reach you regarding inquiries
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
                placeholder="procurement@example.com"
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

      {/* Procurement Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Procurement Preferences
          </CardTitle>
          <CardDescription>
            Help us match you with the right feedstocks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Preferred Feedstock Categories</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {FEEDSTOCK_CATEGORIES.map((cat) => (
                <div key={cat.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={cat.value}
                    checked={formData.preferred_categories.includes(cat.value)}
                    onCheckedChange={() => toggleCategory(cat.value)}
                  />
                  <Label htmlFor={cat.value} className="font-normal">
                    {cat.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Source States</Label>
            <div className="grid gap-2 sm:grid-cols-4">
              {STATES.map((state) => (
                <div key={state} className="flex items-center space-x-2">
                  <Checkbox
                    id={`state-${state}`}
                    checked={formData.preferred_states.includes(state)}
                    onCheckedChange={() => toggleState(state)}
                  />
                  <Label htmlFor={`state-${state}`} className="font-normal">
                    {state}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="annual_volume_requirement">
                Annual Volume Need (t/year)
              </Label>
              <Input
                id="annual_volume_requirement"
                type="number"
                value={formData.annual_volume_requirement}
                onChange={(e) =>
                  updateField("annual_volume_requirement", e.target.value)
                }
                placeholder="e.g., 50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_abfi_score">Minimum ABFI Score</Label>
              <Input
                id="min_abfi_score"
                type="number"
                min={0}
                max={100}
                value={formData.min_abfi_score}
                onChange={(e) => updateField("min_abfi_score", e.target.value)}
                placeholder="e.g., 70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_carbon_intensity">
                Max CI (gCO2e/MJ)
              </Label>
              <Input
                id="max_carbon_intensity"
                type="number"
                value={formData.max_carbon_intensity}
                onChange={(e) =>
                  updateField("max_carbon_intensity", e.target.value)
                }
                placeholder="e.g., 30"
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
              <div className="font-medium">New Feedstock Alerts</div>
              <div className="text-sm text-muted-foreground">
                Get notified when new feedstocks matching your preferences are
                listed
              </div>
            </div>
            <Switch
              checked={formData.notify_new_feedstock}
              onCheckedChange={(c) => updateField("notify_new_feedstock", c)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Price Change Alerts</div>
              <div className="text-sm text-muted-foreground">
                Get notified when feedstocks in your shortlist change price
              </div>
            </div>
            <Switch
              checked={formData.notify_price_change}
              onCheckedChange={(c) => updateField("notify_price_change", c)}
            />
          </div>
        </CardContent>
      </Card>

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
