'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const STORAGE_KEY = 'sikap_pending_toast';
const EVENT_NAME = 'sikap:toast';

export type ToastVariant = 'success' | 'info' | 'error';

interface ToastPayload {
  message: string;
  variant: ToastVariant;
}

export function triggerGlobalToast(
  message: string,
  variant: ToastVariant = 'success'
) {
  if (typeof window === 'undefined') return;
  const payload: ToastPayload = { message, variant };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Abaikan jika sessionStorage tidak tersedia
  }
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT_NAME, { detail: payload }));
}

export function GlobalToast() {
  const pathname = usePathname();
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const show = (payload: ToastPayload) => {
      setToast(payload);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 3600);
    };

    const consumePending = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        sessionStorage.removeItem(STORAGE_KEY);
        const parsed = JSON.parse(raw) as ToastPayload;
        if (parsed?.message) show(parsed);
      } catch {
        // Abaikan
      }
    };

    consumePending();

    const onCustomToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (detail?.message) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // Abaikan
        }
        show(detail);
      }
    };

    window.addEventListener(EVENT_NAME, onCustomToast);
    return () => {
      window.removeEventListener(EVENT_NAME, onCustomToast);
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-0 left-0 z-130 flex justify-center px-4">
      <div
        role="status"
        className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full border py-2.5 pr-3 pl-3.5 text-xs font-semibold text-white shadow-[0_12px_28px_-6px_rgba(15,23,42,0.35)] backdrop-blur-md ${
          toast.variant === 'error'
            ? 'border-rose-500/60 bg-rose-950/95'
            : 'border-zinc-800/80 bg-zinc-900/95'
        }`}
      >
        {toast.variant === 'success' ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : toast.variant === 'error' ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
        ) : (
          <Info className="h-4 w-4 shrink-0 text-sky-400" />
        )}
        <span className="leading-snug">{toast.message}</span>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Tutup notifikasi"
          className="ml-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
