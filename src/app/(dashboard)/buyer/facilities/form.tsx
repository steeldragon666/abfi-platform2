"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Factory,
  MapPin,
  Save,
  Loader2,
  Navigation,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Buyer } from "@/types/database";

// Set Mapbox access token
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

interface FacilitiesFormProps {
  buyer: Buyer | null;
}

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"];

const AUSTRALIA_CENTER: [number, number] = [133.7751, -25.2744];

interface FacilityData {
  facility_name: string;
  facility_address: string;
  facility_city: string;
  facility_state: string;
  facility_postcode: string;
  facility_latitude: number | null;
  facility_longitude: number | null;
  facility_description: string;
  processing_capacity: string;
}

export function FacilitiesForm({ buyer }: FacilitiesFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Parse existing facility data from buyer
  const [formData, setFormData] = useState<FacilityData>(() => {
    // Try to parse facility details from description field if it contains JSON
    let parsedFacility: Partial<FacilityData> = {};
    if (buyer?.description) {
      try {
        const parsed = JSON.parse(buyer.description);
        if (parsed.facility) {
          parsedFacility = parsed.facility;
        }
      } catch {
        // Not JSON, use as regular description
      }
    }

    return {
      facility_name: parsedFacility.facility_name || buyer?.company_name || "",
      facility_address: parsedFacility.facility_address || buyer?.address_line1 || "",
      facility_city: parsedFacility.facility_city || buyer?.city || "",
      facility_state: parsedFacility.facility_state || buyer?.state || "",
      facility_postcode: parsedFacility.facility_postcode || buyer?.postcode || "",
      facility_latitude: buyer?.facility_latitude || null,
      facility_longitude: buyer?.facility_longitude || null,
      facility_description: parsedFacility.facility_description || "",
      processing_capacity: parsedFacility.processing_capacity || "",
    };
  });

  const updateField = <K extends keyof FacilityData>(
    field: K,
    value: FacilityData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter: [number, number] =
      formData.facility_latitude && formData.facility_longitude
        ? [formData.facility_longitude, formData.facility_latitude]
        : AUSTRALIA_CENTER;

    const initialZoom =
      formData.facility_latitude && formData.facility_longitude ? 14 : 4;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add marker if location exists
    if (formData.facility_latitude && formData.facility_longitude) {
      marker.current = new mapboxgl.Marker({ color: "#1B4332" })
        .setLngLat([formData.facility_longitude, formData.facility_latitude])
        .addTo(map.current);
    }

    // Handle map click
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      handleLocationSelect(lat, lng);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    // Update marker
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else if (map.current) {
      marker.current = new mapboxgl.Marker({ color: "#1B4332" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      facility_latitude: lat,
      facility_longitude: lng,
    }));

    // Reverse geocode to get address
    await reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=AU&types=address,locality,place`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];

        // Parse address components
        let city = "";
        let state = "";
        let postcode = "";

        for (const item of context) {
          if (item.id.startsWith("place")) city = item.text;
          if (item.id.startsWith("locality") && !city) city = item.text;
          if (item.id.startsWith("region")) {
            // Convert full state name to abbreviation
            const stateMap: Record<string, string> = {
              "New South Wales": "NSW",
              "Victoria": "VIC",
              "Queensland": "QLD",
              "Western Australia": "WA",
              "South Australia": "SA",
              "Tasmania": "TAS",
              "Northern Territory": "NT",
              "Australian Capital Territory": "ACT",
            };
            state = stateMap[item.text] || item.text;
          }
          if (item.id.startsWith("postcode")) postcode = item.text;
        }

        setFormData((prev) => ({
          ...prev,
          facility_address: feature.place_name?.split(",")[0] || prev.facility_address,
          facility_city: city || prev.facility_city,
          facility_state: state || prev.facility_state,
          facility_postcode: postcode || prev.facility_postcode,
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=AU&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const [lng, lat] = result.center;

    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
      });
    }

    handleLocationSelect(lat, lng);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
          });
        }

        handleLocationSelect(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to get your current location");
      }
    );
  };

  const handleClearLocation = () => {
    setFormData((prev) => ({
      ...prev,
      facility_latitude: null,
      facility_longitude: null,
    }));

    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    if (map.current) {
      map.current.flyTo({
        center: AUSTRALIA_CENTER,
        zoom: 4,
      });
    }
  };

  const handleSave = async () => {
    if (!buyer) {
      toast.error("Buyer profile not found");
      return;
    }

    if (!formData.facility_name) {
      toast.error("Facility name is required");
      return;
    }

    setSaving(true);

    try {
      // Store facility details in a structured way
      const facilityDetails = {
        facility_name: formData.facility_name,
        facility_address: formData.facility_address,
        facility_city: formData.facility_city,
        facility_state: formData.facility_state,
        facility_postcode: formData.facility_postcode,
        facility_description: formData.facility_description,
        processing_capacity: formData.processing_capacity,
      };

      const { error } = await supabase
        .from("buyers")
        .update({
          facility_latitude: formData.facility_latitude,
          facility_longitude: formData.facility_longitude,
          // Store additional facility details in metadata or description
          // For now, we'll use the standard fields where possible
          updated_at: new Date().toISOString(),
        })
        .eq("id", buyer.id);

      if (error) throw error;

      toast.success("Facility location saved successfully");
      router.refresh();
    } catch (error) {
      console.error("Error saving facility:", error);
      toast.error("Failed to save facility location");
    } finally {
      setSaving(false);
    }
  };

  const hasLocation = formData.facility_latitude && formData.facility_longitude;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Alert
        className={cn(
          hasLocation
            ? "border-green-500/50 bg-green-500/10"
            : "border-yellow-500/50 bg-yellow-500/10"
        )}
      >
        {hasLocation ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        <AlertDescription
          className={hasLocation ? "text-green-800" : "text-yellow-800"}
        >
          {hasLocation
            ? "Facility location is set. Suppliers can calculate delivery logistics to your facility."
            : "No facility location set. Add your facility location to help suppliers with delivery planning."}
        </AlertDescription>
      </Alert>

      {/* Map Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Selection
          </CardTitle>
          <CardDescription>
            Search for your facility address or click on the map to set the
            location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search for an address in Australia..."
                className="pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button onClick={handleSearch} disabled={isSearching} size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleUseCurrentLocation}
              title="Use current location"
              size="icon"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="border-2">
              <CardContent className="p-2">
                <ul className="space-y-1">
                  {searchResults.map((result, index) => (
                    <li key={index}>
                      <button
                        onClick={() => selectSearchResult(result)}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <span className="line-clamp-2">
                            {result.place_name}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Map Container */}
          <div
            ref={mapContainer}
            className="w-full h-[400px] rounded-lg border overflow-hidden"
          />

          {/* Current Coordinates */}
          {hasLocation && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Selected Location</p>
                  <p className="text-xs text-muted-foreground">
                    Lat: {formData.facility_latitude?.toFixed(6)}, Lng:{" "}
                    {formData.facility_longitude?.toFixed(6)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLocation}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facility Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Facility Details
          </CardTitle>
          <CardDescription>
            Provide additional information about your processing facility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facility_name">Facility Name *</Label>
              <Input
                id="facility_name"
                value={formData.facility_name}
                onChange={(e) => updateField("facility_name", e.target.value)}
                placeholder="e.g., Melbourne Biofuel Plant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processing_capacity">
                Processing Capacity (t/year)
              </Label>
              <Input
                id="processing_capacity"
                type="number"
                value={formData.processing_capacity}
                onChange={(e) =>
                  updateField("processing_capacity", e.target.value)
                }
                placeholder="e.g., 50000"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="facility_address">Street Address</Label>
            <Input
              id="facility_address"
              value={formData.facility_address}
              onChange={(e) => updateField("facility_address", e.target.value)}
              placeholder="123 Industrial Drive"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="facility_city">City</Label>
              <Input
                id="facility_city"
                value={formData.facility_city}
                onChange={(e) => updateField("facility_city", e.target.value)}
                placeholder="Melbourne"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility_state">State</Label>
              <Select
                value={formData.facility_state}
                onValueChange={(v) => updateField("facility_state", v)}
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
              <Label htmlFor="facility_postcode">Postcode</Label>
              <Input
                id="facility_postcode"
                value={formData.facility_postcode}
                onChange={(e) =>
                  updateField("facility_postcode", e.target.value)
                }
                placeholder="3000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility_description">
              Facility Description (Optional)
            </Label>
            <Textarea
              id="facility_description"
              value={formData.facility_description}
              onChange={(e) =>
                updateField("facility_description", e.target.value)
              }
              placeholder="Describe your facility, receiving capabilities, operating hours, special requirements..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Why Set Your Facility Location?
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Suppliers can calculate accurate delivery distances and
                  costs
                </li>
                <li>
                  • Enables route optimization for feedstock logistics
                </li>
                <li>
                  • Helps match you with nearby suppliers for lower transport
                  costs
                </li>
                <li>
                  • Required for bankability assessments and supply chain
                  analysis
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Facility Location
        </Button>
      </div>
    </div>
  );
}
