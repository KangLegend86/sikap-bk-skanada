import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  Plus,
  Share2,
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


export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  }
  if (session.role === 'GURU_PJR') {
    redirect('/pjr');
  }

  // GURU_BK Dashboard
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBulanIni,
    dalamProsesCount,
    selesaiCount,
    recentJournals,
    recentFeedbacks,
    totalSiswa,
  ] = await Promise.all([
    prisma.jurnalBk.count({
      where: { tanggal_konseling: { gte: startOfMonth } },
    }),
    prisma.jurnalBk.count({
      where: { status: 'DALAM_PROSES' },
    }),
    prisma.jurnalBk.count({
      where: { status: 'SELESAI', tanggal_konseling: { gte: startOfMonth } },
    }),
    prisma.jurnalBk.findMany({
      take: 8,
      orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
      include: {
        siswa: {
          include: {
            jurusan: true,
            ruang_kelas: true,
          },
        },
        guru_bk: true,
        kategori: {
          include: { kategori: true },
        },
        _count: {
          select: { feedback: true },
        },
      },
    }),
    prisma.pjrFeedback.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user_pjr: {
          include: {
            pegawai: true,
            ruang_kelas: true,
          },
        },
        jurnal: {
          include: {
            siswa: {
              include: { ruang_kelas: true },
            },
          },
        },
      },
    }),
    prisma.siswa.count({ where: { is_active: true } }),
  ]);

  const greetingName = formatNamaGuru(session.namaLengkap, session.gelar);

  return (
    <AppShell
      session={session}
      title="Beranda Guru BK"
      subtitle={`Selamat bertugas, ${greetingName}`}
    >
      {/* Quick Hero Action Card (Mobile & Desktop) */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#0D6A37] to-[#084B26] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-emerald-200 uppercase">
              eJurnal BK Skanada
            </p>
            <h2 className="mt-1 text-lg font-bold sm:text-xl">
              Catat Konseling Siswa Lebih Cepat
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90">
              Dokumentasikan permasalahan, solusi, tindak lanjut, dan bagikan ke Guru PJR bila perlu.
            </p>
          </div>
          <Link
            href="/jurnal/baru"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0D6A37] shadow-sm transition hover:bg-emerald-50 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            Catat Jurnal Baru
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
              Kasus Bulan Ini
            </span>
            <FileText className="h-4 w-4 text-[#0D6A37]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{totalBulanIni}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Total konseling tercatat</p>
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
          <p className="mt-0.5 text-[11px] text-zinc-500">Perlu pemantauan</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
              Selesai Bulan Ini
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {selesaiCount}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Kasus tuntas</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
              Siswa Aktif
            </span>
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{totalSiswa}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Terdaftar di direktori</p>
        </div>
      </div>

      {/* Main Content Grid (Desktop 2 columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Journals */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900">
              Jurnal Konseling Terbaru
            </h3>
            <Link
              href="/jurnal"
              className="text-xs font-semibold text-[#0D6A37] hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          {recentJournals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm font-medium text-zinc-700">
                Belum ada catatan jurnal konseling.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Mulai catat konseling siswa pertama melalui tombol di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJournals.map((item) => (
                <Link
                  key={item.id}
                  href={`/jurnal/${item.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-[#0D6A37]/40 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-zinc-900">
                          {item.siswa.nama_lengkap}
                        </span>
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {item.snapshot_ruang}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                            item.siswa.jurusan.kode
                          )}`}
                        >
                          {item.siswa.jurusan.kode}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatTanggalIndo(item.tanggal_konseling)} • Konselor:{' '}
                        {formatNamaGuru(item.guru_bk.nama_lengkap, item.guru_bk.gelar)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.is_shared_with_pjr ? (
                        <span
                          title="Dibagikan ke PJR"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        >
                          <Share2 className="h-3 w-3" />
                          PJR
                        </span>
                      ) : (
                        <span
                          title="Privat BK"
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                        >
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

                  <p className="mt-2.5 line-clamp-2 text-sm text-zinc-700">
                    {item.permasalahan}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {item.kategori.map((k) => (
                        <span
                          key={k.kategori_id}
                          className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                        >
                          #{k.kategori.nama_kategori}
                        </span>
                      ))}
                    </div>
                    {item._count.feedback > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0D6A37]">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {item._count.feedback} pantauan PJR
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* PJR Feedback Notifications */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900">
              Pantauan Guru PJR
            </h3>
            <span className="text-xs text-zinc-500">Terbaru</span>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
            {recentFeedbacks.length === 0 ? (
              <div className="py-6 text-center">
                <MessageSquare className="mx-auto h-7 w-7 text-zinc-300" />
                <p className="mt-2 text-xs text-zinc-500">
                  Belum ada catatan pantauan dari Guru PJR.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentFeedbacks.map((fb) => (
                  <Link
                    key={fb.id}
                    href={`/jurnal/${fb.jurnal_id}`}
                    className="block py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-900">
                        {formatNamaGuru(
                          fb.user_pjr.pegawai.nama_lengkap,
                          fb.user_pjr.pegawai.gelar
                        )}
                      </span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#0D6A37]">
                        {fb.user_pjr.ruang_kelas?.nama_ruang ??
                          fb.jurnal.siswa.ruang_kelas.nama_ruang}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
                      Siswa: {fb.jurnal.siswa.nama_lengkap}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-700">
                      &ldquo;{fb.pesan_pantauan}&rdquo;
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
