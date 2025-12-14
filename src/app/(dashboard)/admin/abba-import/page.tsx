"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ImportLog {
  id: string;
  import_type: string;
  source_file: string | null;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: Array<{ row: number; message: string }>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ImportResult {
  success: boolean;
  import_type: string;
  records_processed: number;
  records_created: number;
  records_failed: number;
  errors: Array<{ row: number; message: string }>;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function ABBAImportPage() {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<string>("price");
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImportLogs();
  }, []);

  const fetchImportLogs = async () => {
    try {
      const response = await fetch("/api/admin/abba-import?limit=20");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setImportLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching import logs:", error);
      toast.error("Failed to load import history");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    setLastResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("import_type", importType);

      const response = await fetch("/api/admin/abba-import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setLastResult(result);

      if (result.success) {
        toast.success(`Successfully imported ${result.records_created} records`);
      } else {
        toast.warning(`Import completed with ${result.records_failed} errors`);
      }

      // Refresh the logs
      fetchImportLogs();
    } catch (error) {
      console.error("Error importing file:", error);
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadTemplate = (type: string) => {
    let csv = "";
    let filename = "";

    if (type === "price") {
      csv = "feedstock_category,region,price_date,price_aud_per_tonne,price_usd_per_tonne,price_low,price_high,volume_available_tonnes,source\n";
      csv += "UCO,AU,2024-01-15,850,560,820,880,5000,ABBA\n";
      csv += "Tallow,AU,2024-01-15,780,515,750,810,3000,ABBA\n";
      filename = "abba_price_template.csv";
    } else {
      csv = "name,category,description,region,supplier_name,volume_tonnes,price_low,price_high,carbon_intensity,certification,available_from\n";
      csv += "Sydney UCO,UCO,Used cooking oil from Sydney metro,AU,Sydney Oils,1000,820,880,15.5,ISCC,2024-02-01\n";
      filename = "abba_feedstock_template.csv";
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ABBA Data Import</h1>
          <p className="text-muted-foreground">
            Import market prices and feedstock data from ABBA
          </p>
        </div>
      </div>

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Upload a CSV file to import market prices or feedstock data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Import Type</label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Market Prices</SelectItem>
                  <SelectItem value="feedstock">Feedstock Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => downloadTemplate(importType)}
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
              disabled={importing}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">
                {importing ? "Importing..." : "Drop CSV file here or click to upload"}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports ABBA format CSV files
              </p>
            </label>
            {importing && <Progress value={50} className="mt-4 w-64 mx-auto" />}
          </div>

          {/* Last Import Result */}
          {lastResult && (
            <Alert variant={lastResult.success ? "default" : "destructive"}>
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {lastResult.success ? "Import Successful" : "Import Completed with Errors"}
              </AlertTitle>
              <AlertDescription>
                <p>
                  Processed: {lastResult.records_processed} | Created:{" "}
                  {lastResult.records_created} | Failed: {lastResult.records_failed}
                </p>
                {lastResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">
                      View {lastResult.errors.length} error(s)
                    </summary>
                    <ul className="mt-2 text-xs space-y-1">
                      {lastResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>
                          Row {err.row}: {err.message}
                        </li>
                      ))}
                      {lastResult.errors.length > 10 && (
                        <li>...and {lastResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import History
          </CardTitle>
          <CardDescription>Previous data imports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading import history...
            </div>
          ) : importLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No import history yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="capitalize">{log.import_type}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.source_file || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[log.status]?.variant || "secondary"}>
                        {log.status === "completed" && (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        {log.status === "failed" && (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {log.status === "processing" && (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {statusConfig[log.status]?.label || log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {log.records_processed}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {log.records_created}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {log.records_failed}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h4>Market Prices CSV Format</h4>
          <p>Required columns:</p>
          <ul>
            <li><strong>feedstock_category</strong>: UCO, Tallow, Palm_PFAD, Canola, etc.</li>
            <li><strong>region</strong>: AU, EU, US, or APAC</li>
            <li><strong>price_date</strong>: Date in YYYY-MM-DD format</li>
            <li><strong>price_aud_per_tonne</strong>: Price in AUD</li>
          </ul>
          <p>Optional columns: price_usd_per_tonne, price_low, price_high, volume_available_tonnes, source</p>

          <h4>Feedstock Data CSV Format</h4>
          <p>Required columns:</p>
          <ul>
            <li><strong>name</strong>: Feedstock name</li>
            <li><strong>category</strong>: UCO, Tallow, etc.</li>
          </ul>
          <p>Optional columns: description, region, supplier_name, volume_tonnes, price_low, price_high, carbon_intensity, certification, available_from</p>
        </CardContent>
      </Card>
    </div>
  );
}
