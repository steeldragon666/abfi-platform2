"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Search, Loader2, X, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

// Set Mapbox access token from environment variable
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationPickerProps {
  value?: LocationCoordinates | null;
  onChange?: (location: LocationCoordinates | null) => void;
  defaultCenter?: [number, number]; // [lng, lat]
  defaultZoom?: number;
  placeholder?: string;
  label?: string;
  description?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

// Australian center coordinates
const AUSTRALIA_CENTER: [number, number] = [133.7751, -25.2744];
const DEFAULT_ZOOM = 4;

export function LocationPicker({
  value,
  onChange,
  defaultCenter = AUSTRALIA_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  placeholder = "Click to select location",
  label,
  description,
  className,
  required = false,
  disabled = false,
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(
    value || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: selectedLocation
        ? [selectedLocation.longitude, selectedLocation.latitude]
        : defaultCenter,
      zoom: selectedLocation ? 12 : defaultZoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add marker if location exists
    if (selectedLocation) {
      marker.current = new mapboxgl.Marker({ color: "#1B4332" })
        .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
        .addTo(map.current);
    }

    // Handle map click
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;

      // Update marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({ color: "#1B4332" })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }

      // Reverse geocode to get address
      const address = await reverseGeocode(lat, lng);

      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        address,
      });
    });
  }, [defaultCenter, defaultZoom, selectedLocation]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Initialize map when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [isOpen, initializeMap]);

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return undefined;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=AU`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
    return undefined;
  };

  // Search for locations
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

  // Select a search result
  const selectSearchResult = (result: any) => {
    const [lng, lat] = result.center;

    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
      });
    }

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else if (map.current) {
      marker.current = new mapboxgl.Marker({ color: "#1B4332" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    setSelectedLocation({
      latitude: lat,
      longitude: lng,
      address: result.place_name,
    });

    setSearchResults([]);
    setSearchQuery("");
  };

  // Confirm selection
  const handleConfirm = () => {
    onChange?.(selectedLocation);
    setIsOpen(false);
  };

  // Clear selection
  const handleClear = () => {
    setSelectedLocation(null);
    onChange?.(null);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  };

  // Use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
          });
        }

        if (marker.current) {
          marker.current.setLngLat([longitude, latitude]);
        } else if (map.current) {
          marker.current = new mapboxgl.Marker({ color: "#1B4332" })
            .setLngLat([longitude, latitude])
            .addTo(map.current);
        }

        const address = await reverseGeocode(latitude, longitude);
        setSelectedLocation({
          latitude,
          longitude,
          address,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-auto py-3",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <MapPin className="mr-2 h-4 w-4 shrink-0" />
            <div className="flex-1 truncate">
              {value?.address || value
                ? `${value.latitude?.toFixed(4)}, ${value.longitude?.toFixed(4)}`
                : placeholder}
            </div>
            {value && (
              <X
                className="ml-2 h-4 w-4 shrink-0 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
            <DialogDescription>
              Search for an address or click on the map to select a location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleUseCurrentLocation} title="Use current location">
                <Navigation className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card>
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
                            <span className="line-clamp-2">{result.place_name}</span>
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
              className="w-full h-[350px] rounded-lg border overflow-hidden"
            />

            {/* Selected Location Info */}
            {selectedLocation && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {selectedLocation.address && (
                        <p className="text-sm font-medium truncate">
                          {selectedLocation.address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Lat: {selectedLocation.latitude.toFixed(6)}, Lng:{" "}
                        {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedLocation}>
                Confirm Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Mini map display component (read-only)
interface LocationDisplayProps {
  location: LocationCoordinates;
  className?: string;
  height?: number;
}

export function LocationDisplay({
  location,
  className,
  height = 200,
}: LocationDisplayProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.longitude, location.latitude],
      zoom: 12,
      interactive: false,
    });

    new mapboxgl.Marker({ color: "#1B4332" })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location]);

  return (
    <div
      ref={mapContainer}
      className={cn("rounded-lg border overflow-hidden", className)}
      style={{ height }}
    />
  );
}

// Coordinates input component (manual entry)
interface CoordinatesInputProps {
  value?: LocationCoordinates | null;
  onChange?: (location: LocationCoordinates | null) => void;
  label?: string;
  className?: string;
}

export function CoordinatesInput({
  value,
  onChange,
  label,
  className,
}: CoordinatesInputProps) {
  const [lat, setLat] = useState(value?.latitude?.toString() || "");
  const [lng, setLng] = useState(value?.longitude?.toString() || "");

  const handleUpdate = (newLat: string, newLng: string) => {
    const latitude = parseFloat(newLat);
    const longitude = parseFloat(newLng);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      onChange?.({
        latitude,
        longitude,
      });
    } else if (newLat === "" && newLng === "") {
      onChange?.(null);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Latitude</Label>
          <Input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => {
              setLat(e.target.value);
              handleUpdate(e.target.value, lng);
            }}
            placeholder="-25.2744"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Longitude</Label>
          <Input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => {
              setLng(e.target.value);
              handleUpdate(lat, e.target.value);
            }}
            placeholder="133.7751"
          />
        </div>
      </div>
    </div>
  );
}
