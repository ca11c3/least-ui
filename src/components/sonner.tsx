"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import useSidebarStore from "../stores/useSidebarStore";

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useSidebarStore((state) => state.theme);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={false}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-xs group-[.toast]:opacity-80",
          actionButton:
            "group-[.toast]:bg-success/15 group-[.toast]:text-success group-[.toast]:border-0 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:border-0 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5",
          success:
            "group-[.toaster]:!bg-success group-[.toaster]:!text-success-foreground group-[.toaster]:!border-success",
          error:
            "group-[.toaster]:!bg-destructive group-[.toaster]:!text-white group-[.toaster]:!border-destructive",
          warning:
            "group-[.toaster]:!bg-warning group-[.toaster]:!text-warning-foreground group-[.toaster]:!border-warning",
          info: "group-[.toaster]:!bg-info group-[.toaster]:!text-info-foreground group-[.toaster]:!border-info",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
export { toast } from "sonner";
