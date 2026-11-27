'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  RotateCcw,
  X,
  ZoomIn,
} from 'lucide-react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export interface HomeVisitPhotoItem {
  driveId: string;
  fileName?: string | null;
}

export function HomeVisitPhotoCard({
  photos,
}: {
  photos: HomeVisitPhotoItem[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; scale: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);

  const isOpen = openIndex !== null && photos[openIndex] !== undefined;
  const activePhoto = isOpen ? photos[openIndex] : null;
  const totalPhotos = photos.length;

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const closeLightbox = useCallback(() => {
    setOpenIndex(null);
    resetZoom();
  }, [resetZoom]);

  const goPrev = useCallback(() => {
    if (totalPhotos <= 1) return;
    resetZoom();
    setOpenIndex((prev) =>
      prev === null ? null : (prev - 1 + totalPhotos) % totalPhotos
    );
  }, [totalPhotos, resetZoom]);

  const goNext = useCallback(() => {
    if (totalPhotos <= 1) return;
    resetZoom();
    setOpenIndex((prev) => (prev === null ? null : (prev + 1) % totalPhotos));
  }, [totalPhotos, resetZoom]);

  const zoomBy = useCallback((delta: number) => {
    setScale((prev) => {
      const next = clamp(Number((prev + delta).toFixed(2)), MIN_SCALE, MAX_SCALE);
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const toggleDoubleTapZoom = useCallback(() => {
    setScale((prev) => {
      if (prev > 1.2) {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
      return 2.5;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === '+' || e.key === '=') zoomBy(0.5);
      if (e.key === '-') zoomBy(-0.5);
      if (e.key === '0') resetZoom();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, closeLightbox, goPrev, goNext, zoomBy, resetZoom]);

  if (photos.length === 0) return null;

  // Mouse wheel zoom (desktop)
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.35 : -0.35;
    zoomBy(delta);
  }

  // Mouse drag pan (desktop)
  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: dragStartRef.current.ox + dx,
      y: dragStartRef.current.oy + dy,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
    dragStartRef.current = null;
  }

  // Touch pinch-to-zoom, 1-finger pan, swipe prev/next & double-tap (mobile)
  function handleTouchStart(e: React.TouchEvent) {
    lastTouchTimeRef.current = Date.now();

    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartRef.current = {
        dist: Math.hypot(dx, dy),
        scale,
      };
      dragStartRef.current = null;
      swipeStartRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        lastTapRef.current = 0;
        swipeStartRef.current = null;
        toggleDoubleTapZoom();
        return;
      }
      lastTapRef.current = now;

      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          ox: offset.x,
          oy: offset.y,
        };
      } else if (totalPhotos > 1) {
        swipeStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / (pinchStartRef.current.dist || 1);
      const nextScale = clamp(
        Number((pinchStartRef.current.scale * ratio).toFixed(2)),
        MIN_SCALE,
        MAX_SCALE
      );
      setScale(nextScale);
      if (nextScale <= 1) setOffset({ x: 0, y: 0 });
      return;
    }

    if (e.touches.length === 1 && dragStartRef.current && scale > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setOffset({
        x: dragStartRef.current.ox + dx,
        y: dragStartRef.current.oy + dy,
      });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) {
      pinchStartRef.current = null;
    }
    if (e.touches.length === 0) {
      if (swipeStartRef.current && scale <= 1 && e.changedTouches[0]) {
        const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
        const dy = e.changedTouches[0].clientY - swipeStartRef.current.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          if (dx < 0) goNext();
          else goPrev();
        }
      }
      swipeStartRef.current = null;
      setIsDragging(false);
      dragStartRef.current = null;
    }
  }

  const activePhotoUrl = activePhoto
    ? `/api/jurnal-sikap/foto/${activePhoto.driveId}`
    : '';
  const activeDownloadUrl = activePhoto
    ? `/api/jurnal-sikap/foto/${activePhoto.driveId}?download=1&name=${encodeURIComponent(
        activePhoto.fileName || 'bukti-home-visit.jpg'
      )}`
    : '';

  return (
    <>
      {/* Kartu Lampiran Kompak (1 foto atau banyak foto tetap ringkas) */}
      <section className="rounded-xl border border-zinc-200/70 bg-white p-3.5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[13.5px] font-bold text-zinc-900">
              Bukti Foto Home Visit{' '}
              {totalPhotos > 1 && (
                <span className="font-semibold text-[#047857]">
                  ({totalPhotos} foto)
                </span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-400">
              Ketuk foto untuk melihat & memperbesar
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenIndex(0)}
            aria-label="Perbesar foto"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857] transition-colors hover:bg-[#047857] hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
          {photos.map((photo, idx) => (
            <button
              key={photo.driveId}
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="group relative h-15 w-15 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 transition-all hover:border-[#047857] active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/jurnal-sikap/foto/${photo.driveId}`}
                alt={photo.fileName || `Bukti Home Visit ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Fullscreen Lightbox */}
      {isOpen &&
        activePhoto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Preview Bukti Foto Home Visit"
            className="fixed inset-0 z-130 flex flex-col bg-black/95 backdrop-blur-md select-none"
          >
            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between gap-3 bg-linear-to-b from-black/70 to-transparent px-4 py-3.5 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  Bukti Foto Home Visit
                  {totalPhotos > 1 && openIndex !== null && (
                    <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 font-mono text-[11px] font-semibold">
                      {openIndex + 1} / {totalPhotos}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-white/60">
                  {totalPhotos > 1
                    ? 'Geser kiri/kanan untuk pindah • Cubit atau ketuk 2× untuk zoom'
                    : 'Cubit atau ketuk 2× untuk memperbesar'}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={activeDownloadUrl}
                  download={activePhoto.fileName || 'bukti-home-visit.jpg'}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh</span>
                </a>
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label="Tutup lightbox"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Interactive Image Stage */}
            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                if (scale <= 1) closeLightbox();
              }}
              className={`relative flex flex-1 items-center justify-center overflow-hidden p-4 touch-none ${
                scale > 1
                  ? isDragging
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-zoom-in'
              }`}
            >
              {/* Prev / Next Arrows (Desktop & Tablet) */}
              {totalPhotos > 1 && scale <= 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                    aria-label="Foto sebelumnya"
                    className="absolute left-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/50 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                    aria-label="Foto berikutnya"
                    className="absolute right-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/50 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhotoUrl}
                alt={activePhoto.fileName || 'Bukti Foto Home Visit'}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (Date.now() - lastTouchTimeRef.current < 600) return;
                  toggleDoubleTapZoom();
                }}
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 160ms ease-out',
                }}
                className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl will-change-transform"
              />
            </div>

            {/* Bottom Floating Zoom Pill */}
            <div className="relative z-20 flex items-center justify-center pb-6 pt-2">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-zinc-900/85 p-1 text-white shadow-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => zoomBy(-0.5)}
                  disabled={scale <= MIN_SCALE}
                  aria-label="Perkecil"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-35"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center font-mono text-xs font-bold tabular-nums">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => zoomBy(0.5)}
                  disabled={scale >= MAX_SCALE}
                  aria-label="Perbesar"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-35"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {scale > 1 && (
                  <button
                    type="button"
                    onClick={resetZoom}
                    aria-label="Reset zoom"
                    title="Reset zoom"
                    className="ml-0.5 flex h-8 cursor-pointer items-center gap-1 rounded-full bg-white/10 px-2.5 text-[11px] font-semibold transition-colors hover:bg-white/20"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
