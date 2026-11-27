import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import {
  JurnalFormClient,
  type StudentOption,
} from '@/components/jurnal/JurnalFormClient';

export default async function JurnalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'GURU_BK' && session.role !== 'ADMIN') {
    redirect('/');
  }

  const { id } = await params;

  const existing = await prisma.jurnalBk.findUnique({
    where: { id },
    include: {
      kategori: { select: { kategori_id: true } },
    },
  });
  if (!existing) notFound();

  const canEdit =
    session.role === 'ADMIN' || existing.guru_bk_id === session.pegawaiId;
  if (!canEdit) redirect(`/jurnal/${id}`);

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
              where: {
                is_active: true,
                role: { in: ['GURU_PJR', 'GURU_BK'] },
              },
              take: 1,
              select: {
                pegawai: {
                  select: {
                    nama_lengkap: true,
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
      pjrNama: pjrAkun ? formatNamaGuru(pjrAkun.pegawai.nama_lengkap) : null,
      pjrGender: pjrAkun ? pjrAkun.pegawai.jenis_kelamin : null,
      pjrWa: pjrAkun?.pegawai.no_whatsapp ?? null,
    };
  });

  const counselorName = formatNamaGuru(session.namaLengkap);
  const liveDate = new Date().toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const tanggalStr = existing.tanggal_konseling.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  });

  return (
    <AppShell
      session={session}
      title="Edit Jurnal BK"
      subtitle="Perbarui catatan layanan konseling siswa"
      backHref={`/jurnal/${existing.id}`}
    >
      <JurnalFormClient
        students={students}
        initialCategories={categories}
        counselorName={counselorName}
        liveDate={liveDate}
        defaultDate={tanggalStr}
        initialData={{
          id: existing.id,
          siswaId: existing.siswa_id,
          tanggalKonseling: tanggalStr,
          kategoriIds: existing.kategori.map((k) => k.kategori_id),
          permasalahan: existing.permasalahan,
          kendala: existing.kendala ?? '',
          solusi: existing.solusi ?? '',
          tindakLanjut: existing.tindak_lanjut,
          catatan: existing.catatan ?? '',
          status: existing.status,
          keteranganStatus: existing.keterangan_status ?? '',
          isSharedWithPjr: existing.is_shared_with_pjr,
        }}
      />
    </AppShell>
  );
}
