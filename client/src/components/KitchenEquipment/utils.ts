import type { KitchenEquipment } from '@shared/schema';
import type { KitchenEquipmentFromDB } from './types';

export function convertToKitchenEquipment(dbEquipment: KitchenEquipmentFromDB): KitchenEquipment {
  return {
    ...dbEquipment,
    lastMaintenanceDate: dbEquipment.lastMaintenanceDate || undefined,
    purchaseDate: dbEquipment.purchaseDate || undefined,
    maintenanceNotes: dbEquipment.maintenanceNotes || undefined,
    maintenanceInterval: dbEquipment.maintenanceInterval || undefined,
    purchasePrice: dbEquipment.purchasePrice || undefined,
  };
}