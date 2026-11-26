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
    redirect(session.role === 'GURU_PJR' ? '/pjr' : '/');
  }

  const [pegawaiList, ruangList, rawUsers] = await Promise.all([
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
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
      include: {
        pegawai: true,
        ruang_kelas: true,
      },
    }),
  ]);

  const users = rawUsers.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    is_active: u.is_active,
    pegawaiNama: formatNamaGuru(u.pegawai.nama_lengkap),
    ruangNama: u.ruang_kelas?.nama_ruang ?? null,
  }));

  return (
    <AppShell
      session={session}
      title="Manajemen Akun Pengguna"
      subtitle="Atur akun terpisah untuk Admin, Guru BK, dan Guru PJR"
    >
      <AdminUsersClient
        pegawaiList={pegawaiList}
        ruangList={ruangList}
        users={users}
      />
    </AppShell>
  );
}

