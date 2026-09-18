'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface PosterBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
}

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  banners: PosterBanner[];
  isAutoClosing: boolean;
}

export function PosterModal({ isOpen, onClose, banners, isAutoClosing }: PosterModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset index and timer whenever modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (isAutoClosing) {
        setTimeLeft(10);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              onClose();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Manual mode: do not set any timer ("until don't close by own")
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } else {
      document.body.style.overflow = 'unset';
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, isAutoClosing, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || banners.length === 0) return null;

  const currentBanner = banners[currentIndex] || banners[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : banners.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < banners.length - 1 ? prev + 1 : 0));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg md:max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-gray-100 flex flex-col max-h-[92vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {currentBanner.title || 'Special Announcement'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Auto-closing countdown chip (only in 10s auto-closing mode) */}
                {isAutoClosing && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-semibold">
                    <Clock className="h-3 w-3 animate-spin text-amber-600" />
                    <span>Closing in {timeLeft}s</span>
                  </div>
                )}

                {/* Cancel / Close button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                  aria-label="Cancel and close poster"
                  title="Close (Cancel)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Auto-closing Progress Bar */}
            {isAutoClosing && (
              <div className="w-full h-1 bg-gray-100 overflow-hidden shrink-0">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                />
              </div>
            )}

            {/* Poster Image Area */}
            <div className="relative flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center min-h-[220px] max-h-[65vh]">
              {currentBanner.imageUrl ? (
                currentBanner.linkUrl ? (
                  <Link
                    href={currentBanner.linkUrl}
                    onClick={onClose}
                    className="block w-full h-full text-center group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentBanner.imageUrl}
                      alt={currentBanner.title || 'Poster'}
                      className="w-full h-auto max-h-[65vh] object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-300"
                    />
                  </Link>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentBanner.imageUrl}
                    alt={currentBanner.title || 'Poster'}
                    className="w-full h-auto max-h-[65vh] object-contain mx-auto"
                  />
                )
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <Sparkles className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-700">{currentBanner.title}</p>
                  {currentBanner.subtitle && <p className="text-xs text-gray-500 mt-1">{currentBanner.subtitle}</p>}
                </div>
              )}

              {/* Prev / Next controls for multiple banners */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                    aria-label="Previous banner"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                    aria-label="Next banner"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Footer with Banner Details, Carousel Dots & Actions */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 space-y-3">
              {currentBanner.subtitle && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {currentBanner.subtitle}
                </p>
              )}

              {/* Multi-banner Dots */}
              {banners.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentIndex ? 'w-6 bg-black' : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {currentBanner.linkUrl && (
                  <Link
                    href={currentBanner.linkUrl}
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-black text-white text-xs sm:text-sm font-semibold rounded-xl text-center hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                  >
                    <span>View Offer</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <button
                  onClick={onClose}
                  className={`${
                    currentBanner.linkUrl ? 'px-5' : 'w-full'
                  } py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
