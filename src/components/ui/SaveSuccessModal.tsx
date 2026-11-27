'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { CheckCircle2, Eye, PlusCircle } from 'lucide-react';

export interface SaveSuccessModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  studentName: string;
  metaText: string;
  badgeText?: string;
  detailHref: string;
  homeHref: string;
  onCreateAnother: () => void;
}

export function SaveSuccessModal({
  open,
  title,
  subtitle,
  studentName,
  metaText,
  badgeText,
  detailHref,
  homeHref,
  onCreateAnother,
}: SaveSuccessModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-success-title"
      className="fixed inset-0 z-120 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-[2px]" />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
        {/* Animated Success Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#ECFDF5] bg-[#D1FAE5] text-[#047857] shadow-sm">
            <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
          </div>

          <h2
            id="save-success-title"
            className="mt-4 text-lg font-extrabold tracking-tight text-zinc-950"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-zinc-500">{subtitle}</p>
          )}
        </div>

        {/* Summary Strip */}
        <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-3.5 text-left">
          <p className="truncate text-sm font-bold text-zinc-950">
            {studentName}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
            {metaText}
          </p>
          {badgeText && (
            <span className="mt-2 inline-block rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#047857]">
              {badgeText}
            </span>
          )}
        </div>

        {/* Actions (tinggi seragam 44px / h-11, ukuran teks & radius imbang) */}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onCreateAnother}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#047857] px-4 text-[13.5px] font-bold text-white shadow-xs transition-colors hover:bg-[#065F46] active:scale-[0.985]"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span>Catat Siswa Lain</span>
          </button>

          <Link
            href={detailHref}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[13.5px] font-bold text-zinc-800 transition-colors hover:bg-zinc-50 active:scale-[0.985]"
          >
            <Eye className="h-4 w-4 shrink-0 text-[#047857]" />
            <span>Lihat Detail Catatan</span>
          </Link>

          <Link
            href={homeHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl text-[13px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100/80 hover:text-zinc-800"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
