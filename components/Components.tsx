
import React, { useEffect } from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6 text-gray-600">{children}</div>
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white shadow-sm";
  const variants = {
    primary: "bg-spr-accent hover:bg-spr-accent_hover text-white focus:ring-blue-500",
    secondary: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-200",
    danger: "bg-spr-danger hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-spr-success hover:bg-emerald-700 text-white focus:ring-emerald-500",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input 
      className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-spr-accent focus:ring-1 focus:ring-spr-accent outline-none transition-colors shadow-sm ${className}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select 
      className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-spr-accent focus:ring-1 focus:ring-spr-accent outline-none transition-colors shadow-sm ${className}`} 
      {...props} 
    >
      {children}
    </select>
  </div>
);

export const Pagination: React.FC<{ 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button 
        variant="secondary" 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 text-sm"
      >
        Prev
      </Button>
      <span className="text-gray-600 text-sm font-medium">
        Page {currentPage} of {totalPages}
      </span>
      <Button 
        variant="secondary" 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 text-sm"
      >
        Next
      </Button>
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 text-gray-600">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ConfirmationModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
}> = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <div className="space-y-4">
      <p className="text-gray-600">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete</Button>
      </div>
    </div>
  </Modal>
);

// Logo Component: Blue Hexagon/Node Theme for "Techforge"
export const Logo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <div className={`flex items-center gap-3 ${size === 'lg' ? 'flex-col' : ''}`}>
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900 rounded-lg shadow-lg shadow-blue-200 transform rotate-3 transition-transform ${size === 'lg' ? 'w-20 h-20' : 'w-10 h-10'}`}>
      {/* Abstract Hex Node Icon */}
      <svg className="text-white w-3/5 h-3/5 transform -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </div>
    <div className={`font-bold tracking-tight text-gray-900 ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>
      SPR <span className="text-spr-accent">Techforge</span>
    </div>
  </div>
);
