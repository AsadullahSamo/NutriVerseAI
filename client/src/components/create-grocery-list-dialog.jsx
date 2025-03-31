import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGroceryListSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
export function CreateGroceryListDialog({ trigger }) {
    var _a;
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(insertGroceryListSchema),
        defaultValues: {
            userId: user === null || user === void 0 ? void 0 : user.id,
            title: "",
            items: [],
            completed: false,
        },
    });
    const createListMutation = useMutation({
        mutationFn: async (data) => {
            const res = await apiRequest("POST", "/api/grocery-lists", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists"] });
            setOpen(false);
            form.reset();
            toast({
                title: "List created!",
                description: "Your grocery list has been created successfully.",
            });
        },
    });
    return (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (<Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2"/>
            New List
          </Button>)}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Grocery List</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createListMutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem>
                  <FormLabel>List Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter list title..." {...field}/>
                  </FormControl>
                </FormItem>)}/>
            <div className="space-y-4">
              {/* Add dynamic item inputs here */}
              <div className="flex items-center gap-2">
                <Input placeholder="Add item..." onKeyPress={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentItems = form.getValues('items') || [];
                form.setValue('items', [...currentItems, {
                        id: crypto.randomUUID(),
                        name: e.target.value,
                        completed: false,
                        quantity: "1"
                    }]);
                e.target.value = '';
            }
        }}/>
              </div>
              {/* Display added items */}
              {(_a = form.watch('items')) === null || _a === void 0 ? void 0 : _a.map((item, index) => (<div key={item.id} className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                const items = form.getValues('items');
                form.setValue('items', items.filter((_, i) => i !== index));
            }}>
                    Remove
                  </Button>
                </div>))}
            </div>
            <Button type="submit" className="w-full" disabled={createListMutation.isPending}>
              {createListMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Create List
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>);
}
