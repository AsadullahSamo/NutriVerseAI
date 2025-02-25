import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPantryItemSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";

interface CreatePantryItemDialogProps {
  trigger?: React.ReactNode;
}

export function CreatePantryItemDialog({ trigger }: CreatePantryItemDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertPantryItemSchema),
    defaultValues: {
      userId: user?.id,
      name: "",
      quantity: "",
      category: "",
      expiryDate: undefined,
      nutritionInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      sustainabilityInfo: {
        score: 0,
        packaging: "recyclable",
        carbonFootprint: "low"
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // First create the pantry item
      const res = await apiRequest("POST", "/api/pantry", values);
      const newItem = await res.json();

      // Then update nutrition progress
      const today = new Date().toISOString().split('T')[0];
      await apiRequest("POST", "/api/nutrition-goals/progress", {
        progress: {
          date: today,
          calories: values.nutritionInfo.calories,
          protein: values.nutritionInfo.protein,
          carbs: values.nutritionInfo.carbs,
          fat: values.nutritionInfo.fat,
          completed: false,
        }
      });

      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Item added!",
        description: "Your pantry item has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-goals/current"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-background pb-4 mb-4">
          <DialogTitle>Add Pantry Item</DialogTitle>
        </DialogHeader>
        <div className="px-1 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            min={new Date().toISOString().split('T')[0]}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Nutrition Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Nutrition Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nutritionInfo"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Calories</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={(value as any)?.calories ?? '0'} 
                            onChange={e => {
                              const newValue = e.target.value ? parseInt(e.target.value) : 0;
                              onChange({ ...(value as any), calories: newValue });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nutritionInfo"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Protein (g)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={(value as any)?.protein ?? '0'} 
                            onChange={e => {
                              const newValue = e.target.value ? parseInt(e.target.value) : 0;
                              onChange({ ...(value as any), protein: newValue });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nutritionInfo"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Carbs (g)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={(value as any)?.carbs ?? '0'} 
                            onChange={e => {
                              const newValue = e.target.value ? parseInt(e.target.value) : 0;
                              onChange({ ...(value as any), carbs: newValue });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nutritionInfo"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Fat (g)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={(value as any)?.fat ?? '0'} 
                            onChange={e => {
                              const newValue = e.target.value ? parseInt(e.target.value) : 0;
                              onChange({ ...(value as any), fat: newValue });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sustainability Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Sustainability Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sustainabilityInfo.score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sustainability Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            min={0}
                            max={100}
                            placeholder="Enter score (0-100)"
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sustainabilityInfo.packaging"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Packaging Type</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., recyclable, biodegradable"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sustainabilityInfo.carbonFootprint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbon Footprint</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., low, medium, high"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
