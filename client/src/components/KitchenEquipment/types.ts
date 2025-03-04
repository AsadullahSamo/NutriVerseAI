export type KitchenEquipmentFromDB = {
  id: number;
  userId: number;
  name: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs-maintenance' | 'replace';
  lastMaintenanceDate: string | null;
  purchaseDate: string | null;
  maintenanceInterval: number | null;
  maintenanceNotes: string | null;
  purchasePrice: number | null;
  createdAt: string;
  updatedAt: string;
};