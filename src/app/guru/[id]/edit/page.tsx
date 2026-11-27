import { notFound, redirect } from 'next/navigation';
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

export default async function GuruJurnalSikapEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const existing = await prisma.jurnalSikap.findUnique({
    where: { id },
    include: { foto_list: { orderBy: { urutan: 'asc' } } },
  });
  if (!existing) notFound();

  const canEdit =
    existing.created_by_id === session.userId ||
    session.role === 'ADMIN' ||
    session.role === 'GURU_BK';

  if (!canEdit) redirect('/guru');

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
  const liveDate = new Date().toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const tanggalStr = existing.tanggal.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  });

  const existingPhotos: { driveId: string; fileName: string | null }[] = [
    ...existing.foto_list.map((f) => ({
      driveId: f.drive_id,
      fileName: f.file_name,
    })),
  ];
  if (
    existing.foto_drive_id &&
    !existingPhotos.some((p) => p.driveId === existing.foto_drive_id)
  ) {
    existingPhotos.unshift({
      driveId: existing.foto_drive_id,
      fileName: existing.foto_file_name,
    });
  }

  return (
    <AppShell
      session={session}
      title="Edit Jurnal Sikap"
      subtitle="Perbarui catatan sikap atau bukti foto home visit"
      backHref={`/guru/${existing.id}`}
    >
      <JurnalSikapFormClient
        students={students}
        konselorList={konselorList}
        defaultKonselorId={existing.konselor_id}
        canChangeKonselor={canChangeKonselor}
        counselorName={counselorName}
        liveDate={liveDate}
        defaultDate={tanggalStr}
        gdriveConfigured={isGdriveConfigured()}
        initialData={{
          id: existing.id,
          tanggal: tanggalStr,
          siswaId: existing.siswa_id,
          jenis: existing.jenis,
          konselorId: existing.konselor_id,
          prestasiDalam: existing.prestasi_dalam ?? '',
          sikapPerilaku: existing.sikap_perilaku ?? '',
          permasalahan: existing.permasalahan ?? '',
          kendala: existing.kendala ?? '',
          solusi: existing.solusi ?? '',
          catatan: existing.catatan ?? '',
          tindakLanjut: existing.tindak_lanjut,
          existingPhotos,
        }}
        redirectAfterSave="/guru"
      />
    </AppShell>
  );
}
