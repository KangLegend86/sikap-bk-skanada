import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  Shield,
  Users,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru, formatTanggalIndo, getMajorBadgeClass } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';


export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') {
    redirect(session.role === 'GURU_PJR' ? '/pjr' : '/');
  }

  const [
    totalJurnal,
    dalamProses,
    selesai,
    totalSiswa,
    totalPegawai,
    totalAkun,
    jurusanStats,
    recentJournals,
  ] = await Promise.all([
    prisma.jurnalBk.count(),
    prisma.jurnalBk.count({ where: { status: 'DALAM_PROSES' } }),
    prisma.jurnalBk.count({ where: { status: 'SELESAI' } }),
    prisma.siswa.count({ where: { is_active: true } }),
    prisma.pegawai.count(),
    prisma.userAccount.count({ where: { is_active: true } }),
    prisma.jurusan.findMany({
      where: { is_active: true },
      orderBy: { kode: 'asc' },
      include: {
        siswa: {
          select: {
            _count: { select: { jurnal: true } },
          },
        },
      },
    }),
    prisma.jurnalBk.findMany({
      take: 6,
      orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
      include: {
        siswa: { include: { jurusan: true } },
        guru_bk: true,
      },
    }),
  ]);

  return (
    <AppShell
      session={session}
      title="Beranda Admin BK"
      subtitle="Ringkasan Konseling Sekolah • SMKS NU 2 Kedungpring"
    >
      {/* Top Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#0D6A37] to-[#084B26] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-emerald-200 uppercase">
              Panel Koordinator BK
            </p>
            <h2 className="mt-1 text-lg font-bold sm:text-xl">
              Monitoring & Rekapitulasi eJurnal BK Skanada
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90">
              Pantau statistik kasus lintas jurusan, cetak laporan berkop sekolah, dan kelola data master.
            </p>
          </div>
          <Link
            href="/admin/rekap"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0D6A37] shadow-xs hover:bg-emerald-50"
          >
            <Printer className="h-4 w-4" />
            Buka Rekap & Cetak
          </Link>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Kasus</span>
            <FileText className="h-4 w-4 text-[#0D6A37]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{totalJurnal}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Dalam Proses</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{dalamProses}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Selesai</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{selesai}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
              Siswa / Akun Aktif
            </span>
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {totalSiswa}{' '}
            <span className="text-sm font-medium text-zinc-400">
              / {totalAkun} akun
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {totalPegawai} pegawai terdaftar
          </p>
        </div>
      </div>

      {/* Breakdown by Jurusan + Recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900">
            Sebaran Kasus per Kompetensi Keahlian
          </h3>
          <div className="mt-4 space-y-3">
            {jurusanStats.map((j) => {
              const count = j.siswa.reduce(
                (acc, s) => acc + s._count.jurnal,
                0
              );
              const pct =
                totalJurnal > 0 ? Math.round((count / totalJurnal) * 100) : 0;

              return (
                <div key={j.id}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-semibold ${getMajorBadgeClass(
                          j.kode
                        )}`}
                      >
                        {j.kode}
                      </span>
                      <span className="text-zinc-600">{j.nama_lengkap}</span>
                    </div>
                    <span className="font-bold text-zinc-900">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-[#0D6A37]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">
              Aktivitas Konseling Terbaru
            </h3>
            <Link
              href="/admin/rekap"
              className="text-xs font-semibold text-[#0D6A37] hover:underline"
            >
              Audit Lengkap →
            </Link>
          </div>

          {recentJournals.length === 0 ? (
            <p className="mt-6 text-center text-xs text-zinc-500">
              Belum ada data konseling.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-zinc-100">
              {recentJournals.map((item) => (
                <Link
                  key={item.id}
                  href={`/jurnal/${item.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {item.siswa.nama_lengkap}{' '}
                      <span className="font-normal text-zinc-500">
                        ({item.snapshot_ruang})
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatTanggalIndo(item.tanggal_konseling)} •{' '}
                      {formatNamaGuru(
                        item.guru_bk.nama_lengkap,
                        item.guru_bk.gelar
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.status === 'SELESAI'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status === 'SELESAI' ? 'Selesai' : 'Proses'}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
            <Link
              href="/admin/master"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Kelola Data Master
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Shield className="h-3.5 w-3.5 text-[#0D6A37]" />
              Kelola Akun Pengguna
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

