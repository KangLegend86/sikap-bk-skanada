import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  MessageSquare,
  Users,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  formatNamaGuru,
  formatTanggalIndo,
  getMajorBadgeClass,
} from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';


export default async function PjrDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'GURU_PJR') {
    redirect(session.role === 'ADMIN' ? '/admin' : '/');
  }

  const ruangId = session.ruangKelasId;
  const namaRuang = session.namaRuang ?? 'Belum Ditugaskan';

  const [totalSiswa, sharedJournals, dalamProsesCount, selesaiCount] =
    ruangId
      ? await Promise.all([
          prisma.siswa.count({
            where: { ruang_kelas_id: ruangId, is_active: true },
          }),
          prisma.jurnalBk.findMany({
            where: {
              is_shared_with_pjr: true,
              siswa: { ruang_kelas_id: ruangId },
            },
            orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
            take: 8,
            include: {
              siswa: { include: { jurusan: true } },
              guru_bk: true,
              kategori: { include: { kategori: true } },
              _count: { select: { feedback: true } },
            },
          }),
          prisma.jurnalBk.count({
            where: {
              is_shared_with_pjr: true,
              status: 'DALAM_PROSES',
              siswa: { ruang_kelas_id: ruangId },
            },
          }),
          prisma.jurnalBk.count({
            where: {
              is_shared_with_pjr: true,
              status: 'SELESAI',
              siswa: { ruang_kelas_id: ruangId },
            },
          }),
        ])
      : [0, [], 0, 0];

  return (
    <AppShell
      session={session}
      title={`Beranda PJR ${namaRuang}`}
      subtitle={`Penanggung Jawab Ruang • ${formatNamaGuru(
        session.namaLengkap,
        session.gelar
      )}`}
    >
      {!ruangId ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold">
                Akun PJR Anda belum terhubung ke Ruang Kelas
              </p>
              <p className="mt-1 text-xs">
                Hubungi Admin / Koordinator BK untuk menugaskan ruang kelas pada akun ini.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#0D6A37] to-[#084B26] p-5 text-white shadow-sm">
            <p className="text-xs font-medium tracking-wider text-emerald-200 uppercase">
              Ruang Kelas {namaRuang}
            </p>
            <h2 className="mt-1 text-lg font-bold sm:text-xl">
              Pantauan Tindak Lanjut Konseling Siswa
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90">
              Lihat kasus yang dibagikan oleh Guru BK untuk ruang kelas Anda dan kirimkan laporan perkembangan siswa di kelas.
            </p>
            <div className="mt-4">
              <Link
                href="/pjr/kasus"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0D6A37] shadow-xs hover:bg-emerald-50"
              >
                <ClipboardList className="h-4 w-4" />
                Buka Daftar Pantauan
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3 lg:gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Siswa Kelas
                </span>
                <Users className="h-4 w-4 text-[#0D6A37]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {totalSiswa}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Dalam Proses
                </span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {dalamProsesCount}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Selesai
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {selesaiCount}
              </p>
            </div>
          </div>

          {/* Recent Shared Cases */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900">
              Kasus Dibagikan Terbaru
            </h3>
            <Link
              href="/pjr/kasus"
              className="text-xs font-semibold text-[#0D6A37] hover:underline"
            >
              Semua Pantauan →
            </Link>
          </div>

          {sharedJournals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm font-medium text-zinc-700">
                Belum ada jurnal yang dibagikan untuk kelas {namaRuang}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedJournals.map((item) => (
                <Link
                  key={item.id}
                  href={`/pjr/kasus#${item.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-[#0D6A37]/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900">
                        {item.siswa.nama_lengkap}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                          item.siswa.jurusan.kode
                        )}`}
                      >
                        {item.siswa.jurusan.kode}
                      </span>
                    </div>
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

                  <p className="mt-1 text-xs text-zinc-500">
                    {formatTanggalIndo(item.tanggal_konseling)} • Guru BK:{' '}
                    {formatNamaGuru(item.guru_bk.nama_lengkap, item.guru_bk.gelar)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-700">
                    <span className="font-semibold">Tindak Lanjut: </span>
                    {item.tindak_lanjut}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[#0D6A37]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {item._count.feedback} catatan pantauan Anda
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

