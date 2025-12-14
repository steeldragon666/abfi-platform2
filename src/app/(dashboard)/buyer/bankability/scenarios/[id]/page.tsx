"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  RefreshCw,
  Trash2,
  Download,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { StressTestScenario, StressTestResults, MethodologyProvenance } from "@/types/database";

const scenarioTypeLabels: Record<string, string> = {
  price_shock: "Price Shock",
  supply_disruption: "Supply Disruption",
  covenant_breach: "Covenant Breach",
  regulatory: "Regulatory Change",
  custom: "Custom Scenario",
};

const riskScoreColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

function getRiskLevel(score: number): string {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ScenarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [scenario, setScenario] = useState<StressTestScenario | null>(null);
  const [provenance, setProvenance] = useState<MethodologyProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const scenarioId = params.id as string;

  useEffect(() => {
    fetchScenario();
  }, [scenarioId]);

  const fetchScenario = async () => {
    try {
      const response = await fetch(`/api/bankability/stress-tests/${scenarioId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch scenario");
      }
      const data = await response.json();
      setScenario(data.scenario);
      setProvenance(data.provenance);
    } catch (error) {
      console.error("Error fetching scenario:", error);
      toast.error("Failed to load scenario");
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = async () => {
    setRerunning(true);
    try {
      const response = await fetch(`/api/bankability/stress-tests/${scenarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rerun: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to re-run scenario");
      }

      const updatedScenario = await response.json();
      setScenario(updatedScenario);
      toast.success("Scenario re-run successfully");
    } catch (error) {
      console.error("Error re-running scenario:", error);
      toast.error("Failed to re-run scenario");
    } finally {
      setRerunning(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/bankability/stress-tests/${scenarioId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete scenario");
      }

      toast.success("Scenario deleted");
      router.push("/buyer/bankability");
    } catch (error) {
      console.error("Error deleting scenario:", error);
      toast.error("Failed to delete scenario");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Scenario Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The requested stress test scenario could not be found.
        </p>
        <Button asChild>
          <Link href="/buyer/bankability">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bankability
          </Link>
        </Button>
      </div>
    );
  }

  const results = scenario.results as StressTestResults | null;
  const riskLevel = results ? getRiskLevel(results.risk_score) : "medium";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/buyer/bankability">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{scenario.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {scenarioTypeLabels[scenario.scenario_type] || scenario.scenario_type}
                </Badge>
                <Badge
                  variant={scenario.status === "completed" ? "default" : "secondary"}
                >
                  {scenario.status}
                </Badge>
                {results && (
                  <Badge className={riskScoreColors[riskLevel]}>
                    {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRerun} disabled={rerunning}>
              <RefreshCw className={`mr-2 h-4 w-4 ${rerunning ? "animate-spin" : ""}`} />
              Re-run
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this stress test scenario? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Description */}
        {scenario.description && (
          <p className="text-muted-foreground">{scenario.description}</p>
        )}

        {/* Key Metrics */}
        {results && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Financial Impact</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(results.financial_impact)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Potential loss exposure
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Supply Gap</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(results.supply_gap_tonnes)} t
                </div>
                <p className="text-xs text-muted-foreground">
                  Shortfall in tonnes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.risk_score}/100</div>
                <Progress value={results.risk_score} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Covenant Status</CardTitle>
                {results.covenant_status === "compliant" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : results.covenant_status === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    results.covenant_status === "compliant"
                      ? "text-green-600"
                      : results.covenant_status === "warning"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {results.covenant_status.charAt(0).toUpperCase() +
                    results.covenant_status.slice(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Debt covenant assessment
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Results Tabs */}
        <Tabs defaultValue="mitigation" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mitigation">Mitigation Options</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="provenance">Methodology</TabsTrigger>
          </TabsList>

          <TabsContent value="mitigation">
            <Card>
              <CardHeader>
                <CardTitle>Mitigation Strategies</CardTitle>
                <CardDescription>
                  Recommended actions to reduce impact of this scenario
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results?.mitigation_options && results.mitigation_options.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Strategy</TableHead>
                        <TableHead className="text-right">Cost Impact</TableHead>
                        <TableHead className="text-right">Implementation</TableHead>
                        <TableHead className="text-right">Effectiveness</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.mitigation_options.map((option, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{option.option}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(option.cost_impact)}
                          </TableCell>
                          <TableCell className="text-right">
                            {option.implementation_time_days} days
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress
                                value={option.effectiveness_score * 100}
                                className="w-16"
                              />
                              <span className="text-sm">
                                {Math.round(option.effectiveness_score * 100)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">
                    No mitigation options available for this scenario.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sensitivity">
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Analysis</CardTitle>
                <CardDescription>
                  How changes in key variables affect the outcome
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results?.sensitivity_analysis &&
                results.sensitivity_analysis.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable</TableHead>
                        <TableHead className="text-right">Base Value</TableHead>
                        <TableHead className="text-right">Impact per Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.sensitivity_analysis.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.variable}</TableCell>
                          <TableCell className="text-right">
                            {typeof item.base_value === "number"
                              ? item.variable.toLowerCase().includes("price")
                                ? formatCurrency(item.base_value)
                                : formatNumber(item.base_value)
                              : item.base_value}
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger>
                                <span
                                  className={
                                    item.impact_per_unit > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  {item.impact_per_unit > 0 ? "+" : ""}
                                  {formatCurrency(item.impact_per_unit)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Impact on financial exposure per unit change
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">
                    No sensitivity analysis available for this scenario.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Parameters</CardTitle>
                <CardDescription>
                  Input assumptions used for this stress test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scenario-specific parameters */}
                <div>
                  <h4 className="font-medium mb-3">Stress Parameters</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {scenario.parameters &&
                      Object.entries(scenario.parameters as Record<string, unknown>).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-2 border-b last:border-0"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="font-medium">
                              {typeof value === "number"
                                ? key.includes("percentage") || key.includes("change")
                                  ? `${value}%`
                                  : key.includes("price")
                                    ? formatCurrency(value)
                                    : formatNumber(value)
                                : String(value)}
                            </span>
                          </div>
                        )
                      )}
                  </div>
                </div>

                {/* Baseline assumptions */}
                <div>
                  <h4 className="font-medium mb-3">Baseline Assumptions</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {scenario.baseline_assumptions &&
                      Object.entries(
                        scenario.baseline_assumptions as Record<string, unknown>
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-2 border-b last:border-0"
                        >
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium">
                            {typeof value === "number"
                              ? key.includes("percentage")
                                ? `${(value * 100).toFixed(0)}%`
                                : key.includes("price") || key.includes("cost")
                                  ? formatCurrency(value)
                                  : formatNumber(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="provenance">
            <Card>
              <CardHeader>
                <CardTitle>Methodology Provenance</CardTitle>
                <CardDescription>
                  Documentation for audit and legal defensibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {provenance ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Methodology
                        </span>
                        <p className="font-medium">{provenance.methodology_name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Version</span>
                        <p className="font-medium">{provenance.methodology_version}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Confidence Level
                        </span>
                        <p className="font-medium capitalize">
                          {provenance.confidence_level}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Generated At
                        </span>
                        <p className="font-medium">
                          {new Date(provenance.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {provenance.uncertainty_notes && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Uncertainty Notes</AlertTitle>
                        <AlertDescription>
                          {provenance.uncertainty_notes}
                        </AlertDescription>
                      </Alert>
                    )}

                    {provenance.input_sources && (
                      <div>
                        <h4 className="font-medium mb-2">Data Sources</h4>
                        <div className="space-y-2">
                          {(
                            provenance.input_sources as Array<{
                              source: string;
                              date: string;
                              verified: boolean;
                            }>
                          ).map((source, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b last:border-0"
                            >
                              <span>{source.source}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {source.date}
                                </span>
                                {source.verified && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {provenance.calculation_steps && (
                      <div>
                        <h4 className="font-medium mb-2">Calculation Steps</h4>
                        <ol className="space-y-2">
                          {(
                            provenance.calculation_steps as Array<{
                              step: number;
                              operation: string;
                              result: unknown;
                            }>
                          ).map((step, index) => (
                            <li key={index} className="flex gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                {step.step}
                              </span>
                              <div>
                                <p className="font-medium">{step.operation}</p>
                                <p className="text-sm text-muted-foreground">
                                  Result:{" "}
                                  {typeof step.result === "number"
                                    ? formatNumber(step.result)
                                    : String(step.result)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No methodology provenance recorded for this scenario.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Legal Disclaimer */}
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important Disclaimer</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            This stress test analysis is provided for informational and planning purposes
            only. Results are based on hypothetical scenarios and historical data, and
            should not be relied upon as predictions of actual future outcomes. Users
            should conduct their own due diligence and consult with qualified financial
            advisors before making investment or lending decisions. ABFI makes no
            warranties regarding the accuracy or completeness of these projections.
          </AlertDescription>
        </Alert>
      </div>
    </TooltipProvider>
  );
}
