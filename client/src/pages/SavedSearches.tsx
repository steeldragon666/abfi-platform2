import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Bookmark, Search, Trash2, Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function SavedSearches() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchCriteria, setSearchCriteria] = useState("");
  
  const { data: searches, isLoading, refetch } = trpc.savedSearches.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const createMutation = trpc.savedSearches.create.useMutation({
    onSuccess: () => {
      toast.success("Search saved successfully");
      setDialogOpen(false);
      setSearchName("");
      setSearchCriteria("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save search");
    },
  });

  const deleteMutation = trpc.savedSearches.delete.useMutation({
    onSuccess: () => {
      toast.success("Search deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete search");
    },
  });

  const handleCreate = () => {
    if (!searchName.trim()) {
      toast.error("Please enter a search name");
      return;
    }
    
    createMutation.mutate({
      name: searchName,
      criteria: searchCriteria || "{}",
      notifyOnNewMatches: false,
    });
  };

  const handleDelete = (searchId: number) => {
    if (confirm("Are you sure you want to delete this saved search?")) {
      deleteMutation.mutate({ searchId });
    }
  };

  const handleRunSearch = (criteria: string) => {
    // Parse criteria and navigate to browse page with filters
    try {
      const params = JSON.parse(criteria);
      const queryString = new URLSearchParams(params).toString();
      setLocation(`/browse?${queryString}`);
    } catch {
      setLocation("/browse");
    }
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
      <div className="container py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Saved Searches</h1>
            <p className="text-muted-foreground">
              Save your search criteria and get alerts for new matches
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Bookmark className="h-4 w-4 mr-2" />
                Save New Search
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Search</DialogTitle>
                <DialogDescription>
                  Give your search a name and optionally add filter criteria
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Search Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., NSW Oilseed Suppliers"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="criteria">Filter Criteria (JSON)</Label>
                  <Input
                    id="criteria"
                    placeholder='{"category": ["oilseed"], "state": ["NSW"]}'
                    value={searchCriteria}
                    onChange={(e) => setSearchCriteria(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Add JSON criteria from your current search
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Search"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searches && searches.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {searches.map((search: any) => (
              <Card key={search.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5" />
                        {search.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Created {new Date(search.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {search.alertEnabled ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Bell className="h-3 w-3 mr-1" />
                          Alerts On
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <BellOff className="h-3 w-3 mr-1" />
                          Alerts Off
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {search.criteria && search.criteria !== "{}" && (
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-xs font-mono text-muted-foreground overflow-x-auto">
                        {search.criteria}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRunSearch(search.criteria)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Run Search
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(search.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved searches yet</h3>
              <p className="text-muted-foreground mb-4">
                Save your search criteria to quickly find feedstocks that match your requirements
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save Your First Search
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Search</DialogTitle>
                    <DialogDescription>
                      Give your search a name and optionally add filter criteria
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Search Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., NSW Oilseed Suppliers"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="criteria">Filter Criteria (JSON)</Label>
                      <Input
                        id="criteria"
                        placeholder='{"category": ["oilseed"], "state": ["NSW"]}'
                        value={searchCriteria}
                        onChange={(e) => setSearchCriteria(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Saving..." : "Save Search"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
