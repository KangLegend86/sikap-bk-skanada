import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, FileText, Lock, Plus, Share2 } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  formatNamaGuru,
  formatTanggalIndo,
  formatWaNumber,
  getMajorBadgeClass,
} from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';


export default async function SiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr/siswa');

  const { id } = await params;

  const siswa = await prisma.siswa.findUnique({
    where: { id },
    include: {
      jurusan: true,
      ruang_kelas: true,
      jurnal: {
        orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
        include: {
          guru_bk: true,
          kategori: { include: { kategori: true } },
        },
      },
    },
  });

  if (!siswa) notFound();

  const ortuWa = formatWaNumber(siswa.no_hp_ortu);

  return (
    <AppShell
      session={session}
      title="Profil & Riwayat Siswa"
      subtitle={`${siswa.nama_lengkap} • ${siswa.ruang_kelas.nama_ruang}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/siswa"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Direktori Siswa
        </Link>
        <Link
          href="/jurnal/baru"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#047857] px-3 py-2 text-xs font-semibold text-white hover:bg-[#065F46]"
        >
          <Plus className="h-3.5 w-3.5" />
          Catat Jurnal
        </Link>
      </div>

      {/* Biodata Card */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900">
                {siswa.nama_lengkap}
              </h2>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                {siswa.ruang_kelas.nama_ruang}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                  siswa.jurusan.kode
                )}`}
              >
                {siswa.jurusan.kode} — {siswa.jurusan.nama_lengkap}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-zinc-600 sm:grid-cols-3">
              <p>
                No. Absen:{' '}
                <span className="font-semibold text-zinc-900">
                  {siswa.no_absen ?? '-'}
                </span>
              </p>
              <p>
                Jenis Kelamin:{' '}
                <span className="font-semibold text-zinc-900">
                  {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </p>
              <p>
                Wali / Ortu:{' '}
                <span className="font-semibold text-zinc-900">
                  {siswa.nama_wali ?? '-'}
                </span>
              </p>
            </div>
          </div>

          {ortuWa && (
            <a
              href={`https://wa.me/${ortuWa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              WA Orang Tua
            </a>
          )}
        </div>
      </div>

      {/* Timeline */}
      <h3 className="mb-3 text-base font-bold text-zinc-900">
        Riwayat Konseling ({siswa.jurnal.length})
      </h3>

      {siswa.jurnal.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-500">
            Siswa ini belum memiliki catatan konseling.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {siswa.jurnal.map((item) => (
            <Link
              key={item.id}
              href={`/jurnal/${item.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-[#047857]/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-800">
                    {formatTanggalIndo(item.tanggal_konseling)}
                  </span>{' '}
                  • Konselor:{' '}
                  {formatNamaGuru(item.guru_bk.nama_lengkap, item.guru_bk.gelar)}
                </div>

                <div className="flex items-center gap-1.5">
                  {item.is_shared_with_pjr ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      <Share2 className="h-3 w-3" />
                      PJR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                      <Lock className="h-3 w-3" />
                      Privat
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.status === 'SELESAI'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status === 'SELESAI' ? 'Selesai' : 'Dalam Proses'}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-zinc-800">{item.permasalahan}</p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {item.kategori.map((k) => (
                  <span
                    key={k.kategori_id}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                  >
                    #{k.kategori.nama_kategori}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

