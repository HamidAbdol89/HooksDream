// src/components/ui/LoadingScreen.tsx
import React from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface LoadingScreenProps {
  text: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ text }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-purple-500 to-green-600">
    <div className="text-center text-white">
      <LoadingSpinner className="w-8 h-8 mx-auto mb-4 text-white" />
      <p>{text}</p>
    </div>
  </div>
);
