import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, FileText, Users } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getCachedActiveJurusanList,
  getCachedActiveRuangList,
} from '@/lib/master-cache';
import AppShell from '@/components/layout/AppShell';
import {
  SiswaFilterClient,
  type BkHistoryFilter,
  type GenderFilter,
} from '@/components/siswa/SiswaFilterClient';

const PAGE_SIZE = 10;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function SiswaDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    ruang?: string;
    jurusan?: string;
    jk?: string;
    bk?: string;
    page?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr/siswa');

  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const ruangFilter = params.ruang?.trim() || undefined;
  const jurusanFilter = params.jurusan?.trim() || undefined;
  const genderFilter: Exclude<GenderFilter, ''> | undefined =
    params.jk === 'L' || params.jk === 'P' ? params.jk : undefined;
  const bkFilter: Exclude<BkHistoryFilter, ''> | undefined =
    params.bk === 'ADA' || params.bk === 'BELUM' ? params.bk : undefined;

  const parsedPage = Number.parseInt(params.page ?? '', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const whereClause: Prisma.SiswaWhereInput = {
    is_active: true,
    ...(ruangFilter ? { ruang_kelas: { nama_ruang: ruangFilter } } : {}),
    ...(jurusanFilter ? { jurusan: { kode: jurusanFilter } } : {}),
    ...(genderFilter ? { jenis_kelamin: genderFilter } : {}),
    ...(bkFilter === 'ADA' ? { jurnal: { some: {} } } : {}),
    ...(bkFilter === 'BELUM' ? { jurnal: { none: {} } } : {}),
    ...(q
      ? { nama_lengkap: { contains: q, mode: 'insensitive' as const } }
      : {}),
  };

  const [totalCount, ruangList, jurusanList] = await Promise.all([
    prisma.siswa.count({ where: whereClause }),
    getCachedActiveRuangList(),
    getCachedActiveJurusanList(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const students = await prisma.siswa.findMany({
    where: whereClause,
    orderBy: [
      { ruang_kelas: { nama_ruang: 'asc' } },
      { no_absen: 'asc' },
      { nama_lengkap: 'asc' },
    ],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      no_absen: true,
      nama_lengkap: true,
      jenis_kelamin: true,
      jurusan: { select: { kode: true } },
      ruang_kelas: { select: { nama_ruang: true } },
      _count: { select: { jurnal: true } },
    },
  });

  const buildPageHref = (pageNum: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (ruangFilter) p.set('ruang', ruangFilter);
    if (jurusanFilter) p.set('jurusan', jurusanFilter);
    if (genderFilter) p.set('jk', genderFilter);
    if (bkFilter) p.set('bk', bkFilter);
    if (pageNum > 1) p.set('page', String(pageNum));
    const qs = p.toString();
    return qs ? `/siswa?${qs}` : '/siswa';
  };

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);
  const prevHref = currentPage > 1 ? buildPageHref(currentPage - 1) : undefined;
  const nextHref =
    currentPage < totalPages ? buildPageHref(currentPage + 1) : undefined;

  return (
    <AppShell
      session={session}
      title="Daftar Siswa"
      subtitle="Data Siswa Aktif & Riwayat BK"
      backHref="/"
    >
      {/* Mobile-first Search, Filter Bottom Sheet & Top Pagination Bar */}
      <SiswaFilterClient
        initialQ={q}
        initialRuang={ruangFilter}
        initialJurusan={jurusanFilter}
        initialGender={genderFilter}
        initialBk={bkFilter}
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

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <Users className="mx-auto h-9 w-9 text-zinc-300" />
          <p className="mt-2 text-sm font-semibold text-zinc-800">
            Data siswa tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Ubah kata kunci atau filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const hasJurnal = s._count.jurnal > 0;
            const isMale = s.jenis_kelamin === 'L';

            return (
              <Link
                key={s.id}
                href={`/siswa/${s.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white p-3.5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out hover:border-[#047857]/30 hover:shadow-[0_6px_18px_-4px_rgba(4,120,87,0.12)] active:scale-[0.985] active:bg-zinc-50/90 active:shadow-xs"
              >
                {/* Avatar Inisial dengan aksen gender halus */}
                <div
                  aria-hidden="true"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-xs font-extrabold tracking-tight ${isMale
                      ? 'border-sky-200/80 bg-sky-50 text-sky-700'
                      : 'border-rose-200/80 bg-rose-50 text-rose-600'
                    }`}
                >
                  {getInitials(s.nama_lengkap)}
                </div>

                {/* Info Siswa */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[14.5px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-[#047857]">
                    {s.nama_lengkap}
                  </h3>
                  <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                    {s.no_absen ? `Absen ${String(s.no_absen).padStart(2, '0')} • ` : ''}
                    {s.ruang_kelas.nama_ruang}{' '}
                    <span className="text-zinc-300">|</span>{' '}
                    <span className="font-semibold text-[#047857]">
                      {s.jurusan.kode}
                    </span>
                  </p>
                </div>

                {/* Badge Jumlah Jurnal + Chevron */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    title={`${s._count.jurnal} jurnal konseling`}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${hasJurnal
                        ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                        : 'border-zinc-200/70 bg-zinc-50 text-zinc-400'
                      }`}
                  >
                    <FileText className="h-3 w-3" />
                    {s._count.jurnal}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#047857]" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
