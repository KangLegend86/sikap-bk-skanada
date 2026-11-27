import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNamaGuru(nama: string): string {
  return nama.trim();
}

export function getSapaan(jenisKelamin?: 'L' | 'P' | null): string {
  if (jenisKelamin === 'L') return 'Bapak';
  if (jenisKelamin === 'P') return 'Ibu';
  return 'Bapak/Ibu';
}

export function getMajorTextClass(kode: string): string {
  const key = kode.trim().toUpperCase();
  const map: Record<string, string> = {
    TKJ: 'text-sky-600',
    TKR: 'text-rose-600',
    TSM: 'text-amber-600',
    DKV: 'text-purple-600',
    BISDIG: 'text-indigo-600',
    'BISDIG 1': 'text-indigo-600',
    'BISDIG 2': 'text-indigo-600',
    DPB: 'text-pink-600',
  };
  return map[key] ?? 'text-zinc-600';
}

export function getMajorBadgeClass(kode: string): string {
  const map: Record<string, string> = {
    TKJ: 'bg-sky-100 text-sky-800 border-sky-200',
    TKR: 'bg-red-100 text-red-800 border-red-200',
    TSM: 'bg-amber-100 text-amber-800 border-amber-200',
    DKV: 'bg-purple-100 text-purple-800 border-purple-200',
    BISDIG: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'BISDIG 1': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'BISDIG 2': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    DPB: 'bg-pink-100 text-pink-800 border-pink-200',
  };
  return map[kode.trim().toUpperCase()] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200';
}

export function formatTanggalIndo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatWaNumber(phone?: string | null): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

export function scrollDropdownIntoView(
  el: HTMLElement | null,
  delayMs: number = 40
): void {
  if (!el || typeof window === 'undefined') return;
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, delayMs);
}

