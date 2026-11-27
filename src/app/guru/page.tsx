import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  Calendar,
  Camera,
  FilePenLine,
  Home,
  NotebookPen,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatTanggalIndo, getMajorTextClass } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';

export default async function GuruDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const ownerWhere = {
    OR: [
      { created_by_id: session.userId },
      { konselor_id: session.pegawaiId },
    ],
  };

  const [prestasiCount, masalahCount, homeVisitCount, recentJournals] =
    await Promise.all([
      prisma.jurnalSikap.count({
        where: { AND: [ownerWhere, { jenis: 'BERPRESTASI' }] },
      }),
      prisma.jurnalSikap.count({
        where: { AND: [ownerWhere, { jenis: 'BERMASALAH' }] },
      }),
      prisma.jurnalSikap.count({
        where: { AND: [ownerWhere, { jenis: 'HOME_VISIT' }] },
      }),
      prisma.jurnalSikap.findMany({
        where: ownerWhere,
        take: 5,
        orderBy: [{ tanggal: 'desc' }, { created_at: 'desc' }],
        include: {
          siswa: { include: { jurusan: true } },
        },
      }),
    ]);

  const todayLabel = formatTanggalIndo(new Date());

  return (
    <AppShell session={session}>
      <div className="flex flex-col gap-4">
        {/* Bar Tanggal Ringkas & Identitas (identik dengan Beranda Guru BK) */}
        <div className="flex items-center justify-between rounded-[10px] border border-zinc-200/80 bg-white px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-600">
            <Calendar className="h-4 w-4 shrink-0 text-[#047857]" />
            <span>{todayLabel}</span>
          </div>
          <span className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#047857]">
            JURNAL SIKAP
          </span>
        </div>

        {/* Tombol Aksi Utama (CTA) */}
        <Link
          href="/guru/baru"
          className="skanada-btn-primary flex w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-3.5 text-[15px] hover:bg-emerald-800"
        >
          <FilePenLine className="h-5 w-5 shrink-0" />
          <span>Catat Jurnal Sikap Baru</span>
        </Link>

        {/* 3 Kartu Angka Ringkas (identik dengan Beranda Guru BK) */}
        <section
          className="grid grid-cols-3 gap-2 sm:gap-3"
          aria-label="Ringkasan Catatan Saya"
        >
          <div className="rounded-xl border border-zinc-200/80 bg-white p-3">
            <div className="text-xs font-medium text-zinc-500">Berprestasi</div>
            <div className="mt-0.5 text-xl font-extrabold text-[#047857]">
              {prestasiCount}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white p-3">
            <div className="text-xs font-medium text-zinc-500">Bermasalah</div>
            <div className="mt-0.5 text-xl font-extrabold text-amber-600">
              {masalahCount}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200/80 bg-white p-3">
            <div className="text-xs font-medium text-zinc-500">Home Visit</div>
            <div className="mt-0.5 text-xl font-extrabold text-blue-600">
              {homeVisitCount}
            </div>
          </div>
        </section>

        {/* Catatan Sikap Terbaru (identik dengan Jurnal BK Terbaru) */}
        <section className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
                <NotebookPen className="h-4 w-4" />
              </div>
              <h2 className="text-[13px] font-extrabold tracking-wider text-zinc-700 uppercase">
                Catatan Sikap Terbaru
              </h2>
            </div>
            <Link
              href="/guru/riwayat"
              className="text-xs font-semibold text-[#047857] hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {recentJournals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
              <NotebookPen className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm font-semibold text-zinc-700">
                Belum ada catatan penilaian sikap.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Mulai catat prestasi, pembinaan, atau home visit melalui tombol di atas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentJournals.map((item) => {
                const meta =
                  item.jenis === 'BERPRESTASI'
                    ? {
                        label: 'Berprestasi',
                        textClass: 'text-[#047857]',
                        iconClass: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]',
                        Icon: Award,
                      }
                    : item.jenis === 'HOME_VISIT'
                      ? {
                          label: 'Home Visit',
                          textClass: 'text-blue-600',
                          iconClass: 'border-blue-200 bg-blue-50 text-blue-600',
                          Icon: Home,
                        }
                      : {
                          label: 'Bermasalah',
                          textClass: 'text-amber-600',
                          iconClass: 'border-amber-200 bg-amber-50 text-amber-600',
                          Icon: AlertTriangle,
                        };
                const JenisIcon = meta.Icon;
                const summaryText =
                  item.jenis === 'BERPRESTASI'
                    ? item.prestasi_dalam || item.sikap_perilaku || '-'
                    : item.permasalahan || '-';

                return (
                  <Link
                    key={item.id}
                    href={`/guru/${item.id}`}
                    className="group flex flex-col justify-between gap-2.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out hover:border-[#047857]/30 hover:shadow-[0_6px_18px_-4px_rgba(4,120,87,0.12)] active:scale-[0.985] active:bg-zinc-50/90 active:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-[#047857]">
                          {item.siswa.nama_lengkap}
                        </h3>
                        <p className="mt-1 truncate text-xs font-medium text-zinc-500">
                          {item.snapshot_ruang} •{' '}
                          <span
                            className={`font-semibold ${getMajorTextClass(
                              item.siswa.jurusan.kode
                            )}`}
                          >
                            {item.siswa.jurusan.kode}
                          </span>{' '}
                          <span className="text-zinc-300">|</span>{' '}
                          <span className={`font-semibold ${meta.textClass}`}>
                            {meta.label}
                          </span>
                        </p>
                      </div>

                      <span
                        title={meta.label}
                        aria-label={meta.label}
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${meta.iconClass}`}
                      >
                        <JenisIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <p className="line-clamp-1 text-[13.5px] leading-relaxed text-zinc-600">
                      {summaryText}
                    </p>

                    <div className="flex items-center justify-between gap-2 border-t border-[#c3c1c1] pt-2">
                      <span className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
                        {formatTanggalIndo(item.tanggal)}
                      </span>

                      {item.foto_drive_id && (
                        <span
                          title="Memiliki bukti foto Home Visit"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600"
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
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
