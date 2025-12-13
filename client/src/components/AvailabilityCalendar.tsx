import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AvailabilityWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  volume: number; // tonnes
  notes?: string;
}

interface AvailabilityCalendarProps {
  value: AvailabilityWindow[];
  onChange: (windows: AvailabilityWindow[]) => void;
  className?: string;
}

export function AvailabilityCalendar({
  value,
  onChange,
  className = "",
}: AvailabilityCalendarProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [volume, setVolume] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!startDate || !endDate || !volume) return;

    const newWindow: AvailabilityWindow = {
      id: Date.now().toString(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      volume: parseInt(volume),
      notes,
    };

    onChange([...value, newWindow]);
    
    // Reset form
    setStartDate("");
    setEndDate("");
    setVolume("");
    setNotes("");
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((w) => w.id !== id));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getMonthLabel = (date: Date) => {
    return new Date(date).toLocaleDateString("en-AU", {
      month: "long",
      year: "numeric",
    });
  };

  // Group windows by month
  const groupedWindows = value.reduce((acc, window) => {
    const monthKey = getMonthLabel(window.startDate);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(window);
    return acc;
  }, {} as Record<string, AvailabilityWindow[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability Calendar
            </CardTitle>
            <CardDescription>
              Specify when your feedstock will be available for delivery
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "outline" : "default"}
          >
            {showAddForm ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add Window
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Available Volume (tonnes)</Label>
              <Input
                id="volume"
                type="number"
                placeholder="1000"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Subject to weather conditions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleAdd} className="w-full">
              Add Availability Window
            </Button>
          </div>
        )}

        {value.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No availability windows added yet</p>
            <p className="text-xs mt-1">Click "Add Window" to specify when feedstock is available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedWindows)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([month, windows]) => (
                <div key={month}>
                  <div className="text-sm font-semibold mb-2 text-muted-foreground">
                    {month}
                  </div>
                  <div className="space-y-2">
                    {windows.map((window) => (
                      <div
                        key={window.id}
                        className="flex items-start justify-between p-3 border rounded-lg bg-background"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {formatDate(window.startDate)} - {formatDate(window.endDate)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {window.volume.toLocaleString()}t
                            </Badge>
                          </div>
                          {window.notes && (
                            <p className="text-xs text-muted-foreground">{window.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(window.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {value.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Available Volume</span>
              <span className="font-semibold">
                {value.reduce((sum, w) => sum + w.volume, 0).toLocaleString()} tonnes
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AvailabilityDisplayProps {
  windows: AvailabilityWindow[];
  compact?: boolean;
  className?: string;
}

export function AvailabilityDisplay({
  windows,
  compact = false,
  className = "",
}: AvailabilityDisplayProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalVolume = windows.reduce((sum, w) => sum + w.volume, 0);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {windows.length} window{windows.length !== 1 ? "s" : ""} • {totalVolume.toLocaleString()}t total
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium mb-3">
        <Calendar className="h-4 w-4" />
        Availability Windows
      </div>
      {windows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No availability windows specified</p>
      ) : (
        <div className="space-y-2">
          {windows.map((window) => (
            <div key={window.id} className="flex items-center justify-between text-sm border-l-2 border-primary pl-3 py-1">
              <div>
                <div className="font-medium">
                  {formatDate(window.startDate)} - {formatDate(window.endDate)}
                </div>
                {window.notes && (
                  <div className="text-xs text-muted-foreground">{window.notes}</div>
                )}
              </div>
              <Badge variant="outline">{window.volume.toLocaleString()}t</Badge>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{totalVolume.toLocaleString()} tonnes</span>
          </div>
        </div>
      )}
    </div>
  );
}
