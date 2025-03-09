import { KitchenStorageProvider } from "@/components/KitchenStorage/KitchenStorageContext";
import { KitchenStorage } from "@/components/KitchenStorage/KitchenStorage";

export default function KitchenStoragePage() {
  return (
    <KitchenStorageProvider>
      <KitchenStorage />
    </KitchenStorageProvider>
  );
}