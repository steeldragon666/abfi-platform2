"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface FeedstockLocation {
  id: string;
  name: string;
  feedstock_id: string;
  category: string;
  latitude: number;
  longitude: number;
  abfi_score: number;
  available_volume: number;
  state: string;
}

interface FeedstockMapProps {
  feedstocks: FeedstockLocation[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  onMarkerClick?: (feedstock: FeedstockLocation) => void;
  className?: string;
  showSearch?: boolean;
  searchRadius?: number; // in km
  searchCenter?: [number, number];
}

export function FeedstockMap({
  feedstocks,
  center = [133.7751, -25.2744], // Australia center
  zoom = 4,
  onMarkerClick,
  className,
  showSearch = false,
  searchRadius,
  searchCenter,
}: FeedstockMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [center, zoom]);

  // Add markers when feedstocks change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    feedstocks.forEach((feedstock) => {
      const el = document.createElement("div");
      el.className = "feedstock-marker";
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer transition-transform hover:scale-110"
             style="background-color: ${getScoreColor(feedstock.abfi_score)}; color: white;">
          ${feedstock.abfi_score}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2 min-w-[200px]">
          <div class="font-semibold">${feedstock.name}</div>
          <div class="text-xs text-gray-500">${feedstock.feedstock_id}</div>
          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div class="text-gray-500">Category</div>
              <div class="font-medium">${getCategoryLabel(feedstock.category)}</div>
            </div>
            <div>
              <div class="text-gray-500">ABFI Score</div>
              <div class="font-medium">${feedstock.abfi_score}/100</div>
            </div>
            <div>
              <div class="text-gray-500">Volume</div>
              <div class="font-medium">${feedstock.available_volume.toLocaleString()}t</div>
            </div>
            <div>
              <div class="text-gray-500">State</div>
              <div class="font-medium">${feedstock.state}</div>
            </div>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([feedstock.longitude, feedstock.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener("click", () => {
        onMarkerClick?.(feedstock);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (feedstocks.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      feedstocks.forEach((f) => {
        bounds.extend([f.longitude, f.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [feedstocks, mapLoaded, onMarkerClick]);

  // Add search radius circle
  useEffect(() => {
    if (!map.current || !mapLoaded || !showSearch || !searchRadius || !searchCenter)
      return;

    const sourceId = "search-radius";
    const layerId = "search-radius-fill";

    // Remove existing layer and source
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Create circle polygon
    const circle = createGeoJSONCircle(searchCenter, searchRadius);

    map.current.addSource(sourceId, {
      type: "geojson",
      data: circle,
    });

    map.current.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#1B4332",
        "fill-opacity": 0.1,
      },
    });

    map.current.addLayer({
      id: `${layerId}-outline`,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#1B4332",
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    });
  }, [mapLoaded, showSearch, searchRadius, searchCenter]);

  return (
    <div className={cn("relative w-full h-full min-h-[400px]", className)}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 85) return "#15803d"; // green-700
  if (score >= 70) return "#059669"; // emerald-600
  if (score >= 55) return "#ca8a04"; // yellow-600
  if (score >= 40) return "#ea580c"; // orange-600
  return "#dc2626"; // red-600
}

function getCategoryLabel(category: string): string {
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
}

function createGeoJSONCircle(
  center: [number, number],
  radiusKm: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]); // Close the polygon

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}
