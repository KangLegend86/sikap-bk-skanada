import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Hash,
  Lock,
  LockOpen,
  MessageCircle,
  MessageSquare,
  User,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  formatNamaGuru,
  formatTanggalIndo,
  formatWaNumber,
} from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function SiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr/siswa');
  if (session.role === 'GURU') redirect('/guru');

  const { id } = await params;

  const siswa = await prisma.siswa.findUnique({
    where: { id },
    select: {
      id: true,
      no_absen: true,
      nama_lengkap: true,
      jenis_kelamin: true,
      nama_wali: true,
      no_hp_ortu: true,
      jurusan: { select: { kode: true, nama_lengkap: true } },
      ruang_kelas: { select: { nama_ruang: true } },
      jurnal: {
        orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
        select: {
          id: true,
          tanggal_konseling: true,
          snapshot_ruang: true,
          permasalahan: true,
          status: true,
          is_shared_with_pjr: true,
          guru_bk: { select: { nama_lengkap: true } },
          kategori: {
            select: {
              kategori_id: true,
              kategori: { select: { nama_kategori: true } },
            },
          },
          _count: { select: { feedback: true } },
        },
      },
      jurnal_sikap: {
        orderBy: [{ tanggal: 'desc' }, { created_at: 'desc' }],
        select: {
          id: true,
          tanggal: true,
          snapshot_ruang: true,
          jenis: true,
          prestasi_dalam: true,
          sikap_perilaku: true,
          permasalahan: true,
          tindak_lanjut: true,
          foto_drive_id: true,
          konselor: { select: { nama_lengkap: true } },
        },
      },
    },
  });

  if (!siswa) notFound();

  const ortuWa = formatWaNumber(siswa.no_hp_ortu);
  const isMale = siswa.jenis_kelamin === 'L';
  const totalJurnal = siswa.jurnal.length;
  const prosesCount = siswa.jurnal.filter((j) => j.status === 'DALAM_PROSES').length;
  const selesaiCount = siswa.jurnal.filter((j) => j.status === 'SELESAI').length;

  return (
    <AppShell
      session={session}
      title="Profil Siswa"
      subtitle={`${siswa.ruang_kelas.nama_ruang} • ${siswa.jurusan.kode}`}
      backHref="/siswa"
    >
      <div className="mx-auto max-w-2xl space-y-5">
        {/* 1. Student Profile Hero & Biodata Card */}
        <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3.5">
            <div
              aria-hidden="true"
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border text-sm font-extrabold tracking-tight ${
                isMale
                  ? 'border-sky-200/80 bg-sky-50 text-sky-700'
                  : 'border-rose-200/80 bg-rose-50 text-rose-600'
              }`}
            >
              {getInitials(siswa.nama_lengkap)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold tracking-[-0.01em] text-zinc-950">
                {siswa.nama_lengkap}
              </h2>
              <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                {siswa.ruang_kelas.nama_ruang}{' '}
                <span className="text-zinc-300">|</span>{' '}
                <span className="font-semibold text-[#047857]">
                  {siswa.jurusan.kode}
                </span>
              </p>
              <span
                className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                  isMale
                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                    : 'border-rose-200 bg-rose-50 text-rose-600'
                }`}
              >
                {isMale ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>
          </div>

          {/* 3 Mini Summary Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 px-3 py-2 text-center">
              <div className="text-[11px] font-medium text-zinc-500">Total</div>
              <div className="mt-0.5 text-lg font-extrabold text-zinc-900">
                {totalJurnal}
              </div>
            </div>
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-3 py-2 text-center">
              <div className="text-[11px] font-medium text-amber-700">Proses</div>
              <div className="mt-0.5 text-lg font-extrabold text-amber-600">
                {prosesCount}
              </div>
            </div>
            <div className="rounded-xl border border-[#A7F3D0]/80 bg-[#ECFDF5]/60 px-3 py-2 text-center">
              <div className="text-[11px] font-medium text-[#047857]">Selesai</div>
              <div className="mt-0.5 text-lg font-extrabold text-[#047857]">
                {selesaiCount}
              </div>
            </div>
          </div>

          {/* Biodata Details */}
          <dl className="mt-4 grid grid-cols-1 gap-2.5 border-t border-[#c3c1c1] pt-3.5 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                <Hash className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <dt className="text-[10.5px] font-medium text-zinc-400">
                  No. Absen
                </dt>
                <dd className="font-semibold text-zinc-900">
                  {siswa.no_absen ? String(siswa.no_absen).padStart(2, '0') : '-'}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <dt className="text-[10.5px] font-medium text-zinc-400">
                  Kompetensi Keahlian
                </dt>
                <dd className="truncate font-semibold text-zinc-900">
                  {siswa.jurusan.nama_lengkap}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:col-span-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                <User className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[10.5px] font-medium text-zinc-400">
                  Orang Tua / Wali
                </dt>
                <dd className="truncate font-semibold text-zinc-900">
                  {siswa.nama_wali || 'Belum diisi'}
                </dd>
              </div>
            </div>
          </dl>

          {/* Quick WhatsApp Button */}
          {ortuWa && (
            <div className="mt-3.5 border-t border-zinc-100 pt-3">
              <a
                href={`https://wa.me/${ortuWa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#047857] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#065F46] active:scale-[0.985]"
              >
                <MessageCircle className="h-4 w-4" />
                Hubungi Orang Tua via WhatsApp
              </a>
            </div>
          )}
        </section>

        {/* 2. Riwayat Konseling Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-[13px] font-extrabold tracking-wider text-zinc-700 uppercase">
                Riwayat Konseling
              </h3>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              {totalJurnal} Jurnal
            </span>
          </div>

          {siswa.jurnal.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm font-semibold text-zinc-700">
                Belum ada catatan konseling
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Siswa ini belum memiliki riwayat bimbingan konseling BK.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {siswa.jurnal.map((item) => {
                const kategoriLabel = item.kategori
                  .map((k) => k.kategori.nama_kategori)
                  .join(', ');

                return (
                  <Link
                    key={item.id}
                    href={`/jurnal/${item.id}`}
                    className="group flex flex-col justify-between gap-2.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out hover:border-[#047857]/30 hover:shadow-[0_6px_18px_-4px_rgba(4,120,87,0.12)] active:scale-[0.985] active:bg-zinc-50/90 active:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-zinc-500">
                          {item.snapshot_ruang}
                          {kategoriLabel && (
                            <>
                              {' '}
                              <span className="text-zinc-300">|</span>{' '}
                              <span className="font-semibold text-[#047857]">
                                {kategoriLabel}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-zinc-700 group-hover:text-zinc-950">
                          {item.permasalahan}
                        </p>
                      </div>

                      <span
                        title={
                          item.is_shared_with_pjr
                            ? 'Dibagikan ke PJR'
                            : 'Privat Internal BK'
                        }
                        aria-label={
                          item.is_shared_with_pjr
                            ? 'Dibagikan ke PJR'
                            : 'Privat Internal BK'
                        }
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          item.is_shared_with_pjr
                            ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                            : 'border-rose-200 bg-rose-50 text-rose-600'
                        }`}
                      >
                        {item.is_shared_with_pjr ? (
                          <LockOpen className="h-3.5 w-3.5" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#c3c1c1] pt-2">
                      <span className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
                        {formatTanggalIndo(item.tanggal_konseling)} •{' '}
                        {formatNamaGuru(item.guru_bk.nama_lengkap)}
                      </span>

                      <div className="flex shrink-0 items-center gap-2">
                        {item._count.feedback > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857]">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {item._count.feedback}
                          </span>
                        )}
                        <span
                          title={item.status === 'SELESAI' ? 'Selesai' : 'Dalam Proses'}
                          aria-label={item.status === 'SELESAI' ? 'Selesai' : 'Dalam Proses'}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                            item.status === 'SELESAI'
                              ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                              : 'border-amber-200 bg-amber-50 text-amber-600'
                          }`}
                        >
                          {item.status === 'SELESAI' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Riwayat Jurnal Penilaian Sikap */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-900">
              Riwayat Jurnal Penilaian Sikap ({siswa.jurnal_sikap.length})
            </h2>
            <Link
              href="/guru/baru"
              className="text-xs font-semibold text-[#047857] hover:underline"
            >
              + Catat Sikap
            </Link>
          </div>

          {siswa.jurnal_sikap.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center">
              <p className="text-xs font-medium text-zinc-500">
                Belum ada catatan Jurnal Penilaian Sikap untuk siswa ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {siswa.jurnal_sikap.map((js) => {
                const badgeCls =
                  js.jenis === 'BERPRESTASI'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : js.jenis === 'HOME_VISIT'
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700';
                const label =
                  js.jenis === 'BERPRESTASI'
                    ? 'Berprestasi'
                    : js.jenis === 'HOME_VISIT'
                      ? 'Home Visit'
                      : 'Bermasalah';
                const ringkasan =
                  js.jenis === 'BERPRESTASI'
                    ? js.prestasi_dalam || js.sikap_perilaku || '-'
                    : js.permasalahan || '-';

                return (
                  <Link
                    key={js.id}
                    href={`/jurnal-sikap/${js.id}`}
                    className="block rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xs transition-colors hover:border-[#A7F3D0]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeCls}`}
                      >
                        {label}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-400">
                        {formatTanggalIndo(js.tanggal)} • {js.snapshot_ruang}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] text-zinc-700">
                      {ringkasan}
                    </p>
                    <p className="mt-1.5 text-[11px] text-zinc-500">
                      Konselor:{' '}
                      <span className="font-semibold text-zinc-700">
                        {formatNamaGuru(js.konselor.nama_lengkap)}
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
