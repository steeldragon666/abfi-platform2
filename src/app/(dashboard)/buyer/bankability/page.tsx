import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  TrendingDown,
  Shield,
  FileText,
  Plus,
  BarChart3,
  DollarSign,
  Truck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { ScenarioType, StressTestScenario } from "@/types/database";

export const metadata = {
  title: "Bankability & Risk Analysis - ABFI",
};

export default async function BuyerBankabilityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get buyer profile
  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!buyer) {
    redirect("/buyer/settings?setup=required");
  }

  // Get stress test scenarios
  const { data: scenarios } = await supabase
    .from("stress_test_scenarios")
    .select("*")
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get financial projections
  const { data: projections } = await supabase
    .from("financial_projections")
    .select("*")
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get supplier risk assessments (for suppliers buyer has transacted with)
  const { data: transactions } = await supabase
    .from("transactions")
    .select("supplier_id")
    .eq("buyer_id", buyer.id)
    .eq("status", "completed");

  const supplierIds = [...new Set(transactions?.map((t) => t.supplier_id) || [])];

  const { data: riskAssessments } = await supabase
    .from("supplier_risk_assessments")
    .select(`
      *,
      supplier:suppliers(id, company_name)
    `)
    .in("supplier_id", supplierIds.length > 0 ? supplierIds : ["none"])
    .order("assessment_date", { ascending: false });

  // Calculate summary stats
  const completedScenarios = scenarios?.filter((s) => s.status === "completed") || [];
  const avgRiskScore =
    completedScenarios.length > 0
      ? completedScenarios.reduce((sum, s) => sum + (s.results?.risk_score || 0), 0) /
        completedScenarios.length
      : 0;

  const breachScenarios = completedScenarios.filter(
    (s) => s.results?.covenant_status === "breach"
  ).length;

  const warningScenarios = completedScenarios.filter(
    (s) => s.results?.covenant_status === "warning"
  ).length;

  const totalFinancialRisk = completedScenarios.reduce(
    (sum, s) => sum + Math.abs(s.results?.financial_impact || 0),
    0
  );

  const getScenarioTypeBadge = (type: ScenarioType) => {
    switch (type) {
      case "price_shock":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Price Shock</Badge>;
      case "supply_disruption":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Supply Disruption</Badge>;
      case "covenant_breach":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Covenant Breach</Badge>;
      case "regulatory":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Regulatory</Badge>;
      case "custom":
        return <Badge variant="outline">Custom</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getCovenantBadge = (status: string | undefined) => {
    switch (status) {
      case "breach":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Breach
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        );
      case "compliant":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Compliant
          </Badge>
        );
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getRiskRatingBadge = (rating: string | undefined) => {
    switch (rating) {
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      case "moderate":
        return <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
      case "elevated":
        return <Badge className="bg-orange-100 text-orange-800">Elevated</Badge>;
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bankability & Risk Analysis</h1>
          <p className="text-muted-foreground">
            Stress testing, scenario analysis, and lender-ready risk metrics
          </p>
        </div>
        <Button asChild>
          <Link href="/buyer/bankability/new-scenario">
            <Plus className="mr-2 h-4 w-4" />
            New Stress Test
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenarios Run</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedScenarios.length}</div>
            <p className="text-xs text-muted-foreground">
              {scenarios?.filter((s) => s.status === "draft").length || 0} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgRiskScore > 50 ? "text-red-600" : avgRiskScore > 30 ? "text-yellow-600" : "text-green-600"}`}>
              {avgRiskScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              out of 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Covenant Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className="text-red-600">{breachScenarios}</span>
              {" / "}
              <span className="text-yellow-600">{warningScenarios}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              breaches / warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risk Exposure</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalFinancialRisk)}
            </div>
            <p className="text-xs text-muted-foreground">
              potential impact
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Stress Tests</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Risk</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        {/* Stress Test Scenarios Tab */}
        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Stress Test Scenarios
              </CardTitle>
              <CardDescription>
                Analyze impact of adverse market conditions on your supply chain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scenarios && scenarios.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scenario</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Financial Impact</TableHead>
                      <TableHead className="text-center">Risk Score</TableHead>
                      <TableHead>Covenant Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scenarios.map((scenario) => (
                      <TableRow key={scenario.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{scenario.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {scenario.scenario_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getScenarioTypeBadge(scenario.scenario_type)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {scenario.results ? (
                            <span className={scenario.results.financial_impact < 0 ? "text-red-600" : "text-green-600"}>
                              {formatCurrency(scenario.results.financial_impact)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {scenario.results ? (
                            <span className={`font-bold ${
                              scenario.results.risk_score > 70 ? "text-red-600" :
                              scenario.results.risk_score > 40 ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {scenario.results.risk_score.toFixed(0)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {getCovenantBadge(scenario.results?.covenant_status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(scenario.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/buyer/bankability/scenarios/${scenario.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No stress tests yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Run your first scenario to analyze supply chain risks
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/buyer/bankability/new-scenario">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Stress Test
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Risk Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Supplier Risk Assessment
              </CardTitle>
              <CardDescription>
                Risk ratings for suppliers in your supply chain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riskAssessments && riskAssessments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-center">Delivery</TableHead>
                      <TableHead className="text-center">Price</TableHead>
                      <TableHead className="text-center">Concentration</TableHead>
                      <TableHead className="text-center">Financial</TableHead>
                      <TableHead className="text-center">Overall</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Assessed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">
                          {assessment.supplier?.company_name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.delivery_risk_score.toFixed(0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.price_volatility_score.toFixed(0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.concentration_risk_score.toFixed(0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.financial_stability_score.toFixed(0)}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {assessment.overall_risk_score.toFixed(0)}
                        </TableCell>
                        <TableCell>
                          {getRiskRatingBadge(assessment.risk_rating)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(assessment.assessment_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No risk assessments</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Complete transactions to generate supplier risk profiles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Financial Projections
              </CardTitle>
              <CardDescription>
                Multi-year procurement and carbon credit forecasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projections && projections.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projection</TableHead>
                      <TableHead>Base Date</TableHead>
                      <TableHead>Horizon</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projections.map((projection) => (
                      <TableRow key={projection.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{projection.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {projection.projection_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(projection.base_date)}</TableCell>
                        <TableCell>{projection.horizon_months} months</TableCell>
                        <TableCell className="text-right font-mono">
                          {projection.annual_volume_tonnes?.toLocaleString()} t
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {projection.total_projected_value
                            ? formatCurrency(projection.total_projected_value)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={projection.status === "approved" ? "default" : "outline"}>
                            {projection.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/buyer/bankability/projections/${projection.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No projections yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create financial projections for lender reporting
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/buyer/bankability/new-projection">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Projection
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legal Disclaimer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Important Disclaimer</p>
              <p>
                Stress test scenarios and projections are based on hypothetical situations and
                simplified models. Results are for informational purposes only and do not constitute
                financial advice. Actual outcomes may differ materially from projections due to
                market conditions, regulatory changes, and other factors. Consult with qualified
                professionals before making business decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
