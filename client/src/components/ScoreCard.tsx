import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Shield } from "lucide-react";

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  description?: string;
  variant?: "default" | "compact" | "detailed";
  showProgress?: boolean;
  icon?: "award" | "trending" | "shield";
  className?: string;
}

export function ScoreCard({
  title,
  score,
  maxScore = 100,
  description,
  variant = "default",
  showProgress = true,
  icon = "award",
  className = "",
}: ScoreCardProps) {
  const percentage = (score / maxScore) * 100;
  
  const getScoreColor = (pct: number): string => {
    if (pct >= 85) return "text-green-600";
    if (pct >= 70) return "text-blue-600";
    if (pct >= 55) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (pct: number): string => {
    if (pct >= 85) return "bg-green-100 text-green-800";
    if (pct >= 70) return "bg-blue-100 text-blue-800";
    if (pct >= 55) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const IconComponent = icon === "award" ? Award : icon === "trending" ? TrendingUp : Shield;

  if (variant === "compact") {
    return (
      <div className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <Badge className={getScoreBadgeColor(percentage)}>
          {score}/{maxScore}
        </Badge>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              {title}
            </CardTitle>
            <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
              {score}
            </div>
          </div>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {showProgress && (
            <div>
              <Progress value={percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>{maxScore}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Performance</span>
            <span className="font-medium">{percentage.toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            {title}
          </CardTitle>
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
            {score}
          </div>
          <div className="text-sm text-muted-foreground">out of {maxScore}</div>
        </div>
        {showProgress && (
          <Progress value={percentage} className="h-2" />
        )}
      </CardContent>
    </Card>
  );
}

interface RatingBadgeProps {
  rating: string;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  className?: string;
}

export function RatingBadge({
  rating,
  size = "md",
  showDescription = false,
  className = "",
}: RatingBadgeProps) {
  const getRatingInfo = (r: string): { color: string; description: string } => {
    switch (r) {
      case "AAA":
        return { color: "bg-green-600 text-white", description: "Exceptional" };
      case "AA":
        return { color: "bg-green-500 text-white", description: "Very Strong" };
      case "A":
        return { color: "bg-blue-600 text-white", description: "Strong" };
      case "BBB":
        return { color: "bg-blue-500 text-white", description: "Good" };
      case "BB":
        return { color: "bg-yellow-600 text-white", description: "Adequate" };
      case "B":
        return { color: "bg-orange-600 text-white", description: "Marginal" };
      case "CCC":
        return { color: "bg-red-600 text-white", description: "Weak" };
      case "GQ1":
        return { color: "bg-green-600 text-white", description: "Premier" };
      case "GQ2":
        return { color: "bg-blue-600 text-white", description: "Qualified" };
      case "GQ3":
        return { color: "bg-yellow-600 text-white", description: "Developing" };
      case "GQ4":
        return { color: "bg-orange-600 text-white", description: "Provisional" };
      default:
        return { color: "bg-gray-500 text-white", description: "Unrated" };
    }
  };

  const info = getRatingInfo(rating);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  if (showDescription) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Badge className={`${info.color} ${sizeClasses[size]} font-bold`}>
          {rating}
        </Badge>
        <span className="text-sm text-muted-foreground">{info.description}</span>
      </div>
    );
  }

  return (
    <Badge className={`${info.color} ${sizeClasses[size]} font-bold ${className}`}>
      {rating}
    </Badge>
  );
}

interface ScoreBreakdownProps {
  scores: Array<{
    label: string;
    value: number;
    maxValue?: number;
    weight?: number;
  }>;
  className?: string;
}

export function ScoreBreakdown({ scores, className = "" }: ScoreBreakdownProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {scores.map((score, index) => {
        const percentage = ((score.value / (score.maxValue || 100)) * 100);
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{score.label}</span>
                {score.weight && (
                  <span className="text-xs text-muted-foreground">({score.weight}%)</span>
                )}
              </div>
              <span className="font-medium">{score.value}</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}

interface ABFIScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ABFIScoreBadge({
  score,
  size = "md",
  showLabel = true,
  className = "",
}: ABFIScoreBadgeProps) {
  const getScoreColor = (s: number): string => {
    if (s >= 90) return "bg-green-600 text-white";
    if (s >= 80) return "bg-blue-600 text-white";
    if (s >= 70) return "bg-yellow-600 text-white";
    if (s >= 60) return "bg-orange-600 text-white";
    return "bg-red-600 text-white";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && <span className="text-sm text-muted-foreground">ABFI Score:</span>}
      <Badge className={`${getScoreColor(score)} ${sizeClasses[size]} font-bold`}>
        {score}/100
      </Badge>
    </div>
  );
}
