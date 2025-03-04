import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { scanBarcode } from "@/ai-services/recipe-ai";
import { apiRequest } from "@/lib/queryClient";
import type { BarcodeProduct } from "@shared/schema";

export function BarcodeScanner({ onScan }: { onScan: (data: BarcodeProduct) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const product = await scanBarcode(barcode, true);
      // Save to database
      await apiRequest("POST", "/api/barcode-products", product);
      return product;
    },
    onSuccess: (data) => {
      onScan(data);
      toast({
        title: "Product scanned",
        description: `Found: ${data.productName}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to scan barcode. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    }

    if (isScanning) {
      setupCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, toast]);

  const toggleScanning = () => {
    setIsScanning(!isScanning);
  };

  // For demo/testing - simulate a barcode scan
  const simulateScan = () => {
    const fakeBarcodes = [
      "7350057169840", // Oatly Oat Milk
      "8710447377338", // Organic Quinoa
      "5000168187436", // Greek Yogurt
      "3033710074624", // Free Range Eggs
    ];
    const randomBarcode = fakeBarcodes[Math.floor(Math.random() * fakeBarcodes.length)];
    scanMutation.mutate(randomBarcode);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        {isScanning && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-background/90 to-background/0">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleScanning}
            className="h-10 w-10"
          >
            {isScanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={simulateScan}
            disabled={scanMutation.isPending}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}