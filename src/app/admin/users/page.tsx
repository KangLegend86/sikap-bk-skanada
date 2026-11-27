import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') {
    redirect(
      session.role === 'GURU_PJR'
        ? '/pjr'
        : session.role === 'GURU'
          ? '/guru'
          : '/'
    );
  }

  const [pegawaiList, ruangList, rawUsers, missingCount] = await Promise.all([
    prisma.pegawai.findMany({
      orderBy: { nama_lengkap: 'asc' },
      select: { id: true, nama_lengkap: true },
    }),
    prisma.ruangKelas.findMany({
      where: { is_active: true },
      orderBy: { nama_ruang: 'asc' },
      select: { id: true, nama_ruang: true },
    }),
    prisma.userAccount.findMany({
      orderBy: [{ is_active: 'desc' }, { role: 'asc' }, { username: 'asc' }],
      include: {
        pegawai: true,
        ruang_kelas: true,
      },
    }),
    prisma.pegawai.count({
      where: { akun: { none: {} } },
    }),
  ]);

  const users = rawUsers.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    is_active: u.is_active,
    pegawaiNama: formatNamaGuru(u.pegawai.nama_lengkap),
    ruangKelasId: u.ruang_kelas_id,
    ruangNama: u.ruang_kelas?.nama_ruang ?? null,
  }));

  return (
    <AppShell
      session={session}
      title="Manajemen Akun Pengguna"
      subtitle="Atur 1 akun per guru untuk Admin, Guru BK, Guru PJR, dan Guru"
    >
      <AdminUsersClient
        pegawaiList={pegawaiList}
        ruangList={ruangList}
        users={users}
        missingGuruCount={missingCount}
      />
    </AppShell>
  );
}
