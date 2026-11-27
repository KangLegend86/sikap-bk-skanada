import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru } from '@/lib/utils';
import { isGdriveConfigured } from '@/lib/gdrive';
import AppShell from '@/components/layout/AppShell';
import {
  JurnalSikapFormClient,
  type KonselorOption,
  type SikapStudentOption,
} from '@/components/jurnal-sikap/JurnalSikapFormClient';

export default async function GuruJurnalSikapBaruPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [rawStudents, rawPegawai] = await Promise.all([
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
              where: {
                is_active: true,
                role: { in: ['GURU_PJR', 'GURU_BK'] },
              },
              take: 1,
              select: {
                pegawai: { select: { nama_lengkap: true } },
              },
            },
          },
        },
      },
    }),
    prisma.pegawai.findMany({
      orderBy: { nama_lengkap: 'asc' },
      select: { id: true, nama_lengkap: true },
    }),
  ]);

  const students: SikapStudentOption[] = rawStudents.map((s) => {
    const pjrAkun = s.ruang_kelas.akun_pjr[0];
    return {
      id: s.id,
      noAbsen: s.no_absen,
      namaLengkap: s.nama_lengkap,
      jenisKelamin: s.jenis_kelamin,
      ruangNama: s.ruang_kelas.nama_ruang,
      jurusanKode: s.jurusan.kode,
      pjrNama: pjrAkun ? formatNamaGuru(pjrAkun.pegawai.nama_lengkap) : null,
    };
  });

  const konselorList: KonselorOption[] = rawPegawai.map((p) => ({
    id: p.id,
    namaLengkap: formatNamaGuru(p.nama_lengkap),
  }));

  const counselorName = formatNamaGuru(session.namaLengkap);
  const canChangeKonselor = session.role === 'ADMIN';
  const now = new Date();
  const liveDate = now.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const defaultDate = now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  });

  return (
    <AppShell
      session={session}
      title="Formulir Jurnal Sikap"
      subtitle="Catat Jurnal Penilaian Sikap Siswa"
      backHref="/guru"
    >
      <JurnalSikapFormClient
        students={students}
        konselorList={konselorList}
        defaultKonselorId={session.pegawaiId}
        canChangeKonselor={canChangeKonselor}
        counselorName={counselorName}
        liveDate={liveDate}
        defaultDate={defaultDate}
        gdriveConfigured={isGdriveConfigured()}
        redirectAfterSave="/guru"
      />
    </AppShell>
  );
}
