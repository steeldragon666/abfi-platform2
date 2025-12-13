import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileUp, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function QualityTestUpload() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [feedstockId, setFeedstockId] = useState<string>("");
  const [testType, setTestType] = useState<string>("");
  const [testDate, setTestDate] = useState<string>("");
  const [moistureContent, setMoistureContent] = useState<string>("");
  const [ashContent, setAshContent] = useState<string>("");
  const [heatingValue, setHeatingValue] = useState<string>("");
  const [sulfurContent, setSulfurContent] = useState<string>("");
  const [documentUrl, setDocumentUrl] = useState<string>("");
  
  const { data: feedstocks } = trpc.feedstocks.search.useQuery(
    {},
    { enabled: !!user }
  );

  const createMutation = trpc.qualityTests.create.useMutation({
    onSuccess: () => {
      toast.success("Quality test uploaded successfully");
      setLocation("/supplier/feedstocks");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload quality test");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedstockId || !testType || !testDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const parameters: Record<string, any> = {};
    if (moistureContent) parameters.moistureContent = parseFloat(moistureContent);
    if (ashContent) parameters.ashContent = parseFloat(ashContent);
    if (heatingValue) parameters.heatingValue = parseFloat(heatingValue);
    if (sulfurContent) parameters.sulfurContent = parseFloat(sulfurContent);

    createMutation.mutate({
      feedstockId: parseInt(feedstockId),
      testDate: new Date(testDate),
      parameters: JSON.stringify(parameters),
      reportUrl: documentUrl || undefined,
      laboratory: testType,
      overallPass: true,
    });
  };

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <FileUp className="h-10 w-10" />
            Upload Quality Test
          </h1>
          <p className="text-muted-foreground">
            Add laboratory test results for your feedstock
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quality Test Report</CardTitle>
            <CardDescription>
              Upload test results to improve your ABFI quality score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedstock Selection */}
              <div>
                <Label htmlFor="feedstock">Feedstock *</Label>
                <Select value={feedstockId} onValueChange={setFeedstockId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedstock" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedstocks?.map((f: any) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.abfiId || `Feedstock #${f.id}`} - {f.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Test Type */}
              <div>
                <Label htmlFor="testType">Test Type *</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proximate">Proximate Analysis</SelectItem>
                    <SelectItem value="ultimate">Ultimate Analysis</SelectItem>
                    <SelectItem value="heating_value">Heating Value Test</SelectItem>
                    <SelectItem value="moisture">Moisture Content Test</SelectItem>
                    <SelectItem value="ash">Ash Content Test</SelectItem>
                    <SelectItem value="sulfur">Sulfur Content Test</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Date */}
              <div>
                <Label htmlFor="testDate">Test Date *</Label>
                <Input
                  id="testDate"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Test Parameters */}
              <div className="space-y-4">
                <h3 className="font-semibold">Test Parameters</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="moisture">Moisture Content (%)</Label>
                    <Input
                      id="moisture"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 12.5"
                      value={moistureContent}
                      onChange={(e) => setMoistureContent(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ash">Ash Content (%)</Label>
                    <Input
                      id="ash"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 3.2"
                      value={ashContent}
                      onChange={(e) => setAshContent(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="heating">Heating Value (MJ/kg)</Label>
                    <Input
                      id="heating"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 18.5"
                      value={heatingValue}
                      onChange={(e) => setHeatingValue(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sulfur">Sulfur Content (%)</Label>
                    <Input
                      id="sulfur"
                      type="number"
                      step="0.001"
                      placeholder="e.g., 0.05"
                      value={sulfurContent}
                      onChange={(e) => setSulfurContent(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <Label htmlFor="document">Test Report Document (URL)</Label>
                <Input
                  id="document"
                  type="url"
                  placeholder="https://example.com/test-report.pdf"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your PDF report to S3 and paste the URL here
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/supplier/feedstocks")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Test
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Why upload quality tests?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Improves your ABFI quality score (25% of total rating)</li>
              <li>• Builds buyer confidence with verified data</li>
              <li>• Demonstrates consistent quality standards</li>
              <li>• Required for premium feedstock listings</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
