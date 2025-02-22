import { useQuery, useMutation } from "@tanstack/react-query";
import { PantryItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, AlertTriangle, Loader2, ArrowUpDown, Trash2, Leaf } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { CreatePantryItemDialog } from "@/components/create-pantry-item-dialog";
import { EditPantryItemDialog } from "@/components/edit-pantry-item-dialog";
import { useToast } from "@/hooks/use-toast";
import { NutritionDisplay } from "@/components/nutrition-display";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type SustainabilityInfo = {
  score: number;
  packaging: string;
};

export default function PantryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const { data: pantryItems, isLoading } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/pantry/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      toast({
        title: "Item deleted",
        description: "Pantry item has been removed successfully.",
      });
    },
  });

  const filteredItems = pantryItems
    ?.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "all" || item.category === selectedCategory)
    )
    .sort((a, b) => {
      if (!a.expiryDate || !b.expiryDate) return 0;
      const dateA = new Date(a.expiryDate);
      const dateB = new Date(b.expiryDate);
      return sortOrder === "asc" 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

  const categories = Array.from(new Set(
    pantryItems
      ?.map(item => item.category)
      .filter((category): category is string => Boolean(category))
  ));

  const expiringItems = filteredItems?.filter((item) => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Smart Pantry</h1>
              <p className="text-muted-foreground mt-2">
                Track your ingredients and reduce food waste
              </p>
            </div>
            <CreatePantryItemDialog />
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search pantry items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(order => order === "asc" ? "desc" : "asc")}
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort by Expiry
              </Button>
            </div>
          </div>
        </header>

        {expiringItems && expiringItems.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {expiringItems.map((item) => (
                  <Card key={item.id} className="bg-card border-muted">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-orange-600 whitespace-nowrap">
                          Expires {format(new Date(item.expiryDate!), "MMM d")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems?.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-lg truncate">{item.name}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      {item.category && (
                        <p className="text-sm text-muted-foreground">
                          Category: {item.category}
                        </p>
                      )}
                      {item.expiryDate && (
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(item.expiryDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      <EditPantryItemDialog item={item} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 pt-4 border-t">
                  <NutritionDisplay nutrition={item.nutritionInfo as NutritionInfo} />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-500" />
                      <h4 className="text-sm font-medium">Sustainability Details</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Eco Score</span>
                        <Badge variant="outline" className={`${
                          (item.sustainabilityInfo as SustainabilityInfo).score >= 70 
                            ? 'text-green-500 border-green-200' 
                            : (item.sustainabilityInfo as SustainabilityInfo).score >= 40 
                            ? 'text-yellow-500 border-yellow-200'
                            : 'text-red-500 border-red-200'
                        }`}>
                          {(item.sustainabilityInfo as SustainabilityInfo).score || 0}/100
                        </Badge>
                      </div>
                      <Progress 
                        value={(item.sustainabilityInfo as SustainabilityInfo).score || 0} 
                        className={`h-2 ${
                          (item.sustainabilityInfo as SustainabilityInfo).score >= 70 
                            ? '[&>div]:bg-green-500' 
                            : (item.sustainabilityInfo as SustainabilityInfo).score >= 40 
                            ? '[&>div]:bg-yellow-500'
                            : '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Packaging Type</span>
                      <Badge variant="secondary" className={`${
                        (item.sustainabilityInfo as SustainabilityInfo).packaging?.toLowerCase() === 'recyclable'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : (item.sustainabilityInfo as SustainabilityInfo).packaging?.toLowerCase() === 'biodegradable'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {(item.sustainabilityInfo as SustainabilityInfo).packaging || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}