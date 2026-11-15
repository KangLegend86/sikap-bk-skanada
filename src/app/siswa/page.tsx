import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, Search, Users } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMajorBadgeClass } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';


export default async function SiswaDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ruang?: string; jurusan?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr/siswa');

  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const ruangFilter = params.ruang?.trim() || undefined;
  const jurusanFilter = params.jurusan?.trim() || undefined;

  const [students, ruangList, jurusanList] = await Promise.all([
    prisma.siswa.findMany({
      where: {
        is_active: true,
        ...(ruangFilter ? { ruang_kelas: { nama_ruang: ruangFilter } } : {}),
        ...(jurusanFilter ? { jurusan: { kode: jurusanFilter } } : {}),
        ...(q
          ? { nama_lengkap: { contains: q, mode: 'insensitive' } }
          : {}),
      },
      orderBy: [
        { ruang_kelas: { nama_ruang: 'asc' } },
        { no_absen: 'asc' },
        { nama_lengkap: 'asc' },
      ],
      take: 100,
      include: {
        jurusan: true,
        ruang_kelas: true,
        _count: { select: { jurnal: true } },
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
      title="Direktori Siswa"
      subtitle="Daftar siswa aktif dan rekam jejak konseling BK"
    >
      <div className="mb-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari nama siswa..."
              className="w-full rounded-lg border border-zinc-300 py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#0D6A37] focus:outline-none"
            />
          </div>

          <select
            name="ruang"
            defaultValue={ruangFilter ?? ''}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0D6A37] focus:outline-none"
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0D6A37] focus:outline-none"
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
              className="rounded-lg bg-[#0D6A37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#09532A]"
            >
              Cari
            </button>
          </div>
        </form>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <Users className="mx-auto h-9 w-9 text-zinc-300" />
          <p className="mt-2 text-sm font-semibold text-zinc-700">
            Data siswa tidak ditemukan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/siswa/${s.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-[#0D6A37]/40 hover:shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">
                  {s.no_absen ? `${s.no_absen}. ` : ''}
                  {s.nama_lengkap}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {s.ruang_kelas.nama_ruang}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                      s.jurusan.kode
                    )}`}
                  >
                    {s.jurusan.kode}
                  </span>
                  <span className="text-xs text-zinc-400">
                    ({s.jenis_kelamin})
                  </span>
                </div>
              </div>

              <div className="ml-3 shrink-0 text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#0D6A37]">
                  <FileText className="h-3.5 w-3.5" />
                  {s._count.jurnal}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

