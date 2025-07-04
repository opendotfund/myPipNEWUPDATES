import React from 'react';

export interface AppPage {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface PageSelectorProps {
  pages: AppPage[];
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  className?: string;
}

export const PageSelector: React.FC<PageSelectorProps> = ({ 
  pages, 
  currentPageId, 
  onPageChange, 
  className = '' 
}) => {
  if (pages.length <= 1) {
    return null; // Don't show selector if there's only one page
  }

  return (
    <div className={`flex items-center justify-center mb-4 ${className}`}>
      <div className="glass-card p-2 rounded-xl">
        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                page.id === currentPageId
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={page.description}
            >
              {page.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 