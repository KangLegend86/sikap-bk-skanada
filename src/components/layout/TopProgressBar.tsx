'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const trickleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigating = useRef(false);

  const clearTimers = () => {
    if (trickleTimer.current) {
      clearInterval(trickleTimer.current);
      trickleTimer.current = null;
    }
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  };

  // Selesaikan progress bar setiap kali URL berubah
  useEffect(() => {
    if (!isNavigating.current) return;
    isNavigating.current = false;
    clearTimers();
    const finishFrame = requestAnimationFrame(() => {
      setProgress(100);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 220);
    });
    return () => cancelAnimationFrame(finishFrame);
  }, [pathname, searchParams]);

  // Mulai progress bar segera saat link internal diklik
  useEffect(() => {
    const startProgress = () => {
      clearTimers();
      isNavigating.current = true;
      setVisible(true);
      setProgress(22);

      trickleTimer.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return prev;
          const step = prev < 50 ? 12 : prev < 75 ? 6 : 2;
          return Math.min(88, prev + step);
        });
      }, 180);

      // Pengaman agar tidak pernah macet jika navigasi dibatalkan
      safetyTimer.current = setTimeout(() => {
        isNavigating.current = false;
        clearTimers();
        setVisible(false);
        setProgress(0);
      }, 8000);
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        return;
      }

      try {
        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        const currentFull = `${window.location.pathname}${window.location.search}`;
        const nextFull = `${nextUrl.pathname}${nextUrl.search}`;
        if (nextFull === currentFull) return;

        startProgress();
      } catch {
        // Abaikan URL tidak valid
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearTimers();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 left-0 z-[10000] h-[2.5px] bg-transparent"
    >
      <div
        className="h-full bg-[#047857] shadow-[0_0_8px_rgba(4,120,87,0.55)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
