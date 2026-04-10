import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  totalItems: number;
  hidePageSize?: boolean;
}

export const PageSizeSelector: React.FC<{
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}> = ({ pageSize, onPageSizeChange, pageSizeOptions = [15, 25, 50, 100] }) => (
  <div className="flex items-center gap-3">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Baris per halaman:</span>
    <select 
      value={pageSize}
      onChange={(e) => onPageSizeChange(Number(e.target.value))}
      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#817BB9]/30 transition-all cursor-pointer shadow-sm"
    >
      {pageSizeOptions.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [15, 25, 50, 100],
  totalItems,
  hidePageSize = false
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Helper to generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col md:flex-row items-center ${hidePageSize ? 'justify-center' : 'justify-between'} gap-6 px-8 py-6 bg-slate-50/50 border-t border-slate-100`}>
      {/* Page Size Selector & Info */}
      {!hidePageSize && (
        <div className="flex items-center gap-6">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} pageSizeOptions={pageSizeOptions} />
          <div className="hidden sm:block w-px h-4 bg-slate-200" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Showing <span className="text-slate-900">{totalItems === 0 ? 0 : startItem}-{endItem}</span> of <span className="text-slate-900">{totalItems}</span> items
          </p>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-[#817BB9] hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => (
            p === '...' ? (
              <span key={`ell-${idx}`} className="px-2 py-1 flex items-center justify-center text-slate-300">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[36px] h-9 rounded-xl text-xs font-black transition-all ${
                  currentPage === p 
                    ? 'bg-[#817BB9] text-white shadow-lg shadow-[#817BB9]/20' 
                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-[#817BB9]'
                }`}
              >
                {p}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-[#817BB9] hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm group"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
