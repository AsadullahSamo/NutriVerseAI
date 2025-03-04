import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShoppingCart, DollarSign, BarChart3, Star, Info, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { KitchenEquipment, getEquipmentShoppingRecommendations } from "../../../ai-services/kitchen-inventory-ai";

interface EquipmentShoppingRecommendationsProps {
  equipment: KitchenEquipment[];
}

export function EquipmentShoppingRecommendations({ equipment }: EquipmentShoppingRecommendationsProps) {
  const [budget, setBudget] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [activeTab, setActiveTab] = useState("recommended");
  const [priorityCategories, setPriorityCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const equipmentCategories = [
    "Cookware",
    "Bakeware",
    "Cutlery",
    "Utensils",
    "Small Appliances",
    "Large Appliances",
    "Storage",
    "Measuring Tools",
    "Specialty"
  ];

  const toggleCategory = (category: string) => {
    if (priorityCategories.includes(category)) {
      setPriorityCategories(priorityCategories.filter(c => c !== category));
    } else {
      setPriorityCategories([...priorityCategories, category]);
    }
  };

  // Query to get user cooking preferences (would normally come from user profile)
  const { data: cookingPreferences } = useQuery({
    queryKey: ["/api/user/cooking-preferences"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/user/cooking-preferences");
        return response;
      } catch (error) {
        console.error("Error fetching cooking preferences:", error);
        // Fallback preferences for demo
        return ["Italian", "Asian", "Baking", "Healthy", "Quick Meals"];
      }
    }
  });

  // Query to get AI recommendations based on equipment and preferences
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ["/api/equipment-shopping-recommendations", budget, priorityCategories.join(',')],
    queryFn: async () => {
      if (!equipment.length || !cookingPreferences) {
        return null;
      }
      
      try {
        // First try the API endpoint
        const response = await apiRequest("GET", "/api/equipment-shopping-recommendations", {
          budget: budget || undefined,
          priorityCategories: priorityCategories.length ? priorityCategories : undefined
        });
        return response;
      } catch (error) {
        // Fall back to the AI service
        return await getEquipmentShoppingRecommendations(
          equipment, 
          cookingPreferences,
          typeof budget === 'number' ? budget : undefined,
          priorityCategories.length ? priorityCategories : undefined
        );
      }
    },
    enabled: !!cookingPreferences && equipment.length > 0
  });

  // Reset and regenerate recommendations when filters change
  useEffect(() => {
    if (cookingPreferences) {
      refetch();
    }
  }, [budget, priorityCategories, refetch, cookingPreferences]);
  
  // Handle sorting of recommendations
  const sortedRecommendations = recommendations?.recommendations
    ? [...recommendations.recommendations].sort((a, b) => {
        switch (sortBy) {
          case "priority":
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority as keyof typeof priorityOrder] - 
                  priorityOrder[b.priority as keyof typeof priorityOrder];
          case "price-low":
            return (Number(a.estimatedPrice?.replace(/[^0-9.-]+/g, "")) || 0) - 
                  (Number(b.estimatedPrice?.replace(/[^0-9.-]+/g, "")) || 0);
          case "price-high":
            return (Number(b.estimatedPrice?.replace(/[^0-9.-]+/g, "")) || 0) - 
                  (Number(a.estimatedPrice?.replace(/[^0-9.-]+/g, "")) || 0);
          case "versatility":
            return b.versatilityScore - a.versatilityScore;
          default:
            return 0;
        }
      })
    : [];
  
  // Filter recommendations by category or priority based on active tab
  const filteredRecommendations = sortedRecommendations?.filter(rec => {
    if (activeTab === "recommended") return true;
    if (activeTab === "high-priority") return rec.priority === "high";
    return rec.category === activeTab;
  });
  
  // Generate tabs based on available categories in recommendations
  const availableCategories = recommendations?.recommendations
    ? Array.from(new Set(recommendations.recommendations.map(r => r.category)))
    : [];
  
  // Generate budget allocation data for visualization
  const budgetAllocation = recommendations?.budgetAllocation;
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Equipment Shopping Recommendations</CardTitle>
          <CardDescription>
            Finding the best kitchen equipment for your needs
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Generating personalized recommendations...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Equipment Shopping Recommendations</CardTitle>
        <CardDescription>
          AI-powered recommendations for your next kitchen equipment purchases
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters and Budget */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Budget Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Your Budget (optional)</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    placeholder="Enter amount"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setBudget('')}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {budgetAllocation && Object.keys(budgetAllocation).length > 0 && typeof budget === 'number' && (
                <div className="pt-4 space-y-3">
                  <h4 className="text-sm font-medium">Suggested Budget Allocation</h4>
                  {Object.entries(budgetAllocation).map(([category, allocation]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{category}</span>
                        <span>${allocation.amount.toFixed(2)} ({allocation.percentage}%)</span>
                      </div>
                      <Progress value={allocation.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Priority Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {equipmentCategories.map(category => (
                  <Badge 
                    key={category} 
                    variant={priorityCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sorting options */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by" className="text-sm">Sort by:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="versatility">Versatility</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Recommendations are based on your current equipment inventory, cooking preferences, and typical recipes.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex gap-1 items-center"
              onClick={() => refetch()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Recommendations */}
        {sortedRecommendations && sortedRecommendations.length > 0 ? (
          <Tabs defaultValue="recommended" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex overflow-auto pb-1 mb-6 w-full">
              <TabsTrigger value="recommended" className="flex-shrink-0">All Recommendations</TabsTrigger>
              <TabsTrigger value="high-priority" className="flex-shrink-0">High Priority</TabsTrigger>
              {availableCategories.map((category) => (
                <TabsTrigger key={category} value={category} className="flex-shrink-0">{category}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="pt-4">
              {filteredRecommendations && filteredRecommendations.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRecommendations.map((item, index) => (
                    <Card key={index} className="group hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-lg">{item.itemName}</h3>
                            <Badge 
                              className={
                                item.priority === 'high'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : item.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }
                            >
                              {item.priority} priority
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">{item.category}</div>
                          
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Estimated Price:</span>
                              <span className="font-semibold">{item.estimatedPrice}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" /> Versatility:
                              </span>
                              <div className="flex items-center gap-1">
                                <Progress value={item.versatilityScore} className="w-16 h-2" />
                                <span>{item.versatilityScore}/100</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t">
                            <h4 className="text-sm font-medium mb-2">Why you need this:</h4>
                            <p className="text-sm text-muted-foreground">{item.reason}</p>
                          </div>
                          
                          {item.alternativeOptions && item.alternativeOptions.length > 0 && (
                            <div>
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="alternatives">
                                  <AccordionTrigger className="text-sm py-2">
                                    Alternative Options
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-3">
                                      {item.alternativeOptions.map((alt, idx) => (
                                        <div key={idx} className="bg-muted/50 p-3 rounded-md">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-sm">{alt.name}</span>
                                            <span className="text-xs">{alt.estimatedPrice}</span>
                                          </div>
                                          <div className="text-xs space-y-1 mt-2">
                                            <div>
                                              <span className="text-green-600">Pros:</span>
                                              <ul className="list-disc list-inside ml-1">
                                                {alt.pros.map((pro, i) => (
                                                  <li key={i}>{pro}</li>
                                                ))}
                                              </ul>
                                            </div>
                                            <div>
                                              <span className="text-red-600">Cons:</span>
                                              <ul className="list-disc list-inside ml-1">
                                                {alt.cons.map((con, i) => (
                                                  <li key={i}>{con}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="px-4 pb-4 pt-0">
                        <Button className="w-full gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Add to Shopping List
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No recommendations found in this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No recommendations available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try refreshing or adjusting your filters
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Generate Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}