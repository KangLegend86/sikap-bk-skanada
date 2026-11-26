import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
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
  getSapaan,
} from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import { JurnalStatusUpdateClient } from '@/components/jurnal/JurnalStatusUpdateClient';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function JurnalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr/kasus');

  const { id } = await params;

  const jurnal = await prisma.jurnalBk.findUnique({
    where: { id },
    include: {
      siswa: {
        include: {
          jurusan: true,
          ruang_kelas: {
            include: {
              akun_pjr: {
                where: { is_active: true, role: 'GURU_PJR' },
                include: { pegawai: true },
                take: 1,
              },
            },
          },
        },
      },
      guru_bk: true,
      kategori: { include: { kategori: true } },
      feedback: {
        orderBy: { created_at: 'desc' },
        include: {
          user_pjr: {
            include: {
              pegawai: true,
              ruang_kelas: true,
            },
          },
        },
      },
    },
  });

  if (!jurnal) notFound();

  const canEdit =
    session.role === 'ADMIN' || jurnal.guru_bk_id === session.pegawaiId;

  const pjrAkun = jurnal.siswa.ruang_kelas.akun_pjr[0];
  const pjrWa = formatWaNumber(pjrAkun?.pegawai.no_whatsapp);
  const ortuWa = formatWaNumber(jurnal.siswa.no_hp_ortu);
  const isMale = jurnal.siswa.jenis_kelamin === 'L';
  const isSelesai = jurnal.status === 'SELESAI';
  const counselorName = formatNamaGuru(jurnal.guru_bk.nama_lengkap);

  const pjrWaText = pjrAkun
    ? encodeURIComponent(
        `Assalamu'alaikum ${getSapaan(pjrAkun.pegawai.jenis_kelamin)} ${formatNamaGuru(
          pjrAkun.pegawai.nama_lengkap
        )}, mohon izin menyampaikan tindak lanjut konseling ananda *${
          jurnal.siswa.nama_lengkap
        }* (${jurnal.snapshot_ruang} / ${jurnal.siswa.jurusan.kode}):\n\n*Tindak Lanjut:* ${
          jurnal.tindak_lanjut
        }\n\nMohon bantuannya untuk pemantauan di kelas. Terima kasih.`
      )
    : '';

  const ortuWaText = ortuWa
    ? encodeURIComponent(
        `Assalamu'alaikum Bapak/Ibu${
          jurnal.siswa.nama_wali ? ` ${jurnal.siswa.nama_wali}` : ''
        }, kami dari Guru BK SMKS NU 2 Kedungpring ingin mengkomunikasikan perkembangan ananda *${
          jurnal.siswa.nama_lengkap
        }* (${jurnal.snapshot_ruang}).\n\n*Rencana Tindak Lanjut:* ${
          jurnal.tindak_lanjut
        }\n\nTerima kasih atas kerja samanya.`
      )
    : '';

  const chronologicalItems = [
    { num: '1', label: 'Permasalahan', content: jurnal.permasalahan },
    ...(jurnal.kendala
      ? [{ num: '2', label: 'Kendala', content: jurnal.kendala }]
      : []),
    ...(jurnal.solusi
      ? [{ num: '3', label: 'Solusi', content: jurnal.solusi }]
      : []),
    { num: '4', label: 'Tindak Lanjut', content: jurnal.tindak_lanjut },
    ...(jurnal.catatan
      ? [{ num: '5', label: 'Catatan Tambahan', content: jurnal.catatan }]
      : []),
  ];

  return (
    <AppShell
      session={session}
      title="Detail Jurnal BK"
      subtitle={`${jurnal.siswa.nama_lengkap} • ${jurnal.snapshot_ruang}`}
      backHref="/jurnal"
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* 1. Student Identity & Case Summary Card */}
        <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          {/* Tappable Student Row */}
          <Link
            href={`/siswa/${jurnal.siswa_id}`}
            className="group flex items-center gap-3 rounded-xl transition-colors"
          >
            <div
              aria-hidden="true"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold tracking-tight ${
                isMale
                  ? 'border-sky-200/80 bg-sky-50 text-sky-700'
                  : 'border-rose-200/80 bg-rose-50 text-rose-600'
              }`}
            >
              {getInitials(jurnal.siswa.nama_lengkap)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15.5px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-[#047857]">
                {jurnal.siswa.nama_lengkap}
              </h2>
              <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                {jurnal.snapshot_ruang}{' '}
                <span className="text-zinc-300">|</span>{' '}
                <span className="font-semibold text-[#047857]">
                  {jurnal.siswa.jurusan.kode}
                </span>
              </p>
              <span className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#047857]">
                Lihat Riwayat Siswa
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>

            {/* Compact Status & Privacy Icons */}
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                title={
                  jurnal.is_shared_with_pjr
                    ? 'Dibagikan ke PJR'
                    : 'Privat Internal BK'
                }
                aria-label={
                  jurnal.is_shared_with_pjr
                    ? 'Dibagikan ke PJR'
                    : 'Privat Internal BK'
                }
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                  jurnal.is_shared_with_pjr
                    ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                    : 'border-rose-200 bg-rose-50 text-rose-600'
                }`}
              >
                {jurnal.is_shared_with_pjr ? (
                  <LockOpen className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </span>

              <span
                title={isSelesai ? 'Selesai' : 'Dalam Proses'}
                aria-label={isSelesai ? 'Selesai' : 'Dalam Proses'}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                  isSelesai
                    ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                    : 'border-amber-200 bg-amber-50 text-amber-600'
                }`}
              >
                {isSelesai ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
              </span>
            </div>
          </Link>

          {/* Category Tags */}
          {jurnal.kategori.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {jurnal.kategori.map((k) => (
                <span
                  key={k.kategori_id}
                  className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]"
                >
                  {k.kategori.nama_kategori}
                </span>
              ))}
            </div>
          )}

          {/* Meta Footer */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#c3c1c1] pt-3 text-[11.5px] font-medium text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#047857]" />
              {formatTanggalIndo(jurnal.tanggal_konseling)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              {counselorName}
            </span>
          </div>
        </section>

        {/* 2. Chronological Counseling Notes */}
        <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
                <FileText className="h-4 w-4" />
              </span>
              <h3 className="text-xs font-extrabold tracking-wider text-zinc-800 uppercase">
                Catatan Konseling
              </h3>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                isSelesai
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isSelesai ? 'Selesai' : 'Dalam Proses'}
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

          {jurnal.keterangan_status && (
            <div
              className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                isSelesai
                  ? 'border-[#A7F3D0] bg-[#ECFDF5]/70 text-[#065F46]'
                  : 'border-amber-200 bg-amber-50/70 text-amber-900'
              }`}
            >
              {isSelesai ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#047857]" />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <div>
                <span className="font-bold">Keterangan Status: </span>
                <span>{jurnal.keterangan_status}</span>
              </div>
            </div>
          )}
        </section>

        {/* 3. Status Update (Pembuat / Admin) atau Mode Lihat Saja */}
        {canEdit ? (
          <JurnalStatusUpdateClient
            jurnalId={jurnal.id}
            initialStatus={jurnal.status}
            initialKeterangan={jurnal.keterangan_status ?? ''}
          />
        ) : (
          <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Mode Lihat Saja
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Jurnal ini dicatat oleh{' '}
                  <strong className="font-semibold text-zinc-700">
                    {counselorName}
                  </strong>
                  . Anda hanya dapat mengedit jurnal yang Anda buat sendiri.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 4. Koordinasi WhatsApp */}
        <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs font-extrabold tracking-wider text-zinc-800 uppercase">
                Koordinasi WhatsApp
              </h3>
              <p className="text-[11px] text-zinc-400">
                Kirim ringkasan tindak lanjut secara cepat
              </p>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {pjrWa ? (
              <a
                href={`https://wa.me/${pjrWa}?text=${pjrWaText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#047857] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#065F46] active:scale-[0.985]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>WA Guru PJR ({jurnal.snapshot_ruang})</span>
              </a>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 px-3 py-2.5 text-center text-xs text-zinc-400">
                No. WA PJR {jurnal.snapshot_ruang} belum diisi
              </div>
            )}

            {ortuWa ? (
              <a
                href={`https://wa.me/${ortuWa}?text=${ortuWaText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#047857] bg-white px-3.5 py-2.5 text-xs font-bold text-[#047857] transition-all hover:bg-[#ECFDF5] active:scale-[0.985]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>WA Orang Tua / Wali</span>
              </a>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 px-3 py-2.5 text-center text-xs text-zinc-400">
                No. WA Orang Tua belum diisi
              </div>
            )}
          </div>
        </section>

        {/* 5. Catatan Pantauan Guru PJR */}
        <section className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700">
                <MessageSquare className="h-4 w-4" />
              </span>
              <h3 className="text-xs font-extrabold tracking-wider text-zinc-800 uppercase">
                Pantauan Guru PJR
              </h3>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              {jurnal.feedback.length} Laporan
            </span>
          </div>

          {jurnal.feedback.length === 0 ? (
            <div className="mt-3.5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-5 text-center">
              <p className="text-xs font-medium text-zinc-500">
                {jurnal.is_shared_with_pjr
                  ? 'Belum ada catatan pantauan yang dikirim oleh Guru PJR kelas ini.'
                  : 'Jurnal ini bersifat Privat Internal BK sehingga tidak ditampilkan ke Guru PJR.'}
              </p>
            </div>
          ) : (
            <div className="mt-3.5 space-y-2.5">
              {jurnal.feedback.map((fb) => {
                const ruangPjr =
                  fb.user_pjr.ruang_kelas?.nama_ruang ?? jurnal.snapshot_ruang;
                return (
                  <div
                    key={fb.id}
                    className="rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-zinc-900">
                        {formatNamaGuru(fb.user_pjr.pegawai.nama_lengkap)}
                      </span>
                      <span className="shrink-0 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                        PJR {ruangPjr}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-zinc-700">
                      {fb.pesan_pantauan}
                    </p>
                    <div className="mt-2 border-t border-zinc-200/70 pt-1.5 text-[11px] font-medium text-zinc-400">
                      {formatTanggalIndo(fb.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
