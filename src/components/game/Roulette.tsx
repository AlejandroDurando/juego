"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface RouletteProps {
  onSpinEnd: () => void;
  isSpinning: boolean;
  setIsSpinning: (val: boolean) => void;
}

export function Roulette({ onSpinEnd, isSpinning, setIsSpinning }: RouletteProps) {
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    // Calculate a random rotation (at least 3 full spins + random degrees)
    const newRotation = rotation + 360 * 3 + Math.floor(Math.random() * 360);
    setRotation(newRotation);

    // After animation ends, call onSpinEnd
    setTimeout(() => {
      setIsSpinning(false);
      onSpinEnd();
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="relative w-64 h-64">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-[var(--brasa)] z-10 drop-shadow-md" />
        
        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full border-4 border-[var(--brasa-light)] bg-[var(--card-bg)] shadow-lg overflow-hidden relative"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: "circOut" }}
        >
          {/* Decorative segments */}
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-[var(--card-border)] -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--card-border)] -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-[var(--card-border)] -translate-x-1/2 rotate-45" />
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--card-border)] -translate-y-1/2 rotate-45" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] border-2 border-[var(--brasa-light)] flex items-center justify-center shadow-inner">
              <span className="font-serif text-lg text-[var(--brasa)]">B</span>
            </div>
          </div>
        </motion.div>
      </div>

      <Button 
        onClick={handleSpin} 
        disabled={isSpinning}
        size="lg"
        className="w-48 font-serif text-lg tracking-wide uppercase"
      >
        {isSpinning ? "Girando..." : "Girar"}
      </Button>
    </div>
  );
}
