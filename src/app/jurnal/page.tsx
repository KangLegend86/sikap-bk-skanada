import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  FileText,
  Lock,
  LockOpen,
  MessageSquare,
} from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getCachedActiveJurusanList,
  getCachedActiveRuangList,
} from '@/lib/master-cache';
import { formatNamaGuru, formatTanggalIndo } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import {
  JurnalFilterClient,
  type PeriodeFilter,
} from '@/components/jurnal/JurnalFilterClient';

const PAGE_SIZE = 10;

function getDateRangeForPeriode(periode?: Exclude<PeriodeFilter, ''>) {
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
  // 3_BULAN
  return { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) };
}

function formatBulanTahun(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export default async function JurnalListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    periode?: string;
    ruang?: string;
    jurusan?: string;
    page?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr/kasus');

  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const statusFilter =
    params.status === 'DALAM_PROSES' || params.status === 'SELESAI'
      ? params.status
      : undefined;
  const periodeFilter: Exclude<PeriodeFilter, ''> | undefined =
    params.periode === 'BULAN_INI' ||
    params.periode === 'BULAN_LALU' ||
    params.periode === '3_BULAN'
      ? params.periode
      : undefined;
  const ruangFilter = params.ruang?.trim() || undefined;
  const jurusanFilter = params.jurusan?.trim() || undefined;

  const parsedPage = Number.parseInt(params.page ?? '', 10);
  const requestedPage = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const dateRange = getDateRangeForPeriode(periodeFilter);

  const whereClause: Prisma.JurnalBkWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(dateRange ? { tanggal_konseling: dateRange } : {}),
    ...(ruangFilter ? { snapshot_ruang: ruangFilter } : {}),
    ...(jurusanFilter
      ? { siswa: { jurusan: { kode: jurusanFilter } } }
      : {}),
    ...(q
      ? {
          OR: [
            { permasalahan: { contains: q, mode: 'insensitive' as const } },
            { tindak_lanjut: { contains: q, mode: 'insensitive' as const } },
            {
              siswa: {
                nama_lengkap: { contains: q, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {}),
  };

  const [totalCount, ruangList, jurusanList] = await Promise.all([
    prisma.jurnalBk.count({ where: whereClause }),
    getCachedActiveRuangList(),
    getCachedActiveJurusanList(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const journals = await prisma.jurnalBk.findMany({
    where: whereClause,
    orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      tanggal_konseling: true,
      snapshot_ruang: true,
      permasalahan: true,
      status: true,
      is_shared_with_pjr: true,
      siswa: {
        select: {
          nama_lengkap: true,
          jurusan: { select: { kode: true } },
        },
      },
      guru_bk: {
        select: {
          nama_lengkap: true,
          gelar: true,
        },
      },
      kategori: {
        select: {
          kategori: { select: { nama_kategori: true } },
        },
      },
      _count: { select: { feedback: true } },
    },
  });

  // Kelompokkan jurnal per bulan agar mudah dipindai saat data sudah banyak
  const groupedByMonth: { monthLabel: string; items: typeof journals }[] = [];
  for (const item of journals) {
    const label = formatBulanTahun(item.tanggal_konseling);
    const lastGroup = groupedByMonth[groupedByMonth.length - 1];
    if (lastGroup && lastGroup.monthLabel === label) {
      lastGroup.items.push(item);
    } else {
      groupedByMonth.push({ monthLabel: label, items: [item] });
    }
  }

  const buildPageHref = (pageNum: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (statusFilter) p.set('status', statusFilter);
    if (periodeFilter) p.set('periode', periodeFilter);
    if (ruangFilter) p.set('ruang', ruangFilter);
    if (jurusanFilter) p.set('jurusan', jurusanFilter);
    if (pageNum > 1) p.set('page', String(pageNum));
    const qs = p.toString();
    return qs ? `/jurnal?${qs}` : '/jurnal';
  };

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);
  const prevHref = currentPage > 1 ? buildPageHref(currentPage - 1) : undefined;
  const nextHref = currentPage < totalPages ? buildPageHref(currentPage + 1) : undefined;

  return (
    <AppShell
      session={session}
      title="Riwayat Jurnal BK"
      subtitle="Daftar Seluruh Jurnal BK Siswa"
      backHref="/"
    >
      {/* Mobile-first Search, Filter Bottom Sheet & Top Pagination Bar */}
      <JurnalFilterClient
        initialQ={q}
        initialStatus={statusFilter}
        initialPeriode={periodeFilter}
        initialRuang={ruangFilter}
        initialJurusan={jurusanFilter}
        ruangList={ruangList.map((r) => ({ id: r.id, nama_ruang: r.nama_ruang }))}
        jurusanList={jurusanList.map((j) => ({ id: j.id, kode: j.kode }))}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        prevHref={prevHref}
        nextHref={nextHref}
      />

      {/* Results */}
      {journals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <FileText className="mx-auto h-9 w-9 text-zinc-300" />
          <p className="mt-2 text-sm font-semibold text-zinc-800">
            Tidak ada jurnal ditemukan
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Ubah kata kunci atau filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByMonth.map((group) => (
            <section key={group.monthLabel} className="space-y-2.5">
              {groupedByMonth.length > 1 && (
                <div className="px-1 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                  {group.monthLabel}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {group.items.map((item) => {
                  const kategoriLabel = item.kategori
                    .map((k) => k.kategori.nama_kategori)
                    .join(', ');

                  return (
                    <Link
                      key={item.id}
                      href={`/jurnal/${item.id}`}
                      className="group flex flex-col justify-between gap-2.5 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out hover:border-[#047857]/30 hover:shadow-[0_6px_18px_-4px_rgba(4,120,87,0.12)] active:scale-[0.985] active:bg-zinc-50/90 active:shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-[#047857]">
                            {item.siswa.nama_lengkap}
                          </h3>
                          <p className="mt-1 truncate text-xs font-medium text-zinc-500">
                            {item.snapshot_ruang} • {item.siswa.jurusan.kode}
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
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                            item.is_shared_with_pjr
                              ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
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

                      <p className="line-clamp-1 text-[13.5px] leading-relaxed text-zinc-600">
                        {item.permasalahan}
                      </p>

                      <div className="flex items-center justify-between gap-2 border-t border-zinc-100/90 pt-2">
                        <span className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
                          {formatTanggalIndo(item.tanggal_konseling)} •{' '}
                          {formatNamaGuru(item.guru_bk.nama_lengkap, item.guru_bk.gelar)}
                        </span>

                        <div className="flex shrink-0 items-center gap-2">
                          {item._count.feedback > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857]">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {item._count.feedback}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                              item.status === 'SELESAI'
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.status === 'SELESAI' ? 'Selesai' : 'Proses'}
                          </span>
                        </div>
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
