import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PantryItem, insertPantryItemSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Loader2 } from "lucide-react";
import { z } from "zod";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type FormData = z.infer<typeof insertPantryItemSchema>;

interface EditPantryItemDialogProps {
  item: PantryItem;
  trigger?: React.ReactNode;
}

export function EditPantryItemDialog({ item, trigger }: EditPantryItemDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertPantryItemSchema),
    defaultValues: {
      userId: item.userId,
      name: item.name,
      quantity: item.quantity,
      category: item.category || "",
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      nutritionInfo: item.nutritionInfo || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      sustainabilityInfo: item.sustainabilityInfo || ""
    },
  });

  const deletePantryItemMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/pantry/${item.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setOpen(false);
      toast({
        title: "Item deleted!",
        description: "Your pantry item has been deleted successfully.",
      });
    },
  });

  const editPantryItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null
      };
      const res = await apiRequest("PATCH", `/api/pantry/${item.id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setOpen(false);
      toast({
        title: "Item updated!",
        description: "Your pantry item has been updated successfully.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Edit Pantry Item</DialogTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the item from your pantry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => document.querySelector('[role="alertdialog"] button:first-of-type')?.click()}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deletePantryItemMutation.mutate()}
                  disabled={deletePantryItemMutation.isPending}
                >
                  {deletePantryItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => editPantryItemMutation.mutate(data))} className="space-y-4">
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
                    <Input {...field} value={field.value || ''} />
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
                        value={(value as NutritionInfo)?.calories ?? '0'} 
                        onChange={e => {
                          const newValue = e.target.value ? parseInt(e.target.value) : 0;
                          onChange({ ...(value as NutritionInfo), calories: newValue });
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
                        value={(value as NutritionInfo)?.protein ?? '0'} 
                        onChange={e => {
                          const newValue = e.target.value ? parseInt(e.target.value) : 0;
                          onChange({ ...(value as NutritionInfo), protein: newValue });
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
                        value={(value as NutritionInfo)?.carbs ?? '0'} 
                        onChange={e => {
                          const newValue = e.target.value ? parseInt(e.target.value) : 0;
                          onChange({ ...(value as NutritionInfo), carbs: newValue });
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
                        value={(value as NutritionInfo)?.fat ?? '0'} 
                        onChange={e => {
                          const newValue = e.target.value ? parseInt(e.target.value) : 0;
                          onChange({ ...(value as NutritionInfo), fat: newValue });
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sustainability Information</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value?.toString() || ''} placeholder="Enter sustainability details" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={editPantryItemMutation.isPending}>
              {editPantryItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Item
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}