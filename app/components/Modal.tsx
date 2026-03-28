'use client';

import { ReactNode, useEffect } from 'react';

import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative crt-panel rounded-sm w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-crt-border">
          <h2 className="text-2xl font-bold text-crt-phosphor-bright tracking-wide crt-text-plain">{title}</h2>
          <button
            onClick={onClose}
            className="p-3 md:p-2 text-crt-phosphor-dim hover:text-crt-phosphor-bright hover:bg-crt-bar-track rounded-sm transition-colors crt-text-plain"
          >
            <X className="w-6 h-6 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}


