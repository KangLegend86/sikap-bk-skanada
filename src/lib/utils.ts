import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNamaGuru(nama: string, gelar?: string | null): string {
  return gelar ? `${nama}, ${gelar}` : nama;
}

export function getSapaan(jenisKelamin?: 'L' | 'P' | null): string {
  if (jenisKelamin === 'L') return 'Bapak';
  if (jenisKelamin === 'P') return 'Ibu';
  return 'Bapak/Ibu';
}

export function getMajorBadgeClass(kode: string): string {
  const map: Record<string, string> = {
    TKJ: 'bg-sky-100 text-sky-800 border-sky-200',
    TKR: 'bg-red-100 text-red-800 border-red-200',
    TSM: 'bg-amber-100 text-amber-800 border-amber-200',
    DKV: 'bg-purple-100 text-purple-800 border-purple-200',
    BISDIG: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DPB: 'bg-teal-100 text-teal-800 border-teal-200',
  };
  return map[kode.toUpperCase()] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200';
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

