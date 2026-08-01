import * as React from "react";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton" aria-hidden="true" className={`skeleton ${className}`.trim()} {...props} />;
}
