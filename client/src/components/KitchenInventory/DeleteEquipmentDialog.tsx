import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useKitchenInventory } from './KitchenInventoryContext';
import { KitchenEquipment } from '@/ai-services/kitchen-inventory-ai';

interface DeleteEquipmentDialogProps {
  equipment: KitchenEquipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEquipmentDialog({ equipment, open, onOpenChange }: DeleteEquipmentDialogProps) {
  const { dispatch } = useKitchenInventory();
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/kitchen-equipment/${equipment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete equipment');

      dispatch({ type: 'DELETE_EQUIPMENT', payload: equipment.id });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {equipment.name}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}