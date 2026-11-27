'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { scrollDropdownIntoView } from '@/lib/utils';

export type GenderFilter = '' | 'L' | 'P';
export type BkHistoryFilter = '' | 'ADA' | 'BELUM';

interface SiswaFilterClientProps {
  initialQ: string;
  initialRuang?: string;
  initialJurusan?: string;
  initialGender?: Exclude<GenderFilter, ''>;
  initialBk?: Exclude<BkHistoryFilter, ''>;
  ruangList: { id: string; nama_ruang: string }[];
  jurusanList: { id: string; kode: string }[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  prevHref?: string;
  nextHref?: string;
}

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

const BK_OPTIONS: { value: BkHistoryFilter; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'ADA', label: 'Pernah Konseling' },
  { value: 'BELUM', label: 'Belum Ada Jurnal' },
];

export function SiswaFilterClient({
  initialQ,
  initialRuang,
  initialJurusan,
  initialGender,
  initialBk,
  ruangList,
  jurusanList,
  totalCount,
  currentPage,
  totalPages,
  rangeStart,
  rangeEnd,
  prevHref,
  nextHref,
}: SiswaFilterClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQ);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [draftRuang, setDraftRuang] = useState(initialRuang ?? '');
  const [showRuangDropdown, setShowRuangDropdown] = useState(false);
  const ruangWrapRef = useRef<HTMLDivElement>(null);

  const [draftJurusan, setDraftJurusan] = useState(initialJurusan ?? '');
  const [draftGender, setDraftGender] = useState<GenderFilter>(initialGender ?? '');
  const [draftBk, setDraftBk] = useState<BkHistoryFilter>(initialBk ?? '');

  const openSheet = () => {
    setDraftRuang(initialRuang ?? '');
    setShowRuangDropdown(false);
    setDraftJurusan(initialJurusan ?? '');
    setDraftGender(initialGender ?? '');
    setDraftBk(initialBk ?? '');
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!showRuangDropdown) return;
    scrollDropdownIntoView(ruangWrapRef.current, 40);
    const handlePointerDown = (e: PointerEvent) => {
      if (ruangWrapRef.current && !ruangWrapRef.current.contains(e.target as Node)) {
        setShowRuangDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showRuangDropdown]);

  useEffect(() => {
    if (!sheetOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sheetOpen]);

  const navigateWithParams = (next: {
    q?: string;
    ruang?: string;
    jurusan?: string;
    jk?: string;
    bk?: string;
  }) => {
    const params = new URLSearchParams();
    const qVal = (next.q ?? query).trim();
    const ruangVal = next.ruang !== undefined ? next.ruang : (initialRuang ?? '');
    const jurusanVal = next.jurusan !== undefined ? next.jurusan : (initialJurusan ?? '');
    const jkVal = next.jk !== undefined ? next.jk : (initialGender ?? '');
    const bkVal = next.bk !== undefined ? next.bk : (initialBk ?? '');

    if (qVal) params.set('q', qVal);
    if (ruangVal) params.set('ruang', ruangVal);
    if (jurusanVal) params.set('jurusan', jurusanVal);
    if (jkVal) params.set('jk', jkVal);
    if (bkVal) params.set('bk', bkVal);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/siswa?${qs}` : '/siswa');
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateWithParams({ q: query });
  };

  const handleClearSearch = () => {
    setQuery('');
    navigateWithParams({ q: '' });
  };

  const handleApplySheet = () => {
    setSheetOpen(false);
    navigateWithParams({
      ruang: draftRuang,
      jurusan: draftJurusan,
      jk: draftGender,
      bk: draftBk,
    });
  };

  const handleResetSheet = () => {
    setDraftRuang('');
    setShowRuangDropdown(false);
    setDraftJurusan('');
    setDraftGender('');
    setDraftBk('');
    setSheetOpen(false);
    navigateWithParams({ ruang: '', jurusan: '', jk: '', bk: '' });
  };

  const activeFilterCount =
    (initialRuang ? 1 : 0) +
    (initialJurusan ? 1 : 0) +
    (initialGender ? 1 : 0) +
    (initialBk ? 1 : 0);

  return (
    <>
      <div className="mb-4 space-y-3">
        {/* Search Bar + Filter Button */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full rounded-xl border border-zinc-200/80 bg-white py-2.5 pr-9 pl-10 text-sm text-zinc-900 shadow-[0_1px_4px_rgba(15,23,42,0.04)] placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Hapus pencarian"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={openSheet}
            aria-label="Buka Filter Siswa"
            className={`relative flex h-10.5 w-10.5 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95 ${
              activeFilterCount > 0
                ? 'border-[#047857] bg-[#ECFDF5] text-[#047857]'
                : 'border-zinc-200/80 bg-white text-zinc-600 shadow-[0_1px_4px_rgba(15,23,42,0.04)] hover:border-zinc-300 hover:text-zinc-900'
            }`}
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#047857] px-1 text-[10px] font-bold text-white shadow-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {initialRuang && (
              <button
                type="button"
                onClick={() => navigateWithParams({ ruang: '' })}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#047857] transition hover:bg-[#D1FAE5]"
              >
                {initialRuang}
                <X className="h-3 w-3" />
              </button>
            )}
            {initialJurusan && (
              <button
                type="button"
                onClick={() => navigateWithParams({ jurusan: '' })}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#047857] transition hover:bg-[#D1FAE5]"
              >
                {initialJurusan}
                <X className="h-3 w-3" />
              </button>
            )}
            {initialGender && (
              <button
                type="button"
                onClick={() => navigateWithParams({ jk: '' })}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#047857] transition hover:bg-[#D1FAE5]"
              >
                {initialGender === 'L' ? 'Laki-laki' : 'Perempuan'}
                <X className="h-3 w-3" />
              </button>
            )}
            {initialBk && (
              <button
                type="button"
                onClick={() => navigateWithParams({ bk: '' })}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#047857] transition hover:bg-[#D1FAE5]"
              >
                {initialBk === 'ADA' ? 'Pernah Konseling' : 'Belum Ada Jurnal'}
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleResetSheet}
              className="ml-1 cursor-pointer text-[11px] font-semibold text-zinc-500 hover:text-zinc-900"
            >
              Reset
            </button>
          </div>
        )}

        {/* Unified Total Siswa + Compact Pagination Toolbar */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/70 bg-white px-3.5 py-2 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
          <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#047857]" />
            {isPending ? (
              <span className="truncate font-medium text-zinc-400">
                Memuat siswa...
              </span>
            ) : totalPages > 1 ? (
              <span className="truncate">
                <strong className="font-bold text-zinc-900">
                  {rangeStart}–{rangeEnd}
                </strong>{' '}
                dari{' '}
                <strong className="font-bold text-[#047857]">{totalCount}</strong>{' '}
                siswa
              </span>
            ) : (
              <span className="truncate">
                Total{' '}
                <strong className="font-bold text-[#047857]">{totalCount}</strong>{' '}
                Siswa
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Navigasi halaman siswa"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200/70 bg-zinc-50 p-0.5"
            >
              {prevHref ? (
                <Link
                  href={prevHref}
                  aria-label="Halaman sebelumnya"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-700 shadow-2xs transition-all hover:text-[#047857] active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}

              <span className="px-2 font-mono text-[11px] font-bold text-zinc-700 tabular-nums">
                {currentPage}
                <span className="font-medium text-zinc-400">/{totalPages}</span>
              </span>

              {nextHref ? (
                <Link
                  href={nextHref}
                  aria-label="Halaman berikutnya"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-700 shadow-2xs transition-all hover:text-[#047857] active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Bottom Sheet Filter Modal via Portal */}
      {sheetOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 flex touch-none items-end justify-center overscroll-none bg-zinc-950/45 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Filter Daftar Siswa"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85dvh] w-full max-w-xl touch-pan-y overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-5 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200" />

              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-950">Filter Siswa</h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Tutup filter"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {/* Ruang Kelas (Custom Select Dropdown) */}
                <div ref={ruangWrapRef} className="relative scroll-mt-3">
                  <span className="mb-2 block text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Ruang Kelas
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRuangDropdown((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={showRuangDropdown}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-[11px] border px-3.5 py-2.5 text-[13.5px] font-medium transition-all ${
                      showRuangDropdown
                        ? 'border-[#047857] bg-white ring-3 ring-[#047857]/12'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70'
                    }`}
                  >
                    <span className={draftRuang ? 'font-semibold text-zinc-900' : 'text-zinc-500'}>
                      {draftRuang || 'Semua Ruang Kelas'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 transition-transform ${
                        showRuangDropdown ? 'rotate-180 text-[#047857]' : ''
                      }`}
                    />
                  </button>

                  {showRuangDropdown && (
                    <div
                      role="listbox"
                      className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-48 overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white shadow-xl"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={draftRuang === ''}
                        onClick={() => {
                          setDraftRuang('');
                          setShowRuangDropdown(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between border-b border-zinc-100 px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-zinc-50 ${
                          draftRuang === ''
                            ? 'bg-[#ECFDF5]/60 font-semibold text-[#047857]'
                            : 'font-medium text-zinc-600'
                        }`}
                      >
                        <span>Semua Ruang Kelas</span>
                        {draftRuang === '' && <Check className="h-4 w-4 text-[#047857]" />}
                      </button>

                      {ruangList.map((r) => {
                        const selected = draftRuang === r.nama_ruang;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setDraftRuang(r.nama_ruang);
                              setShowRuangDropdown(false);
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between border-b border-zinc-100 px-3.5 py-2.5 text-left text-[13px] transition-colors last:border-none hover:bg-zinc-50 ${
                              selected
                                ? 'bg-[#ECFDF5]/60 font-semibold text-[#047857]'
                                : 'font-medium text-zinc-800'
                            }`}
                          >
                            <span>{r.nama_ruang}</span>
                            {selected && <Check className="h-4 w-4 text-[#047857]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Jurusan */}
                <div>
                  <span className="mb-2 block text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Jurusan
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftJurusan('')}
                      className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                        draftJurusan === ''
                          ? 'bg-[#047857] text-white shadow-xs'
                          : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      Semua
                    </button>
                    {jurusanList.map((j) => {
                      const selected = draftJurusan === j.kode;
                      return (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => setDraftJurusan(selected ? '' : j.kode)}
                          className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                            selected
                              ? 'bg-[#047857] text-white shadow-xs'
                              : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          {j.kode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <span className="mb-2 block text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Jenis Kelamin
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map((opt) => {
                      const selected = draftGender === opt.value;
                      return (
                        <button
                          key={opt.value || 'ALL_G'}
                          type="button"
                          onClick={() => setDraftGender(opt.value)}
                          className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                            selected
                              ? 'bg-[#047857] text-white shadow-xs'
                              : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Riwayat Konseling BK */}
                <div>
                  <span className="mb-2 block text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Riwayat Konseling BK
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {BK_OPTIONS.map((opt) => {
                      const selected = draftBk === opt.value;
                      return (
                        <button
                          key={opt.value || 'ALL_BK'}
                          type="button"
                          onClick={() => setDraftBk(opt.value)}
                          className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                            selected
                              ? 'bg-[#047857] text-white shadow-xs'
                              : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleResetSheet}
                  className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.985]"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApplySheet}
                  className="cursor-pointer rounded-xl bg-[#047857] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#065F46] active:scale-[0.985]"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
