import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  FileText,
  Filter,
  Lock,
  LockOpen,
  MessageSquare,
  Plus,
  Search,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru, formatTanggalIndo } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';


export default async function JurnalListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    ruang?: string;
    jurusan?: string;
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
  const ruangFilter = params.ruang?.trim() || undefined;
  const jurusanFilter = params.jurusan?.trim() || undefined;

  const [journals, ruangList, jurusanList] = await Promise.all([
    prisma.jurnalBk.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(ruangFilter ? { snapshot_ruang: ruangFilter } : {}),
        ...(jurusanFilter
          ? { siswa: { jurusan: { kode: jurusanFilter } } }
          : {}),
        ...(q
          ? {
              OR: [
                { permasalahan: { contains: q, mode: 'insensitive' } },
                { tindak_lanjut: { contains: q, mode: 'insensitive' } },
                { siswa: { nama_lengkap: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
      take: 60,
      include: {
        siswa: {
          include: {
            jurusan: true,
            ruang_kelas: true,
          },
        },
        guru_bk: true,
        kategori: { include: { kategori: true } },
        _count: { select: { feedback: true } },
      },
    }),
    prisma.ruangKelas.findMany({
      where: { is_active: true },
      orderBy: { nama_ruang: 'asc' },
    }),
    prisma.jurusan.findMany({
      where: { is_active: true },
      orderBy: { kode: 'asc' },
    }),
  ]);

  return (
    <AppShell
      session={session}
      title="Daftar Jurnal Konseling"
      subtitle="Cari, filter, dan pantau perkembangan kasus siswa"
    >
      {/* Top Action + Filter Bar */}
      <div className="mb-5 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari nama siswa atau kata kunci kasus..."
              className="w-full rounded-lg border border-zinc-300 py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
            />
          </div>

          <select
            name="status"
            defaultValue={statusFilter ?? ''}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#047857] focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="DALAM_PROSES">Dalam Proses</option>
            <option value="SELESAI">Selesai</option>
          </select>

          <select
            name="ruang"
            defaultValue={ruangFilter ?? ''}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#047857] focus:outline-none"
          >
            <option value="">Semua Ruang Kelas</option>
            {ruangList.map((r) => (
              <option key={r.id} value={r.nama_ruang}>
                {r.nama_ruang}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              name="jurusan"
              defaultValue={jurusanFilter ?? ''}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#047857] focus:outline-none"
            >
              <option value="">Semua Jurusan</option>
              {jurusanList.map((j) => (
                <option key={j.id} value={j.kode}>
                  {j.kode}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#047857] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#065F46]"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
          <p className="text-xs text-zinc-500">
            Menampilkan <span className="font-semibold text-zinc-800">{journals.length}</span> jurnal konseling
          </p>
          <div className="flex items-center gap-3">
            {(q || statusFilter || ruangFilter || jurusanFilter) && (
              <Link
                href="/jurnal"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                Reset Filter
              </Link>
            )}
            <Link
              href="/jurnal/baru"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-[#047857] hover:bg-emerald-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Catat Jurnal
            </Link>
          </div>
        </div>
      </div>

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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {journals.map((item) => {
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
      )}
    </AppShell>
  );
}

