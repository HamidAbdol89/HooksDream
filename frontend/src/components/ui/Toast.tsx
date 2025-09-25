// src/components/ui/Toast.tsx
import * as React from "react";
import { createRoot } from "react-dom/client";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const toastVariants = cva(
  "pointer-events-auto flex items-center justify-between rounded-md border p-4 shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-white text-black",
        destructive: "bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  id?: string;
  title?: string;
  description?: string;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, title, description, ...props }, ref) => (
    <div ref={ref} className={toastVariants({ variant, className })} {...props}>
      <div>
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="text-sm">{description}</p>}
      </div>
      <X className="ml-4 h-4 w-4 cursor-pointer" />
    </div>
  )
);

Toast.displayName = "Toast";

// --- Helper show toast ---
export function toast(props: ToastProps) {
  const container = document.getElementById("toast-container") || (() => {
    const div = document.createElement("div");
    div.id = "toast-container";
    document.body.appendChild(div);
    return div;
  })();

  const div = document.createElement("div");
  container.appendChild(div);

  const remove = () => {
    if (container.contains(div)) container.removeChild(div);
  };

  const root = createRoot(div);
  root.render(<Toast {...props} onClick={remove} />);
}
