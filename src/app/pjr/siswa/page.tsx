import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMajorBadgeClass } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';


export default async function PjrSiswaPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const account = await prisma.userAccount.findUnique({
    where: { id: session.userId },
    select: {
      role: true,
      ruang_kelas_id: true,
      ruang_kelas: { select: { nama_ruang: true } },
    },
  });

  const canAccessPjr =
    account &&
    (account.role === 'GURU_PJR' ||
      (account.role === 'GURU_BK' && Boolean(account.ruang_kelas_id)));

  if (!canAccessPjr) {
    redirect(
      session.role === 'ADMIN'
        ? '/admin'
        : session.role === 'GURU'
          ? '/guru'
          : '/'
    );
  }

  const ruangId = account.ruang_kelas_id;
  const namaRuang = account.ruang_kelas?.nama_ruang ?? '-';
  const liveSession = {
    ...session,
    ruangKelasId: ruangId,
    namaRuang: account.ruang_kelas?.nama_ruang ?? null,
  };

  const students = ruangId
    ? await prisma.siswa.findMany({
        where: { ruang_kelas_id: ruangId, is_active: true },
        orderBy: [{ no_absen: 'asc' }, { nama_lengkap: 'asc' }],
        include: {
          jurusan: true,
          _count: {
            select: {
              jurnal: { where: { is_shared_with_pjr: true } },
            },
          },
        },
      })
    : [];

  return (
    <AppShell
      session={liveSession}
      title={`Siswa Kelas ${namaRuang}`}
      subtitle="Daftar siswa aktif dalam ruang kelas binaan Anda"
    >
      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <Users className="mx-auto h-9 w-9 text-zinc-300" />
          <p className="mt-2 text-sm font-semibold text-zinc-700">
            Belum ada siswa terdaftar di kelas {namaRuang}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">
                  {s.no_absen ? `${s.no_absen}. ` : ''}
                  {s.nama_lengkap}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                      s.jurusan.kode
                    )}`}
                  >
                    {s.jurusan.kode}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
              </div>

              {s._count.jurnal > 0 && (
                <span className="ml-2 shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#047857]">
                  {s._count.jurnal} kasus
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

