import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Plus, TrendingUp, AlertCircle, FileText, Users } from "lucide-react";
import { Link } from "wouter";

export default function BankabilityDashboard() {
  const { user, loading: authLoading } = useAuth();
  
  const { data: projects, isLoading: projectsLoading } = trpc.bankability.getMyProjects.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  const getRatingColor = (rating: string) => {
    if (["AAA", "AA", "A"].includes(rating)) return "bg-green-100 text-green-800";
    if (["BBB", "BB"].includes(rating)) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-green-100 text-green-800";
      case "construction": return "bg-blue-100 text-blue-800";
      case "financing": return "bg-purple-100 text-purple-800";
      case "development": return "bg-yellow-100 text-yellow-800";
      case "planning": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bankability Dashboard</h1>
            <p className="text-muted-foreground">
              Manage bioenergy projects and supply agreements
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {projectsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-6">
            {projects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status?.toUpperCase()}
                      </Badge>
                      {project.bankabilityRating && (
                        <Badge className={getRatingColor(project.bankabilityRating)}>
                          {project.bankabilityRating}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Details */}
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Capacity</div>
                      <div className="font-medium">
                        {project.nameplateCapacity?.toLocaleString()} MW
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Location</div>
                      <div className="font-medium">
                        {project.facilityLocation || project.state || "TBD"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target COD</div>
                      <div className="font-medium">
                        {project.targetCOD ? new Date(project.targetCOD).toLocaleDateString() : "TBD"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Debt Tenor</div>
                      <div className="font-medium">
                        {project.debtTenor ? `${project.debtTenor} years` : "TBD"}
                      </div>
                    </div>
                  </div>

                  {/* Supply Position */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Supply Position</h4>
                      <span className="text-sm text-muted-foreground">
                        Target: 150% of capacity
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Primary Coverage (Tier 1)</span>
                          <span className="font-medium">0% / 120%</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Secondary Coverage (Tier 2)</span>
                          <span className="font-medium">0% / 30%</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Bankability Score Breakdown */}
                  {project.bankabilityScore && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Bankability Assessment</h4>
                      <div className="grid md:grid-cols-5 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {project.bankabilityScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Composite</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-semibold mb-1">--</div>
                          <div className="text-xs text-muted-foreground">Volume (30%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-semibold mb-1">--</div>
                          <div className="text-xs text-muted-foreground">Quality (25%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-semibold mb-1">--</div>
                          <div className="text-xs text-muted-foreground">Structure (20%)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-semibold mb-1">--</div>
                          <div className="text-xs text-muted-foreground">Risk (15%)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  {(!project.bankabilityRating || project.bankabilityRating === "CCC") && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-900">Action Required</div>
                        <div className="text-yellow-700">
                          Complete supply agreements to improve bankability rating
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Agreements
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Suppliers
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Run Assessment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bioenergy project to start managing supply agreements
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
