"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Loader2,
  TrendingDown,
  AlertTriangle,
  Truck,
  Scale,
  FileText,
  Zap,
} from "lucide-react";
import type { ScenarioType, FeedstockCategory } from "@/types/database";

const scenarioTypes: {
  value: ScenarioType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "price_shock",
    label: "Price Shock",
    description: "Model impact of sudden feedstock price increases",
    icon: <TrendingDown className="h-5 w-5" />,
  },
  {
    value: "supply_disruption",
    label: "Supply Disruption",
    description: "Analyze effects of supplier failures or shortages",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    value: "covenant_breach",
    label: "Covenant Breach",
    description: "Combined stress test for lender covenant assessment",
    icon: <Scale className="h-5 w-5" />,
  },
  {
    value: "regulatory",
    label: "Regulatory Change",
    description: "Impact of carbon intensity or mandate changes",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    value: "custom",
    label: "Custom Scenario",
    description: "Define your own multi-factor stress test",
    icon: <Zap className="h-5 w-5" />,
  },
];

const feedstockCategories: FeedstockCategory[] = [
  "oilseed",
  "UCO",
  "tallow",
  "lignocellulosic",
  "waste",
  "algae",
  "bamboo",
  "other",
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  scenario_type: z.enum([
    "price_shock",
    "supply_disruption",
    "covenant_breach",
    "regulatory",
    "custom",
  ]),
  // Price shock parameters
  price_shock_percentage: z.number().min(0).max(200).optional(),
  // Supply disruption parameters
  supply_reduction_percentage: z.number().min(0).max(100).optional(),
  affected_categories: z.array(z.string()).optional(),
  // Regulatory parameters
  carbon_price_increase: z.number().min(0).max(500).optional(),
  regulatory_threshold_change: z.number().min(-50).max(50).optional(),
  // Duration
  duration_months: z.number().min(1).max(60).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewScenarioPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<ScenarioType | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      scenario_type: "price_shock",
      price_shock_percentage: 30,
      supply_reduction_percentage: 25,
      affected_categories: [],
      carbon_price_increase: 50,
      regulatory_threshold_change: -10,
      duration_months: 12,
    },
  });

  const scenarioType = form.watch("scenario_type");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Build parameters based on scenario type
      const parameters: Record<string, unknown> = {};

      if (data.scenario_type === "price_shock" || data.scenario_type === "custom" || data.scenario_type === "covenant_breach") {
        if (data.price_shock_percentage) {
          parameters.price_shock_percentage = data.price_shock_percentage;
        }
      }

      if (data.scenario_type === "supply_disruption" || data.scenario_type === "custom" || data.scenario_type === "covenant_breach") {
        if (data.supply_reduction_percentage) {
          parameters.supply_reduction_percentage = data.supply_reduction_percentage;
        }
        if (data.affected_categories && data.affected_categories.length > 0) {
          parameters.affected_categories = data.affected_categories;
        }
      }

      if (data.scenario_type === "regulatory" || data.scenario_type === "custom") {
        if (data.carbon_price_increase) {
          parameters.carbon_price_increase = data.carbon_price_increase;
        }
        if (data.regulatory_threshold_change) {
          parameters.regulatory_threshold_change = data.regulatory_threshold_change;
        }
      }

      if (data.duration_months) {
        parameters.duration_months = data.duration_months;
      }

      const response = await fetch("/api/bankability/stress-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          scenario_type: data.scenario_type,
          parameters,
          run_immediately: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stress test");
      }

      const result = await response.json();
      toast.success("Stress test completed!");
      router.push(`/buyer/bankability/scenarios/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run stress test");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/buyer/bankability">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Stress Test Scenario</h1>
          <p className="text-muted-foreground">
            Model adverse market conditions and assess impact on your supply chain
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Scenario Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Type</CardTitle>
              <CardDescription>Choose the type of stress test to run</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="scenario_type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {scenarioTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                              field.value === type.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/50"
                            }`}
                            onClick={() => {
                              field.onChange(type.value);
                              setSelectedType(type.value);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`${field.value === type.value ? "text-primary" : "text-muted-foreground"}`}>
                                {type.icon}
                              </div>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q1 2025 Price Shock Analysis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the scenario and its purpose..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 12)}
                      />
                    </FormControl>
                    <FormDescription>
                      How long the adverse conditions persist
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Price Shock Parameters */}
          {(scenarioType === "price_shock" || scenarioType === "covenant_breach" || scenarioType === "custom") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Price Shock Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="price_shock_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Increase (%)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            className="w-32"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <div className="flex gap-2">
                            {[15, 30, 50, 100].map((val) => (
                              <Badge
                                key={val}
                                variant={field.value === val ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => field.onChange(val)}
                              >
                                {val}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Percentage increase in feedstock prices
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Supply Disruption Parameters */}
          {(scenarioType === "supply_disruption" || scenarioType === "covenant_breach" || scenarioType === "custom") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Supply Disruption Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="supply_reduction_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supply Reduction (%)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-32"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <div className="flex gap-2">
                            {[10, 25, 50, 75].map((val) => (
                              <Badge
                                key={val}
                                variant={field.value === val ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => field.onChange(val)}
                              >
                                {val}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Percentage of supply that becomes unavailable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="affected_categories"
                  render={() => (
                    <FormItem>
                      <FormLabel>Affected Categories (Optional)</FormLabel>
                      <FormDescription>
                        Select specific categories affected, or leave empty for all
                      </FormDescription>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {feedstockCategories.map((category) => (
                          <FormField
                            key={category}
                            control={form.control}
                            name="affected_categories"
                            render={({ field }) => (
                              <FormItem key={category}>
                                <FormControl>
                                  <div
                                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                      field.value?.includes(category)
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-muted-foreground/50"
                                    }`}
                                    onClick={() => {
                                      const current = field.value || [];
                                      const updated = current.includes(category)
                                        ? current.filter((c) => c !== category)
                                        : [...current, category];
                                      field.onChange(updated);
                                    }}
                                  >
                                    {category}
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Regulatory Parameters */}
          {(scenarioType === "regulatory" || scenarioType === "custom") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Regulatory Change Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="carbon_price_increase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbon Price Increase (%)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min={0}
                            max={500}
                            className="w-32"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <div className="flex gap-2">
                            {[50, 100, 200].map((val) => (
                              <Badge
                                key={val}
                                variant={field.value === val ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => field.onChange(val)}
                              >
                                +{val}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Increase in carbon credit/permit prices
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regulatory_threshold_change"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CI Threshold Change (gCO2e/MJ)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min={-50}
                            max={50}
                            className="w-32"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <div className="flex gap-2">
                            {[-5, -10, -15].map((val) => (
                              <Badge
                                key={val}
                                variant={field.value === val ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => field.onChange(val)}
                              >
                                {val}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Change in allowable carbon intensity threshold (negative = stricter)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Disclaimer</p>
                  <p>
                    This stress test uses simplified models based on your transaction history and
                    market assumptions. Results are for informational purposes only and do not
                    constitute financial advice. Actual outcomes may vary significantly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/buyer/bankability">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                "Run Stress Test"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
