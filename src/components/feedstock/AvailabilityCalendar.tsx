"use client";

import { useState, useMemo } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  isSameMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MonthlyAvailability {
  month: number; // 1-12
  year: number;
  volume: number; // tonnes
  status: "available" | "limited" | "committed" | "unavailable";
  notes?: string;
  priceIndicator?: number; // Optional price in $/tonne
}

interface AvailabilityCalendarProps {
  availability: MonthlyAvailability[];
  onChange?: (availability: MonthlyAvailability[]) => void;
  defaultVolume?: number;
  maxVolume?: number;
  readOnly?: boolean;
  className?: string;
  feedstockName?: string;
}

const STATUS_CONFIG = {
  available: {
    label: "Available",
    color: "bg-green-500",
    lightColor: "bg-green-100",
    textColor: "text-green-700",
    description: "Full volume available for sale",
  },
  limited: {
    label: "Limited",
    color: "bg-yellow-500",
    lightColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    description: "Reduced availability due to commitments",
  },
  committed: {
    label: "Committed",
    color: "bg-blue-500",
    lightColor: "bg-blue-100",
    textColor: "text-blue-700",
    description: "Volume committed under existing contracts",
  },
  unavailable: {
    label: "Unavailable",
    color: "bg-gray-400",
    lightColor: "bg-gray-100",
    textColor: "text-gray-700",
    description: "No feedstock available (off-season)",
  },
};

export function AvailabilityCalendar({
  availability,
  onChange,
  defaultVolume = 0,
  maxVolume = 10000,
  readOnly = false,
  className,
  feedstockName,
}: AvailabilityCalendarProps) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<MonthlyAvailability>>({});
  const [saving, setSaving] = useState(false);

  // Get months for current year view
  const months = useMemo(() => {
    const start = new Date(viewYear, 0, 1);
    const end = new Date(viewYear, 11, 31);
    return eachMonthOfInterval({ start, end });
  }, [viewYear]);

  // Get availability for a specific month
  const getMonthAvailability = (month: number, year: number): MonthlyAvailability | undefined => {
    return availability.find((a) => a.month === month && a.year === year);
  };

  // Calculate totals
  const yearTotals = useMemo(() => {
    const yearData = availability.filter((a) => a.year === viewYear);
    const totalVolume = yearData.reduce((sum, a) => sum + a.volume, 0);
    const availableVolume = yearData
      .filter((a) => a.status === "available" || a.status === "limited")
      .reduce((sum, a) => sum + a.volume, 0);
    const committedVolume = yearData
      .filter((a) => a.status === "committed")
      .reduce((sum, a) => sum + a.volume, 0);

    return { totalVolume, availableVolume, committedVolume };
  }, [availability, viewYear]);

  // Handle editing a month
  const startEditing = (month: number) => {
    const existing = getMonthAvailability(month, viewYear);
    setEditData({
      volume: existing?.volume ?? defaultVolume,
      status: existing?.status ?? "available",
      notes: existing?.notes ?? "",
      priceIndicator: existing?.priceIndicator,
    });
    setEditingMonth(month);
  };

  // Save changes
  const saveChanges = async () => {
    if (editingMonth === null || !onChange) return;

    setSaving(true);
    try {
      const existingIndex = availability.findIndex(
        (a) => a.month === editingMonth && a.year === viewYear
      );

      const newEntry: MonthlyAvailability = {
        month: editingMonth,
        year: viewYear,
        volume: editData.volume || 0,
        status: editData.status || "available",
        notes: editData.notes,
        priceIndicator: editData.priceIndicator,
      };

      const newAvailability = [...availability];
      if (existingIndex >= 0) {
        newAvailability[existingIndex] = newEntry;
      } else {
        newAvailability.push(newEntry);
      }

      onChange(newAvailability);
      setEditingMonth(null);
    } finally {
      setSaving(false);
    }
  };

  // Get volume fill percentage
  const getVolumeFill = (volume: number): number => {
    return Math.min(100, (volume / maxVolume) * 100);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability Calendar
              {feedstockName && (
                <Badge variant="outline">{feedstockName}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage monthly feedstock availability and pricing
            </CardDescription>
          </div>

          {/* Year Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[80px] text-center">
              {viewYear}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewYear((y) => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Year Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">
              {yearTotals.totalVolume.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Volume (t)
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {yearTotals.availableVolume.toLocaleString()}
            </div>
            <div className="text-xs text-green-600">Available (t)</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {yearTotals.committedVolume.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600">Committed (t)</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Month Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {months.map((date, index) => {
            const monthNum = index + 1;
            const monthData = getMonthAvailability(monthNum, viewYear);
            const status = monthData?.status || "unavailable";
            const config = STATUS_CONFIG[status];
            const isEditing = editingMonth === monthNum;
            const isPast = date < startOfMonth(new Date());

            return (
              <TooltipProvider key={monthNum}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "relative rounded-lg border p-2 transition-all cursor-pointer",
                        config.lightColor,
                        isEditing && "ring-2 ring-primary",
                        !readOnly && "hover:shadow-md",
                        isPast && "opacity-60"
                      )}
                      onClick={() => !readOnly && startEditing(monthNum)}
                    >
                      {/* Month Label */}
                      <div className="text-xs font-medium text-center mb-1">
                        {format(date, "MMM")}
                      </div>

                      {/* Volume Bar */}
                      <div className="h-12 bg-white/50 rounded relative overflow-hidden">
                        <div
                          className={cn(
                            "absolute bottom-0 left-0 right-0 transition-all",
                            config.color
                          )}
                          style={{
                            height: `${getVolumeFill(monthData?.volume || 0)}%`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {monthData?.volume
                              ? `${(monthData.volume / 1000).toFixed(1)}k`
                              : "-"}
                          </span>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex justify-center mt-1">
                        <div className={cn("w-2 h-2 rounded-full", config.color)} />
                      </div>

                      {/* Edit Icon (hover) */}
                      {!readOnly && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {format(date, "MMMM yyyy")}
                      </div>
                      <div className="text-sm">
                        Volume: {monthData?.volume?.toLocaleString() || 0} tonnes
                      </div>
                      <div className="text-sm">
                        Status: {config.label}
                      </div>
                      {monthData?.priceIndicator && (
                        <div className="text-sm">
                          Price: ${monthData.priceIndicator}/t
                        </div>
                      )}
                      {monthData?.notes && (
                        <div className="text-sm text-muted-foreground">
                          {monthData.notes}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", config.color)} />
              <span className="text-xs text-muted-foreground">
                {config.label}
              </span>
            </div>
          ))}
        </div>

        {/* Edit Panel */}
        {editingMonth !== null && !readOnly && (
          <Card className="mt-4 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Edit {format(new Date(viewYear, editingMonth - 1), "MMMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Available Volume (tonnes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[editData.volume || 0]}
                    onValueChange={([v]) =>
                      setEditData((d) => ({ ...d, volume: v }))
                    }
                    max={maxVolume}
                    step={100}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={editData.volume || 0}
                    onChange={(e) =>
                      setEditData((d) => ({
                        ...d,
                        volume: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-24"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(v) =>
                    setEditData((d) => ({
                      ...d,
                      status: v as MonthlyAvailability["status"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn("w-2 h-2 rounded-full", config.color)}
                          />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Indicator ($/tonne)</Label>
                <Input
                  type="number"
                  value={editData.priceIndicator || ""}
                  onChange={(e) =>
                    setEditData((d) => ({
                      ...d,
                      priceIndicator: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={editData.notes || ""}
                  onChange={(e) =>
                    setEditData((d) => ({ ...d, notes: e.target.value }))
                  }
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMonth(null)}
                >
                  Cancel
                </Button>
                <Button onClick={saveChanges} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

// Compact availability view for feedstock cards
interface AvailabilityBadgesProps {
  availability: MonthlyAvailability[];
  year?: number;
  className?: string;
}

export function AvailabilityBadges({
  availability,
  year = new Date().getFullYear(),
  className,
}: AvailabilityBadgesProps) {
  const yearData = availability.filter((a) => a.year === year);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className={cn("flex gap-0.5", className)}>
      {months.map((month) => {
        const data = yearData.find((a) => a.month === month);
        const status = data?.status || "unavailable";
        const config = STATUS_CONFIG[status];

        return (
          <TooltipProvider key={month}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  className={cn(
                    "w-2 h-4 rounded-sm",
                    data ? config.color : "bg-gray-200"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs">
                  {format(new Date(year, month - 1), "MMM")}: {config.label}
                  {data?.volume ? ` (${data.volume.toLocaleString()}t)` : ""}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// Seasonality chart for displaying typical availability patterns
interface SeasonalityChartProps {
  data: { month: number; avgVolume: number; minVolume: number; maxVolume: number }[];
  className?: string;
}

export function SeasonalityChart({ data, className }: SeasonalityChartProps) {
  const maxValue = Math.max(...data.map((d) => d.maxVolume));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Seasonal Availability Pattern</CardTitle>
        <CardDescription>Typical monthly production volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-24">
          {data.map((d) => {
            const avgHeight = (d.avgVolume / maxValue) * 100;
            const minHeight = (d.minVolume / maxValue) * 100;
            const maxHeight = (d.maxVolume / maxValue) * 100;

            return (
              <TooltipProvider key={d.month}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full relative"
                        style={{ height: `${maxHeight}%` }}
                      >
                        {/* Range bar */}
                        <div
                          className="absolute left-0 right-0 bg-muted rounded-t"
                          style={{
                            bottom: 0,
                            height: `${((maxHeight - minHeight) / maxHeight) * 100}%`,
                          }}
                        />
                        {/* Average bar */}
                        <div
                          className="absolute left-0 right-0 bg-primary rounded-t"
                          style={{
                            bottom: 0,
                            height: `${(avgHeight / maxHeight) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(2024, d.month - 1), "MMM")[0]}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <div className="font-medium">
                        {format(new Date(2024, d.month - 1), "MMMM")}
                      </div>
                      <div>Avg: {d.avgVolume.toLocaleString()}t</div>
                      <div className="text-muted-foreground">
                        Range: {d.minVolume.toLocaleString()} -{" "}
                        {d.maxVolume.toLocaleString()}t
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
