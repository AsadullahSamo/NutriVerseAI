import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WrenchIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KitchenEquipment, getMaintenanceTips } from "../../../ai-services/kitchen-inventory-ai";
import { format } from "date-fns";

const formSchema = z.object({
  maintenanceType: z.string().min(1, "Maintenance type is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EquipmentMaintenanceDialogProps {
  item: KitchenEquipment;
}

export function EquipmentMaintenanceDialog({ item }: EquipmentMaintenanceDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maintenanceType: "",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const { data: maintenanceTips, isLoading: tipsLoading } = useQuery({
    queryKey: [`/api/equipment-maintenance-tips/${item.id}`],
    queryFn: async () => {
      try {
        // First try to get from API, if implemented
        const response = await apiRequest("GET", `/api/equipment-maintenance-tips/${item.id}`);
        return response;
      } catch (error) {
        // Fallback to AI-generated tips
        return await getMaintenanceTips(item);
      }
    },
    enabled: open, // Only fetch when dialog is open
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // First log the maintenance activity
      await apiRequest("POST", `/api/equipment-maintenance/${item.id}`, {
        equipmentId: item.id,
        ...data,
      });
      
      // Then update the equipment's last maintenance date
      const payload = {
        ...item,
        lastMaintenanceDate: data.date,
        condition: item.condition === 'needs-maintenance' ? 'good' : item.condition,
      };
      
      return await apiRequest("PUT", `/api/kitchen-equipment/${item.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen-equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-maintenance"] });
      toast({
        title: "Maintenance logged",
        description: "Equipment maintenance has been recorded successfully.",
      });
      setOpen(false);
      form.reset({
        maintenanceType: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error logging maintenance",
        description: "There was an error recording the maintenance. Please try again.",
        variant: "destructive",
      });
      console.error("Error logging maintenance:", error);
    },
  });

  function onSubmit(values: FormValues) {
    updateMutation.mutate(values);
  }

  const maintenanceTypes = [
    "Cleaning",
    "Sharpening",
    "Oiling/Lubricating",
    "Part Replacement",
    "Calibration",
    "Descaling",
    "General Service",
    "Safety Check",
    "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          title="Log maintenance"
        >
          <WrenchIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Log Maintenance for {item.name}</DialogTitle>
          <DialogDescription>
            Record maintenance activities to keep track of your equipment's service history.
          </DialogDescription>
        </DialogHeader>
        
        {maintenanceTips && maintenanceTips.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
            <h3 className="text-sm font-medium mb-2">Maintenance Tips:</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              {maintenanceTips.slice(0, 3).map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="maintenanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select maintenance type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maintenanceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Performed</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes or observations..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? "Logging..." : "Log Maintenance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}