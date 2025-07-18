import { useState, useEffect } from "react";
import { FeatureDirectoryButton } from "./FeatureCarousel";
import { FeatureDirectory } from "./FeatureDirectory";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FeatureShowcase() {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [highlightedFeatureId, setHighlightedFeatureId] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Handle click to open directory directly
  const handleDirectoryOpen = () => {
    setHighlightedFeatureId("all-features");
    setDirectoryOpen(true);
    setShowTooltip(false);
  };

  // Set up tooltip animation for first-time users
  useEffect(() => {
    // Show tooltip after a delay
    const tooltipDelay = setTimeout(() => {
      setShowTooltip(true);
      
      // Hide tooltip after a few seconds
      const hideTooltip = setTimeout(() => {
        setShowTooltip(false);
      }, 8000);
      
      return () => clearTimeout(hideTooltip);
    }, 2000);
    
    return () => clearTimeout(tooltipDelay);
  }, []);

  return (
    <div className="relative">
      {/* Feature Directory Button wrapper */}
      <div 
        onClick={handleDirectoryOpen}
        className="cursor-pointer"
      >
        <FeatureDirectoryButton />
      </div>
      
      {/* Floating tooltip animation */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div 
            initial={{ opacity: 0, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: -55, scale: 1 }}
            exit={{ opacity: 0, y: -65, scale: 0.9 }}
            className="absolute left-1/2 transform -translate-x-1/2 top-0 z-10 bg-background/90 backdrop-blur-sm border shadow-md rounded-md px-3 py-1.5 text-center mt-2"
          >
            <p className="text-xs flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Explore all features</span>
            </p>
            <motion.div 
              className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-background border-b border-r"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direct dialog implementation with Radix UI */}
      <DialogPrimitive.Root open={directoryOpen} onOpenChange={setDirectoryOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay 
            className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-50 grid w-[90vw] max-w-[1100px] h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg p-0 overflow-auto md:overflow-hidden"
          >
            <FeatureDirectory 
              highlightedFeatureId={highlightedFeatureId}
            />
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
} 