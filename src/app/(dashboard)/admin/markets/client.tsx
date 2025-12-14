"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  ArrowRightLeft,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface MarketSignal {
  id: string;
  user_id: string;
  commodity_id: string;
  commodity_name: string;
  commodity_category: string | null;
  signal_type: "buy" | "sell";
  volume: number | null;
  unit: string | null;
  target_price: number | null;
  price_currency: string;
  status: "active" | "fulfilled" | "expired" | "cancelled" | "matched";
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  } | null;
}

interface MarketMatch {
  id: string;
  buy_signal_id: string;
  sell_signal_id: string;
  match_score: number;
  status: string;
  created_at: string;
  buy_signal: {
    commodity_name: string;
    volume: number | null;
    unit: string | null;
    profiles: { full_name: string | null; company_name: string | null } | null;
  } | null;
  sell_signal: {
    commodity_name: string;
    volume: number | null;
    unit: string | null;
    profiles: { full_name: string | null; company_name: string | null } | null;
  } | null;
}

interface Stats {
  total: number;
  active: number;
  buySignals: number;
  sellSignals: number;
}

interface AdminMarketsClientProps {
  signals: MarketSignal[];
  matches: MarketMatch[];
  stats: Stats;
}

export function AdminMarketsClient({ signals, matches, stats }: AdminMarketsClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [localSignals, setLocalSignals] = useState(signals);
  const supabase = createClient();

  const filteredSignals = localSignals.filter((signal) => {
    const matchesSearch =
      signal.commodity_name.toLowerCase().includes(search.toLowerCase()) ||
      signal.profiles?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      signal.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || signal.signal_type === typeFilter;
    const matchesStatus = statusFilter === "all" || signal.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = async (signalId: string, newStatus: string) => {
    const { error } = await supabase
      .from("market_signals")
      .update({ status: newStatus })
      .eq("id", signalId);

    if (error) {
      toast.error("Failed to update signal status");
      return;
    }

    setLocalSignals((prev) =>
      prev.map((s) => (s.id === signalId ? { ...s, status: newStatus as MarketSignal["status"] } : s))
    );
    toast.success("Signal status updated");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
      active: { variant: "default", icon: Activity },
      fulfilled: { variant: "secondary", icon: CheckCircle },
      expired: { variant: "outline", icon: Clock },
      cancelled: { variant: "destructive", icon: Ban },
      matched: { variant: "default", icon: ArrowRightLeft },
    };
    const { variant, icon: Icon } = variants[status] || { variant: "outline", icon: AlertCircle };
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Market Monitoring</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage buy/sell signals across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time market signals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buy Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.buySignals}</div>
            <p className="text-xs text-muted-foreground">
              Active buy signals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sell Interest</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sellSignals}</div>
            <p className="text-xs text-muted-foreground">
              Active sell signals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">All Signals</TabsTrigger>
          <TabsTrigger value="matches">Potential Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by commodity, company, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signals Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>User / Company</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No signals found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSignals.map((signal) => (
                    <TableRow key={signal.id}>
                      <TableCell>
                        <Badge variant={signal.signal_type === "buy" ? "default" : "secondary"}>
                          {signal.signal_type === "buy" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {signal.signal_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{signal.commodity_name}</div>
                        {signal.commodity_category && (
                          <div className="text-xs text-muted-foreground">
                            {signal.commodity_category}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {signal.profiles?.full_name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {signal.profiles?.company_name || signal.profiles?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {signal.volume ? (
                          <span>
                            {signal.volume.toLocaleString()} {signal.unit || "units"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {signal.target_price ? (
                          <span>
                            ${signal.target_price.toLocaleString()} {signal.price_currency}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Market</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(signal.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(signal.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {signal.status === "active" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(signal.id, "fulfilled")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Fulfilled
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(signal.id, "cancelled")}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Cancel Signal
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Potential Matches</CardTitle>
              <CardDescription>
                Buy and sell signals that could be matched based on commodity, volume, and location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No potential matches found yet</p>
                  <p className="text-sm">Matches will appear when compatible buy/sell signals are detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {/* Buyer */}
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            {match.buy_signal?.profiles?.company_name || "Buyer"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Wants {match.buy_signal?.volume?.toLocaleString()}{" "}
                            {match.buy_signal?.unit}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                          <Badge variant="outline">{match.match_score}% match</Badge>
                        </div>

                        {/* Seller */}
                        <div>
                          <div className="font-medium text-blue-600">
                            {match.sell_signal?.profiles?.company_name || "Seller"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Has {match.sell_signal?.volume?.toLocaleString()}{" "}
                            {match.sell_signal?.unit}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge>{match.buy_signal?.commodity_name}</Badge>
                        <Button size="sm" variant="outline">
                          Facilitate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
