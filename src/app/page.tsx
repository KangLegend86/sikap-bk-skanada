import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Calendar,
  FilePenLine,
  FileText,
  Lock,
  LockOpen,
  MessageSquare,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru, formatTanggalIndo } from '@/lib/utils';
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
      take: 5,
      orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
      include: {
        siswa: {
          include: {
            jurusan: true,
            ruang_kelas: true,
          },
        },
        kategori: {
          include: { kategori: true },
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
              include: {
                jurusan: true,
                ruang_kelas: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const todayLabel = formatTanggalIndo(now);

  return (
    <AppShell session={session}>
      <div className="flex flex-col gap-4">
        {/* Bar Tanggal Ringkas & Identitas */}
        <div className="flex items-center justify-between rounded-[10px] border border-zinc-200/80 bg-white px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-600">
            <Calendar className="h-4 w-4 shrink-0 text-[#045A19]" />
            <span>{todayLabel}</span>
          </div>
          <span className="rounded-[6px] border border-[#C9D6CC] bg-[#E9F2EB] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#045A19]">
            BK SKANADA
          </span>
        </div>

        {/* Tombol Aksi Utama (CTA) */}
        <Link
          href="/jurnal/baru"
          className="skanada-btn-primary flex w-full items-center justify-center gap-2 px-4 py-3.5 text-[15px]"
        >
          <FilePenLine className="h-5 w-5 shrink-0" />
          <span>Catat Jurnal BK Baru</span>
        </Link>

        {/* 3 Kartu Angka Ringkas */}
        <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Ringkasan Bulan Ini">
          <div className="rounded-[12px] border border-zinc-200/80 bg-white p-3">
            <div className="text-xs font-medium text-zinc-500">Bulan Ini</div>
            <div className="mt-0.5 text-xl font-extrabold text-zinc-900">
              {totalBulanIni}
            </div>
          </div>
          <div className="rounded-[12px] border border-zinc-200/80 bg-white p-3">
            <div className="text-xs font-medium text-zinc-500">Proses</div>
            <div className="mt-0.5 text-xl font-extrabold text-amber-600">
              {dalamProsesCount}
            </div>
          </div>
          <div className="rounded-[12px] border border-zinc-200/80 bg-white p-3">
            <div className="text-xs font-medium text-zinc-500">Selesai</div>
            <div className="mt-0.5 text-xl font-extrabold text-[#045A19]">
              {selesaiCount}
            </div>
          </div>
        </section>

        {/* Konten Utama: 1 kolom di mobile, 2 kolom bersebelahan di desktop */}
        <div className="grid grid-cols-1 gap-5 pt-1 lg:grid-cols-2 lg:items-start">
          {/* Bagian 1: Jurnal BK Terbaru */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-[#C9D6CC] bg-[#E9F2EB] text-[#045A19]">
                  <FileText className="h-4 w-4" />
                </div>
                <h2 className="text-[13px] font-extrabold tracking-wider text-zinc-700 uppercase">
                  Jurnal BK Terbaru
                </h2>
              </div>
              <Link
                href="/jurnal"
                className="text-xs font-semibold text-[#045A19] hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            {recentJournals.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-zinc-300 bg-white p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-zinc-300" />
                <p className="mt-2 text-sm font-semibold text-zinc-700">
                  Belum ada catatan jurnal konseling.
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Mulai catat konseling siswa pertama melalui tombol di atas.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentJournals.map((item) => {
                  const kategoriLabel = item.kategori
                    .map((k) => k.kategori.nama_kategori)
                    .join(', ');

                  return (
                    <Link
                      key={item.id}
                      href={`/jurnal/${item.id}`}
                      className="flex flex-col justify-between gap-2 rounded-[12px] border border-zinc-200/80 bg-white p-3.5 transition-colors hover:bg-zinc-50/80"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[14.5px] font-extrabold text-zinc-900">
                            {item.siswa.nama_lengkap}
                          </h3>
                          <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                            {item.snapshot_ruang} • {item.siswa.jurusan.kode}
                            {kategoriLabel && (
                              <>
                                {' '}
                                <span className="text-zinc-300">|</span>{' '}
                                <span className="font-semibold text-[#045A19]">
                                  {kategoriLabel}
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        {/* Ikon Flat Gembok Buka (Hijau - PJR) / Gembok Tutup (Merah - Privat) */}
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
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border ${
                            item.is_shared_with_pjr
                              ? 'border-[#C9D6CC] bg-[#E9F2EB] text-[#045A19]'
                              : 'border-rose-200 bg-rose-50 text-rose-600'
                          }`}
                        >
                          {item.is_shared_with_pjr ? (
                            <LockOpen className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm leading-[1.45] text-zinc-600">
                        {item.permasalahan}
                      </p>

                      <div className="truncate border-t border-zinc-100 pt-1.5 text-[11.5px] font-medium text-zinc-400">
                        {formatTanggalIndo(item.tanggal_konseling)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bagian 2: Pantauan Guru PJR */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <h2 className="text-[13px] font-extrabold tracking-wider text-zinc-700 uppercase">
                  Pantauan Guru PJR
                </h2>
              </div>
              <span className="font-mono text-xs text-zinc-400">
                {recentFeedbacks.length} Laporan
              </span>
            </div>

            {recentFeedbacks.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-zinc-300 bg-white p-8 text-center">
                <MessageSquare className="mx-auto h-7 w-7 text-zinc-300" />
                <p className="mt-2 text-xs font-medium text-zinc-500">
                  Belum ada catatan pantauan dari Guru PJR.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentFeedbacks.map((fb) => {
                  const namaRuang =
                    fb.user_pjr.ruang_kelas?.nama_ruang ??
                    fb.jurnal.siswa.ruang_kelas.nama_ruang;

                  return (
                    <Link
                      key={fb.id}
                      href={`/jurnal/${fb.jurnal_id}`}
                      className="flex flex-col justify-between gap-2 rounded-[12px] border border-zinc-200/80 bg-white p-3.5 transition-colors hover:bg-zinc-50/80"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-[14.5px] font-extrabold text-zinc-900">
                          {fb.jurnal.siswa.nama_lengkap}
                        </h3>
                        <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                          {namaRuang} • {fb.jurnal.siswa.jurusan.kode}{' '}
                          <span className="text-zinc-300">|</span>{' '}
                          <span className="font-semibold text-sky-700">
                            Laporan PJR {namaRuang}
                          </span>
                        </p>
                      </div>

                      <p className="line-clamp-2 text-sm leading-[1.45] text-zinc-600">
                        &ldquo;{fb.pesan_pantauan}&rdquo;
                      </p>

                      <div className="truncate border-t border-zinc-100 pt-1.5 text-[11.5px] font-medium text-zinc-400">
                        {formatTanggalIndo(fb.created_at)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
