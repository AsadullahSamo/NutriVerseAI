import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Grid } from "lucide-react";
import { motion } from "framer-motion";

export function FeatureDirectoryButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Add pulsing effect on component mount
  useEffect(() => {
    // Start pulsing after a delay
    const pulseTimer = setTimeout(() => {
      setIsPulsing(true);
      
      // Stop pulsing after a while
      const stopPulse = setTimeout(() => {
        setIsPulsing(false);
      }, 6000);
      
      return () => clearTimeout(stopPulse);
    }, 1000);
    
    return () => clearTimeout(pulseTimer);
  }, []);
  
  return (
    <motion.div
      className="relative flex my-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-purple-500/20 rounded-lg blur-sm"
        animate={{ 
          scale: isHovered ? 1.05 : 1,
          opacity: isHovered ? 0.8 : 0.5
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Pulsing ring for attention */}
      {isPulsing && (
        <motion.div 
          className="absolute inset-0 rounded-lg"
          animate={{ 
            boxShadow: [
              "0 0 0 0 rgba(124, 58, 237, 0)",
              "0 0 0 4px rgba(124, 58, 237, 0.3)",
              "0 0 0 0 rgba(124, 58, 237, 0)"
            ]
          }}
          transition={{ 
            repeat: 5,
            duration: 1.2
          }}
        />
      )}
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button 
          className={`gap-2 px-4 py-2 h-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg shadow-md border border-indigo-400/30 ${
            isPulsing ? 'shadow-indigo-500/40' : 'shadow-indigo-500/20'
          }`}
          size="default"
          type="button"
        >
          <Grid className="h-4 w-4" />
          <span className="font-medium">Feature Directory</span>
          {(isHovered || isPulsing) && (
            <Sparkles className="h-3 w-3 ml-1 text-indigo-200" />
          )}
          <motion.div
            animate={{ 
              x: isHovered || isPulsing ? [0, 5, 0] : 0,
            }}
            transition={{ 
              duration: 0.8, 
              repeat: (isHovered || isPulsing) ? Infinity : 0,
              repeatType: "loop"
            }}
            className="ml-1"
          >
            →
          </motion.div>
        </Button>
      </motion.div>
      
      {/* Animated dot */}
      <motion.div 
        className={`absolute -top-1 -right-1 h-3 w-3 bg-violet-500 rounded-full ${
          isPulsing ? 'animate-ping' : ''
        }`}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
    </motion.div>
  );
}

// No longer exporting a carousel component
// The homepage should use FeatureDirectoryButton instead 