"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Star,
  Trash2,
  Search,
  MessageSquare,
  StickyNote,
  MoreVertical,
  ExternalLink,
  MapPin,
  Gauge,
  Building2,
  ArrowUpDown,
  Filter,
  Grid,
  List,
  ChevronRight,
  Package,
  Download,
  Scale,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AbfiScoreBadge } from "@/components/rating/AbfiScoreCard";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ShortlistItem {
  id: string;
  notes: string | null;
  created_at: string;
  feedstock: {
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
    price_indicative: number | null;
    price_currency: string | null;
    supplier: {
      id: string;
      company_name: string;
      verification_status: string;
    } | null;
    certificates: {
      id: string;
      type: string;
      status: string;
      expiry_date: string | null;
    }[];
  } | null;
}

interface ShortlistClientProps {
  shortlist: ShortlistItem[];
  buyerId: string;
}

type SortField = "added" | "score" | "volume" | "name" | "category";
type ViewMode = "grid" | "table";

const CATEGORIES: Record<string, string> = {
  oilseed: "Oilseed",
  UCO: "Used Cooking Oil",
  tallow: "Tallow",
  lignocellulosic: "Lignocellulosic",
  waste: "Waste",
  algae: "Algae",
  bamboo: "Bamboo",
  other: "Other",
};

export function ShortlistClient({
  shortlist: initialShortlist,
  buyerId,
}: ShortlistClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [shortlist, setShortlist] = useState(initialShortlist);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("added");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentNoteItem, setCurrentNoteItem] = useState<ShortlistItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [bulkRemoveDialogOpen, setBulkRemoveDialogOpen] = useState(false);
  const [removingBulk, setRemovingBulk] = useState(false);

  // Filter and sort shortlist
  const filteredShortlist = useMemo(() => {
    let items = shortlist.filter((item) => item.feedstock);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const f = item.feedstock!;
        return (
          f.name.toLowerCase().includes(query) ||
          f.feedstock_id.toLowerCase().includes(query) ||
          f.type.toLowerCase().includes(query) ||
          f.supplier?.company_name.toLowerCase().includes(query)
        );
      });
    }

    // Category filter
    if (categoryFilter) {
      items = items.filter((item) => item.feedstock?.category === categoryFilter);
    }

    // Sort
    items.sort((a, b) => {
      const fA = a.feedstock!;
      const fB = b.feedstock!;
      let comparison = 0;

      switch (sortField) {
        case "added":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "score":
          comparison = fA.abfi_score - fB.abfi_score;
          break;
        case "volume":
          comparison = fA.available_volume_current - fB.available_volume_current;
          break;
        case "name":
          comparison = fA.name.localeCompare(fB.name);
          break;
        case "category":
          comparison = fA.category.localeCompare(fB.category);
          break;
      }

      return sortAsc ? comparison : -comparison;
    });

    return items;
  }, [shortlist, searchQuery, categoryFilter, sortField, sortAsc]);

  // Toggle sort direction
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Toggle item selection
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredShortlist.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredShortlist.map((item) => item.id)));
    }
  };

  // Remove from shortlist
  const removeFromShortlist = async (id: string) => {
    const { error } = await supabase.from("shortlists").delete().eq("id", id);

    if (error) {
      toast.error("Failed to remove from shortlist");
      return;
    }

    setShortlist((prev) => prev.filter((item) => item.id !== id));
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success("Removed from shortlist");
    setRemoveDialogOpen(false);
    setItemToRemove(null);
  };

  // Bulk remove
  const bulkRemove = async () => {
    setRemovingBulk(true);
    const idsToRemove = Array.from(selectedItems);

    const { error } = await supabase
      .from("shortlists")
      .delete()
      .in("id", idsToRemove);

    if (error) {
      toast.error("Failed to remove items");
      setRemovingBulk(false);
      return;
    }

    setShortlist((prev) => prev.filter((item) => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
    toast.success(`Removed ${idsToRemove.length} item(s) from shortlist`);
    setBulkRemoveDialogOpen(false);
    setRemovingBulk(false);
  };

  // Save note
  const saveNote = async () => {
    if (!currentNoteItem) return;

    setSavingNote(true);
    const { error } = await supabase
      .from("shortlists")
      .update({ notes: noteText || null })
      .eq("id", currentNoteItem.id);

    if (error) {
      toast.error("Failed to save note");
      setSavingNote(false);
      return;
    }

    setShortlist((prev) =>
      prev.map((item) =>
        item.id === currentNoteItem.id ? { ...item, notes: noteText || null } : item
      )
    );
    toast.success("Note saved");
    setNoteDialogOpen(false);
    setCurrentNoteItem(null);
    setNoteText("");
    setSavingNote(false);
  };

  // Open note dialog
  const openNoteDialog = (item: ShortlistItem) => {
    setCurrentNoteItem(item);
    setNoteText(item.notes || "");
    setNoteDialogOpen(true);
  };

  // Export shortlist to CSV
  const exportToCsv = () => {
    const headers = [
      "Feedstock ID",
      "Name",
      "Category",
      "Type",
      "State",
      "ABFI Score",
      "Available Volume",
      "Annual Capacity",
      "CI Value",
      "Supplier",
      "Notes",
      "Added Date",
    ];

    const rows = filteredShortlist.map((item) => {
      const f = item.feedstock!;
      return [
        f.feedstock_id,
        f.name,
        CATEGORIES[f.category] || f.category,
        f.type,
        f.state,
        f.abfi_score,
        f.available_volume_current,
        f.annual_capacity_tonnes,
        f.carbon_intensity_value || "",
        f.supplier?.company_name || "",
        item.notes || "",
        new Date(item.created_at).toLocaleDateString(),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shortlist-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Shortlist exported");
  };

  // Get unique categories from shortlist
  const categories = useMemo(() => {
    const cats = new Set(shortlist.map((item) => item.feedstock?.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [shortlist]);

  if (shortlist.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            My Shortlist
          </h1>
          <p className="text-muted-foreground mt-2">
            Save feedstocks you're interested in for easy access later
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Star className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-6 text-xl font-semibold">Your shortlist is empty</h3>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              Start browsing feedstocks and click the star icon to add them to your
              shortlist for later review and comparison.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/buyer/search">
                <Search className="h-4 w-4 mr-2" />
                Browse Feedstocks
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            My Shortlist
          </h1>
          <p className="text-muted-foreground mt-1">
            {shortlist.length} feedstock(s) saved
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          {selectedItems.size > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/buyer/compare?ids=${Array.from(selectedItems)
                  .map((id) =>
                    shortlist.find((s) => s.id === id)?.feedstock?.id
                  )
                  .filter(Boolean)
                  .join(",")}`}
              >
                <Scale className="h-4 w-4 mr-1" />
                Compare ({selectedItems.size})
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shortlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORIES[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${sortField}-${sortAsc ? "asc" : "desc"}`}
              onValueChange={(v) => {
                const [field, dir] = v.split("-") as [SortField, string];
                setSortField(field);
                setSortAsc(dir === "asc");
              }}
            >
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="added-desc">Newest First</SelectItem>
                <SelectItem value="added-asc">Oldest First</SelectItem>
                <SelectItem value="score-desc">Highest Score</SelectItem>
                <SelectItem value="score-asc">Lowest Score</SelectItem>
                <SelectItem value="volume-desc">Most Available</SelectItem>
                <SelectItem value="volume-asc">Least Available</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedItems.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedItems.size === filteredShortlist.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedItems.size} item(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkRemoveDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {filteredShortlist.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No results found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredShortlist.map((item) => {
            const f = item.feedstock!;
            const isSelected = selectedItems.has(item.id);

            return (
              <Card
                key={item.id}
                className={cn(
                  "hover:shadow-md transition-all",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                      <div className="space-y-1">
                        <CardTitle className="text-base line-clamp-1">
                          {f.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {f.feedstock_id}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/buyer/feedstock/${f.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openNoteDialog(item)}>
                          <StickyNote className="h-4 w-4 mr-2" />
                          {item.notes ? "Edit Note" : "Add Note"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/buyer/inquiries/new?feedstock=${f.id}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Inquiry
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setItemToRemove(item.id);
                            setRemoveDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <AbfiScoreBadge score={f.abfi_score} size="sm" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {f.state}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORIES[f.category] || f.category}
                    </Badge>
                    {f.carbon_intensity_value && (
                      <Badge variant="outline" className="text-xs">
                        <Gauge className="h-3 w-3 mr-1" />
                        {f.carbon_intensity_value} gCO2e/MJ
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Available</div>
                      <div className="font-medium">
                        {f.available_volume_current.toLocaleString()} t
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Supplier</div>
                      <div className="font-medium truncate">
                        {f.supplier?.company_name || "N/A"}
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="bg-muted/50 rounded p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <StickyNote className="h-3 w-3" />
                        Note
                      </div>
                      <p className="text-xs line-clamp-2">{item.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Added {formatRelativeTime(item.created_at)}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/buyer/feedstock/${f.id}`}>
                        View
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.size === filteredShortlist.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  Feedstock
                  {sortField === "name" && (
                    <ArrowUpDown className="h-4 w-4 ml-1 inline" />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("category")}>
                  Category
                  {sortField === "category" && (
                    <ArrowUpDown className="h-4 w-4 ml-1 inline" />
                  )}
                </TableHead>
                <TableHead>State</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("score")}>
                  Score
                  {sortField === "score" && (
                    <ArrowUpDown className="h-4 w-4 ml-1 inline" />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("volume")}>
                  Available
                  {sortField === "volume" && (
                    <ArrowUpDown className="h-4 w-4 ml-1 inline" />
                  )}
                </TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("added")}>
                  Added
                  {sortField === "added" && (
                    <ArrowUpDown className="h-4 w-4 ml-1 inline" />
                  )}
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShortlist.map((item) => {
                const f = item.feedstock!;
                const isSelected = selectedItems.has(item.id);

                return (
                  <TableRow
                    key={item.id}
                    className={cn(isSelected && "bg-primary/5")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          href={`/buyer/feedstock/${f.id}`}
                          className="font-medium hover:underline"
                        >
                          {f.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {f.feedstock_id}
                        </div>
                        {item.notes && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <StickyNote className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORIES[f.category] || f.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{f.state}</TableCell>
                    <TableCell>
                      <AbfiScoreBadge score={f.abfi_score} size="sm" />
                    </TableCell>
                    <TableCell>{f.available_volume_current.toLocaleString()} t</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {f.supplier?.company_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeTime(item.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/buyer/feedstock/${f.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openNoteDialog(item)}>
                            <StickyNote className="h-4 w-4 mr-2" />
                            {item.notes ? "Edit Note" : "Add Note"}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/buyer/inquiries/new?feedstock=${f.id}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Inquiry
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setItemToRemove(item.id);
                              setRemoveDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentNoteItem?.notes ? "Edit Note" : "Add Note"}
            </DialogTitle>
            <DialogDescription>
              Add a personal note to help you remember important details about this
              feedstock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentNoteItem?.feedstock && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <AbfiScoreBadge
                  score={currentNoteItem.feedstock.abfi_score}
                  size="sm"
                />
                <div>
                  <div className="font-medium">
                    {currentNoteItem.feedstock.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentNoteItem.feedstock.feedstock_id}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g., Good price point, need to verify certificates, potential for long-term contract..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote} disabled={savingNote}>
              {savingNote && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from shortlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This feedstock will be removed from your shortlist. You can always add
              it back later from the search page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => itemToRemove && removeFromShortlist(itemToRemove)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Remove Confirmation Dialog */}
      <AlertDialog open={bulkRemoveDialogOpen} onOpenChange={setBulkRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove {selectedItems.size} item(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              These feedstocks will be removed from your shortlist. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingBulk}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={bulkRemove}
              disabled={removingBulk}
            >
              {removingBulk && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
