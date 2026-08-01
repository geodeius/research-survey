"use client";

import * as React from "react";
import { CaretRight, Check, Circle } from "@phosphor-icons/react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;

export function DropdownMenuContent({ className = "", sideOffset = 8, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.Content data-slot="dropdown-menu-content" sideOffset={sideOffset} className={`dropdown-menu-content ${className}`.trim()} {...props} /></DropdownMenuPrimitive.Portal>;
}

export function DropdownMenuItem({ className = "", variant = "default", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: "default" | "destructive" }) {
  return <DropdownMenuPrimitive.Item data-slot="dropdown-menu-item" data-variant={variant} className={`dropdown-menu-item ${className}`.trim()} {...props} />;
}

export function DropdownMenuLabel({ className = "", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label data-slot="dropdown-menu-label" className={`dropdown-menu-label ${className}`.trim()} {...props} />;
}

export function DropdownMenuSeparator({ className = "", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={`dropdown-menu-separator ${className}`.trim()} {...props} />;
}

export function DropdownMenuShortcut({ className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="dropdown-menu-shortcut" className={`dropdown-menu-shortcut ${className}`.trim()} {...props} />;
}

export function DropdownMenuCheckboxItem({ children, className = "", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return <DropdownMenuPrimitive.CheckboxItem data-slot="dropdown-menu-checkbox-item" className={`dropdown-menu-item dropdown-menu-choice ${className}`.trim()} {...props}><DropdownMenuPrimitive.ItemIndicator className="dropdown-menu-indicator"><Check size={14} /></DropdownMenuPrimitive.ItemIndicator>{children}</DropdownMenuPrimitive.CheckboxItem>;
}

export function DropdownMenuRadioItem({ children, className = "", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return <DropdownMenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item" className={`dropdown-menu-item dropdown-menu-choice ${className}`.trim()} {...props}><DropdownMenuPrimitive.ItemIndicator className="dropdown-menu-indicator"><Circle size={8} weight="fill" /></DropdownMenuPrimitive.ItemIndicator>{children}</DropdownMenuPrimitive.RadioItem>;
}

export function DropdownMenuSubTrigger({ children, className = "", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return <DropdownMenuPrimitive.SubTrigger data-slot="dropdown-menu-sub-trigger" className={`dropdown-menu-item ${className}`.trim()} {...props}>{children}<CaretRight className="dropdown-menu-sub-caret" size={14} /></DropdownMenuPrimitive.SubTrigger>;
}

export function DropdownMenuSubContent({ className = "", sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.SubContent data-slot="dropdown-menu-sub-content" sideOffset={sideOffset} className={`dropdown-menu-content ${className}`.trim()} {...props} /></DropdownMenuPrimitive.Portal>;
}
