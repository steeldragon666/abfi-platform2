"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Package,
  MapPin,
  Truck,
  FlaskConical,
  Leaf,
  Loader2,
} from "lucide-react";
import type { FeedstockCategory, CertificationType, Feedstock } from "@/types/database";

const CATEGORIES: { value: FeedstockCategory; label: string }[] = [
  { value: "oilseed", label: "Oilseed" },
  { value: "UCO", label: "Used Cooking Oil" },
  { value: "tallow", label: "Tallow" },
  { value: "lignocellulosic", label: "Lignocellulosic" },
  { value: "waste", label: "Waste" },
  { value: "algae", label: "Algae" },
  { value: "bamboo", label: "Bamboo" },
  { value: "other", label: "Other" },
];

const STATES = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "NT",
  "ACT",
];

const CERTIFICATION_TYPES: { value: CertificationType; label: string }[] = [
  { value: "ISCC_EU", label: "ISCC EU" },
  { value: "ISCC_PLUS", label: "ISCC PLUS" },
  { value: "RSB", label: "RSB" },
  { value: "RED_II", label: "RED II" },
  { value: "ABFI", label: "ABFI Certified" },
  { value: "GO", label: "Guarantee of Origin" },
  { value: "OTHER", label: "Other" },
];

const QUALITY_PARAMETERS: Record<FeedstockCategory, { key: string; label: string; unit: string }[]> = {
  oilseed: [
    { key: "oil_content", label: "Oil Content", unit: "%" },
    { key: "free_fatty_acid", label: "Free Fatty Acid", unit: "%" },
    { key: "moisture", label: "Moisture", unit: "%" },
    { key: "impurities", label: "Impurities", unit: "%" },
    { key: "phosphorus", label: "Phosphorus", unit: "ppm" },
  ],
  UCO: [
    { key: "free_fatty_acid", label: "Free Fatty Acid", unit: "%" },
    { key: "moisture", label: "Moisture", unit: "%" },
    { key: "impurities", label: "Impurities", unit: "%" },
    { key: "iodine_value", label: "Iodine Value", unit: "" },
    { key: "miu", label: "MIU", unit: "%" },
  ],
  tallow: [
    { key: "free_fatty_acid", label: "Free Fatty Acid", unit: "%" },
    { key: "moisture", label: "Moisture", unit: "%" },
    { key: "titre", label: "Titre", unit: "°C" },
    { key: "impurities", label: "Impurities", unit: "%" },
    { key: "category", label: "Category", unit: "" },
  ],
  lignocellulosic: [
    { key: "moisture", label: "Moisture", unit: "%" },
    { key: "ash_content", label: "Ash Content", unit: "%" },
    { key: "calorific_value", label: "Calorific Value", unit: "MJ/kg" },
    { key: "particle_consistency", label: "Particle Consistency", unit: "%" },
    { key: "contaminants", label: "Contaminant-Free", unit: "%" },
  ],
  waste: [
    { key: "contamination_rate", label: "Contamination Rate", unit: "%" },
    { key: "organic_content", label: "Organic Content", unit: "%" },
    { key: "moisture", label: "Moisture", unit: "%" },
    { key: "homogeneity", label: "Homogeneity", unit: "%" },
    { key: "heavy_metals", label: "Heavy Metals Compliance", unit: "%" },
  ],
  algae: [
    { key: "lipid_content", label: "Lipid Content", unit: "%" },
    { key: "moisture", label: "Moisture", unit: "%" },
    { key: "ash_content", label: "Ash Content", unit: "%" },
    { key: "protein_content", label: "Protein Content", unit: "%" },
    { key: "contamination", label: "Contamination", unit: "%" },
  ],
  bamboo: [
    { key: "moisture", label: "Moisture", unit: "%" },
    { key: "ash_content", label: "Ash Content", unit: "%" },
    { key: "calorific_value", label: "Calorific Value", unit: "MJ/kg" },
    { key: "fiber_content", label: "Fiber Content", unit: "%" },
    { key: "lignin_content", label: "Lignin Content", unit: "%" },
  ],
  other: [
    { key: "general_quality", label: "General Quality Score", unit: "%" },
  ],
};

interface EditFeedstockFormProps {
  feedstock: Feedstock;
}

export function EditFeedstockForm({ feedstock }: EditFeedstockFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  // Initialize form data from feedstock
  const qualityParams = feedstock.quality_parameters as Record<string, number> | null;
  const sustainabilityData = feedstock.sustainability_data as Record<string, boolean | string> | null;

  const [formData, setFormData] = useState({
    // Basic Info
    category: feedstock.category as FeedstockCategory,
    type: feedstock.type || "",
    name: feedstock.name,
    production_method: feedstock.production_method || "",
    collection_method: feedstock.collection_method || "",
    storage_method: feedstock.storage_method || "",
    description: feedstock.description || "",
    // Location
    state: feedstock.state,
    region: feedstock.region || "",
    latitude: feedstock.latitude?.toString() || "",
    longitude: feedstock.longitude?.toString() || "",
    distance_to_port_km: feedstock.distance_to_port_km?.toString() || "",
    // Volume & Pricing
    available_volume_current: feedstock.available_volume_current?.toString() || "",
    available_volume_annual: feedstock.available_volume_annual?.toString() || "",
    minimum_order_tonnes: feedstock.minimum_order_tonnes?.toString() || "",
    lead_time_days: feedstock.lead_time_days?.toString() || "",
    price_aud_per_tonne: feedstock.price_aud_per_tonne?.toString() || "",
    delivery_options: feedstock.delivery_options || "",
    // Quality Parameters
    quality_parameters: qualityParams || {} as Record<string, number>,
    // Sustainability
    certification_type: (typeof sustainabilityData?.certification_type === "string" ? sustainabilityData.certification_type : "") as CertificationType | "",
    carbon_intensity_value: feedstock.carbon_intensity_value?.toString() || "",
    no_deforestation_verified: Boolean(sustainabilityData?.no_deforestation_verified),
    no_hcv_land_conversion: Boolean(sustainabilityData?.no_hcv_land_conversion),
    no_peatland_drainage: Boolean(sustainabilityData?.no_peatland_drainage),
    indigenous_rights_compliance: Boolean(sustainabilityData?.indigenous_rights_compliance),
    fair_work_certified: Boolean(sustainabilityData?.fair_work_certified),
    community_benefit_documented: Boolean(sustainabilityData?.community_benefit_documented),
    supply_chain_transparent: Boolean(sustainabilityData?.supply_chain_transparent),
    regenerative_practice_certified: Boolean(sustainabilityData?.regenerative_practice_certified),
    soil_carbon_measured: Boolean(sustainabilityData?.soil_carbon_measured),
    biodiversity_corridor_maintained: Boolean(sustainabilityData?.biodiversity_corridor_maintained),
  });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQualityParam = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      quality_parameters: {
        ...prev.quality_parameters,
        [key]: value ? parseFloat(value) : 0,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Build sustainability data object
      const sustainability_data = {
        certification_type: formData.certification_type,
        no_deforestation_verified: formData.no_deforestation_verified,
        no_hcv_land_conversion: formData.no_hcv_land_conversion,
        no_peatland_drainage: formData.no_peatland_drainage,
        indigenous_rights_compliance: formData.indigenous_rights_compliance,
        fair_work_certified: formData.fair_work_certified,
        community_benefit_documented: formData.community_benefit_documented,
        supply_chain_transparent: formData.supply_chain_transparent,
        regenerative_practice_certified: formData.regenerative_practice_certified,
        soil_carbon_measured: formData.soil_carbon_measured,
        biodiversity_corridor_maintained: formData.biodiversity_corridor_maintained,
      };

      const { error } = await supabase
        .from("feedstocks")
        .update({
          category: formData.category,
          type: formData.type || null,
          name: formData.name,
          production_method: formData.production_method || null,
          collection_method: formData.collection_method || null,
          storage_method: formData.storage_method || null,
          description: formData.description || null,
          state: formData.state,
          region: formData.region || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          distance_to_port_km: formData.distance_to_port_km
            ? parseFloat(formData.distance_to_port_km)
            : null,
          available_volume_current: formData.available_volume_current
            ? parseFloat(formData.available_volume_current)
            : null,
          available_volume_annual: formData.available_volume_annual
            ? parseFloat(formData.available_volume_annual)
            : null,
          minimum_order_tonnes: formData.minimum_order_tonnes
            ? parseFloat(formData.minimum_order_tonnes)
            : null,
          lead_time_days: formData.lead_time_days
            ? parseInt(formData.lead_time_days)
            : null,
          price_aud_per_tonne: formData.price_aud_per_tonne
            ? parseFloat(formData.price_aud_per_tonne)
            : null,
          delivery_options: formData.delivery_options || null,
          quality_parameters: formData.quality_parameters,
          carbon_intensity_value: formData.carbon_intensity_value
            ? parseFloat(formData.carbon_intensity_value)
            : null,
          sustainability_data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedstock.id);

      if (error) throw error;

      toast.success("Feedstock updated successfully");
      router.push(`/supplier/feedstocks/${feedstock.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating feedstock:", error);
      toast.error("Failed to update feedstock");
    } finally {
      setSaving(false);
    }
  };

  const qualityFields = formData.category
    ? QUALITY_PARAMETERS[formData.category]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/supplier/feedstocks/${feedstock.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Feedstock</h1>
            <p className="text-muted-foreground">{feedstock.feedstock_id}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Form Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Location</span>
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Volume</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Quality</span>
          </TabsTrigger>
          <TabsTrigger value="sustainability" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline">Sustainability</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core details about your feedstock
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) =>
                      updateField("category", v as FeedstockCategory)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    placeholder="e.g., Canola, Camelina"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Descriptive name for your feedstock"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="production_method">Production Method</Label>
                  <Input
                    id="production_method"
                    value={formData.production_method}
                    onChange={(e) =>
                      updateField("production_method", e.target.value)
                    }
                    placeholder="e.g., Dryland farming"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection_method">Collection Method</Label>
                  <Input
                    id="collection_method"
                    value={formData.collection_method}
                    onChange={(e) =>
                      updateField("collection_method", e.target.value)
                    }
                    placeholder="e.g., Direct harvest"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_method">Storage Method</Label>
                <Input
                  id="storage_method"
                  value={formData.storage_method}
                  onChange={(e) => updateField("storage_method", e.target.value)}
                  placeholder="e.g., Covered silo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Additional details about your feedstock"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Where is the feedstock sourced from?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(v) => updateField("state", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
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
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => updateField("region", e.target.value)}
                    placeholder="e.g., Riverina, Darling Downs"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => updateField("latitude", e.target.value)}
                    placeholder="-33.8688"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => updateField("longitude", e.target.value)}
                    placeholder="151.2093"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance_to_port_km">Distance to Port (km)</Label>
                <Input
                  id="distance_to_port_km"
                  type="number"
                  value={formData.distance_to_port_km}
                  onChange={(e) =>
                    updateField("distance_to_port_km", e.target.value)
                  }
                  placeholder="Distance to nearest export port"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volume Tab */}
        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Volume & Pricing</CardTitle>
              <CardDescription>
                Availability and commercial terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="available_volume_current">
                    Current Available Volume (tonnes)
                  </Label>
                  <Input
                    id="available_volume_current"
                    type="number"
                    value={formData.available_volume_current}
                    onChange={(e) =>
                      updateField("available_volume_current", e.target.value)
                    }
                    placeholder="Volume currently available"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available_volume_annual">
                    Annual Capacity (tonnes/year)
                  </Label>
                  <Input
                    id="available_volume_annual"
                    type="number"
                    value={formData.available_volume_annual}
                    onChange={(e) =>
                      updateField("available_volume_annual", e.target.value)
                    }
                    placeholder="Annual production capacity"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minimum_order_tonnes">
                    Minimum Order (tonnes)
                  </Label>
                  <Input
                    id="minimum_order_tonnes"
                    type="number"
                    value={formData.minimum_order_tonnes}
                    onChange={(e) =>
                      updateField("minimum_order_tonnes", e.target.value)
                    }
                    placeholder="Minimum order quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_time_days">Lead Time (days)</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) =>
                      updateField("lead_time_days", e.target.value)
                    }
                    placeholder="Typical delivery lead time"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price_aud_per_tonne">
                    Price (AUD/tonne, Ex-Works)
                  </Label>
                  <Input
                    id="price_aud_per_tonne"
                    type="number"
                    value={formData.price_aud_per_tonne}
                    onChange={(e) =>
                      updateField("price_aud_per_tonne", e.target.value)
                    }
                    placeholder="Indicative price per tonne"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_options">Delivery Options</Label>
                  <Input
                    id="delivery_options"
                    value={formData.delivery_options}
                    onChange={(e) =>
                      updateField("delivery_options", e.target.value)
                    }
                    placeholder="e.g., Ex-works, FOB port"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle>Quality Parameters</CardTitle>
              <CardDescription>
                Specifications for {formData.category || "your feedstock category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {qualityFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label} {field.unit && `(${field.unit})`}
                    </Label>
                    <Input
                      id={field.key}
                      type="number"
                      step="any"
                      value={formData.quality_parameters[field.key] || ""}
                      onChange={(e) =>
                        updateQualityParam(field.key, e.target.value)
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sustainability Tab */}
        <TabsContent value="sustainability">
          <Card>
            <CardHeader>
              <CardTitle>Sustainability & Certification</CardTitle>
              <CardDescription>
                Environmental compliance and certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certification_type">Certification</Label>
                  <Select
                    value={formData.certification_type}
                    onValueChange={(v) =>
                      updateField("certification_type", v as CertificationType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select certification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {CERTIFICATION_TYPES.map((cert) => (
                        <SelectItem key={cert.value} value={cert.value}>
                          {cert.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbon_intensity_value">
                    Carbon Intensity (gCO2e/MJ)
                  </Label>
                  <Input
                    id="carbon_intensity_value"
                    type="number"
                    step="any"
                    value={formData.carbon_intensity_value}
                    onChange={(e) =>
                      updateField("carbon_intensity_value", e.target.value)
                    }
                    placeholder="Lifecycle carbon intensity"
                  />
                </div>
              </div>

              <div>
                <h4 className="mb-4 font-medium">Land Use Compliance</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no_deforestation_verified"
                      checked={formData.no_deforestation_verified}
                      onCheckedChange={(c) =>
                        updateField("no_deforestation_verified", !!c)
                      }
                    />
                    <Label htmlFor="no_deforestation_verified">
                      No deforestation verified
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no_hcv_land_conversion"
                      checked={formData.no_hcv_land_conversion}
                      onCheckedChange={(c) =>
                        updateField("no_hcv_land_conversion", !!c)
                      }
                    />
                    <Label htmlFor="no_hcv_land_conversion">
                      No HCV land conversion
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no_peatland_drainage"
                      checked={formData.no_peatland_drainage}
                      onCheckedChange={(c) =>
                        updateField("no_peatland_drainage", !!c)
                      }
                    />
                    <Label htmlFor="no_peatland_drainage">
                      No peatland drainage
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="indigenous_rights_compliance"
                      checked={formData.indigenous_rights_compliance}
                      onCheckedChange={(c) =>
                        updateField("indigenous_rights_compliance", !!c)
                      }
                    />
                    <Label htmlFor="indigenous_rights_compliance">
                      Indigenous rights compliance
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 font-medium">Social Compliance</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fair_work_certified"
                      checked={formData.fair_work_certified}
                      onCheckedChange={(c) =>
                        updateField("fair_work_certified", !!c)
                      }
                    />
                    <Label htmlFor="fair_work_certified">
                      Fair work certified
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="community_benefit_documented"
                      checked={formData.community_benefit_documented}
                      onCheckedChange={(c) =>
                        updateField("community_benefit_documented", !!c)
                      }
                    />
                    <Label htmlFor="community_benefit_documented">
                      Community benefit documented
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="supply_chain_transparent"
                      checked={formData.supply_chain_transparent}
                      onCheckedChange={(c) =>
                        updateField("supply_chain_transparent", !!c)
                      }
                    />
                    <Label htmlFor="supply_chain_transparent">
                      Supply chain transparent
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 font-medium">Biodiversity & Soil</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="regenerative_practice_certified"
                      checked={formData.regenerative_practice_certified}
                      onCheckedChange={(c) =>
                        updateField("regenerative_practice_certified", !!c)
                      }
                    />
                    <Label htmlFor="regenerative_practice_certified">
                      Regenerative practice certified
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="soil_carbon_measured"
                      checked={formData.soil_carbon_measured}
                      onCheckedChange={(c) =>
                        updateField("soil_carbon_measured", !!c)
                      }
                    />
                    <Label htmlFor="soil_carbon_measured">
                      Soil carbon measured
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="biodiversity_corridor_maintained"
                      checked={formData.biodiversity_corridor_maintained}
                      onCheckedChange={(c) =>
                        updateField("biodiversity_corridor_maintained", !!c)
                      }
                    />
                    <Label htmlFor="biodiversity_corridor_maintained">
                      Biodiversity corridor maintained
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
