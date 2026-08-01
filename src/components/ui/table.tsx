import * as React from "react";

export function Table({ className = "", ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <div data-slot="table-container" className="table-scroll"><table data-slot="table" className={`table ${className}`.trim()} {...props} /></div>;
}

export function TableHeader({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead data-slot="table-header" className={className} {...props} />;
}

export function TableBody({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

export function TableFooter({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot data-slot="table-footer" className={className} {...props} />;
}

export function TableRow({ className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr data-slot="table-row" className={className} {...props} />;
}

export function TableHead({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th data-slot="table-head" className={className} {...props} />;
}

export function TableCell({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td data-slot="table-cell" className={className} {...props} />;
}

export function TableCaption({ className = "", ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption data-slot="table-caption" className={className} {...props} />;
}
