import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  Camera,
  Home,
  NotebookPen,
} from 'lucide-react';
import type { JenisJurnalSikap, Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getCachedActiveJurusanList,
  getCachedActiveRuangList,
} from '@/lib/master-cache';
import { formatNamaGuru, formatTanggalIndo } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import {
  JurnalSikapFilterClient,
  type SikapPeriodeFilter,
} from '@/components/jurnal-sikap/JurnalSikapFilterClient';

const PAGE_SIZE = 10;

function getDateRangeForPeriode(periode?: Exclude<SikapPeriodeFilter, ''>) {
  if (!periode) return undefined;
  const now = new Date();
  if (periode === 'BULAN_INI') {
    return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }
  if (periode === 'BULAN_LALU') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: start, lt: end };
  }
  return { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) };
}

function formatBulanTahun(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export default async function JurnalSikapPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    jenis?: string;
    periode?: string;
    ruang?: string;
    jurusan?: string;
    page?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr');
  if (session.role === 'GURU') redirect('/guru');

  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const jenisFilter: JenisJurnalSikap | undefined =
    params.jenis === 'BERPRESTASI' ||
    params.jenis === 'BERMASALAH' ||
    params.jenis === 'HOME_VISIT'
      ? params.jenis
      : undefined;
  const periodeFilter: Exclude<SikapPeriodeFilter, ''> | undefined =
    params.periode === 'BULAN_INI' ||
    params.periode === 'BULAN_LALU' ||
    params.periode === '3_BULAN'
      ? params.periode
      : undefined;
  const ruangFilter = params.ruang?.trim() || undefined;
  const jurusanFilter = params.jurusan?.trim() || undefined;

  const parsedPage = Number.parseInt(params.page ?? '', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const dateRange = getDateRangeForPeriode(periodeFilter);

  const whereClause: Prisma.JurnalSikapWhereInput = {
    ...(jenisFilter ? { jenis: jenisFilter } : {}),
    ...(dateRange ? { tanggal: dateRange } : {}),
    ...(ruangFilter ? { snapshot_ruang: ruangFilter } : {}),
    ...(jurusanFilter
      ? { siswa: { jurusan: { kode: jurusanFilter } } }
      : {}),
    ...(q
      ? {
          OR: [
            { prestasi_dalam: { contains: q, mode: 'insensitive' as const } },
            { sikap_perilaku: { contains: q, mode: 'insensitive' as const } },
            { permasalahan: { contains: q, mode: 'insensitive' as const } },
            { tindak_lanjut: { contains: q, mode: 'insensitive' as const } },
            {
              siswa: {
                nama_lengkap: { contains: q, mode: 'insensitive' as const },
              },
            },
            {
              konselor: {
                nama_lengkap: { contains: q, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {}),
  };

  const [totalCount, ruangList, jurusanList] = await Promise.all([
    prisma.jurnalSikap.count({ where: whereClause }),
    getCachedActiveRuangList(),
    getCachedActiveJurusanList(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const journals = await prisma.jurnalSikap.findMany({
    where: whereClause,
    orderBy: [{ tanggal: 'desc' }, { created_at: 'desc' }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      siswa: { include: { jurusan: true } },
      konselor: true,
    },
  });

  const buildPageHref = (pageNum: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (jenisFilter) sp.set('jenis', jenisFilter);
    if (periodeFilter) sp.set('periode', periodeFilter);
    if (ruangFilter) sp.set('ruang', ruangFilter);
    if (jurusanFilter) sp.set('jurusan', jurusanFilter);
    if (pageNum > 1) sp.set('page', String(pageNum));
    const qs = sp.toString();
    return qs ? `/jurnal-sikap?${qs}` : '/jurnal-sikap';
  };

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  // Kelompokkan per bulan
  const grouped = new Map<string, typeof journals>();
  for (const item of journals) {
    const key = formatBulanTahun(item.tanggal);
    const arr = grouped.get(key) ?? [];
    arr.push(item);
    grouped.set(key, arr);
  }

  return (
    <AppShell
      session={session}
      title="Jurnal Penilaian Sikap"
      subtitle="Riwayat Jurnal Penilaian Sikap Siswa"
      backHref={session.role === 'ADMIN' ? '/admin' : '/'}
    >
      <JurnalSikapFilterClient
        initialQ={q}
        initialJenis={jenisFilter}
        initialPeriode={periodeFilter}
        initialRuang={ruangFilter}
        initialJurusan={jurusanFilter}
        ruangList={ruangList}
        jurusanList={jurusanList}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        prevHref={currentPage > 1 ? buildPageHref(currentPage - 1) : undefined}
        nextHref={
          currentPage < totalPages ? buildPageHref(currentPage + 1) : undefined
        }
      />

      {journals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
            <NotebookPen className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-zinc-900">
            {q || jenisFilter || periodeFilter || ruangFilter || jurusanFilter
              ? 'Tidak ada jurnal sikap yang cocok'
              : 'Belum ada Jurnal Penilaian Sikap masuk'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Catatan penilaian sikap yang diinput oleh seluruh guru akan tampil di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([monthLabel, monthItems]) => (
            <section key={monthLabel} className="space-y-2.5">
              <h2 className="px-0.5 text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
                {monthLabel}
              </h2>

              <div className="flex flex-col gap-3">
                {monthItems.map((item) => {
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
                      href={`/jurnal-sikap/${item.id}`}
                      className="group flex flex-col justify-between gap-2.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out hover:border-[#047857]/30 hover:shadow-[0_6px_18px_-4px_rgba(4,120,87,0.12)] active:scale-[0.985] active:bg-zinc-50/90 active:shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-[#047857]">
                            {item.siswa.nama_lengkap}
                          </h3>
                          <p className="mt-1 truncate text-xs font-medium text-zinc-500">
                            {item.snapshot_ruang} • {item.siswa.jurusan.kode}{' '}
                            <span className="text-zinc-300">|</span>{' '}
                            <span className={`font-semibold ${meta.textClass}`}>
                              {meta.label}
                            </span>
                          </p>
                        </div>

                        <span
                          title={meta.label}
                          aria-label={meta.label}
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${meta.iconClass}`}
                        >
                          <JenisIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <p className="line-clamp-1 text-[13.5px] leading-relaxed text-zinc-600">
                        {summaryText}
                      </p>

                      <div className="flex items-center justify-between gap-2 border-t border-zinc-200/80 pt-2">
                        <span className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
                          {formatTanggalIndo(item.tanggal)} •{' '}
                          {formatNamaGuru(item.konselor.nama_lengkap)}
                        </span>

                        {item.foto_drive_id && (
                          <span
                            title="Memiliki bukti foto Home Visit"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600"
                          >
                            <Camera className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
