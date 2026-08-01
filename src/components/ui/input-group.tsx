import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { Input, type InputProps } from "./input";

type AddonAlign = "inline-start" | "inline-end" | "block-start" | "block-end";

export function InputGroup({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="input-group" className={`input-group ${className}`.trim()} {...props} />;
}

export function InputGroupInput({ className = "", ...props }: InputProps) {
  return <Input data-slot="input-group-control" className={`input-group-control ${className}`.trim()} {...props} />;
}

export function InputGroupTextarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea data-slot="input-group-control" className={`input-group-control input-group-textarea ${className}`.trim()} {...props} />;
}

export function InputGroupAddon({ align = "inline-start", className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: AddonAlign }) {
  return <div data-slot="input-group-addon" data-align={align} className={`input-group-addon ${className}`.trim()} {...props} />;
}

export function InputGroupText({ className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="input-group-text" className={`input-group-text ${className}`.trim()} {...props} />;
}

export function InputGroupButton({ size = "xs", variant = "ghost", ...props }: ButtonProps) {
  return <Button data-slot="input-group-button" size={size} variant={variant} {...props} />;
}
