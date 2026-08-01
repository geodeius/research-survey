"use client";

import { CaretLeft, CaretRight, DotsThree } from "@phosphor-icons/react";
import { Button } from "./button";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function pagesFor(page: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const values = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...values].filter((value) => value > 0 && value <= totalPages).sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = pagesFor(page, totalPages);

  return (
    <nav className="pagination" aria-label="Survey table pagination">
      <Button variant="outline" size="icon-sm" aria-label="Go to previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)}><CaretLeft size={16} /></Button>
      <div className="pagination-pages">
        {pages.map((item, index) => (
          <span key={item} className="pagination-item">
            {index > 0 && item - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true"><DotsThree size={18} /></span>}
            <Button variant={item === page ? "default" : "ghost"} size="icon-sm" aria-label={`Go to page ${item}`} aria-current={item === page ? "page" : undefined} onClick={() => onPageChange(item)}>{item}</Button>
          </span>
        ))}
      </div>
      <Button variant="outline" size="icon-sm" aria-label="Go to next page" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}><CaretRight size={16} /></Button>
    </nav>
  );
}
