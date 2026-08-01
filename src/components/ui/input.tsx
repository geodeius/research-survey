import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", type = "text", ...props }: InputProps) {
  return <input data-slot="input" type={type} className={`input ${className}`.trim()} {...props} />;
}
