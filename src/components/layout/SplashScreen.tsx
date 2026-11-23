'use client';

import { useEffect, useState } from 'react';

const SPLASH_STORAGE_KEY = 'sikap_bk_splash_shown';

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'hidden'>('visible');

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_STORAGE_KEY) === '1') {
        const frame = requestAnimationFrame(() => setPhase('hidden'));
        return () => cancelAnimationFrame(frame);
      }
      sessionStorage.setItem(SPLASH_STORAGE_KEY, '1');
    } catch {
      // Abaikan jika sessionStorage tidak tersedia
    }

    const fadeTimer = setTimeout(() => {
      setPhase('fading');
    }, 850);

    const hideTimer = setTimeout(() => {
      setPhase('hidden');
    }, 1150);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[10001] flex flex-col items-center justify-between bg-white px-6 py-12 transition-opacity duration-300 ease-out ${
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Top optical balance spacer */}
      <div className="h-4" />

      {/* Center Logo & Brand */}
      <div className="splash-enter flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-sikap-bk.svg"
          alt="Logo SiKAP BK Skanada"
          className="h-24 w-24 object-contain"
        />

        <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-[#047857]">
          SiKAP BK
        </h1>
        <p className="mt-1 text-xs font-medium text-zinc-400">
          Bimbingan Konseling &amp; Penilaian Sikap
        </p>

        {/* Minimalist loading bar */}
        <div className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-zinc-100">
          <div className="splash-bar h-full w-1/2 rounded-full bg-[#047857]" />
        </div>
      </div>

      {/* Bottom School Signature */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="h-1 w-5 rounded-full bg-[#047857]" />
          <span className="h-1 w-2 rounded-full bg-[#FFCC00]" />
        </div>
        <span className="text-[10.5px] font-bold tracking-[0.22em] text-zinc-400 uppercase">
          SMKS NU 2 Kedungpring
        </span>
      </div>
    </div>
  );
}
