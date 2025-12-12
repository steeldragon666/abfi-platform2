"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  MapPin,
  List,
  Star,
  StarOff,
  MessageSquare,
  Building2,
  Gauge,
  Package,
  ChevronRight,
} from "lucide-react";
import { AbfiScoreBadge } from "@/components/rating/AbfiScoreCard";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Dynamically import map to avoid SSR issues
const FeedstockMap = dynamic(
  () => import("@/components/maps/FeedstockMap").then((mod) => mod.FeedstockMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-muted rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ),
  }
);

interface Feedstock {
  id: string;
  feedstock_id: string;
  name: string;
  description: string | null;
  category: string;
  type: string;
  state: string;
  region: string | null;
  latitude: number;
  longitude: number;
  abfi_score: number;
  sustainability_score: number;
  carbon_intensity_score: number;
  quality_score: number;
  reliability_score: number;
  carbon_intensity_value: number | null;
  available_volume_current: number;
  annual_capacity_tonnes: number;
  supplier: {
    id: string;
    company_name: string;
    verification_status: string;
  } | null;
  certificates: { id: string; type: string; status: string }[];
}

interface BuyerSearchClientProps {
  feedstocks: Feedstock[];
  shortlistedIds: Set<string>;
  buyerId?: string;
  initialFilters: {
    category?: string;
    state?: string;
    min_score?: string;
    max_ci?: string;
  };
}

const CATEGORIES = [
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
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
];

export function BuyerSearchClient({
  feedstocks,
  shortlistedIds: initialShortlistedIds,
  buyerId,
  initialFilters,
}: BuyerSearchClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [shortlistedIds, setShortlistedIds] = useState(initialShortlistedIds);
  const [, setSelectedFeedstock] = useState<Feedstock | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    category: initialFilters.category || "",
    state: initialFilters.state || "",
    minScore: initialFilters.min_score || "",
    maxCi: initialFilters.max_ci || "",
  });

  // Filter feedstocks
  const filteredFeedstocks = useMemo(() => {
    return feedstocks.filter((f) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          f.name.toLowerCase().includes(query) ||
          f.feedstock_id.toLowerCase().includes(query) ||
          f.type.toLowerCase().includes(query) ||
          f.supplier?.company_name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && f.category !== filters.category) return false;

      // State filter
      if (filters.state && f.state !== filters.state) return false;

      // Min score filter
      if (filters.minScore && f.abfi_score < parseInt(filters.minScore))
        return false;

      // Max CI filter
      if (
        filters.maxCi &&
        f.carbon_intensity_value &&
        f.carbon_intensity_value > parseFloat(filters.maxCi)
      )
        return false;

      return true;
    });
  }, [feedstocks, searchQuery, filters]);

  // Map data
  const mapFeedstocks = useMemo(() => {
    return filteredFeedstocks.map((f) => ({
      id: f.id,
      name: f.name,
      feedstock_id: f.feedstock_id,
      category: f.category,
      latitude: f.latitude,
      longitude: f.longitude,
      abfi_score: f.abfi_score,
      available_volume: f.available_volume_current,
      state: f.state,
    }));
  }, [filteredFeedstocks]);

  // Toggle shortlist
  const toggleShortlist = async (feedstockId: string) => {
    if (!buyerId) {
      toast.error("Please complete your buyer profile first");
      return;
    }

    const isShortlisted = shortlistedIds.has(feedstockId);

    if (isShortlisted) {
      const { error } = await supabase
        .from("shortlists")
        .delete()
        .eq("buyer_id", buyerId)
        .eq("feedstock_id", feedstockId);

      if (error) {
        toast.error("Failed to remove from shortlist");
        return;
      }

      setShortlistedIds((prev) => {
        const next = new Set(prev);
        next.delete(feedstockId);
        return next;
      });
      toast.success("Removed from shortlist");
    } else {
      const { error } = await supabase.from("shortlists").insert({
        buyer_id: buyerId,
        feedstock_id: feedstockId,
      });

      if (error) {
        toast.error("Failed to add to shortlist");
        return;
      }

      setShortlistedIds((prev) => new Set([...prev, feedstockId]));
      toast.success("Added to shortlist");
    }
  };

  // Apply filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.state) params.set("state", filters.state);
    if (filters.minScore) params.set("min_score", filters.minScore);
    if (filters.maxCi) params.set("max_ci", filters.maxCi);

    router.push(`/buyer/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({ category: "", state: "", minScore: "", maxCi: "" });
    router.push("/buyer/search");
  };

  const getCategoryLabel = (value: string) =>
    CATEGORIES.find((c) => c.value === value)?.label || value;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Feedstocks</h1>
          <p className="text-muted-foreground">
            {filteredFeedstocks.length} feedstock(s) found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feedstocks, suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(filters.category ||
                filters.state ||
                filters.minScore ||
                filters.maxCi) && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Feedstocks</SheetTitle>
              <SheetDescription>
                Narrow down your search results
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(v) =>
                    setFilters((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={filters.state}
                  onValueChange={(v) =>
                    setFilters((prev) => ({ ...prev, state: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All states</SelectItem>
                    {STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minimum ABFI Score</Label>
                <Input
                  type="number"
                  placeholder="0-100"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, minScore: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Max Carbon Intensity (gCO2e/MJ)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  min="0"
                  value={filters.maxCi}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, maxCi: e.target.value }))
                  }
                />
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {(filters.category ||
        filters.state ||
        filters.minScore ||
        filters.maxCi) && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary">
              Category: {getCategoryLabel(filters.category)}
            </Badge>
          )}
          {filters.state && (
            <Badge variant="secondary">State: {filters.state}</Badge>
          )}
          {filters.minScore && (
            <Badge variant="secondary">Min Score: {filters.minScore}</Badge>
          )}
          {filters.maxCi && (
            <Badge variant="secondary">Max CI: {filters.maxCi} gCO2e/MJ</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Results */}
      {viewMode === "list" ? (
        <div className="grid gap-4">
          {filteredFeedstocks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No feedstocks found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFeedstocks.map((feedstock) => (
              <Card
                key={feedstock.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Score */}
                    <div className="flex md:flex-col items-center gap-2 md:gap-1">
                      <AbfiScoreBadge score={feedstock.abfi_score} size="lg" />
                      <span className="text-xs text-muted-foreground">
                        ABFI Score
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {feedstock.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {feedstock.feedstock_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleShortlist(feedstock.id)}
                          >
                            {shortlistedIds.has(feedstock.id) ? (
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {getCategoryLabel(feedstock.category)}
                        </Badge>
                        <Badge variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {feedstock.state}
                          {feedstock.region && `, ${feedstock.region}`}
                        </Badge>
                        {feedstock.carbon_intensity_value && (
                          <Badge variant="outline">
                            <Gauge className="h-3 w-3 mr-1" />
                            {feedstock.carbon_intensity_value} gCO2e/MJ
                          </Badge>
                        )}
                        {feedstock.certificates?.some(
                          (c) => c.status === "active"
                        ) && <Badge variant="secondary">Certified</Badge>}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Supplier</div>
                          <div className="font-medium flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {feedstock.supplier?.company_name || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Available</div>
                          <div className="font-medium">
                            {feedstock.available_volume_current.toLocaleString()}{" "}
                            tonnes
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Capacity</div>
                          <div className="font-medium">
                            {feedstock.annual_capacity_tonnes.toLocaleString()}{" "}
                            t/yr
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Type</div>
                          <div className="font-medium">{feedstock.type}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/buyer/feedstock/${feedstock.id}`}>
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                      <Button size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Inquire
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="h-[600px]">
            <FeedstockMap
              feedstocks={mapFeedstocks}
              onMarkerClick={(f) => {
                const full = filteredFeedstocks.find((ff) => ff.id === f.id);
                if (full) setSelectedFeedstock(full);
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
