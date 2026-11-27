'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  ChevronRight,
  NotebookPen,
  Search,
  X,
} from 'lucide-react';
import type { JenisJurnalSikap } from '@prisma/client';
import { getMajorBadgeClass } from '@/lib/utils';

export interface JurnalSikapListItem {
  id: string;
  tanggalFormatted: string;
  jenis: JenisJurnalSikap;
  siswaId: string;
  siswaNama: string;
  snapshotRuang: string;
  jurusanKode: string;
  konselorNama: string;
  summaryText: string;
  tindakLanjut: string;
  hasFoto: boolean;
}

export function JurnalSikapListClient({
  items,
  ruangOptions,
}: {
  items: JurnalSikapListItem[];
  ruangOptions: string[];
}) {
  const [filterJenis, setFilterJenis] = useState<'ALL' | JenisJurnalSikap>('ALL');
  const [filterRuang, setFilterRuang] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const prestasiCount = useMemo(
    () => items.filter((i) => i.jenis === 'BERPRESTASI').length,
    [items]
  );
  const masalahCount = useMemo(
    () => items.filter((i) => i.jenis === 'BERMASALAH').length,
    [items]
  );
  const homeVisitCount = useMemo(
    () => items.filter((i) => i.jenis === 'HOME_VISIT').length,
    [items]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (filterJenis !== 'ALL' && item.jenis !== filterJenis) return false;
      if (filterRuang !== 'ALL' && item.snapshotRuang !== filterRuang) return false;
      if (!q) return true;
      return (
        item.siswaNama.toLowerCase().includes(q) ||
        item.konselorNama.toLowerCase().includes(q) ||
        item.snapshotRuang.toLowerCase().includes(q) ||
        item.summaryText.toLowerCase().includes(q) ||
        item.tindakLanjut.toLowerCase().includes(q)
      );
    });
  }, [items, filterJenis, filterRuang, searchQuery]);

  const hasActiveFilter =
    filterJenis !== 'ALL' || filterRuang !== 'ALL' || searchQuery.trim() !== '';

  return (
    <div className="flex flex-col gap-3.5">
      {/* 3 Kartu Angka Ringkas (selaras dengan Beranda Guru BK, sekaligus quick filter) */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Ringkasan Jurnal Sikap">
        <button
          type="button"
          onClick={() =>
            setFilterJenis((cur) =>
              cur === 'BERPRESTASI' ? 'ALL' : 'BERPRESTASI'
            )
          }
          className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
            filterJenis === 'BERPRESTASI'
              ? 'border-[#047857] bg-[#ECFDF5] ring-2 ring-[#047857]/15'
              : 'border-zinc-200/80 bg-white hover:border-[#A7F3D0]'
          }`}
        >
          <div className="text-xs font-medium text-zinc-500">Berprestasi</div>
          <div className="mt-0.5 text-xl font-extrabold text-[#047857]">
            {prestasiCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilterJenis((cur) =>
              cur === 'BERMASALAH' ? 'ALL' : 'BERMASALAH'
            )
          }
          className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
            filterJenis === 'BERMASALAH'
              ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/15'
              : 'border-zinc-200/80 bg-white hover:border-amber-300'
          }`}
        >
          <div className="text-xs font-medium text-zinc-500">Bermasalah</div>
          <div className="mt-0.5 text-xl font-extrabold text-amber-600">
            {masalahCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilterJenis((cur) =>
              cur === 'HOME_VISIT' ? 'ALL' : 'HOME_VISIT'
            )
          }
          className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
            filterJenis === 'HOME_VISIT'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/15'
              : 'border-zinc-200/80 bg-white hover:border-blue-300'
          }`}
        >
          <div className="text-xs font-medium text-zinc-500">Home Visit</div>
          <div className="mt-0.5 text-xl font-extrabold text-blue-600">
            {homeVisitCount}
          </div>
        </button>
      </section>

      {/* Search & Filter Bar (selaras dengan JurnalFilterClient) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[190px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa, guru, atau catatan..."
            className="w-full rounded-xl border border-zinc-200/80 bg-white pl-9 pr-8 py-2.5 text-xs font-medium text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-zinc-400 focus:border-[#047857] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={filterRuang}
          onChange={(e) => setFilterRuang(e.target.value)}
          className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:border-[#047857] focus:outline-none"
        >
          <option value="ALL">Semua Kelas</option>
          {ruangOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setFilterJenis('ALL');
              setFilterRuang('ALL');
              setSearchQuery('');
            }}
            className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Reset
          </button>
        )}
      </div>

      {/* Info jumlah */}
      <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 px-0.5">
        <span>
          Menampilkan <strong className="text-zinc-700">{filtered.length}</strong>{' '}
          dari {items.length} catatan
        </span>
      </div>

      {/* List Kartu (selaras dengan kartu Jurnal BK) */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-9 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
            <NotebookPen className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-zinc-900">
            {items.length === 0
              ? 'Belum ada Jurnal Penilaian Sikap masuk'
              : 'Tidak ada catatan yang cocok dengan filter'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Catatan sikap yang diinput seluruh guru akan otomatis tampil di sini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((item) => {
            const badgeCls =
              item.jenis === 'BERPRESTASI'
                ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                : item.jenis === 'HOME_VISIT'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700';
            const label =
              item.jenis === 'BERPRESTASI'
                ? 'Berprestasi'
                : item.jenis === 'HOME_VISIT'
                  ? 'Home Visit'
                  : 'Bermasalah';

            return (
              <Link
                key={item.id}
                href={`/jurnal-sikap/${item.id}`}
                className="group block rounded-xl border border-zinc-200/70 bg-white p-3.5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)] transition-all hover:border-[#A7F3D0] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeCls}`}
                      >
                        {label}
                      </span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700">
                        {item.snapshotRuang}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getMajorBadgeClass(
                          item.jurusanKode
                        )}`}
                      >
                        {item.jurusanKode}
                      </span>
                      {item.hasFoto && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          <Camera className="h-3 w-3" />
                          Foto
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 truncate text-[14.5px] font-bold text-zinc-950 group-hover:text-[#047857]">
                      {item.siswaNama}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-600">
                      {item.summaryText}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#047857]" />
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-zinc-200/80 pt-2">
                  <span className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
                    {item.tanggalFormatted} • {item.konselorNama}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
