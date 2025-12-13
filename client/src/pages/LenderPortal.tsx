import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Shield, TrendingUp, AlertCircle, CheckCircle, FileText, Download, Eye } from "lucide-react";
import { RatingBadge, ScoreBreakdown } from "@/components/ScoreCard";

export default function LenderPortal() {
  const { user, loading: authLoading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // In a real implementation, lenders would have access to specific projects
  // For now, we'll show all projects (this should be filtered by lender permissions)
  const { data: projects, isLoading: projectsLoading } = trpc.bankability.listProjects.useQuery();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "construction":
        return "bg-blue-100 text-blue-800";
      case "financing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCovenantStatus = (project: any): { status: "compliant" | "warning" | "breach"; message: string } => {
    // Check Tier 1 covenant (typically 80% minimum)
    const tier1Target = project.tier1Target || 80;
    const tier1Actual = 0; // TODO: Calculate from agreements
    
    if (tier1Actual < tier1Target * 0.9) {
      return { status: "breach", message: `Tier 1 coverage below threshold (${tier1Actual}% vs ${tier1Target}% target)` };
    }
    if (tier1Actual < tier1Target) {
      return { status: "warning", message: `Tier 1 coverage approaching threshold (${tier1Actual}% vs ${tier1Target}% target)` };
    }
    return { status: "compliant", message: "All covenants compliant" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Lender Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Read-only monitoring view for financed bioenergy projects
          </p>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Projects Available</h3>
              <p className="text-sm text-muted-foreground">
                You don't have access to any projects yet. Contact your relationship manager.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Project List */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monitored Projects</CardTitle>
                  <CardDescription>Select a project to view details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {projects.map((project: any) => {
                    const covenant = getCovenantStatus(project);
                    return (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(project.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedProject === project.id
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-sm">{project.name}</div>
                          {covenant.status === "breach" && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {covenant.status === "warning" && (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {covenant.status === "compliant" && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                          <Badge variant="outline" className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Project Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedProject ? (
                (() => {
                  const project = projects.find((p: any) => p.id === selectedProject);
                  if (!project) return null;
                  
                  const covenant = getCovenantStatus(project);

                  return (
                    <>
                      {/* Project Overview */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{project.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {project.facilityLocation} • {project.nameplateCapacity.toLocaleString()} tonnes/year capacity
                              </CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export Report
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Status</div>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Bankability Rating</div>
                              <span className="text-sm">Not assessed</span>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Technology</div>
                              <div className="text-sm font-medium">N/A</div>
                            </div>
                          </div>

                          {project.description && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Description</div>
                              <p className="text-sm">{project.description}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Covenant Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Covenant Monitoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div
                            className={`flex items-start gap-3 p-4 rounded-lg ${
                              covenant.status === "breach"
                                ? "bg-red-50 border border-red-200"
                                : covenant.status === "warning"
                                ? "bg-yellow-50 border border-yellow-200"
                                : "bg-green-50 border border-green-200"
                            }`}
                          >
                            {covenant.status === "breach" && <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                            {covenant.status === "warning" && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                            {covenant.status === "compliant" && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                            <div>
                              <div
                                className={`font-medium mb-1 ${
                                  covenant.status === "breach"
                                    ? "text-red-900"
                                    : covenant.status === "warning"
                                    ? "text-yellow-900"
                                    : "text-green-900"
                                }`}
                              >
                                {covenant.status === "breach" ? "Covenant Breach" : covenant.status === "warning" ? "Covenant Warning" : "Covenants Compliant"}
                              </div>
                              <p
                                className={`text-sm ${
                                  covenant.status === "breach"
                                    ? "text-red-700"
                                    : covenant.status === "warning"
                                    ? "text-yellow-700"
                                    : "text-green-700"
                                }`}
                              >
                                {covenant.message}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Tier 1 Coverage</span>
                                <span className="font-medium">
                                  0% / {project.tier1Target || 80}%
                                </span>
                              </div>
                              <Progress value={0} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Total Primary Coverage</span>
                                <span className="font-medium">0%</span>
                              </div>
                              <Progress value={0} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Supply Position */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Supply Position
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScoreBreakdown
                            scores={[
                              {
                                label: "Tier 1 (Core)",
                                value: 0,
                                maxValue: 100,
                              },
                              {
                                label: "Tier 2 (Supplementary)",
                                value: 0,
                                maxValue: 100,
                              },
                              {
                                label: "Options",
                                value: 0,
                                maxValue: 100,
                              },
                              {
                                label: "ROFR",
                                value: 0,
                                maxValue: 100,
                              },
                            ]}
                          />
                        </CardContent>
                      </Card>

                      {/* Documents */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documents
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Latest Bankability Certificate
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Supply Agreement Summary
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Covenant Compliance Report
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a project to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
