import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import {
  JurnalFormClient,
  type StudentOption,
} from '@/components/jurnal/JurnalFormClient';


export default async function JurnalBaruPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'GURU_BK' && session.role !== 'ADMIN') {
    redirect('/');
  }

  const [rawStudents, categories] = await Promise.all([
    prisma.siswa.findMany({
      where: { is_active: true },
      orderBy: [
        { ruang_kelas: { nama_ruang: 'asc' } },
        { no_absen: 'asc' },
        { nama_lengkap: 'asc' },
      ],
      select: {
        id: true,
        no_absen: true,
        nama_lengkap: true,
        jenis_kelamin: true,
        jurusan: { select: { kode: true } },
        ruang_kelas: {
          select: {
            nama_ruang: true,
            akun_pjr: {
              where: { is_active: true, role: 'GURU_PJR' },
              take: 1,
              select: {
                pegawai: {
                  select: {
                    nama_lengkap: true,
                    gelar: true,
                    jenis_kelamin: true,
                    no_whatsapp: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.kategoriBk.findMany({
      where: { is_active: true },
      orderBy: { nama_kategori: 'asc' },
      select: { id: true, nama_kategori: true },
    }),
  ]);

  const students: StudentOption[] = rawStudents.map((s) => {
    const pjrAkun = s.ruang_kelas.akun_pjr[0];
    return {
      id: s.id,
      noAbsen: s.no_absen,
      namaLengkap: s.nama_lengkap,
      jenisKelamin: s.jenis_kelamin,
      ruangNama: s.ruang_kelas.nama_ruang,
      jurusanKode: s.jurusan.kode,
      pjrNama: pjrAkun
        ? formatNamaGuru(pjrAkun.pegawai.nama_lengkap, pjrAkun.pegawai.gelar)
        : null,
      pjrGender: pjrAkun ? pjrAkun.pegawai.jenis_kelamin : null,
      pjrWa: pjrAkun?.pegawai.no_whatsapp ?? null,
    };
  });

  const counselorName = formatNamaGuru(session.namaLengkap, session.gelar);
  const now = new Date();
  const liveDate = now.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const defaultDate = now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  });

  return (
    <AppShell
      session={session}
      title="Form Jurnal BK"
      subtitle="SMKS NU 2 Kedungpring"
      backHref="/"
    >
      <JurnalFormClient
        students={students}
        initialCategories={categories}
        counselorName={counselorName}
        liveDate={liveDate}
        defaultDate={defaultDate}
      />
    </AppShell>
  );
}

