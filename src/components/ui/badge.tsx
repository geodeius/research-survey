import * as React from "react";
import { Slot } from "radix-ui";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
  variant?: BadgeVariant;
}

export function Badge({ asChild = false, className = "", variant = "default", ...props }: BadgeProps) {
  const Component = asChild ? Slot.Root : "span";

  return (
    <Component
      data-slot="badge"
      data-variant={variant}
      className={`badge badge--${variant} ${className}`.trim()}
      {...props}
    />
  );
}
