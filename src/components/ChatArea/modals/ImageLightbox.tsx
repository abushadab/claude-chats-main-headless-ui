"use client"

import { useEffect } from "react";

interface ImageLightboxProps {
  lightboxImage: string | null;
  onClose: () => void;
}

export function ImageLightbox({ lightboxImage, onClose }: ImageLightboxProps) {
  // ESC key support for lightbox
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && lightboxImage) {
        onClose();
      }
    };

    if (lightboxImage) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [lightboxImage, onClose]);

  if (!lightboxImage) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-4xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={lightboxImage} 
          alt="Full size image" 
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
}