import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ListChecks, 
  Store, 
  ShoppingCart, 
  Map, 
  Settings,
  TrendingDown,
  ArrowRight,
  Plus,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StoreSpecificList } from "@shared/schema";
import { generatePriceComparisons, optimizeShoppingList } from "@/ai-services/recipe-ai";

interface ShoppingItem {
  name: string;
  quantity: string;
}

export function SmartShoppingAssistant() {
  const [currentItem, setCurrentItem] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState("1");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const { toast } = useToast();

  // Get nearby stores
  const { data: stores } = useQuery({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stores");
      return res.json();
    },
  });

  // Get store-specific lists
  const { data: storeLists } = useQuery({
    queryKey: ["/api/store-lists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/store-lists");
      return res.json() as Promise<StoreSpecificList[]>;
    },
  });

  // Optimize shopping list
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      // Get user's location (in a real app, would use proper geolocation)
      const userLocation = { lat: 40.7128, lng: -74.0060 };
      return optimizeShoppingList(items, userLocation, {
        maxStores: 3,
        prioritizeSustainability: true,
        maxTravelDistance: 10,
      });
    },
    onSuccess: (data) => {
      // Save optimized lists to database
      data.optimizedLists.forEach(async (list) => {
        await apiRequest("POST", "/api/store-lists", {
          name: `Optimized List - ${new Date().toLocaleDateString()}`,
          storeId: stores?.find(s => s.name === list.storeName)?.id,
          items: list.items,
          totalEstimatedCost: list.totalCost,
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/store-lists"] });
      toast({
        title: "Shopping list optimized!",
        description: data.reasoning,
      });
    },
  });

  // Compare prices
  const comparePricesMutation = useMutation({
    mutationFn: async () => {
      const userLocation = { lat: 40.7128, lng: -74.0060 };
      return generatePriceComparisons(
        items.map(i => i.name),
        userLocation
      );
    },
  });

  const addItem = () => {
    if (currentItem.trim()) {
      setItems(prev => [...prev, { 
        name: currentItem.trim(), 
        quantity: currentQuantity 
      }]);
      setCurrentItem("");
      setCurrentQuantity("1");
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Smart Shopping Assistant
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">
              <ListChecks className="h-4 w-4 mr-2" />
              Shopping List
            </TabsTrigger>
            <TabsTrigger value="stores">
              <Map className="h-4 w-4 mr-2" />
              Store Lists
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentItem}
                onChange={(e) => setCurrentItem(e.target.value)}
                placeholder="Add item..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Input
                type="number"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                className="w-20"
                min="1"
              />
              <Button onClick={addItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Qty: {item.quantity}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => comparePricesMutation.mutate()}
                disabled={items.length === 0 || comparePricesMutation.isPending}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Compare Prices
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => optimizeMutation.mutate()}
                disabled={items.length === 0 || optimizeMutation.isPending}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Optimize List
              </Button>
            </div>

            {/* Price Comparisons */}
            {comparePricesMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Price Comparisons</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {comparePricesMutation.data.map((comparison, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <h4 className="font-medium mb-2">{comparison.productName}</h4>
                        <div className="space-y-2">
                          {comparison.stores.map((store, storeIndex) => (
                            <div 
                              key={storeIndex}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{store.storeName}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  ${store.price.toFixed(2)}/{store.unit}
                                </span>
                                {store.onSale && (
                                  <Badge>On Sale</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stores">
            <div className="space-y-4">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a store..." />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                {storeLists?.filter(list => 
                  !selectedStore || list.storeId.toString() === selectedStore
                ).map((list) => (
                  <Card key={list.id} className="mb-4 last:mb-0">
                    <CardHeader>
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {list.items.map((item: any, index: number) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <span>{item.name}</span>
                            <Badge variant="outline">
                              {item.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {list.totalEstimatedCost && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Estimated Total:
                            </span>
                            <span className="font-medium">
                              ${list.totalEstimatedCost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Shopping Preferences</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Maximum stores to visit</span>
                  <Input type="number" className="w-20" defaultValue="3" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Maximum travel distance (km)</span>
                  <Input type="number" className="w-20" defaultValue="10" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Prioritize sustainability</span>
                  <Select defaultValue="false">
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}