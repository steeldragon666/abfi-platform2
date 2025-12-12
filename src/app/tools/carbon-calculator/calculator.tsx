"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { calculateCarbonIntensityScore, getCarbonRatingColor } from "@/lib/rating/calculator";
import { Gauge, Calculator, RefreshCw, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_VALUES = [
  { label: "UCO (Collected)", value: 14, category: "UCO" },
  { label: "Tallow Cat 1", value: 20, category: "Tallow" },
  { label: "Tallow Cat 3", value: 28, category: "Tallow" },
  { label: "Canola (Dryland)", value: 38, category: "Oilseed" },
  { label: "Canola (Irrigated)", value: 45, category: "Oilseed" },
  { label: "Wheat Straw", value: 8, category: "Lignocellulosic" },
  { label: "Bagasse", value: 6, category: "Lignocellulosic" },
  { label: "Food Waste", value: 12, category: "Waste" },
  { label: "Palm Oil (Certified)", value: 35, category: "Oilseed" },
  { label: "Soybean Oil", value: 42, category: "Oilseed" },
];

export function CarbonCalculator() {
  const [ciValue, setCiValue] = useState<number>(25);

  const result = useMemo(() => {
    return calculateCarbonIntensityScore(ciValue);
  }, [ciValue]);

  const handlePresetSelect = (value: string) => {
    const preset = PRESET_VALUES.find((p) => p.label === value);
    if (preset) {
      setCiValue(preset.value);
    }
  };

  const handleReset = () => {
    setCiValue(25);
  };

  const fossilComparator = 94;
  const savingsPercent = Math.round(((fossilComparator - ciValue) / fossilComparator) * 100);
  const meetsRedII = savingsPercent >= 65;
  const meetsMinimum = savingsPercent >= 50;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Input Values
          </CardTitle>
          <CardDescription>
            Enter carbon intensity or select a preset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Select */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <Select onValueChange={handlePresetSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a feedstock preset" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_VALUES.map((preset) => (
                  <SelectItem key={preset.label} value={preset.label}>
                    {preset.label} ({preset.value} gCO2e/MJ)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="ci-value">Carbon Intensity (gCO2e/MJ)</Label>
            <div className="flex gap-2">
              <Input
                id="ci-value"
                type="number"
                min={0}
                max={150}
                step={0.1}
                value={ciValue}
                onChange={(e) => setCiValue(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <Label>Adjust Value</Label>
            <Slider
              value={[ciValue]}
              onValueChange={(v) => setCiValue(v[0])}
              min={0}
              max={100}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 (Carbon Neutral)</span>
              <span>50</span>
              <span>100 (High)</span>
            </div>
          </div>

          {/* RED II Compliance */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium">RED II Compliance Check</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Fossil Fuel Comparator
                </span>
                <span>{fossilComparator} gCO2e/MJ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GHG Savings</span>
                <span
                  className={cn(
                    "font-medium",
                    savingsPercent >= 65
                      ? "text-green-600"
                      : savingsPercent >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                  )}
                >
                  {savingsPercent}%
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <div
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    meetsRedII
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  65% Threshold {meetsRedII ? "✓" : "✗"}
                </div>
                <div
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    meetsMinimum
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  50% Minimum {meetsMinimum ? "✓" : "✗"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Carbon Intensity Score
          </CardTitle>
          <CardDescription>
            Your feedstock rating based on lifecycle emissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
              <div className="text-center">
                <div
                  className={cn(
                    "mx-auto flex h-32 w-32 items-center justify-center rounded-full text-4xl font-bold",
                    getCarbonRatingColor(result.rating)
                  )}
                >
                  {result.rating}
                </div>
                <p className="mt-4 text-2xl font-semibold">{result.score}/100</p>
                <p className="text-muted-foreground">Carbon Intensity Score</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score Progress</span>
                  <span className="font-medium">{result.score}%</span>
                </div>
                <Progress value={result.score} className="h-3" />
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <h4 className="font-medium">Score Calculation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Input CI Value
                    </span>
                    <span>{ciValue} gCO2e/MJ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating Tier</span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        getCarbonRatingColor(result.rating)
                      )}
                    >
                      {result.rating}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Component Score
                    </span>
                    <span className="font-medium">{result.score}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground">
                      ABFI Weight (30%)
                    </span>
                    <span className="font-medium">
                      {Math.round(result.score * 0.3)} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">What This Means</h4>
                <p className="text-sm text-muted-foreground">
                  {result.rating === "A+" &&
                    "Exceptional performance. This feedstock has near-zero lifecycle emissions and qualifies for the highest sustainability premiums."}
                  {result.rating === "A" &&
                    "Excellent performance. Very low emissions make this feedstock highly attractive for SAF production."}
                  {result.rating === "B+" &&
                    "Very good performance. Low emissions with comfortable margins above RED II thresholds."}
                  {result.rating === "B" &&
                    "Good performance. Moderate emissions that meet most sustainability requirements."}
                  {result.rating === "C+" &&
                    "Average performance. Higher emissions may limit premium pricing opportunities."}
                  {result.rating === "C" &&
                    "Below average. Consider improvements to reduce lifecycle emissions."}
                  {result.rating === "D" &&
                    "Poor performance. Significant emissions reduction needed for competitiveness."}
                  {result.rating === "F" &&
                    "Failing. Very high emissions may not qualify for renewable fuel incentives."}
                </p>
              </div>
        </CardContent>
      </Card>
    </div>
  );
}
