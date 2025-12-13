import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, Shield, Users, FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function BankabilityAssessment() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // Assessment scores (0-100)
  const [volumeSecurityScore, setVolumeSecurityScore] = useState(0);
  const [counterpartyQualityScore, setCounterpartyQualityScore] = useState(0);
  const [contractStructureScore, setContractStructureScore] = useState(0);
  const [concentrationRiskScore, setConcentrationRiskScore] = useState(0);
  const [operationalReadinessScore, setOperationalReadinessScore] = useState(0);
  
  const [strengths, setStrengths] = useState("");
  const [monitoringItems, setMonitoringItems] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const { data: project, isLoading: projectLoading } = trpc.bankability.getProjectById.useQuery(
    { id: parseInt(projectId!) },
    { enabled: !!projectId }
  );
  
  const { data: agreements, isLoading: agreementsLoading } = trpc.bankability.getProjectAgreements.useQuery(
    { projectId: parseInt(projectId!) },
    { enabled: !!projectId }
  );
  
  const createAssessmentMutation = trpc.bankability.createAssessment.useMutation({
    onSuccess: () => {
      setLocation("/bankability");
    },
    onError: (error) => {
      setError(error.message || "Failed to create assessment");
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (projectLoading || agreementsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Project not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate composite score (weighted average)
  const weights = {
    volumeSecurity: 0.30,
    counterpartyQuality: 0.25,
    contractStructure: 0.20,
    concentrationRisk: 0.15,
    operationalReadiness: 0.10,
  };
  
  const compositeScore = Math.round(
    volumeSecurityScore * weights.volumeSecurity +
    counterpartyQualityScore * weights.counterpartyQuality +
    contractStructureScore * weights.contractStructure +
    concentrationRiskScore * weights.concentrationRisk +
    operationalReadinessScore * weights.operationalReadiness
  );

  // Determine rating based on composite score
  const getRating = (score: number): { rating: string; description: string; color: string } => {
    if (score >= 90) return { rating: "AAA", description: "Exceptional bankability", color: "text-green-600" };
    if (score >= 85) return { rating: "AA", description: "Very strong bankability", color: "text-green-600" };
    if (score >= 80) return { rating: "A", description: "Strong bankability", color: "text-blue-600" };
    if (score >= 70) return { rating: "BBB", description: "Good bankability", color: "text-blue-600" };
    if (score >= 60) return { rating: "BB", description: "Adequate bankability", color: "text-yellow-600" };
    if (score >= 50) return { rating: "B", description: "Marginal bankability", color: "text-orange-600" };
    return { rating: "CCC", description: "Weak bankability", color: "text-red-600" };
  };

  const rating = getRating(compositeScore);

  // Calculate supply position metrics from agreements
  const calculateSupplyMetrics = () => {
    if (!agreements || agreements.length === 0) {
      return {
        tier1Volume: 0,
        tier1Percent: 0,
        tier2Volume: 0,
        tier2Percent: 0,
        optionsVolume: 0,
        optionsPercent: 0,
        rofrVolume: 0,
        rofrPercent: 0,
        totalAgreements: 0,
      };
    }

    const capacity = project.nameplateCapacity;
    let tier1Volume = 0;
    let tier2Volume = 0;
    let optionsVolume = 0;
    let rofrVolume = 0;

    agreements.forEach((agreement: any) => {
      const volume = agreement.annualVolume || 0;
      if (agreement.tier === "tier1") tier1Volume += volume;
      else if (agreement.tier === "tier2") tier2Volume += volume;
      else if (agreement.tier === "option") optionsVolume += volume;
      else if (agreement.tier === "rofr") rofrVolume += volume;
    });

    return {
      tier1Volume,
      tier1Percent: Math.round((tier1Volume / capacity) * 100),
      tier2Volume,
      tier2Percent: Math.round((tier2Volume / capacity) * 100),
      optionsVolume,
      optionsPercent: Math.round((optionsVolume / capacity) * 100),
      rofrVolume,
      rofrPercent: Math.round((rofrVolume / capacity) * 100),
      totalAgreements: agreements.length,
    };
  };

  const supplyMetrics = calculateSupplyMetrics();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (compositeScore === 0) {
      setError("Please provide scores for all criteria");
      return;
    }
    
    // Generate assessment number
    const assessmentNumber = `ABFI-BANK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    
    createAssessmentMutation.mutate({
      projectId: parseInt(projectId!),
      assessmentNumber,
      assessmentDate: new Date(),
      volumeSecurityScore,
      counterpartyQualityScore,
      contractStructureScore,
      concentrationRiskScore,
      operationalReadinessScore,
      compositeScore,
      rating: rating.rating as any,
      ratingDescription: rating.description,
      ...supplyMetrics,
      strengths: strengths ? strengths.split('\n').filter(s => s.trim()) : undefined,
      monitoringItems: monitoringItems ? monitoringItems.split('\n').filter(s => s.trim()) : undefined,
      status: "submitted",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/bankability")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Assessment Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Bankability Assessment
                </CardTitle>
                <CardDescription>
                  Project: {project.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Volume Security */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-semibold">Volume Security (30%)</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tier 1 coverage, total secured volume, flex bands
                        </p>
                      </div>
                      <span className="text-sm font-medium">{volumeSecurityScore}/100</span>
                    </div>
                    <Slider
                      value={[volumeSecurityScore]}
                      onValueChange={(v) => setVolumeSecurityScore(v[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Counterparty Quality */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-semibold">Counterparty Quality (25%)</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Grower qualifications, financial strength, track record
                        </p>
                      </div>
                      <span className="text-sm font-medium">{counterpartyQualityScore}/100</span>
                    </div>
                    <Slider
                      value={[counterpartyQualityScore]}
                      onValueChange={(v) => setCounterpartyQualityScore(v[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Contract Structure */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-semibold">Contract Structure (20%)</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Take-or-pay terms, pricing mechanisms, security packages
                        </p>
                      </div>
                      <span className="text-sm font-medium">{contractStructureScore}/100</span>
                    </div>
                    <Slider
                      value={[contractStructureScore]}
                      onValueChange={(v) => setContractStructureScore(v[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Concentration Risk */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-semibold">Concentration Risk (15%)</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supplier HHI, geographic diversity, single event exposure
                        </p>
                      </div>
                      <span className="text-sm font-medium">{concentrationRiskScore}/100</span>
                    </div>
                    <Slider
                      value={[concentrationRiskScore]}
                      onValueChange={(v) => setConcentrationRiskScore(v[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Operational Readiness */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-semibold">Operational Readiness (10%)</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Project status, timeline, regulatory approvals
                        </p>
                      </div>
                      <span className="text-sm font-medium">{operationalReadinessScore}/100</span>
                    </div>
                    <Slider
                      value={[operationalReadinessScore]}
                      onValueChange={(v) => setOperationalReadinessScore(v[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Strengths */}
                  <div className="space-y-2">
                    <Label htmlFor="strengths">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Key Strengths
                    </Label>
                    <Textarea
                      id="strengths"
                      rows={4}
                      placeholder="List key strengths (one per line)&#10;- Strong Tier 1 coverage at 95%&#10;- Diverse supplier base with low HHI&#10;- Long-term contracts averaging 18 years"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                    />
                  </div>

                  {/* Monitoring Items */}
                  <div className="space-y-2">
                    <Label htmlFor="monitoring">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Monitoring Items
                    </Label>
                    <Textarea
                      id="monitoring"
                      rows={4}
                      placeholder="List items requiring monitoring (one per line)&#10;- Monitor supplier X financial performance&#10;- Track contract renewals due in 2026&#10;- Review pricing mechanisms annually"
                      value={monitoringItems}
                      onChange={(e) => setMonitoringItems(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={createAssessmentMutation.isPending}
                      className="flex-1"
                    >
                      {createAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/bankability")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Score Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Assessment Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className={`text-6xl font-bold mb-2 ${rating.color}`}>
                    {rating.rating}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Composite Score: {compositeScore}/100
                  </div>
                  <div className="text-sm font-medium">{rating.description}</div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Volume Security</span>
                      <span className="font-medium">{volumeSecurityScore}</span>
                    </div>
                    <Progress value={volumeSecurityScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Counterparty Quality</span>
                      <span className="font-medium">{counterpartyQualityScore}</span>
                    </div>
                    <Progress value={counterpartyQualityScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Contract Structure</span>
                      <span className="font-medium">{contractStructureScore}</span>
                    </div>
                    <Progress value={contractStructureScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Concentration Risk</span>
                      <span className="font-medium">{concentrationRiskScore}</span>
                    </div>
                    <Progress value={concentrationRiskScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Operational Readiness</span>
                      <span className="font-medium">{operationalReadinessScore}</span>
                    </div>
                    <Progress value={operationalReadinessScore} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Supply Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Agreements</span>
                  <span className="font-medium">{supplyMetrics.totalAgreements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier 1 Coverage</span>
                  <span className="font-medium">{supplyMetrics.tier1Percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier 2 Coverage</span>
                  <span className="font-medium">{supplyMetrics.tier2Percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Options</span>
                  <span className="font-medium">{supplyMetrics.optionsPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROFR</span>
                  <span className="font-medium">{supplyMetrics.rofrPercent}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rating Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <Badge className="bg-green-100 text-green-800 mb-1">AAA-AA</Badge>
                  <p className="text-muted-foreground">Exceptional to very strong (85-100)</p>
                </div>
                <div>
                  <Badge className="bg-blue-100 text-blue-800 mb-1">A-BBB</Badge>
                  <p className="text-muted-foreground">Strong to good (70-84)</p>
                </div>
                <div>
                  <Badge className="bg-yellow-100 text-yellow-800 mb-1">BB</Badge>
                  <p className="text-muted-foreground">Adequate (60-69)</p>
                </div>
                <div>
                  <Badge className="bg-orange-100 text-orange-800 mb-1">B</Badge>
                  <p className="text-muted-foreground">Marginal (50-59)</p>
                </div>
                <div>
                  <Badge className="bg-red-100 text-red-800 mb-1">CCC</Badge>
                  <p className="text-muted-foreground">Weak (&lt;50)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
