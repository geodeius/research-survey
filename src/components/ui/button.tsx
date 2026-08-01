import * as React from "react";
import { Slot } from "radix-ui";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({ asChild = false, className = "", size = "default", variant = "default", ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";

  return (
    <Component
      data-slot="button"
      data-size={size}
      data-variant={variant}
      className={`button button--${variant} button--${size} ${className}`.trim()}
      {...props}
    />
  );
}
