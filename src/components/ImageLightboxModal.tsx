import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { Language } from '../types';

interface ImageLightboxModalProps {
  src: string;
  alt?: string;
  chapterTitle?: string;
  onClose: () => void;
  language?: Language;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  src,
  alt,
  chapterTitle,
  onClose,
  language = 'en'
}) => {
  const [scale, setScale] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div
      id="lightbox-backdrop"
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950/85 backdrop-blur-sm text-neutral-100 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 select-none">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-neutral-400">
            {chapterTitle || (language === 'zh' ? '架构图' : 'Architecture Diagram')}
          </span>
          <h3 className="text-sm font-semibold text-neutral-100 line-clamp-1">
            {alt || (language === 'zh' ? '系统设计架构图' : 'System Design Diagram')}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="lightbox-zoom-out"
            type="button"
            onClick={handleZoomOut}
            title={language === 'zh' ? '缩小' : 'Zoom Out'}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-2 py-1 bg-neutral-800 rounded text-neutral-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            id="lightbox-zoom-in"
            type="button"
            onClick={handleZoomIn}
            title={language === 'zh' ? '放大' : 'Zoom In'}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="lightbox-reset"
            type="button"
            onClick={handleResetZoom}
            title={language === 'zh' ? '重置缩放' : 'Reset Zoom'}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <a
            id="lightbox-download"
            href={src}
            download={alt ? `${alt.replace(/\s+/g, '_')}.png` : 'system_diagram.png'}
            title={language === 'zh' ? '下载高清架构图' : 'Download Diagram'}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors inline-flex items-center"
          >
            <Download className="w-4 h-4" />
          </a>
          <div className="h-4 w-px bg-neutral-700 mx-1" />
          <button
            id="lightbox-close"
            type="button"
            onClick={onClose}
            title={language === 'zh' ? '关闭 (Esc)' : 'Close (Esc)'}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image canvas viewport */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-6 cursor-zoom-out"
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="transition-transform duration-150 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{ transform: `scale(${scale})` }}
        >
          <img
            src={src}
            alt={alt || 'System design diagram'}
            className="max-h-[82vh] max-w-[92vw] object-contain rounded-md shadow-2xl bg-white p-3 ring-1 ring-neutral-700 select-none cursor-default"
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};
