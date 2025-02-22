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

  const createPantryItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null
      };
      const res = await apiRequest("POST", "/api/pantry", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Item added!",
        description: "Your pantry item has been added successfully.",
      });
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
            <form onSubmit={form.handleSubmit((data) => createPantryItemMutation.mutate(data))} className="space-y-6">
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
              <FormField
                control={form.control}
                name="sustainabilityInfo"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Sustainability Information</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          placeholder="Sustainability Score (0-100)"
                          value={(value as any)?.score ?? '0'}
                          onChange={e => {
                            const score = e.target.value ? parseInt(e.target.value) : 0;
                            onChange({ ...(value as any), score });
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Packaging Type (e.g., recyclable)"
                          value={(value as any)?.packaging ?? ''}
                          onChange={e => {
                            onChange({ ...(value as any), packaging: e.target.value });
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Carbon Footprint (e.g., low)"
                          value={(value as any)?.carbonFootprint ?? ''}
                          onChange={e => {
                            onChange({ ...(value as any), carbonFootprint: e.target.value });
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createPantryItemMutation.isPending}>
                {createPantryItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
