'use client';

import { useState } from 'react';
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
  Trash2,
  X,
} from 'lucide-react';
import type { JenisJurnalSikap } from '@prisma/client';
import { deleteJurnalSikapAction } from '@/actions/jurnal-sikap';
import type { GuruRiwayatItem } from '@/components/jurnal-sikap/GuruRiwayatClient';

export interface GuruRiwayatGroup {
  monthLabel: string;
  items: GuruRiwayatItem[];
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

export function GuruRiwayatGroupedClient({
  groups,
}: {
  groups: GuruRiwayatGroup[];
}) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<GuruRiwayatItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.monthLabel} className="space-y-2.5">
            <h2 className="px-0.5 text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
              {group.monthLabel}
            </h2>

            <div className="flex flex-col gap-3">
              {group.items.map((item) => {
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

                    <p className="line-clamp-1 text-[13.5px] leading-relaxed text-zinc-600">
                      {summaryText}
                    </p>

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
          </section>
        ))}
      </div>

      {/* Bottom Sheet Detail */}
      {selectedItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <div
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
            />

            <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
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

                <div>
                  <p className="text-[11px] font-bold tracking-wider text-[#047857] uppercase">
                    Tindak Lanjut
                  </p>
                  <p className="mt-1 whitespace-pre-line font-medium text-zinc-900">
                    {selectedItem.tindakLanjut}
                  </p>
                </div>

                {selectedItem.catatan && (
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                      Catatan Tambahan
                    </p>
                    <p className="mt-1 whitespace-pre-line text-zinc-800">
                      {selectedItem.catatan}
                    </p>
                  </div>
                )}

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
