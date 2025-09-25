// src/components/ui/use-toast.ts
import * as React from "react";
import { ToastProps, toast as shadToast } from "@/components/ui/Toast"; 

type ToastOptions = Omit<ToastProps, "id">;

export function useToast() {
  const toast = React.useCallback((options: ToastOptions) => {
    shadToast({ ...options });
  }, []);

  return { toast };
}
