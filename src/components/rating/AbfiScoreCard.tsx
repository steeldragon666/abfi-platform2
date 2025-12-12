"use client";

import { cn } from "@/lib/utils";
import { getScoreTier, getCarbonRatingColor } from "@/lib/rating/calculator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Leaf, Gauge, FlaskConical, TrendingUp } from "lucide-react";

interface AbfiScoreCardProps {
  abfiScore: number;
  sustainabilityScore: number;
  carbonIntensityScore: number;
  qualityScore: number;
  reliabilityScore: number;
  carbonIntensityValue?: number;
  carbonRating?: string;
  compact?: boolean;
}

export function AbfiScoreCard({
  abfiScore,
  sustainabilityScore,
  carbonIntensityScore,
  qualityScore,
  reliabilityScore,
  carbonIntensityValue,
  carbonRating,
  compact = false,
}: AbfiScoreCardProps) {
  const tier = getScoreTier(abfiScore);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg font-bold text-lg",
            tier.bgColor,
            tier.color
          )}
        >
          {abfiScore}
        </div>
        <div>
          <div className="font-medium">{tier.tier}</div>
          <div className="text-xs text-muted-foreground">ABFI Score</div>
        </div>
      </div>
    );
  }

  const pillars = [
    {
      name: "Sustainability",
      score: sustainabilityScore,
      weight: "30%",
      icon: Leaf,
      color: "bg-green-500",
    },
    {
      name: "Carbon Intensity",
      score: carbonIntensityScore,
      weight: "30%",
      icon: Gauge,
      color: "bg-blue-500",
      extra: carbonRating
        ? `${carbonIntensityValue} gCO2e/MJ (${carbonRating})`
        : undefined,
    },
    {
      name: "Quality",
      score: qualityScore,
      weight: "25%",
      icon: FlaskConical,
      color: "bg-purple-500",
    },
    {
      name: "Reliability",
      score: reliabilityScore,
      weight: "15%",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">ABFI Score</CardTitle>
            <CardDescription>Composite rating from 4 pillars</CardDescription>
          </div>
          <div
            className={cn(
              "flex h-16 w-16 flex-col items-center justify-center rounded-xl font-bold",
              tier.bgColor,
              tier.color
            )}
          >
            <span className="text-2xl">{abfiScore}</span>
            <span className="text-xs font-normal">{tier.tier}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <pillar.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{pillar.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({pillar.weight})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pillar.extra && (
                  <span className="text-xs text-muted-foreground">
                    {pillar.extra}
                  </span>
                )}
                <span className="font-semibold">{pillar.score}</span>
              </div>
            </div>
            <Progress value={pillar.score} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface AbfiScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function AbfiScoreBadge({ score, size = "md" }: AbfiScoreBadgeProps) {
  const tier = getScoreTier(score);

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-xl",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center rounded-lg font-bold cursor-help",
              sizeClasses[size],
              tier.bgColor,
              tier.color
            )}
          >
            {score}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            ABFI Score: {score}/100 ({tier.tier})
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CarbonRatingBadgeProps {
  rating: string;
  value?: number;
}

export function CarbonRatingBadge({ rating, value }: CarbonRatingBadgeProps) {
  const colorClass = getCarbonRatingColor(rating);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium cursor-help",
              colorClass
            )}
          >
            <Gauge className="h-3 w-3" />
            {rating}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Carbon Intensity: {value ? `${value} gCO2e/MJ` : "Not measured"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
