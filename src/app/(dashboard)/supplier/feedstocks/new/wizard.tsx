"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, MapPin, Package, BarChart3, Shield, Send } from "lucide-react";
import type { FeedstockCategory, ProductionMethod, AustralianState, CertificationType } from "@/types/database";

interface WizardProps {
  supplierId: string;
}

interface FormData {
  // Step 1: Basic Info
  category: FeedstockCategory | "";
  type: string;
  name: string;
  description: string;
  production_method: ProductionMethod | "";
  
  // Step 2: Location
  state: AustralianState | "";
  region: string;
  latitude: string;
  longitude: string;
  
  // Step 3: Volume & Pricing
  annual_capacity_tonnes: string;
  available_volume_current: string;
  price_indication: string;
  price_unit: string;
  
  // Step 4: Quality (simplified - category specific)
  quality_parameters: Record<string, string>;
  
  // Step 5: Sustainability
  certification_type: CertificationType | "";
  no_deforestation_verified: boolean;
  no_hcv_land_conversion: boolean;
  no_peatland_drainage: boolean;
  indigenous_rights_compliance: boolean;
  fair_work_certified: boolean;
  community_benefit_documented: boolean;
  supply_chain_transparent: boolean;
  regenerative_practice_certified: boolean;
  soil_carbon_measured: boolean;
  biodiversity_corridor_maintained: boolean;
  
  // Step 6: Carbon
  carbon_intensity_value: string;
  carbon_intensity_method: string;
}

const STEPS = [
  { id: 1, name: "Basic Info", icon: Package },
  { id: 2, name: "Location", icon: MapPin },
  { id: 3, name: "Volume", icon: BarChart3 },
  { id: 4, name: "Quality", icon: CheckCircle },
  { id: 5, name: "Sustainability", icon: Shield },
  { id: 6, name: "Review", icon: Send },
];

const FEEDSTOCK_CATEGORIES: { value: FeedstockCategory; label: string }[] = [
  { value: "oilseed", label: "Oilseed" },
  { value: "UCO", label: "Used Cooking Oil" },
  { value: "tallow", label: "Tallow / Animal Fats" },
  { value: "lignocellulosic", label: "Lignocellulosic Biomass" },
  { value: "waste", label: "Waste Streams" },
  { value: "algae", label: "Algae" },
  { value: "bamboo", label: "Bamboo" },
  { value: "other", label: "Other" },
];

const FEEDSTOCK_TYPES: Record<FeedstockCategory, string[]> = {
  oilseed: ["Canola", "Mustard", "Camelina", "Soybean", "Sunflower", "Other Oilseed"],
  UCO: ["Restaurant UCO", "Industrial UCO", "Mixed UCO"],
  tallow: ["Beef Tallow", "Poultry Fat", "Pork Fat", "Mixed Animal Fat", "Category 1", "Category 2", "Category 3"],
  lignocellulosic: ["Bagasse", "Wheat Straw", "Rice Straw", "Corn Stover", "Wood Chips", "Sawdust", "Forest Residue"],
  waste: ["Food Waste", "MSW Organic", "Agricultural Residue", "Processing Waste"],
  algae: ["Microalgae", "Macroalgae", "Seaweed"],
  bamboo: ["Giant Bamboo", "Moso Bamboo", "Bamboo Residue", "Processed Bamboo"],
  other: ["Other"],
};

const PRODUCTION_METHODS: { value: ProductionMethod; label: string }[] = [
  { value: "crop", label: "Crop Production" },
  { value: "waste", label: "Waste Collection" },
  { value: "residue", label: "Agricultural Residue" },
  { value: "processing_byproduct", label: "Processing Byproduct" },
];

const AUSTRALIAN_STATES: { value: AustralianState; label: string }[] = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
];

const CERTIFICATION_TYPES: { value: CertificationType; label: string }[] = [
  { value: "ISCC_EU", label: "ISCC EU" },
  { value: "ISCC_PLUS", label: "ISCC PLUS" },
  { value: "RSB", label: "RSB" },
  { value: "RED_II", label: "RED II Compliant" },
  { value: "GO", label: "Guarantee of Origin" },
  { value: "ABFI", label: "ABFI Verified" },
  { value: "OTHER", label: "Other" },
];

const QUALITY_PARAMS_BY_CATEGORY: Record<FeedstockCategory, { name: string; label: string; unit: string }[]> = {
  oilseed: [
    { name: "oil_content", label: "Oil Content", unit: "%" },
    { name: "free_fatty_acid", label: "Free Fatty Acid", unit: "%" },
    { name: "moisture", label: "Moisture", unit: "%" },
    { name: "impurities", label: "Impurities", unit: "%" },
  ],
  UCO: [
    { name: "free_fatty_acid", label: "Free Fatty Acid", unit: "%" },
    { name: "moisture", label: "Moisture", unit: "%" },
    { name: "impurities", label: "Impurities", unit: "%" },
    { name: "miu", label: "MIU", unit: "%" },
  ],
  tallow: [
    { name: "free_fatty_acid", label: "Free Fatty Acid", unit: "%" },
    { name: "moisture", label: "Moisture", unit: "%" },
    { name: "titre", label: "Titre", unit: "°C" },
    { name: "impurities", label: "Impurities", unit: "%" },
  ],
  lignocellulosic: [
    { name: "moisture", label: "Moisture", unit: "%" },
    { name: "ash_content", label: "Ash Content", unit: "%" },
    { name: "calorific_value", label: "Calorific Value", unit: "MJ/kg" },
  ],
  waste: [
    { name: "contamination_rate", label: "Contamination Rate", unit: "%" },
    { name: "organic_content", label: "Organic Content", unit: "%" },
    { name: "moisture", label: "Moisture", unit: "%" },
  ],
  algae: [
    { name: "lipid_content", label: "Lipid Content", unit: "%" },
    { name: "moisture", label: "Moisture", unit: "%" },
    { name: "ash_content", label: "Ash Content", unit: "%" },
  ],
  bamboo: [
    { name: "moisture", label: "Moisture", unit: "%" },
    { name: "ash_content", label: "Ash Content", unit: "%" },
    { name: "calorific_value", label: "Calorific Value", unit: "MJ/kg" },
    { name: "fiber_content", label: "Fiber Content", unit: "%" },
  ],
  other: [
    { name: "general_quality", label: "General Quality Score", unit: "/100" },
  ],
};

export function FeedstockWizard({ supplierId }: WizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    category: "",
    type: "",
    name: "",
    description: "",
    production_method: "",
    state: "",
    region: "",
    latitude: "",
    longitude: "",
    annual_capacity_tonnes: "",
    available_volume_current: "",
    price_indication: "",
    price_unit: "AUD/tonne",
    quality_parameters: {},
    certification_type: "",
    no_deforestation_verified: false,
    no_hcv_land_conversion: false,
    no_peatland_drainage: false,
    indigenous_rights_compliance: false,
    fair_work_certified: false,
    community_benefit_documented: false,
    supply_chain_transparent: false,
    regenerative_practice_certified: false,
    soil_carbon_measured: false,
    biodiversity_corridor_maintained: false,
    carbon_intensity_value: "",
    carbon_intensity_method: "",
  });

  const updateFormData = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const updateQualityParam = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      quality_parameters: { ...prev.quality_parameters, [name]: value }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.category || !formData.type || !formData.name || !formData.production_method) {
          setError("Please fill in all required fields");
          return false;
        }
        break;
      case 2:
        if (!formData.state || !formData.latitude || !formData.longitude) {
          setError("Please fill in all location fields");
          return false;
        }
        break;
      case 3:
        if (!formData.annual_capacity_tonnes || !formData.available_volume_current) {
          setError("Please fill in capacity and available volume");
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("feedstocks")
        .insert({
          supplier_id: supplierId,
          category: formData.category,
          type: formData.type,
          name: formData.name,
          description: formData.description || null,
          production_method: formData.production_method,
          state: formData.state,
          region: formData.region || null,
          location: `POINT(${formData.longitude} ${formData.latitude})`,
          annual_capacity_tonnes: parseFloat(formData.annual_capacity_tonnes),
          available_volume_current: parseFloat(formData.available_volume_current),
          price_indication: formData.price_indication ? parseFloat(formData.price_indication) : null,
          price_unit: formData.price_unit,
          carbon_intensity_value: formData.carbon_intensity_value ? parseFloat(formData.carbon_intensity_value) : null,
          carbon_intensity_method: formData.carbon_intensity_method || null,
          status: "pending_review",
          verification_level: "self_declared",
          abfi_score: 0,
          sustainability_score: 0,
          carbon_intensity_score: 0,
          quality_score: 0,
          reliability_score: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Feedstock submitted for review!");
      router.push("/supplier/feedstocks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create feedstock");
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-1 ${
                step.id <= currentStep ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  step.id < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.id === currentStep
                    ? "border-primary"
                    : "border-muted"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs hidden sm:block">{step.name}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Tell us about your feedstock source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Feedstock Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => {
                      updateFormData("category", v);
                      updateFormData("type", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDSTOCK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Feedstock Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => updateFormData("type", v)}
                    disabled={!formData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category &&
                        FEEDSTOCK_TYPES[formData.category as FeedstockCategory]?.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Listing Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="e.g., Premium Canola - Murray Region"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Describe your feedstock, quality, and any relevant details"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="production_method">Production Method *</Label>
                <Select
                  value={formData.production_method}
                  onValueChange={(v) => updateFormData("production_method", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Where is the feedstock source located?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(v) => updateFormData("state", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUSTRALIAN_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region / NRM Area</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => updateFormData("region", e.target.value)}
                    placeholder="e.g., Murray-Darling Basin"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => updateFormData("latitude", e.target.value)}
                    placeholder="-33.8688"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => updateFormData("longitude", e.target.value)}
                    placeholder="151.2093"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Tip: You can find coordinates by right-clicking on Google Maps
              </p>
            </CardContent>
          </>
        )}

        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Volume & Pricing</CardTitle>
              <CardDescription>
                Specify your capacity and availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="annual_capacity">Annual Capacity (tonnes) *</Label>
                  <Input
                    id="annual_capacity"
                    type="number"
                    value={formData.annual_capacity_tonnes}
                    onChange={(e) => updateFormData("annual_capacity_tonnes", e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available_volume">Currently Available (tonnes) *</Label>
                  <Input
                    id="available_volume"
                    type="number"
                    value={formData.available_volume_current}
                    onChange={(e) => updateFormData("available_volume_current", e.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price Indication (optional)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price_indication}
                    onChange={(e) => updateFormData("price_indication", e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_unit">Price Unit</Label>
                  <Select
                    value={formData.price_unit}
                    onValueChange={(v) => updateFormData("price_unit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUD/tonne">AUD/tonne</SelectItem>
                      <SelectItem value="AUD/litre">AUD/litre</SelectItem>
                      <SelectItem value="AUD/kg">AUD/kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Quality Parameters</CardTitle>
              <CardDescription>
                Enter your feedstock quality data (from latest test)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.category && QUALITY_PARAMS_BY_CATEGORY[formData.category as FeedstockCategory]?.map((param) => (
                <div key={param.name} className="grid gap-4 sm:grid-cols-3 items-center">
                  <Label>{param.label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quality_parameters[param.name] || ""}
                    onChange={(e) => updateQualityParam(param.name, e.target.value)}
                    placeholder={`Enter ${param.label.toLowerCase()}`}
                  />
                  <span className="text-sm text-muted-foreground">{param.unit}</span>
                </div>
              ))}
              {!formData.category && (
                <p className="text-muted-foreground">Please select a category first</p>
              )}
            </CardContent>
          </>
        )}

        {currentStep === 5 && (
          <>
            <CardHeader>
              <CardTitle>Sustainability & Certification</CardTitle>
              <CardDescription>
                Declare your sustainability credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Primary Certification</Label>
                <Select
                  value={formData.certification_type}
                  onValueChange={(v) => updateFormData("certification_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certification (if any)" />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATION_TYPES.map((cert) => (
                      <SelectItem key={cert.value} value={cert.value}>
                        {cert.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Land Use Compliance</Label>
                <div className="space-y-3">
                  {[
                    { key: "no_deforestation_verified", label: "No deforestation post-2008 (verified)" },
                    { key: "no_hcv_land_conversion", label: "No high-conservation value land conversion" },
                    { key: "no_peatland_drainage", label: "No peatland drainage" },
                    { key: "indigenous_rights_compliance", label: "Indigenous land rights compliance" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.key}
                        checked={formData[item.key as keyof FormData] as boolean}
                        onCheckedChange={(checked) => updateFormData(item.key as keyof FormData, checked)}
                      />
                      <Label htmlFor={item.key} className="font-normal cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Social Compliance</Label>
                <div className="space-y-3">
                  {[
                    { key: "fair_work_certified", label: "Fair work certification/audit" },
                    { key: "community_benefit_documented", label: "Community benefit documentation" },
                    { key: "supply_chain_transparent", label: "Supply chain transparency declaration" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.key}
                        checked={formData[item.key as keyof FormData] as boolean}
                        onCheckedChange={(checked) => updateFormData(item.key as keyof FormData, checked)}
                      />
                      <Label htmlFor={item.key} className="font-normal cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Environmental Practices</Label>
                <div className="space-y-3">
                  {[
                    { key: "regenerative_practice_certified", label: "Regenerative practice certification" },
                    { key: "soil_carbon_measured", label: "Soil carbon measurement program" },
                    { key: "biodiversity_corridor_maintained", label: "Biodiversity corridor maintenance" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.key}
                        checked={formData[item.key as keyof FormData] as boolean}
                        onCheckedChange={(checked) => updateFormData(item.key as keyof FormData, checked)}
                      />
                      <Label htmlFor={item.key} className="font-normal cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="carbon_intensity">Carbon Intensity (gCO2e/MJ)</Label>
                  <Input
                    id="carbon_intensity"
                    type="number"
                    step="0.1"
                    value={formData.carbon_intensity_value}
                    onChange={(e) => updateFormData("carbon_intensity_value", e.target.value)}
                    placeholder="e.g., 25.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbon_method">Calculation Method</Label>
                  <Input
                    id="carbon_method"
                    value={formData.carbon_intensity_method}
                    onChange={(e) => updateFormData("carbon_intensity_method", e.target.value)}
                    placeholder="e.g., ISCC default values"
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 6 && (
          <>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Review your feedstock details before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Category:</dt>
                      <dd>{FEEDSTOCK_CATEGORIES.find(c => c.value === formData.category)?.label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Type:</dt>
                      <dd>{formData.type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name:</dt>
                      <dd>{formData.name}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">State:</dt>
                      <dd>{AUSTRALIAN_STATES.find(s => s.value === formData.state)?.label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Coordinates:</dt>
                      <dd>{formData.latitude}, {formData.longitude}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Volume</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Annual Capacity:</dt>
                      <dd>{Number(formData.annual_capacity_tonnes).toLocaleString()} t</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Available:</dt>
                      <dd>{Number(formData.available_volume_current).toLocaleString()} t</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Certification</h4>
                  <p className="text-sm">
                    {formData.certification_type 
                      ? CERTIFICATION_TYPES.find(c => c.value === formData.certification_type)?.label 
                      : "None declared"}
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Your feedstock will be submitted for review. Once approved, it will be visible to buyers on the platform.
                </AlertDescription>
              </Alert>
            </CardContent>
          </>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || loading}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {currentStep < STEPS.length ? (
          <Button onClick={nextStep} disabled={loading}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for Review
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
