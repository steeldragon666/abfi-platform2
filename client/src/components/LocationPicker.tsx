import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search } from "lucide-react";

interface LocationPickerProps {
  value?: {
    address?: string;
    city?: string;
    state?: string;
    postcode?: string;
    latitude?: string;
    longitude?: string;
  };
  onChange: (location: {
    address?: string;
    city?: string;
    state?: string;
    postcode?: string;
    latitude?: string;
    longitude?: string;
  }) => void;
  required?: boolean;
  className?: string;
}

const AUSTRALIAN_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
];

export function LocationPicker({
  value = {},
  onChange,
  required = false,
  className = "",
}: LocationPickerProps) {
  const [address, setAddress] = useState(value.address || "");
  const [city, setCity] = useState(value.city || "");
  const [state, setState] = useState(value.state || "");
  const [postcode, setPostcode] = useState(value.postcode || "");
  const [latitude, setLatitude] = useState(value.latitude || "");
  const [longitude, setLongitude] = useState(value.longitude || "");

  useEffect(() => {
    onChange({
      address,
      city,
      state,
      postcode,
      latitude,
      longitude,
    });
  }, [address, city, state, postcode, latitude, longitude]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="address">
          Street Address {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="address"
          placeholder="123 Farm Road"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required={required}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">
            City/Town {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="city"
            placeholder="Wagga Wagga"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required={required}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postcode">
            Postcode {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="postcode"
            placeholder="2650"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            maxLength={4}
            required={required}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">
          State {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={state} onValueChange={setState} required={required}>
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {AUSTRALIAN_STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">GPS Coordinates (Optional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
          >
            <MapPin className="h-3 w-3 mr-1" />
            Use Current Location
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
            <Input
              id="latitude"
              placeholder="-35.1082"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              type="number"
              step="any"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
            <Input
              id="longitude"
              placeholder="147.3598"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              type="number"
              step="any"
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          GPS coordinates help buyers find your location on the map
        </p>
      </div>
    </div>
  );
}

interface LocationDisplayProps {
  location: {
    address?: string;
    city?: string;
    state?: string;
    postcode?: string;
    latitude?: string;
    longitude?: string;
  };
  showCoordinates?: boolean;
  className?: string;
}

export function LocationDisplay({
  location,
  showCoordinates = false,
  className = "",
}: LocationDisplayProps) {
  const formatAddress = () => {
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.postcode) parts.push(location.postcode);
    return parts.join(", ");
  };

  const address = formatAddress();

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <div className="text-sm">{address || "No location specified"}</div>
        {showCoordinates && location.latitude && location.longitude && (
          <div className="text-xs text-muted-foreground mt-1">
            {location.latitude}, {location.longitude}
          </div>
        )}
      </div>
    </div>
  );
}
