'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  Camera,
  Edit3,
  ExternalLink,
  Home,
  Loader2,
  NotebookPen,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { JenisJurnalSikap } from '@prisma/client';
import { deleteJurnalSikapAction } from '@/actions/jurnal-sikap';

export interface GuruRiwayatItem {
  id: string;
  tanggalFormatted: string;
  jenis: JenisJurnalSikap;
  siswaNama: string;
  snapshotRuang: string;
  jurusanKode: string;
  konselorNama: string;
  prestasiDalam: string | null;
  sikapPerilaku: string | null;
  permasalahan: string | null;
  kendala: string | null;
  solusi: string | null;
  catatan: string | null;
  tindakLanjut: string;
  fotoDriveId: string | null;
  fotoFileName: string | null;
  canModify: boolean;
}

const JENIS_META: Record<
  JenisJurnalSikap,
  {
    label: string;
    textClass: string;
    iconWrapClass: string;
    badgeClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  BERPRESTASI: {
    label: 'Berprestasi',
    textClass: 'text-[#047857]',
    iconWrapClass: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]',
    badgeClass: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]',
    Icon: Award,
  },
  BERMASALAH: {
    label: 'Bermasalah',
    textClass: 'text-amber-600',
    iconWrapClass: 'border-amber-200 bg-amber-50 text-amber-600',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    Icon: AlertTriangle,
  },
  HOME_VISIT: {
    label: 'Home Visit',
    textClass: 'text-blue-600',
    iconWrapClass: 'border-blue-200 bg-blue-50 text-blue-600',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
    Icon: Home,
  },
};

export function GuruRiwayatClient({ items }: { items: GuruRiwayatItem[] }) {
  const router = useRouter();
  const [filterJenis, setFilterJenis] = useState<'ALL' | JenisJurnalSikap>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<GuruRiwayatItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      if (!q) return true;
      const summary =
        item.jenis === 'BERPRESTASI'
          ? `${item.prestasiDalam ?? ''} ${item.sikapPerilaku ?? ''}`
          : `${item.permasalahan ?? ''} ${item.solusi ?? ''}`;
      return (
        item.siswaNama.toLowerCase().includes(q) ||
        item.snapshotRuang.toLowerCase().includes(q) ||
        item.jurusanKode.toLowerCase().includes(q) ||
        summary.toLowerCase().includes(q) ||
        item.tindakLanjut.toLowerCase().includes(q)
      );
    });
  }, [items, filterJenis, searchQuery]);

  async function handleDelete(item: GuruRiwayatItem) {
    const ok = window.confirm(
      'Yakin ingin menghapus catatan penilaian sikap ini? Jika ada bukti foto Home Visit, foto di Google Drive juga akan dipindahkan ke Sampah.'
    );
    if (!ok) return;

    setDeletingId(item.id);
    const res = await deleteJurnalSikapAction(item.id);
    setDeletingId(null);

    if (res.error) {
      window.alert(res.error);
      return;
    }

    setSelectedItem(null);
    router.refresh();
  }

  return (
    <>
      {/* 3 Kartu Angka Ringkas (selaras dengan Beranda Guru BK + bisa diklik jadi quick filter) */}
      <section
        className="grid grid-cols-3 gap-2 sm:gap-3"
        aria-label="Ringkasan Catatan Saya"
      >
        <button
          type="button"
          onClick={() =>
            setFilterJenis((cur) =>
              cur === 'BERPRESTASI' ? 'ALL' : 'BERPRESTASI'
            )
          }
          className={`cursor-pointer rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
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
          className={`cursor-pointer rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
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
          className={`cursor-pointer rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
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

      {/* Bagian Riwayat Catatan Saya */}
      <section className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
              <NotebookPen className="h-4 w-4" />
            </div>
            <h2 className="text-[13px] font-extrabold tracking-wider text-zinc-700 uppercase">
              Riwayat Catatan Saya
            </h2>
          </div>

          {filterJenis !== 'ALL' ? (
            <button
              type="button"
              onClick={() => setFilterJenis('ALL')}
              className="cursor-pointer text-xs font-semibold text-[#047857] hover:underline"
            >
              Tampilkan Semua
            </button>
          ) : (
            <span className="text-xs font-semibold text-zinc-400">
              {items.length} catatan
            </span>
          )}
        </div>

        {/* Pencarian Ringkas (hanya muncul bila sudah ada catatan) */}
        {items.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, kelas, atau catatan..."
              className="w-full rounded-xl border border-zinc-200/80 bg-white py-2.5 pr-9 pl-10 text-sm text-zinc-900 shadow-[0_1px_4px_rgba(15,23,42,0.04)] placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <NotebookPen className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-2 text-sm font-semibold text-zinc-700">
              {items.length === 0
                ? 'Belum ada catatan penilaian sikap.'
                : 'Tidak ada catatan yang cocok.'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {items.length === 0
                ? 'Mulai catat siswa berprestasi, butuh bimbingan, atau home visit melalui tombol di atas.'
                : 'Coba ubah kata kunci pencarian atau reset filter kategori.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => {
              const meta = JENIS_META[item.jenis];
              const JenisIcon = meta.Icon;
              const summaryText =
                item.jenis === 'BERPRESTASI'
                  ? item.prestasiDalam || item.sikapPerilaku || '-'
                  : item.permasalahan || '-';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="group flex w-full cursor-pointer flex-col justify-between gap-2.5 rounded-xl border border-zinc-200/70 bg-white p-4 text-left shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out hover:border-[#047857]/30 hover:shadow-[0_6px_18px_-4px_rgba(4,120,87,0.12)] active:scale-[0.985] active:bg-zinc-50/90 active:shadow-xs"
                >
                  {/* Baris 1: Nama Siswa + Ikon Kategori Bulat (identik dengan kartu Jurnal BK) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-[#047857]">
                        {item.siswaNama}
                      </h3>
                      <p className="mt-1 truncate text-xs font-medium text-zinc-500">
                        {item.snapshotRuang} • {item.jurusanKode}{' '}
                        <span className="text-zinc-300">|</span>{' '}
                        <span className={`font-semibold ${meta.textClass}`}>
                          {meta.label}
                        </span>
                      </p>
                    </div>

                    <span
                      title={meta.label}
                      aria-label={meta.label}
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${meta.iconWrapClass}`}
                    >
                      <JenisIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  {/* Baris 2: Ringkasan 1 baris bersih */}
                  <p className="line-clamp-1 text-[13.5px] leading-relaxed text-zinc-600">
                    {summaryText}
                  </p>

                  {/* Baris 3: Footer tanggal & indikator foto */}
                  <div className="flex items-center justify-between gap-2 border-t border-zinc-200/80 pt-2">
                    <span className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
                      {item.tanggalFormatted}
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.fotoDriveId && (
                        <span
                          title="Memiliki bukti foto Home Visit"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600"
                        >
                          <Camera className="h-3 w-3" />
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-[#047857] opacity-80 group-hover:opacity-100">
                        Detail
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom Sheet Detail Catatan (bersih, tampilkan isi lengkap + foto + tombol Edit/Hapus) */}
      {selectedItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <div
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
            />

            <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${
                      JENIS_META[selectedItem.jenis].badgeClass
                    }`}
                  >
                    {JENIS_META[selectedItem.jenis].label}
                  </span>
                  <h3 className="mt-1.5 truncate text-base font-extrabold text-zinc-950">
                    {selectedItem.siswaNama}
                  </h3>
                  <p className="text-xs font-medium text-zinc-500">
                    {selectedItem.snapshotRuang} • {selectedItem.jurusanKode} •{' '}
                    {selectedItem.tanggalFormatted}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  aria-label="Tutup detail"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
                {selectedItem.jenis === 'BERPRESTASI' ? (
                  <>
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-[#047857] uppercase">
                        Berprestasi dalam hal
                      </p>
                      <p className="mt-1 whitespace-pre-line text-zinc-800">
                        {selectedItem.prestasiDalam || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                        Sikap / Perilaku
                      </p>
                      <p className="mt-1 whitespace-pre-line text-zinc-800">
                        {selectedItem.sikapPerilaku || '-'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">
                        Permasalahan
                      </p>
                      <p className="mt-1 whitespace-pre-line text-zinc-800">
                        {selectedItem.permasalahan || '-'}
                      </p>
                    </div>
                    {selectedItem.kendala && (
                      <div>
                        <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                          Kendala
                        </p>
                        <p className="mt-1 whitespace-pre-line text-zinc-800">
                          {selectedItem.kendala}
                        </p>
                      </div>
                    )}
                    {selectedItem.solusi && (
                      <div>
                        <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                          Solusi
                        </p>
                        <p className="mt-1 whitespace-pre-line text-zinc-800">
                          {selectedItem.solusi}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedItem.catatan && (
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                      Catatan
                    </p>
                    <p className="mt-1 whitespace-pre-line text-zinc-800">
                      {selectedItem.catatan}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold tracking-wider text-[#047857] uppercase">
                    Tindak Lanjut
                  </p>
                  <p className="mt-1 whitespace-pre-line font-medium text-zinc-900">
                    {selectedItem.tindakLanjut}
                  </p>
                </div>

                {selectedItem.fotoDriveId && (
                  <div className="space-y-2 rounded-xl border border-blue-200/80 bg-blue-50/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                        <Camera className="h-3.5 w-3.5" />
                        Bukti Foto Home Visit
                      </span>
                      <a
                        href={`https://drive.google.com/file/d/${selectedItem.fotoDriveId}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Drive
                      </a>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/jurnal-sikap/foto/${selectedItem.fotoDriveId}`}
                        alt={selectedItem.fotoFileName || 'Bukti Home Visit'}
                        className="max-h-60 w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {selectedItem.canModify && (
                <div className="flex items-center gap-2 border-t border-zinc-100 px-5 py-3.5">
                  <button
                    type="button"
                    disabled={deletingId === selectedItem.id}
                    onClick={() => handleDelete(selectedItem)}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100/70 disabled:opacity-60"
                  >
                    {deletingId === selectedItem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Hapus
                  </button>
                  <Link
                    href={`/guru/${selectedItem.id}/edit`}
                    onClick={() => setSelectedItem(null)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#047857] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#065F46]"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Catatan
                  </Link>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
