import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 5,
  itemName = 'places'
}) => {
  if (totalPages <= 1) return null;

  const handlePrev = (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems || (totalPages * itemsPerPage));

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      marginTop: '20px',
      padding: '12px 18px',
      borderRadius: 'var(--radius-lg)',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border)'
    }}>
      {/* Items count summary */}
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        Showing <strong style={{ color: '#fff' }}>{startIndex}-{endIndex}</strong> of <strong style={{ color: '#fff' }}>{totalItems || (totalPages * itemsPerPage)}</strong> {itemName}
      </div>

      {/* Pagination controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: currentPage === 1 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-fast)',
            opacity: currentPage === 1 ? 0.5 : 1
          }}
        >
          <ChevronLeft size={15} /> Previous
        </button>

        {/* Numbered Page Buttons */}
        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                ...
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none'
              }}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            color: currentPage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-fast)',
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
