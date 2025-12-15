"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageLayout, PageContainer } from "@/components/layout";
import { Layers, Search, Download, Target, Save, Trash2, FolderOpen, Loader2, Map, Globe, Zap, TreeDeciduous, Building2 } from "lucide-react";
import { analyzeRadius, type AnalysisResults } from "@/lib/radiusAnalysis";
import { exportAsGeoJSON, exportAsCSV } from "@/lib/mapExport";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";
import { useProxyMapLoader } from "@/hooks/useProxyMapLoader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Link } from "wouter";

// Australia center
const defaultCenter = {
  lat: -25.2744,
  lng: 133.7751,
};

interface LayerConfig {
  id: string;
  name: string;
  type: "marker" | "polygon";
  source: string;
  color: string;
  visible: boolean;
}

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

export default function FeedstockMap() {
  // Load Google Maps via Forge proxy
  const { isLoaded, loadError } = useProxyMapLoader();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [selectedStates, setSelectedStates] = useState<string[]>(["QLD", "NSW", "VIC", "SA", "WA", "TAS"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedAnalysisName, setSavedAnalysisName] = useState("");
  const [savedAnalysisDescription, setSavedAnalysisDescription] = useState("");
  const [radiusCircle, setRadiusCircle] = useState<google.maps.Circle | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // GeoJSON data storage
  const [layerData, setLayerData] = useState<Record<string, GeoJSONData>>({});

  // Fetch saved analyses
  const { data: savedAnalyses, refetch: refetchSavedAnalyses } = trpc.savedAnalyses.list.useQuery();
  const deleteAnalysisMutation = trpc.savedAnalyses.delete.useMutation({
    onSuccess: () => {
      refetchSavedAnalyses();
    },
  });

  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: "sugar-mills", name: "Sugar Mills", type: "marker", source: "/geojson/sugar_mills.json", color: "#8B4513", visible: true },
    { id: "grain-regions", name: "Grain Regions", type: "polygon", source: "/geojson/grain_regions.json", color: "#DAA520", visible: true },
    { id: "forestry-regions", name: "Forestry Regions", type: "polygon", source: "/geojson/forestry_regions.json", color: "#228B22", visible: false },
    { id: "biogas-facilities", name: "Biogas Facilities", type: "marker", source: "/geojson/biogas_facilities.json", color: "#FF6347", visible: false },
    { id: "biofuel-plants", name: "Biofuel Plants", type: "marker", source: "/geojson/biofuel_plants.json", color: "#4169E1", visible: false },
    { id: "transport-ports", name: "Ports & Transport", type: "marker", source: "/geojson/transport_infrastructure.json", color: "#9370DB", visible: false },
  ]);

  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    "sugar-mills": 100,
    "grain-regions": 30,
    "forestry-regions": 30,
    "biogas-facilities": 100,
    "biofuel-plants": 100,
    "transport-ports": 100,
  });

  // Capacity filters
  const [sugarMillCapacity, setSugarMillCapacity] = useState<[number, number]>([0, 4000000]);
  const [biogasCapacity, setBiogasCapacity] = useState<[number, number]>([0, 50]);
  const [biofuelCapacity, setBiofuelCapacity] = useState<[number, number]>([0, 500]);
  const [portThroughput, setPortThroughput] = useState<[number, number]>([0, 200]);

  // Initialize map when script is loaded
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInitialized) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 4,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9eafc" }] },
        { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e8f5e9" }] },
      ],
    });

    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    setMapInitialized(true);
  }, [isLoaded, mapInitialized]);

  // Load GeoJSON data on mount
  useEffect(() => {
    const loadData = async () => {
      const data: Record<string, GeoJSONData> = {};
      for (const layer of layers) {
        try {
          const response = await fetch(layer.source);
          const geojson = await response.json();
          data[layer.id] = geojson;
        } catch (error) {
          console.error(`Failed to load ${layer.id}:`, error);
        }
      }
      setLayerData(data);
    };
    loadData();
  }, []);

  // Filter features by state
  const filterByState = useCallback((feature: GeoJSONFeature): boolean => {
    const state = feature.properties?.state || feature.properties?.STATE;
    if (!state) return true;
    return selectedStates.includes(state);
  }, [selectedStates]);

  // Create popup content
  const createPopupContent = (layerId: string, properties: Record<string, any>): string => {
    const baseStyle = `font-family: system-ui, -apple-system, sans-serif; font-size: 13px;`;
    switch (layerId) {
      case "sugar-mills":
        return `
          <div style="${baseStyle} padding: 12px; max-width: 280px;">
            <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 15px; color: #1a1a1a;">${properties.name || "Sugar Mill"}</h3>
            <div style="display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Owner:</span><span style="font-weight: 500;">${properties.owner || "N/A"}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Capacity:</span><span style="font-weight: 500;">${(properties.crushing_capacity_tonnes || 0).toLocaleString()} t</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Bagasse:</span><span style="font-weight: 500; color: #059669;">${(properties.bagasse_tonnes_available || 0).toLocaleString()} t</span></div>
            </div>
          </div>
        `;
      case "biogas-facilities":
        return `
          <div style="${baseStyle} padding: 12px; max-width: 280px;">
            <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 15px; color: #1a1a1a;">${properties.name || "Biogas Facility"}</h3>
            <div style="display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Capacity:</span><span style="font-weight: 500;">${properties.capacity_mw || "N/A"} MW</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Feedstock:</span><span style="font-weight: 500;">${properties.feedstock_type || "N/A"}</span></div>
            </div>
          </div>
        `;
      case "biofuel-plants":
        return `
          <div style="${baseStyle} padding: 12px; max-width: 280px;">
            <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 15px; color: #1a1a1a;">${properties.name || "Biofuel Plant"}</h3>
            <div style="display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Type:</span><span style="font-weight: 500;">${properties.fuel_type || "N/A"}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Capacity:</span><span style="font-weight: 500;">${properties.capacity_ml_year || "N/A"} ML/yr</span></div>
            </div>
          </div>
        `;
      case "transport-ports":
        return `
          <div style="${baseStyle} padding: 12px; max-width: 280px;">
            <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 15px; color: #1a1a1a;">${properties.name || "Port"}</h3>
            <div style="display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Type:</span><span style="font-weight: 500;">${properties.type || "N/A"}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Throughput:</span><span style="font-weight: 500;">${properties.throughput_mt || "N/A"} MT/yr</span></div>
            </div>
          </div>
        `;
      case "grain-regions":
      case "forestry-regions":
        return `
          <div style="${baseStyle} padding: 12px; max-width: 280px;">
            <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 15px; color: #1a1a1a;">${properties.name || properties.REGION_NAME || "Region"}</h3>
            <div style="display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">State:</span><span style="font-weight: 500;">${properties.state || properties.STATE || "N/A"}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #666;">Area:</span><span style="font-weight: 500;">${(properties.area_ha || properties.AREA_HA || 0).toLocaleString()} ha</span></div>
            </div>
          </div>
        `;
      default:
        return `<div style="padding: 8px;">${JSON.stringify(properties, null, 2)}</div>`;
    }
  };

  // Update map layers when data or visibility changes
  useEffect(() => {
    if (!mapRef.current || !mapInitialized || Object.keys(layerData).length === 0) return;

    // Clear existing markers and polygons
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    polygonsRef.current.forEach(polygon => polygon.setMap(null));
    polygonsRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    const newMarkers: google.maps.Marker[] = [];
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;

    // Render marker layers
    layers
      .filter((l) => l.visible && l.type === "marker")
      .forEach((layer) => {
        const data = layerData[layer.id];
        if (!data) return;

        data.features
          .filter(filterByState)
          .filter((feature) => feature.geometry.type === "Point")
          .forEach((feature) => {
            const coords = feature.geometry.coordinates as number[];
            const marker = new google.maps.Marker({
              position: { lat: coords[1], lng: coords[0] },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: layer.color,
                fillOpacity: (layerOpacity[layer.id] || 100) / 100,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 8,
              },
            });

            marker.addListener("click", () => {
              if (infoWindow) {
                infoWindow.setContent(createPopupContent(layer.id, feature.properties));
                infoWindow.setPosition({ lat: coords[1], lng: coords[0] });
                infoWindow.open(map);
              }
            });

            newMarkers.push(marker);
          });
      });

    // Create clusterer for markers
    if (newMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: newMarkers,
      });
    }
    markersRef.current = newMarkers;

    // Render polygon layers
    layers
      .filter((l) => l.visible && l.type === "polygon")
      .forEach((layer) => {
        const data = layerData[layer.id];
        if (!data) return;

        data.features
          .filter(filterByState)
          .filter((feature) => feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
          .forEach((feature) => {
            let paths: google.maps.LatLngLiteral[][] = [];

            if (feature.geometry.type === "Polygon") {
              const coords = feature.geometry.coordinates as number[][][];
              paths = coords.map((ring) =>
                ring.map((coord) => ({ lat: coord[1], lng: coord[0] }))
              );
            } else if (feature.geometry.type === "MultiPolygon") {
              const coords = feature.geometry.coordinates as unknown as number[][][][];
              coords.forEach((polygon) => {
                polygon.forEach((ring) => {
                  paths.push(ring.map((coord) => ({ lat: coord[1], lng: coord[0] })));
                });
              });
            }

            paths.forEach((path) => {
              const polygon = new google.maps.Polygon({
                paths: path,
                fillColor: layer.color,
                fillOpacity: (layerOpacity[layer.id] || 100) / 100 * 0.3,
                strokeColor: layer.color,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                map,
              });

              polygon.addListener("click", (e: google.maps.MapMouseEvent) => {
                if (infoWindow && e.latLng) {
                  infoWindow.setContent(createPopupContent(layer.id, feature.properties));
                  infoWindow.setPosition(e.latLng);
                  infoWindow.open(map);
                }
              });

              polygonsRef.current.push(polygon);
            });
          });
      });

  }, [mapInitialized, layerData, layers, layerOpacity, selectedStates, filterByState]);

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setLayers(layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)));
  };

  // Update layer opacity
  const updateOpacity = (layerId: string, opacity: number) => {
    setLayerOpacity({ ...layerOpacity, [layerId]: opacity });
  };

  // Draw radius and analyze
  const drawRadius = async () => {
    if (!mapRef.current) return;

    const center = mapRef.current.getCenter();
    if (!center) return;

    const centerPos = { lat: center.lat(), lng: center.lng() };
    setRadiusCenter(centerPos);
    setIsAnalyzing(true);

    // Remove existing circle
    if (radiusCircle) {
      radiusCircle.setMap(null);
    }

    // Create new circle
    const circle = new google.maps.Circle({
      strokeColor: "#14b8a6",
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: "#14b8a6",
      fillOpacity: 0.15,
      map: mapRef.current,
      center: centerPos,
      radius: radiusKm * 1000,
    });

    setRadiusCircle(circle);

    // Run analysis
    try {
      const results = await analyzeRadius(centerPos.lat, centerPos.lng, radiusKm);
      setAnalysisResults(results);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear radius
  const clearRadius = () => {
    if (radiusCircle) {
      radiusCircle.setMap(null);
      setRadiusCircle(null);
    }
    setRadiusCenter(null);
    setAnalysisResults(null);
  };

  // Export handlers
  const handleExportGeoJSON = async () => {
    setIsExporting(true);
    try {
      const visibleLayers = layers.filter((l) => l.visible).map((l) => l.id);
      const count = await exportAsGeoJSON({
        layers: visibleLayers,
        stateFilter: selectedStates,
        capacityRanges: {
          "sugar-mills": { min: sugarMillCapacity[0], max: sugarMillCapacity[1] },
          "biogas-facilities": { min: biogasCapacity[0], max: biogasCapacity[1] },
          "biofuel-plants": { min: biofuelCapacity[0], max: biofuelCapacity[1] },
          "transport-infrastructure": { min: portThroughput[0], max: portThroughput[1] },
        },
      });
      alert(`Exported ${count} facilities as GeoJSON`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const visibleLayers = layers.filter((l) => l.visible).map((l) => l.id);
      const count = await exportAsCSV({
        layers: visibleLayers,
        stateFilter: selectedStates,
        capacityRanges: {
          "sugar-mills": { min: sugarMillCapacity[0], max: sugarMillCapacity[1] },
          "biogas-facilities": { min: biogasCapacity[0], max: biogasCapacity[1] },
          "biofuel-plants": { min: biofuelCapacity[0], max: biofuelCapacity[1] },
          "transport-infrastructure": { min: portThroughput[0], max: portThroughput[1] },
        },
      });
      alert(`Exported ${count} facilities as CSV`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Save analysis mutation
  const saveAnalysisMutation = trpc.savedAnalyses.save.useMutation({
    onSuccess: () => {
      alert("Analysis saved successfully!");
      setShowSaveDialog(false);
      setSavedAnalysisName("");
      setSavedAnalysisDescription("");
      refetchSavedAnalyses();
    },
    onError: (error) => {
      alert(`Failed to save analysis: ${error.message}`);
    },
  });

  // Handle save analysis
  const handleSaveAnalysis = async () => {
    if (!analysisResults || !radiusCenter) {
      alert("Please run a radius analysis first.");
      return;
    }

    if (!savedAnalysisName.trim()) {
      alert("Please enter a name for this analysis.");
      return;
    }

    saveAnalysisMutation.mutate({
      name: savedAnalysisName,
      description: savedAnalysisDescription || undefined,
      radiusKm,
      centerLat: radiusCenter.lat.toString(),
      centerLng: radiusCenter.lng.toString(),
      results: analysisResults,
      filterState: {
        selectedStates,
        visibleLayers: layers.filter((l) => l.visible).map((l) => l.id),
        capacityRanges: {
          "sugar-mills": { min: sugarMillCapacity[0], max: sugarMillCapacity[1] },
          "biogas-facilities": { min: biogasCapacity[0], max: biogasCapacity[1] },
          "biofuel-plants": { min: biofuelCapacity[0], max: biofuelCapacity[1] },
          "transport-infrastructure": { min: portThroughput[0], max: portThroughput[1] },
        } as Record<string, { min: number; max: number }>,
      },
    });
  };

  // Load saved analysis
  const handleLoadAnalysis = (analysis: any) => {
    clearRadius();

    const centerLat = parseFloat(analysis.centerLat);
    const centerLng = parseFloat(analysis.centerLng);

    setRadiusCenter({ lat: centerLat, lng: centerLng });
    setRadiusKm(analysis.radiusKm);
    setAnalysisResults(analysis.results);

    if (analysis.filterState) {
      setSelectedStates(analysis.filterState.selectedStates);
      setLayers((prev) =>
        prev.map((layer) => ({
          ...layer,
          visible: analysis.filterState.visibleLayers.includes(layer.id),
        }))
      );

      const ranges = analysis.filterState.capacityRanges;
      if (ranges["sugar-mills"]) setSugarMillCapacity([ranges["sugar-mills"].min, ranges["sugar-mills"].max]);
      if (ranges["biogas-facilities"]) setBiogasCapacity([ranges["biogas-facilities"].min, ranges["biogas-facilities"].max]);
      if (ranges["biofuel-plants"]) setBiofuelCapacity([ranges["biofuel-plants"].min, ranges["biofuel-plants"].max]);
      if (ranges["transport-infrastructure"]) setPortThroughput([ranges["transport-infrastructure"].min, ranges["transport-infrastructure"].max]);
    }

    // Pan to analysis location
    if (mapRef.current) {
      mapRef.current.panTo({ lat: centerLat, lng: centerLng });
      mapRef.current.setZoom(9);

      // Draw circle
      setTimeout(() => {
        if (mapRef.current) {
          const circle = new google.maps.Circle({
            strokeColor: "#14b8a6",
            strokeOpacity: 0.9,
            strokeWeight: 3,
            fillColor: "#14b8a6",
            fillOpacity: 0.15,
            map: mapRef.current,
            center: { lat: centerLat, lng: centerLng },
            radius: analysis.radiusKm * 1000,
          });
          setRadiusCircle(circle);
        }
      }, 500);
    }
  };

  if (loadError) {
    return (
      <PageLayout>
        <PageContainer>
          <Card>
            <CardContent className="py-16 text-center">
              <Map className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Map</h3>
              <p className="text-muted-foreground">Please check your API key configuration and try again.</p>
            </CardContent>
          </Card>
        </PageContainer>
      </PageLayout>
    );
  }

  if (!isLoaded) {
    return (
      <PageLayout>
        <PageContainer>
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Loading Map</h3>
              <p className="text-muted-foreground">Initializing geospatial visualization...</p>
            </CardContent>
          </Card>
        </PageContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout showFooter={false}>
      {/* Compact Header */}
      <section className="bg-gradient-to-r from-slate-900 to-teal-900 text-white py-8">
        <PageContainer padding="none">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-teal-400/50 text-teal-300 bg-teal-500/10">
                  <Globe className="h-3 w-3 mr-1" />
                  Interactive GIS
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold">
                Feedstock Supply Map
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Visualize biomass resources, facilities, and infrastructure across Australia
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/futures">
                  <TreeDeciduous className="h-4 w-4 mr-1" />
                  Marketplace
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/bankability">
                  <Building2 className="h-4 w-4 mr-1" />
                  Bankability
                </Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Map Container */}
          <div className="flex-1 flex flex-col">
            <div
              ref={mapContainerRef}
              className="flex-1 min-h-[500px] lg:min-h-0"
            />

            {/* Map Controls Bar */}
            <div className="bg-background border-t p-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Radius:</span>
                <Slider
                  value={[radiusKm]}
                  onValueChange={(value) => setRadiusKm(value[0])}
                  min={10}
                  max={200}
                  step={5}
                  className="flex-1"
                />
                <Badge variant="outline" className="shrink-0">{radiusKm} km</Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={drawRadius} size="sm" disabled={isAnalyzing}>
                  <Target className="h-4 w-4 mr-1" />
                  {isAnalyzing ? "Analyzing..." : "Analyze Area"}
                </Button>
                {radiusCenter && (
                  <Button onClick={clearRadius} variant="outline" size="sm">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-background overflow-y-auto max-h-[50vh] lg:max-h-none">
            <div className="p-4 space-y-4">
              {/* Analysis Results */}
              {analysisResults && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Analysis Results
                    </CardTitle>
                    <CardDescription>{radiusKm}km radius from center</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Feasibility Score */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Feasibility</span>
                        <Badge variant={analysisResults.feasibilityScore >= 70 ? "default" : analysisResults.feasibilityScore >= 40 ? "secondary" : "destructive"}>
                          {analysisResults.feasibilityScore}/100
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${analysisResults.feasibilityScore}%` }} />
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Facilities Found</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Sugar Mills:</span><span className="font-mono">{analysisResults.facilities.sugarMills}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Biogas:</span><span className="font-mono">{analysisResults.facilities.biogasFacilities}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Biofuel:</span><span className="font-mono">{analysisResults.facilities.biofuelPlants}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Ports:</span><span className="font-mono">{analysisResults.facilities.ports}</span></div>
                      </div>
                    </div>

                    {/* Feedstock */}
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-sm font-medium">Annual Feedstock (t)</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Bagasse:</span><span className="font-mono">{analysisResults.feedstockTonnes.bagasse.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Grain Stubble:</span><span className="font-mono">{analysisResults.feedstockTonnes.grainStubble.toLocaleString()}</span></div>
                        <div className="flex justify-between font-semibold pt-1 border-t"><span>Total:</span><span className="font-mono text-primary">{analysisResults.feedstockTonnes.total.toLocaleString()}</span></div>
                      </div>
                    </div>

                    <Button onClick={() => setShowSaveDialog(true)} className="w-full" variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* State Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm">States</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["QLD", "NSW", "VIC", "SA", "WA", "TAS"].map((state) => (
                        <div key={state} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`state-${state}`}
                            checked={selectedStates.includes(state)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStates([...selectedStates, state]);
                              } else {
                                setSelectedStates(selectedStates.filter((s) => s !== state));
                              }
                            }}
                          />
                          <Label htmlFor={`state-${state}`} className="text-xs cursor-pointer">{state}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedStates(["QLD", "NSW", "VIC", "SA", "WA", "TAS"])}
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>

              {/* Saved Analyses */}
              {savedAnalyses && savedAnalyses.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Saved Analyses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {savedAnalyses.map((analysis: any) => (
                        <div key={analysis.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{analysis.name}</div>
                            <div className="text-xs text-muted-foreground">{analysis.radiusKm}km</div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleLoadAnalysis(analysis)}>
                              <Target className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAnalysisMutation.mutate({ id: analysis.id })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Layers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {layers.map((layer) => (
                    <div key={layer.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={layer.visible} onCheckedChange={() => toggleLayer(layer.id)} />
                          <Label className="text-sm cursor-pointer">{layer.name}</Label>
                        </div>
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: layer.color }} />
                      </div>
                      {layer.visible && (
                        <div className="ml-6 space-y-1">
                          <Slider
                            value={[layerOpacity[layer.id]]}
                            onValueChange={([value]) => updateOpacity(layer.id, value)}
                            max={100}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Export */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={handleExportGeoJSON} disabled={isExporting} variant="outline" size="sm" className="w-full">
                    {isExporting ? "Exporting..." : "Export GeoJSON"}
                  </Button>
                  <Button onClick={handleExportCSV} disabled={isExporting} variant="outline" size="sm" className="w-full">
                    {isExporting ? "Exporting..." : "Export CSV"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Save Analysis Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Analysis</DialogTitle>
            <DialogDescription>Save this analysis for future reference.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="analysis-name">Name *</Label>
              <Input
                id="analysis-name"
                placeholder="e.g., Brisbane North Assessment"
                value={savedAnalysisName}
                onChange={(e) => setSavedAnalysisName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="analysis-description">Description</Label>
              <Textarea
                id="analysis-description"
                placeholder="Add notes..."
                value={savedAnalysisDescription}
                onChange={(e) => setSavedAnalysisDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAnalysis} disabled={saveAnalysisMutation.isPending || !savedAnalysisName.trim()}>
              {saveAnalysisMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
