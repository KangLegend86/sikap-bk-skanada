import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/layout/AppShell';
import { AdminMasterClient } from '@/components/admin/AdminMasterClient';


export default async function AdminMasterPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') {
    redirect(session.role === 'GURU_PJR' ? '/pjr' : '/');
  }

  const [jurusanList, ruangList, rawSiswa, pegawaiList, kategoriList] =
    await Promise.all([
      prisma.jurusan.findMany({
        where: { is_active: true },
        orderBy: { kode: 'asc' },
      }),
      prisma.ruangKelas.findMany({
        where: { is_active: true },
        orderBy: { nama_ruang: 'asc' },
      }),
      prisma.siswa.findMany({
        where: { is_active: true },
        orderBy: [
          { ruang_kelas: { nama_ruang: 'asc' } },
          { no_absen: 'asc' },
          { nama_lengkap: 'asc' },
        ],
        include: { jurusan: true, ruang_kelas: true },
      }),
      prisma.pegawai.findMany({
        orderBy: { nama_lengkap: 'asc' },
      }),
      prisma.kategoriBk.findMany({
        where: { is_active: true },
        orderBy: { nama_kategori: 'asc' },
      }),
    ]);

  const siswaList = rawSiswa.map((s) => ({
    id: s.id,
    no_absen: s.no_absen,
    nama_lengkap: s.nama_lengkap,
    jenis_kelamin: s.jenis_kelamin,
    jurusanKode: s.jurusan.kode,
    ruangNama: s.ruang_kelas.nama_ruang,
  }));

  return (
    <AppShell
      session={session}
      title="Data Master Sekolah"
      subtitle="Kelola data Siswa, Pegawai/GTK, Kategori BK, Ruang & Jurusan"
    >
      <AdminMasterClient
        jurusanList={jurusanList}
        ruangList={ruangList}
        siswaList={siswaList}
        pegawaiList={pegawaiList}
        kategoriList={kategoriList}
      />
    </AppShell>
  );
}

