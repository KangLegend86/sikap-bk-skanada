import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  FileText,
  Filter,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Share2,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  formatNamaGuru,
  formatTanggalIndo,
  getMajorBadgeClass,
} from '@/lib/utils';
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
      <div className="mb-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
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
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
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
          {journals.map((item) => (
            <Link
              key={item.id}
              href={`/jurnal/${item.id}`}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-[#047857]/40 hover:shadow-sm"
            >
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900">
                        {item.siswa.nama_lengkap}
                      </span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                        {item.snapshot_ruang}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                          item.siswa.jurusan.kode
                        )}`}
                      >
                        {item.siswa.jurusan.kode}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatTanggalIndo(item.tanggal_konseling)} •{' '}
                      {formatNamaGuru(item.guru_bk.nama_lengkap, item.guru_bk.gelar)}
                    </p>
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

                <p className="mt-2.5 line-clamp-2 text-sm text-zinc-700">
                  {item.permasalahan}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {item.kategori.map((k) => (
                    <span
                      key={k.kategori_id}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                    >
                      #{k.kategori.nama_kategori}
                    </span>
                  ))}
                </div>
                {item._count.feedback > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#047857]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {item._count.feedback}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

