"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Leaf,
  Shield,
  Users,
  TreePine,
  Droplets,
  FlaskConical,
  Truck,
  Clock,
  History,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Sustainability, Quality, Reliability, CarbonIntensity } from "@/icons";
import { getScoreTier } from "@/lib/rating/calculator";
import type { FeedstockCategory } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

interface SustainabilityBreakdown {
  certification: number;
  no_deforestation: number;
  no_hcv_conversion: number;
  no_peatland: number;
  indigenous_rights: number;
  fair_work: number;
  community_benefit: number;
  supply_chain_transparency: number;
  regenerative: number;
  soil_carbon: number;
  biodiversity: number;
}

interface CarbonBreakdown {
  value: number;
  rating: string;
}

interface QualityBreakdown {
  [key: string]: number;
}

interface ReliabilityBreakdown {
  delivery_performance: number;
  volume_consistency: number;
  quality_consistency: number;
  response_time: number;
  platform_history: number;
}

interface ScoreBreakdownData {
  sustainability: SustainabilityBreakdown;
  carbon: CarbonBreakdown;
  quality: QualityBreakdown;
  reliability: ReliabilityBreakdown;
}

interface ScoreBreakdownProps {
  abfiScore: number;
  sustainabilityScore: number;
  carbonIntensityScore: number;
  qualityScore: number;
  reliabilityScore: number;
  breakdown: ScoreBreakdownData;
  feedstockCategory?: FeedstockCategory;
  className?: string;
}

// ============================================================================
// SUB-COMPONENT: Score Item
// ============================================================================

interface ScoreItemProps {
  label: string;
  score: number;
  maxScore: number;
  icon?: React.ReactNode;
  description?: string;
  status?: "passed" | "failed" | "partial" | "na";
}

function ScoreItem({
  label,
  score,
  maxScore,
  icon,
  description,
  status,
}: ScoreItemProps) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const tier = getScoreTier(percentage);

  const statusIcon = {
    passed: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
    failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
    partial: <AlertCircle className="h-3.5 w-3.5 text-warning" />,
    na: null,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50">
            {icon && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {status && statusIcon[status]}
                  <span className="font-mono text-sm font-semibold">
                    {score}/{maxScore}
                  </span>
                </div>
              </div>
              <Progress
                value={percentage}
                className="mt-1.5 h-1.5"
              />
            </div>
          </div>
        </TooltipTrigger>
        {description && (
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-sm">{description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// SUB-COMPONENT: Pillar Section
// ============================================================================

interface PillarSectionProps {
  title: string;
  score: number;
  weight: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function PillarSection({
  title,
  score,
  weight,
  icon,
  colorClass,
  bgClass,
  children,
  defaultOpen = false,
}: PillarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const tier = getScoreTier(score);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full rounded-lg border bg-card p-4 text-left transition-all hover:bg-muted/50 hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg p-2", bgClass)}>
              <div className={cn("h-5 w-5", colorClass)}>{icon}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold">{title}</span>
                <Badge variant="outline" size="sm" className="font-normal">
                  {weight}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Progress value={score} className="h-1.5 flex-1 max-w-32" />
                <span className={cn("font-mono text-sm font-bold", tier.colorClass)}>
                  {score}
                </span>
              </div>
            </div>
            <div className="text-muted-foreground">
              {isOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="rounded-lg border bg-muted/30 p-2 space-y-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// SUB-COMPONENT: Section Header
// ============================================================================

function SectionHeader({
  title,
  maxPoints,
}: {
  title: string;
  maxPoints: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
      <span className="font-medium uppercase tracking-wider">{title}</span>
      <span className="font-mono">max {maxPoints} pts</span>
    </div>
  );
}

// ============================================================================
// QUALITY PARAMETER LABELS
// ============================================================================

const QUALITY_LABELS: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  // Oilseed
  oil_content: { label: "Oil Content", description: "Percentage of oil in the seed (higher is better)", icon: <Droplets className="h-4 w-4" /> },
  free_fatty_acid: { label: "Free Fatty Acid", description: "FFA level (lower is better for processing)", icon: <FlaskConical className="h-4 w-4" /> },
  moisture: { label: "Moisture", description: "Water content percentage (lower is better)", icon: <Droplets className="h-4 w-4" /> },
  impurities: { label: "Impurities", description: "Foreign matter percentage (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  phosphorus: { label: "Phosphorus", description: "Phosphorus content in ppm (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  // UCO
  iodine_value: { label: "Iodine Value", description: "Measure of unsaturation (optimal range: 80-120)", icon: <FlaskConical className="h-4 w-4" /> },
  miu: { label: "MIU", description: "Moisture, Impurities, Unsaponifiables (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  // Tallow
  titre: { label: "Titre", description: "Solidification temperature (optimal: 40-46°C)", icon: <FlaskConical className="h-4 w-4" /> },
  category: { label: "Category", description: "Tallow category (3 is highest quality)", icon: <FlaskConical className="h-4 w-4" /> },
  // Lignocellulosic & Bamboo
  ash_content: { label: "Ash Content", description: "Mineral residue percentage (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  calorific_value: { label: "Calorific Value", description: "Energy content in MJ/kg (higher is better)", icon: <FlaskConical className="h-4 w-4" /> },
  particle_consistency: { label: "Particle Consistency", description: "Size uniformity percentage (higher is better)", icon: <FlaskConical className="h-4 w-4" /> },
  contaminants: { label: "Contaminants", description: "Contamination level (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  fiber_content: { label: "Fiber Content", description: "Cellulose fiber percentage (higher is better)", icon: <FlaskConical className="h-4 w-4" /> },
  lignin_content: { label: "Lignin Content", description: "Lignin percentage (optimal range varies)", icon: <FlaskConical className="h-4 w-4" /> },
  // Waste
  contamination_rate: { label: "Contamination Rate", description: "Non-organic contamination % (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  organic_content: { label: "Organic Content", description: "Organic matter percentage (higher is better)", icon: <Leaf className="h-4 w-4" /> },
  homogeneity: { label: "Homogeneity", description: "Material uniformity score (higher is better)", icon: <FlaskConical className="h-4 w-4" /> },
  heavy_metals: { label: "Heavy Metals", description: "Heavy metal content (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  // Algae
  lipid_content: { label: "Lipid Content", description: "Oil content percentage (higher is better)", icon: <Droplets className="h-4 w-4" /> },
  protein_content: { label: "Protein Content", description: "Protein percentage (higher is better for co-products)", icon: <FlaskConical className="h-4 w-4" /> },
  contamination: { label: "Contamination", description: "Contamination percentage (lower is better)", icon: <FlaskConical className="h-4 w-4" /> },
  // Generic
  general_quality: { label: "General Quality", description: "Overall quality score", icon: <FlaskConical className="h-4 w-4" /> },
};

const QUALITY_MAX_POINTS: Record<string, number> = {
  oil_content: 25,
  free_fatty_acid: 30,
  moisture: 25,
  impurities: 20,
  phosphorus: 15,
  iodine_value: 15,
  miu: 10,
  titre: 20,
  category: 10,
  ash_content: 25,
  calorific_value: 25,
  particle_consistency: 15,
  contaminants: 15,
  fiber_content: 15,
  lignin_content: 10,
  contamination_rate: 30,
  organic_content: 25,
  homogeneity: 15,
  heavy_metals: 10,
  lipid_content: 30,
  protein_content: 15,
  contamination: 10,
  general_quality: 100,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScoreBreakdown({
  abfiScore,
  sustainabilityScore,
  carbonIntensityScore,
  qualityScore,
  reliabilityScore,
  breakdown,
  feedstockCategory,
  className,
}: ScoreBreakdownProps) {
  const tier = getScoreTier(abfiScore);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display">Score Breakdown</CardTitle>
            <CardDescription>
              Detailed view of all scoring components
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">ABFI Score</div>
              <div className={cn("font-mono text-2xl font-bold", tier.colorClass)}>
                {abfiScore}
              </div>
            </div>
            <Badge
              className={cn("text-sm", tier.bgClass, tier.colorClass)}
              variant="outline"
            >
              {tier.tier}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sustainability Pillar */}
        <PillarSection
          title="Sustainability"
          score={sustainabilityScore}
          weight="30%"
          icon={<Sustainability />}
          colorClass="text-success"
          bgClass="bg-success/10"
          defaultOpen={true}
        >
          <SectionHeader title="Certification" maxPoints={40} />
          <ScoreItem
            label="Certification Tier"
            score={breakdown.sustainability.certification}
            maxScore={40}
            icon={<Shield className="h-4 w-4" />}
            description="Points based on certification type: ISCC EU/PLUS (40), RSB (38), ABFI (30), RED II (25), GO (20)"
          />

          <SectionHeader title="Land Use Compliance" maxPoints={25} />
          <ScoreItem
            label="No Deforestation"
            score={breakdown.sustainability.no_deforestation}
            maxScore={10}
            icon={<TreePine className="h-4 w-4" />}
            description="Verified commitment to zero deforestation"
            status={breakdown.sustainability.no_deforestation > 0 ? "passed" : "failed"}
          />
          <ScoreItem
            label="No HCV Land Conversion"
            score={breakdown.sustainability.no_hcv_conversion}
            maxScore={8}
            icon={<Leaf className="h-4 w-4" />}
            description="No conversion of High Conservation Value land"
            status={breakdown.sustainability.no_hcv_conversion > 0 ? "passed" : "failed"}
          />
          <ScoreItem
            label="No Peatland Drainage"
            score={breakdown.sustainability.no_peatland}
            maxScore={5}
            icon={<Droplets className="h-4 w-4" />}
            description="No drainage of peatland areas"
            status={breakdown.sustainability.no_peatland > 0 ? "passed" : "failed"}
          />
          <ScoreItem
            label="Indigenous Rights"
            score={breakdown.sustainability.indigenous_rights}
            maxScore={2}
            icon={<Users className="h-4 w-4" />}
            description="Compliance with indigenous land rights"
            status={breakdown.sustainability.indigenous_rights > 0 ? "passed" : "failed"}
          />

          <SectionHeader title="Social Compliance" maxPoints={20} />
          <ScoreItem
            label="Fair Work Certified"
            score={breakdown.sustainability.fair_work}
            maxScore={10}
            icon={<Users className="h-4 w-4" />}
            description="Fair work practices certification"
            status={breakdown.sustainability.fair_work > 0 ? "passed" : "failed"}
          />
          <ScoreItem
            label="Community Benefit"
            score={breakdown.sustainability.community_benefit}
            maxScore={5}
            icon={<Users className="h-4 w-4" />}
            description="Documented community benefit programs"
            status={breakdown.sustainability.community_benefit > 0 ? "passed" : "failed"}
          />
          <ScoreItem
            label="Supply Chain Transparency"
            score={breakdown.sustainability.supply_chain_transparency}
            maxScore={5}
            icon={<Shield className="h-4 w-4" />}
            description="Transparent supply chain documentation"
            status={breakdown.sustainability.supply_chain_transparency > 0 ? "passed" : "failed"}
          />

          <SectionHeader title="Biodiversity & Soil" maxPoints={15} />
          <ScoreItem
            label="Regenerative Practices"
            score={breakdown.sustainability.regenerative}
            maxScore={8}
            icon={<Leaf className="h-4 w-4" />}
            description="Certified regenerative agriculture practices"
            status={breakdown.sustainability.regenerative > 0 ? "passed" : "failed"}
          />
          <ScoreItem
            label="Soil Carbon Measurement"
            score={breakdown.sustainability.soil_carbon}
            maxScore={4}
            icon={<Leaf className="h-4 w-4" />}
            description="Regular soil carbon monitoring"
            status={breakdown.sustainability.soil_carbon > 0 ? "passed" : "failed"}
          />
          <ScoreItem
            label="Biodiversity Corridors"
            score={breakdown.sustainability.biodiversity}
            maxScore={3}
            icon={<TreePine className="h-4 w-4" />}
            description="Maintenance of biodiversity corridors"
            status={breakdown.sustainability.biodiversity > 0 ? "passed" : "failed"}
          />
        </PillarSection>

        {/* Carbon Intensity Pillar */}
        <PillarSection
          title="Carbon Intensity"
          score={carbonIntensityScore}
          weight="30%"
          icon={<CarbonIntensity />}
          colorClass="text-info"
          bgClass="bg-info/10"
        >
          <div className="p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Carbon Intensity Value
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-bold">
                {breakdown.carbon.value}
              </span>
              <span className="text-lg text-muted-foreground">gCO₂e/MJ</span>
            </div>
            <Badge
              className={cn(
                "mt-3 text-lg px-4 py-1",
                getScoreTier(carbonIntensityScore).bgClass,
                getScoreTier(carbonIntensityScore).colorClass
              )}
            >
              Rating: {breakdown.carbon.rating}
            </Badge>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm mx-auto">
              Lower carbon intensity values result in higher scores. Benchmarked
              against RED II fossil fuel comparator (94 gCO₂e/MJ).
            </p>
          </div>
        </PillarSection>

        {/* Quality Pillar */}
        <PillarSection
          title="Quality"
          score={qualityScore}
          weight="25%"
          icon={<Quality />}
          colorClass="text-accent"
          bgClass="bg-accent/10"
        >
          {feedstockCategory && (
            <div className="px-3 py-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {feedstockCategory.charAt(0).toUpperCase() + feedstockCategory.slice(1)} Parameters
              </Badge>
            </div>
          )}
          {Object.entries(breakdown.quality).map(([param, score]) => {
            const info = QUALITY_LABELS[param] || {
              label: param.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              description: "",
              icon: <FlaskConical className="h-4 w-4" />,
            };
            const maxScore = QUALITY_MAX_POINTS[param] || 25;
            return (
              <ScoreItem
                key={param}
                label={info.label}
                score={score}
                maxScore={maxScore}
                icon={info.icon}
                description={info.description}
              />
            );
          })}
          {Object.keys(breakdown.quality).length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No quality test data available
            </div>
          )}
        </PillarSection>

        {/* Reliability Pillar */}
        <PillarSection
          title="Supply Reliability"
          score={reliabilityScore}
          weight="15%"
          icon={<Reliability />}
          colorClass="text-warning"
          bgClass="bg-warning/10"
        >
          <ScoreItem
            label="Delivery Performance"
            score={breakdown.reliability.delivery_performance}
            maxScore={30}
            icon={<Truck className="h-4 w-4" />}
            description="On-time, in-full (OTIF) delivery rate"
          />
          <ScoreItem
            label="Volume Consistency"
            score={breakdown.reliability.volume_consistency}
            maxScore={25}
            icon={<FlaskConical className="h-4 w-4" />}
            description="Consistency of delivered volumes vs. committed"
          />
          <ScoreItem
            label="Quality Consistency"
            score={breakdown.reliability.quality_consistency}
            maxScore={20}
            icon={<FlaskConical className="h-4 w-4" />}
            description="Consistency of quality across deliveries"
          />
          <ScoreItem
            label="Response Time"
            score={breakdown.reliability.response_time}
            maxScore={15}
            icon={<Clock className="h-4 w-4" />}
            description="Average time to respond to inquiries"
          />
          <ScoreItem
            label="Platform History"
            score={breakdown.reliability.platform_history}
            maxScore={10}
            icon={<History className="h-4 w-4" />}
            description="Time and transactions on the ABFI platform"
          />
        </PillarSection>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

interface ScoreBreakdownCompactProps {
  sustainabilityScore: number;
  carbonIntensityScore: number;
  qualityScore: number;
  reliabilityScore: number;
  className?: string;
}

export function ScoreBreakdownCompact({
  sustainabilityScore,
  carbonIntensityScore,
  qualityScore,
  reliabilityScore,
  className,
}: ScoreBreakdownCompactProps) {
  const pillars = [
    { name: "Sustainability", score: sustainabilityScore, weight: 30, colorClass: "text-success", bgClass: "bg-success" },
    { name: "Carbon Intensity", score: carbonIntensityScore, weight: 30, colorClass: "text-info", bgClass: "bg-info" },
    { name: "Quality", score: qualityScore, weight: 25, colorClass: "text-accent", bgClass: "bg-accent" },
    { name: "Reliability", score: reliabilityScore, weight: 15, colorClass: "text-warning", bgClass: "bg-warning" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {pillars.map((pillar) => (
        <div key={pillar.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{pillar.name}</span>
              <span className="text-xs text-muted-foreground">({pillar.weight}%)</span>
            </div>
            <span className={cn("font-mono font-semibold", pillar.colorClass)}>
              {pillar.score}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", pillar.bgClass)}
              style={{ width: `${pillar.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// IMPROVEMENT SUGGESTIONS
// ============================================================================

interface ImprovementSuggestion {
  pillar: string;
  currentScore: number;
  potentialGain: number;
  suggestions: string[];
}

interface ScoreImprovementsProps {
  suggestions: ImprovementSuggestion[];
  className?: string;
}

export function ScoreImprovements({ suggestions, className }: ScoreImprovementsProps) {
  if (suggestions.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-display">Score Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mb-3" />
            <p className="font-medium">Excellent Performance!</p>
            <p className="text-sm text-muted-foreground mt-1">
              All pillars are performing well. Keep up the great work!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-display">Score Improvements</CardTitle>
        <CardDescription>
          Actions to improve your ABFI score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.pillar}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{suggestion.pillar}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Current: {suggestion.currentScore}
                </span>
                <Badge variant="success" size="sm">
                  +{suggestion.potentialGain} possible
                </Badge>
              </div>
            </div>
            <ul className="space-y-2">
              {suggestion.suggestions.map((text, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
