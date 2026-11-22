import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Filter } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru, formatTanggalIndo } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import { AdminRekapClient, type RekapRow } from '@/components/admin/AdminRekapClient';


export default async function AdminRekapPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    jurusan?: string;
    ruang?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') {
    redirect(session.role === 'GURU_PJR' ? '/pjr' : '/');
  }

  const params = await searchParams;
  const statusFilter =
    params.status === 'DALAM_PROSES' || params.status === 'SELESAI'
      ? params.status
      : undefined;
  const jurusanFilter = params.jurusan?.trim() || undefined;
  const ruangFilter = params.ruang?.trim() || undefined;

  const [journals, jurusanList, ruangList] = await Promise.all([
    prisma.jurnalBk.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(ruangFilter ? { snapshot_ruang: ruangFilter } : {}),
        ...(jurusanFilter
          ? { siswa: { jurusan: { kode: jurusanFilter } } }
          : {}),
      },
      orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
      include: {
        siswa: { include: { jurusan: true } },
        guru_bk: true,
        kategori: { include: { kategori: true } },
      },
    }),
    prisma.jurusan.findMany({
      where: { is_active: true },
      orderBy: { kode: 'asc' },
    }),
    prisma.ruangKelas.findMany({
      where: { is_active: true },
      orderBy: { nama_ruang: 'asc' },
    }),
  ]);

  const exportRows: RekapRow[] = journals.map((j) => ({
    id: j.id,
    tanggal: formatTanggalIndo(j.tanggal_konseling),
    siswaNama: j.siswa.nama_lengkap,
    ruang: j.snapshot_ruang,
    jurusanKode: j.siswa.jurusan.kode,
    konselor: formatNamaGuru(j.guru_bk.nama_lengkap, j.guru_bk.gelar),
    kategori: j.kategori.map((k) => k.kategori.nama_kategori).join(', '),
    permasalahan: j.permasalahan,
    tindakLanjut: j.tindak_lanjut,
    status: j.status === 'SELESAI' ? 'Selesai' : 'Dalam Proses',
  }));

  return (
    <AppShell
      session={session}
      title="Rekapitulasi & Laporan BK"
      subtitle="Audit seluruh jurnal konseling dan cetak laporan resmi"
    >
      {/* Print Kop Surat (Only visible on print) */}
      <div className="mb-6 hidden border-b-2 border-zinc-900 pb-4 text-center print:block">
        <p className="text-xs font-semibold tracking-wider uppercase">
          Lembaga Pendidikan Ma&apos;arif NU Kabupaten Lamongan
        </p>
        <h1 className="text-lg font-bold uppercase">
          SMKS NU 2 KEDUNGPRING (SKANADA)
        </h1>
        <p className="text-xs text-zinc-700">
          Laporan Rekapitulasi Jurnal Bimbingan & Konseling Siswa
        </p>
      </div>

      {/* Filter & Export Controls */}
      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            Total Data: <span className="font-bold text-zinc-900">{journals.length}</span> jurnal
          </p>
          <AdminRekapClient rows={exportRows} />
        </div>

        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select
            name="status"
            defaultValue={statusFilter ?? ''}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
          >
            <option value="">Semua Status</option>
            <option value="DALAM_PROSES">Dalam Proses</option>
            <option value="SELESAI">Selesai</option>
          </select>

          <select
            name="ruang"
            defaultValue={ruangFilter ?? ''}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
          >
            <option value="">Semua Ruang Kelas</option>
            {ruangList.map((r) => (
              <option key={r.id} value={r.nama_ruang}>
                {r.nama_ruang}
              </option>
            ))}
          </select>

          <select
            name="jurusan"
            defaultValue={jurusanFilter ?? ''}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
          >
            <option value="">Semua Jurusan</option>
            {jurusanList.map((j) => (
              <option key={j.id} value={j.kode}>
                {j.kode}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#047857] px-3 py-2 text-sm font-semibold text-white hover:bg-[#065F46]"
            >
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
            {(statusFilter || jurusanFilter || ruangFilter) && (
              <Link
                href="/admin/rekap"
                className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs print:border-zinc-400">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
            <tr>
              <th className="px-3 py-3 font-semibold">No</th>
              <th className="px-3 py-3 font-semibold">Tanggal</th>
              <th className="px-3 py-3 font-semibold">Siswa</th>
              <th className="px-3 py-3 font-semibold">Kelas / Jur</th>
              <th className="px-3 py-3 font-semibold">Guru BK</th>
              <th className="px-3 py-3 font-semibold">Permasalahan & Tindak Lanjut</th>
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {journals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Tidak ada data jurnal untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              journals.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-50/60">
                  <td className="px-3 py-3 align-top text-zinc-500">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap text-zinc-700">
                    {formatTanggalIndo(item.tanggal_konseling)}
                  </td>
                  <td className="px-3 py-3 align-top font-semibold text-zinc-900">
                    <Link
                      href={`/jurnal/${item.id}`}
                      className="hover:text-[#047857] hover:underline print:no-underline"
                    >
                      {item.siswa.nama_lengkap}
                    </Link>
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap text-zinc-700">
                    {item.snapshot_ruang} ({item.siswa.jurusan.kode})
                  </td>
                  <td className="px-3 py-3 align-top text-zinc-700">
                    {formatNamaGuru(item.guru_bk.nama_lengkap, item.guru_bk.gelar)}
                  </td>
                  <td className="max-w-md px-3 py-3 align-top text-zinc-700">
                    <p className="font-medium text-zinc-900">
                      {item.permasalahan}
                    </p>
                    <p className="mt-1 text-zinc-500">
                      Tindak Lanjut: {item.tindak_lanjut}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        item.status === 'SELESAI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status === 'SELESAI' ? 'Selesai' : 'Dalam Proses'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

