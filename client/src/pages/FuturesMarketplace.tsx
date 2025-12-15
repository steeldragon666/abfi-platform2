import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUSTRALIAN_STATES } from "@/const";
import { trpc } from "@/lib/trpc";
import { PageLayout, PageContainer } from "@/components/layout";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  TreeDeciduous,
  Sprout,
  Leaf,
  ChevronRight,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const CROP_TYPE_OPTIONS = [
  { value: "bamboo", label: "Bamboo", icon: Sprout },
  { value: "rotation_forestry", label: "Rotation Forestry", icon: TreeDeciduous },
  { value: "eucalyptus", label: "Eucalyptus", icon: TreeDeciduous },
  { value: "poplar", label: "Poplar", icon: TreeDeciduous },
  { value: "willow", label: "Willow", icon: TreeDeciduous },
  { value: "miscanthus", label: "Miscanthus", icon: Leaf },
  { value: "switchgrass", label: "Switchgrass", icon: Leaf },
  { value: "arundo_donax", label: "Arundo Donax", icon: Leaf },
  { value: "hemp", label: "Industrial Hemp", icon: Leaf },
  { value: "other_perennial", label: "Other Perennial", icon: Sprout },
];

const CROP_TYPE_LABELS: Record<string, string> = {
  bamboo: "Bamboo",
  rotation_forestry: "Rotation Forestry",
  eucalyptus: "Eucalyptus",
  poplar: "Poplar",
  willow: "Willow",
  miscanthus: "Miscanthus",
  switchgrass: "Switchgrass",
  arundo_donax: "Arundo Donax",
  hemp: "Industrial Hemp",
  other_perennial: "Other Perennial",
};

const CROP_TYPE_ICONS: Record<string, React.ReactNode> = {
  bamboo: <Sprout className="h-5 w-5 text-emerald-600" />,
  rotation_forestry: <TreeDeciduous className="h-5 w-5 text-green-600" />,
  eucalyptus: <TreeDeciduous className="h-5 w-5 text-teal-600" />,
  poplar: <TreeDeciduous className="h-5 w-5 text-lime-600" />,
  willow: <TreeDeciduous className="h-5 w-5 text-green-700" />,
  miscanthus: <Leaf className="h-5 w-5 text-yellow-600" />,
  switchgrass: <Leaf className="h-5 w-5 text-amber-600" />,
  arundo_donax: <Leaf className="h-5 w-5 text-orange-600" />,
  hemp: <Leaf className="h-5 w-5 text-green-500" />,
  other_perennial: <Sprout className="h-5 w-5 text-emerald-500" />,
};

// Mock data for demonstration when no listings exist
const MOCK_FUTURES = [
  {
    id: 1,
    futuresId: "FUT-2025-0001",
    cropType: "eucalyptus",
    title: "Blue Mallee Eucalyptus - Certified Sustainable Plantation",
    state: "VIC",
    region: "Mallee Region",
    projectionStartYear: 2026,
    projectionEndYear: 2040,
    totalProjectedTonnes: "145000",
    totalAvailableTonnes: "125000",
    totalContractedTonnes: "20000",
    indicativePricePerTonne: "85",
    landAreaHectares: "2500",
    supplierName: "Mallee Sustainable Energy",
    growerQuality: "GQ1",
  },
  {
    id: 2,
    futuresId: "FUT-2025-0002",
    cropType: "miscanthus",
    title: "Giant Miscanthus Energy Crop - High Yield Variety",
    state: "NSW",
    region: "Riverina",
    projectionStartYear: 2026,
    projectionEndYear: 2035,
    totalProjectedTonnes: "75000",
    totalAvailableTonnes: "75000",
    totalContractedTonnes: "0",
    indicativePricePerTonne: "95",
    landAreaHectares: "1200",
    supplierName: "Riverina Biomass Co",
    growerQuality: "GQ2",
  },
  {
    id: 3,
    futuresId: "FUT-2025-0003",
    cropType: "bamboo",
    title: "Dendrocalamus Bamboo - Fast-Growing Biomass",
    state: "QLD",
    region: "Sunshine Coast Hinterland",
    projectionStartYear: 2025,
    projectionEndYear: 2045,
    totalProjectedTonnes: "200000",
    totalAvailableTonnes: "180000",
    totalContractedTonnes: "20000",
    indicativePricePerTonne: "75",
    landAreaHectares: "3500",
    supplierName: "Tropical Bamboo Farms",
    growerQuality: "GQ1",
  },
  {
    id: 4,
    futuresId: "FUT-2025-0004",
    cropType: "rotation_forestry",
    title: "Short Rotation Forestry - Mixed Hardwood",
    state: "TAS",
    region: "North East",
    projectionStartYear: 2026,
    projectionEndYear: 2041,
    totalProjectedTonnes: "320000",
    totalAvailableTonnes: "280000",
    totalContractedTonnes: "40000",
    indicativePricePerTonne: "65",
    landAreaHectares: "5000",
    supplierName: "Tasmanian Forestry Alliance",
    growerQuality: "GQ1",
  },
  {
    id: 5,
    futuresId: "FUT-2025-0005",
    cropType: "hemp",
    title: "Industrial Hemp - Multi-Purpose Biomass",
    state: "SA",
    region: "Adelaide Plains",
    projectionStartYear: 2025,
    projectionEndYear: 2030,
    totalProjectedTonnes: "45000",
    totalAvailableTonnes: "45000",
    totalContractedTonnes: "0",
    indicativePricePerTonne: "120",
    landAreaHectares: "800",
    supplierName: "SA Hemp Industries",
    growerQuality: "GQ3",
  },
  {
    id: 6,
    futuresId: "FUT-2025-0006",
    cropType: "switchgrass",
    title: "Switchgrass - Low Input Energy Crop",
    state: "WA",
    region: "South West",
    projectionStartYear: 2026,
    projectionEndYear: 2036,
    totalProjectedTonnes: "90000",
    totalAvailableTonnes: "90000",
    totalContractedTonnes: "0",
    indicativePricePerTonne: "88",
    landAreaHectares: "1800",
    supplierName: "WA Energy Crops",
    growerQuality: "GQ2",
  },
];

const GQ_COLORS: Record<string, string> = {
  GQ1: "bg-emerald-100 text-emerald-700 border-emerald-200",
  GQ2: "bg-green-100 text-green-700 border-green-200",
  GQ3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  GQ4: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function FuturesMarketplace() {
  const [stateFilter, setStateFilter] = useState<string>("");
  const [cropTypeFilter, setCropTypeFilter] = useState<string>("");
  const [minVolumeFilter, setMinVolumeFilter] = useState<string>("");

  const { data: apiData, isLoading, refetch } = trpc.futures.search.useQuery({
    state: stateFilter ? [stateFilter as any] : undefined,
    cropType: cropTypeFilter ? [cropTypeFilter as any] : undefined,
    minVolume: minVolumeFilter ? parseInt(minVolumeFilter) : undefined,
    limit: 50,
  });

  // Use mock data if no real data
  const futures = apiData && apiData.length > 0 ? apiData : MOCK_FUTURES;
  const isUsingMockData = !apiData || apiData.length === 0;

  const clearFilters = () => {
    setStateFilter("");
    setCropTypeFilter("");
    setMinVolumeFilter("");
  };

  const hasFilters = stateFilter || cropTypeFilter || minVolumeFilter;

  // Calculate summary stats
  const totalVolume = futures.reduce((sum, f: any) => sum + parseFloat(f.totalAvailableTonnes || "0"), 0);
  const totalListings = futures.length;
  const avgPrice = futures.reduce((sum, f: any) => sum + (parseFloat(f.indicativePricePerTonne || "0")), 0) / futures.length;
  const totalHectares = futures.reduce((sum, f: any) => sum + parseFloat(f.landAreaHectares || "0"), 0);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[80px]" />
        </div>

        <PageContainer className="relative z-10" padding="none">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline" className="border-emerald-400/50 text-emerald-300 bg-emerald-500/10">
                <Zap className="h-3 w-3 mr-1" />
                Live Marketplace
              </Badge>
              {isUsingMockData && (
                <Badge variant="outline" className="border-amber-400/50 text-amber-300 bg-amber-500/10">
                  Demo Data
                </Badge>
              )}
            </div>

            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Futures Marketplace
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Secure long-term supply of sustainable perennial biomass. Browse verified futures
              listings and express interest in multi-year contracts with qualified growers.
            </p>

            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/10 text-white border-white/20 py-2 px-4">
                <TreeDeciduous className="h-4 w-4 mr-2" />
                Perennial Crops
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 py-2 px-4">
                <Calendar className="h-4 w-4 mr-2" />
                Up to 25 Year Contracts
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 py-2 px-4">
                <ShieldCheck className="h-4 w-4 mr-2" />
                GQ1-GQ4 Verified
              </Badge>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold font-mono text-white">{totalListings}</div>
              <div className="text-sm text-slate-400 mt-1">Active Listings</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold font-mono text-emerald-400">{(totalVolume / 1000).toFixed(0)}k</div>
              <div className="text-sm text-slate-400 mt-1">Tonnes Available</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold font-mono text-white">${avgPrice.toFixed(0)}</div>
              <div className="text-sm text-slate-400 mt-1">Avg Price/Tonne</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold font-mono text-white">{(totalHectares / 1000).toFixed(1)}k</div>
              <div className="text-sm text-slate-400 mt-1">Hectares</div>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        {/* Filters */}
        <Card className="mb-8 -mt-6 relative z-20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                Filter Listings
              </CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">State</Label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                    {AUSTRALIAN_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Crop Type</Label>
                <Select value={cropTypeFilter} onValueChange={setCropTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All crop types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Crop Types</SelectItem>
                    {CROP_TYPE_OPTIONS.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        <div className="flex items-center gap-2">
                          <crop.icon className="h-4 w-4" />
                          {crop.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Minimum Volume (tonnes)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1000"
                  value={minVolumeFilter}
                  onChange={(e) => setMinVolumeFilter(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">&nbsp;</Label>
                <Button onClick={() => refetch()} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            <strong className="text-foreground">{futures.length}</strong> futures listing{futures.length !== 1 ? "s" : ""} found
            {isUsingMockData && <span className="ml-2 text-amber-600">(Demo data)</span>}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/feedstock-map">
                <MapPin className="h-4 w-4 mr-1" />
                View on Map
              </Link>
            </Button>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {futures.map((f: any) => {
              const totalProjected = parseFloat(f.totalProjectedTonnes || "0");
              const totalAvailable = parseFloat(f.totalAvailableTonnes || "0");
              const totalContracted = parseFloat(f.totalContractedTonnes || "0");
              const projectionYears = f.projectionEndYear - f.projectionStartYear + 1;
              const contractedPercent = totalProjected > 0 ? (totalContracted / totalProjected) * 100 : 0;

              return (
                <Card key={f.id} className="hover:shadow-lg transition-all group border-2 border-transparent hover:border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                          {CROP_TYPE_ICONS[f.cropType] || <Sprout className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <CardTitle className="text-base font-mono">{f.futuresId}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{CROP_TYPE_LABELS[f.cropType]}</Badge>
                            {f.growerQuality && (
                              <Badge className={cn("text-xs border", GQ_COLORS[f.growerQuality])}>{f.growerQuality}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-3 line-clamp-2 text-sm">{f.title}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{f.state}{f.region && `, ${f.region}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{f.projectionStartYear}-{f.projectionEndYear}</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="font-semibold text-emerald-600 font-mono">{totalAvailable.toLocaleString()}t</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Contracted</span>
                          <span>{contractedPercent.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${contractedPercent}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-border/50">
                        <span className="text-muted-foreground">Contract Period</span>
                        <span className="font-medium">{projectionYears} years</span>
                      </div>
                    </div>

                    {f.supplierName && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{f.supplierName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">
                          {f.indicativePricePerTonne ? `$${parseFloat(f.indicativePricePerTonne).toFixed(0)}` : "TBD"}
                        </span>
                        <span className="text-sm text-muted-foreground">/t</span>
                      </div>
                      <Link href={`/futures/${f.id}`}>
                        <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <section className="mt-16 mb-8">
          <Card className="bg-gradient-to-r from-primary/5 to-emerald-500/5 border-primary/20">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Are you a biomass producer?</h3>
                  <p className="text-muted-foreground">
                    List your perennial crop futures and connect with verified buyers seeking long-term supply.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/for-growers">Learn More</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/supplier/futures/create">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      List Your Futures
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </PageLayout>
  );
}
