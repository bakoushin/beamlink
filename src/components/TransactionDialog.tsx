import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSun } from "@/components/AnimatedSun";

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TransactionDialog({ open, onClose }: TransactionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="flex flex-col items-center gap-4">
          {/* Animated Sun */}
          <AnimatedSun />

          {/* Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm transaction in your wallet
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
