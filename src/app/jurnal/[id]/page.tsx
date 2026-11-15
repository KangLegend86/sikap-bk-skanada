import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Lock,
  MessageCircle,
  MessageSquare,
  Share2,
  User,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  formatNamaGuru,
  formatTanggalIndo,
  formatWaNumber,
  getMajorBadgeClass,
  getSapaan,
} from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import { JurnalStatusUpdateClient } from '@/components/jurnal/JurnalStatusUpdateClient';


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

  const pjrAkun = jurnal.siswa.ruang_kelas.akun_pjr[0];
  const pjrWa = formatWaNumber(pjrAkun?.pegawai.no_whatsapp);
  const ortuWa = formatWaNumber(jurnal.siswa.no_hp_ortu);

  const pjrWaText = pjrAkun
    ? encodeURIComponent(
        `Assalamu'alaikum ${getSapaan(pjrAkun.pegawai.jenis_kelamin)} ${formatNamaGuru(
          pjrAkun.pegawai.nama_lengkap,
          pjrAkun.pegawai.gelar
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

  return (
    <AppShell
      session={session}
      title="Detail Jurnal Konseling"
      subtitle={`${jurnal.siswa.nama_lengkap} • ${jurnal.snapshot_ruang}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/jurnal"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Jurnal
        </Link>
        <Link
          href={`/siswa/${jurnal.siswa_id}`}
          className="text-xs font-semibold text-[#0D6A37] hover:underline"
        >
          Lihat Riwayat Siswa →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Main Chronological Content */}
        <div className="space-y-4 lg:col-span-2">
          {/* Header Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-900">
                    {jurnal.siswa.nama_lengkap}
                  </h2>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                    {jurnal.snapshot_ruang}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                      jurnal.siswa.jurusan.kode
                    )}`}
                  >
                    {jurnal.siswa.jurusan.kode}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatTanggalIndo(jurnal.tanggal_konseling)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Konselor:{' '}
                    {formatNamaGuru(
                      jurnal.guru_bk.nama_lengkap,
                      jurnal.guru_bk.gelar
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {jurnal.is_shared_with_pjr ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Share2 className="h-3.5 w-3.5" />
                    Dibagikan ke PJR
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                    <Lock className="h-3.5 w-3.5" />
                    Privat BK
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    jurnal.status === 'SELESAI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {jurnal.status === 'SELESAI' ? 'Selesai' : 'Dalam Proses'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {jurnal.kategori.map((k) => (
                <span
                  key={k.kategori_id}
                  className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
                >
                  #{k.kategori.nama_kategori}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Chronological Fields */}
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
            <div>
              <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                1. Permasalahan
              </h3>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-800">
                {jurnal.permasalahan}
              </p>
            </div>

            {jurnal.kendala && (
              <div className="border-t border-zinc-100 pt-4">
                <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  2. Kendala
                </h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-800">
                  {jurnal.kendala}
                </p>
              </div>
            )}

            {jurnal.solusi && (
              <div className="border-t border-zinc-100 pt-4">
                <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  3. Solusi
                </h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-800">
                  {jurnal.solusi}
                </p>
              </div>
            )}

            <div className="border-t border-zinc-100 pt-4">
              <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                4. Tindak Lanjut
              </h3>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-800">
                {jurnal.tindak_lanjut}
              </p>
            </div>

            {jurnal.catatan && (
              <div className="border-t border-zinc-100 pt-4">
                <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  5. Catatan Tambahan
                </h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-800">
                  {jurnal.catatan}
                </p>
              </div>
            )}

            {jurnal.keterangan_status && (
              <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
                <span className="font-semibold">Keterangan Status: </span>
                {jurnal.keterangan_status}
              </div>
            )}
          </div>

          {/* PJR Feedback Thread */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                <MessageSquare className="h-4 w-4 text-[#0D6A37]" />
                Catatan Pantauan Guru PJR ({jurnal.feedback.length})
              </h3>
            </div>

            {jurnal.feedback.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-500">
                {jurnal.is_shared_with_pjr
                  ? 'Belum ada pantauan yang dikirim oleh Guru PJR kelas ini.'
                  : 'Jurnal ini bersifat Privat BK sehingga tidak tampil di halaman Guru PJR.'}
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {jurnal.feedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-900">
                        {formatNamaGuru(
                          fb.user_pjr.pegawai.nama_lengkap,
                          fb.user_pjr.pegawai.gelar
                        )}{' '}
                        ({fb.user_pjr.ruang_kelas?.nama_ruang ?? jurnal.snapshot_ruang})
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {formatTanggalIndo(fb.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-sm text-zinc-700">
                      {fb.pesan_pantauan}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Status Update & Quick WhatsApp */}
        <div className="space-y-4">
          <JurnalStatusUpdateClient
            jurnalId={jurnal.id}
            initialStatus={jurnal.status}
            initialKeterangan={jurnal.keterangan_status ?? ''}
          />

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900">
              Koordinasi WhatsApp
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Kirim ringkasan tindak lanjut secara cepat.
            </p>

            <div className="mt-3 space-y-2">
              {pjrWa ? (
                <a
                  href={`https://wa.me/${pjrWa}?text=${pjrWaText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat WA Guru PJR ({jurnal.snapshot_ruang})
                </a>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 p-2.5 text-center text-xs text-zinc-400">
                  Nomor WA Guru PJR belum tersedia
                </div>
              )}

              {ortuWa ? (
                <a
                  href={`https://wa.me/${ortuWa}?text=${ortuWaText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white px-3 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat WA Orang Tua / Wali
                </a>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 p-2.5 text-center text-xs text-zinc-400">
                  Nomor WA Orang Tua belum diisi
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

