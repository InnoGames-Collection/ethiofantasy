import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalCatalogItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  pageSize,
  totalItems,
  totalCatalogItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const [jumpInput, setJumpInput] = useState('');
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpInput('');
    }
  };

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-xs text-slate-600">
      {/* Range and Page Size */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <span className="font-mono text-slate-500 text-[11px]">
          Showing <strong className="text-slate-800 font-semibold">{startItem}</strong>–
          <strong className="text-slate-800 font-semibold">{endItem}</strong> of{' '}
          <strong className="text-slate-800 font-semibold">{totalItems}</strong> questions
          {totalItems !== totalCatalogItems && (
            <span className="text-slate-400"> (from {totalCatalogItems})</span>
          )}
        </span>
      </div>

      {/* Navigation Buttons and Jump to Page */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Jump to page */}
        <form onSubmit={handleJumpSubmit} className="hidden md:flex items-center space-x-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Go to:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder={`${currentPage}`}
            className="w-12 px-1.5 py-1 text-center bg-white border border-slate-200 rounded-md text-xs font-mono font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
          >
            Go
          </button>
        </form>

        {/* Page Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((p, idx) =>
              p === '...' ? (
                <span key={`ell-${idx}`} className="px-1.5 text-slate-400 text-xs">
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => onPageChange(p as number)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-md text-xs font-mono font-semibold transition-colors ${
                    currentPage === p
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
