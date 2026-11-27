import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  Calendar,
  ChevronRight,
  FileText,
  Home,
  Pencil,
  User,
} from 'lucide-react';
import type { JenisJurnalSikap, JenisKelamin } from '@prisma/client';
import {
  formatNamaGuru,
  formatTanggalIndo,
  getMajorTextClass,
} from '@/lib/utils';
import { DeleteJurnalSikapButton } from '@/components/jurnal-sikap/DeleteJurnalSikapButton';
import { HomeVisitPhotoCard } from '@/components/jurnal-sikap/HomeVisitPhotoCard';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export interface JurnalSikapDetailData {
  id: string;
  tanggal: Date;
  snapshot_ruang: string;
  jenis: JenisJurnalSikap;
  prestasi_dalam: string | null;
  sikap_perilaku: string | null;
  permasalahan: string | null;
  kendala: string | null;
  solusi: string | null;
  catatan: string | null;
  tindak_lanjut: string;
  foto_drive_id: string | null;
  foto_file_name: string | null;
  foto_list?: { drive_id: string; file_name: string | null }[];
  siswa_id: string;
  siswa: {
    nama_lengkap: string;
    jenis_kelamin: JenisKelamin;
    jurusan: { kode: string };
  };
  konselor: { nama_lengkap: string };
}

export function JurnalSikapDetailView({
  item,
  canViewSiswaProfile,
  canModify,
  deleteRedirectTo,
}: {
  item: JurnalSikapDetailData;
  canViewSiswaProfile: boolean;
  canModify: boolean;
  deleteRedirectTo: string;
}) {
  const isMale = item.siswa.jenis_kelamin === 'L';
  const counselorName = formatNamaGuru(item.konselor.nama_lengkap);

  const meta =
    item.jenis === 'BERPRESTASI'
      ? {
          label: 'Berprestasi',
          pillClass: 'bg-[#ECFDF5] text-[#047857]',
          iconClass: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]',
          Icon: Award,
        }
      : item.jenis === 'HOME_VISIT'
        ? {
            label: 'Home Visit',
            pillClass: 'bg-blue-50 text-blue-700',
            iconClass: 'border-blue-200 bg-blue-50 text-blue-600',
            Icon: Home,
          }
        : {
            label: 'Bermasalah',
            pillClass: 'bg-amber-50 text-amber-700',
            iconClass: 'border-amber-200 bg-amber-50 text-amber-600',
            Icon: AlertTriangle,
          };

  const JenisIcon = meta.Icon;

  const chronologicalItems =
    item.jenis === 'BERPRESTASI'
      ? [
          {
            num: '1',
            label: 'Berprestasi dalam hal',
            content: item.prestasi_dalam || '-',
          },
          {
            num: '2',
            label: 'Sikap / Perilaku',
            content: item.sikap_perilaku || '-',
          },
          {
            num: '3',
            label: 'Tindak Lanjut',
            content: item.tindak_lanjut,
          },
          ...(item.catatan
            ? [{ num: '4', label: 'Catatan Tambahan', content: item.catatan }]
            : []),
        ]
      : [
          {
            num: '1',
            label: 'Permasalahan',
            content: item.permasalahan || '-',
          },
          ...(item.kendala
            ? [{ num: '2', label: 'Kendala', content: item.kendala }]
            : []),
          ...(item.solusi
            ? [{ num: '3', label: 'Solusi', content: item.solusi }]
            : []),
          {
            num: '4',
            label: 'Tindak Lanjut',
            content: item.tindak_lanjut,
          },
          ...(item.catatan
            ? [{ num: '5', label: 'Catatan Tambahan', content: item.catatan }]
            : []),
        ];

  const StudentRowInner = (
    <>
      <div
        aria-hidden="true"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold tracking-tight ${
          isMale
            ? 'border-sky-200/80 bg-sky-50 text-sky-700'
            : 'border-rose-200/80 bg-rose-50 text-rose-600'
        }`}
      >
        {getInitials(item.siswa.nama_lengkap)}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[15.5px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-[#047857]">
          {item.siswa.nama_lengkap}
        </h2>
        <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
          {item.snapshot_ruang} <span className="text-zinc-300">|</span>{' '}
          <span
            className={`font-semibold ${getMajorTextClass(
              item.siswa.jurusan.kode
            )}`}
          >
            {item.siswa.jurusan.kode}
          </span>
        </p>
        {canViewSiswaProfile && (
          <span className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#047857]">
            Lihat Riwayat Siswa
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>

      <span
        title={meta.label}
        aria-label={meta.label}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${meta.iconClass}`}
      >
        <JenisIcon className="h-3.5 w-3.5" />
      </span>
    </>
  );

  const allPhotos: { driveId: string; fileName?: string | null }[] = [
    ...(item.foto_list ?? []).map((f) => ({
      driveId: f.drive_id,
      fileName: f.file_name,
    })),
  ];
  if (
    item.foto_drive_id &&
    !allPhotos.some((p) => p.driveId === item.foto_drive_id)
  ) {
    allPhotos.unshift({
      driveId: item.foto_drive_id,
      fileName: item.foto_file_name,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* 1. Student Identity & Summary Card (identik dengan Detail Jurnal BK) */}
      <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
        {canViewSiswaProfile ? (
          <Link
            href={`/siswa/${item.siswa_id}`}
            className="group flex items-center gap-3 rounded-xl transition-colors"
          >
            {StudentRowInner}
          </Link>
        ) : (
          <div className="flex items-center gap-3">{StudentRowInner}</div>
        )}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#c3c1c1] pt-3 text-[11.5px] font-medium text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#047857]" />
            {formatTanggalIndo(item.tanggal)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-zinc-400" />
            {counselorName}
          </span>
        </div>
      </section>

      {/* 2. Chronological Notes Card (identik dengan Detail Jurnal BK) */}
      <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
              <FileText className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-extrabold tracking-wider text-zinc-800 uppercase">
              Catatan Penilaian Sikap
            </h3>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${meta.pillClass}`}
          >
            {meta.label}
          </span>
        </div>

        <div className="mt-3.5 divide-y divide-zinc-100">
          {chronologicalItems.map((field) => (
            <div key={field.num} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                  {field.num}
                </span>
                <h4 className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                  {field.label}
                </h4>
              </div>
              <p className="mt-1.5 pl-7 whitespace-pre-line text-[13.5px] leading-relaxed text-zinc-800">
                {field.content}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Bukti Foto Home Visit (kartu lampiran kompak + Lightbox fullscreen) */}
      {allPhotos.length > 0 && <HomeVisitPhotoCard photos={allPhotos} />}

      {/* 4. Tombol Aksi Edit & Hapus (selaras dengan gaya tombol halaman Profil Saya) */}
      {canModify && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/guru/${item.id}/edit`}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 shadow-xs transition-all hover:border-[#047857]/30 hover:text-[#047857] active:scale-[0.985]"
          >
            <Pencil className="h-4 w-4" />
            Edit Jurnal
          </Link>
          <DeleteJurnalSikapButton
            id={item.id}
            redirectTo={deleteRedirectTo}
            label="Hapus Jurnal"
          />
        </div>
      )}
    </div>
  );
}
