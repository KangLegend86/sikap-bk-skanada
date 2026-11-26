'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatNamaGuru } from '@/lib/utils';

export type JurnalActionResult = {
  error?: string;
  success?: string;
  jurnalId?: string;
};

export async function createJurnalAction(input: {
  siswaId: string;
  tanggalKonseling?: string;
  kategoriIds: string[];
  permasalahan: string;
  kendala?: string;
  solusi?: string;
  tindakLanjut: string;
  catatan?: string;
  status: 'DALAM_PROSES' | 'SELESAI';
  keteranganStatus?: string;
  isSharedWithPjr: boolean;
}): Promise<JurnalActionResult> {
  const session = await getSession();
  if (!session || (session.role !== 'GURU_BK' && session.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki akses untuk mencatat jurnal BK.' };
  }

  if (!input.siswaId) return { error: 'Siswa wajib dipilih.' };
  if (!input.kategoriIds || input.kategoriIds.length === 0) {
    return { error: 'Pilih minimal 1 kategori bimbingan.' };
  }
  if (!input.permasalahan.trim()) return { error: 'Permasalahan wajib diisi.' };
  if (!input.tindakLanjut.trim()) return { error: 'Tindak lanjut wajib diisi.' };

  // Ambil data siswa beserta ruang dan PJR aktif ruang tersebut
  const siswa = await prisma.siswa.findUnique({
    where: { id: input.siswaId },
    include: {
      ruang_kelas: {
        include: {
          akun_pjr: {
            where: { role: 'GURU_PJR', is_active: true },
            include: { pegawai: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!siswa) {
    return { error: 'Data siswa tidak ditemukan.' };
  }

  const pjrAccount = siswa.ruang_kelas.akun_pjr[0];
  const snapshotPjr = pjrAccount
    ? formatNamaGuru(pjrAccount.pegawai.nama_lengkap)
    : null;

  const parsedTanggal =
    input.tanggalKonseling && /^\d{4}-\d{2}-\d{2}$/.test(input.tanggalKonseling)
      ? new Date(`${input.tanggalKonseling}T12:00:00+07:00`)
      : new Date();

  const created = await prisma.jurnalBk.create({
    data: {
      tanggal_konseling: parsedTanggal,
      siswa_id: siswa.id,
      guru_bk_id: session.pegawaiId,
      snapshot_ruang: siswa.ruang_kelas.nama_ruang,
      snapshot_pjr: snapshotPjr,
      permasalahan: input.permasalahan.trim(),
      kendala: input.kendala?.trim() || null,
      solusi: input.solusi?.trim() || null,
      tindak_lanjut: input.tindakLanjut.trim(),
      catatan: input.catatan?.trim() || null,
      status: input.status,
      keterangan_status: input.keteranganStatus?.trim() || null,
      is_shared_with_pjr: input.isSharedWithPjr,
      kategori: {
        create: input.kategoriIds.map((katId) => ({
          kategori_id: katId,
        })),
      },
    },
  });

  revalidatePath('/');
  revalidatePath('/jurnal');
  revalidatePath('/admin');
  revalidatePath('/pjr');

  return {
    success: input.isSharedWithPjr
      ? 'Jurnal disimpan & dibagikan ke akun Guru PJR'
      : 'Jurnal internal BK berhasil disimpan',
    jurnalId: created.id,
  };
}

export async function updateJurnalStatusAction(
  jurnalId: string,
  status: 'DALAM_PROSES' | 'SELESAI',
  keteranganStatus: string
): Promise<JurnalActionResult> {
  const session = await getSession();
  if (!session || (session.role !== 'GURU_BK' && session.role !== 'ADMIN')) {
    return { error: 'Anda tidak memiliki akses untuk mengubah status jurnal.' };
  }

  const existing = await prisma.jurnalBk.findUnique({
    where: { id: jurnalId },
    select: { guru_bk_id: true },
  });

  if (!existing) {
    return { error: 'Jurnal tidak ditemukan.' };
  }

  if (session.role === 'GURU_BK' && existing.guru_bk_id !== session.pegawaiId) {
    return { error: 'Anda hanya dapat mengedit jurnal yang Anda buat sendiri.' };
  }

  await prisma.jurnalBk.update({
    where: { id: jurnalId },
    data: {
      status,
      keterangan_status: keteranganStatus.trim() || null,
    },
  });

  revalidatePath('/');
  revalidatePath('/jurnal');
  revalidatePath(`/jurnal/${jurnalId}`);
  revalidatePath('/pjr');
  revalidatePath('/admin');

  return { success: 'Status penanganan berhasil diperbarui.' };
}

export async function createKategoriAction(namaKategori: string) {
  const session = await getSession();
  if (!session || (session.role !== 'GURU_BK' && session.role !== 'ADMIN')) {
    return { error: 'Akses ditolak.' };
  }
  const cleanName = namaKategori.trim();
  if (!cleanName) return { error: 'Nama kategori tidak boleh kosong.' };

  const existing = await prisma.kategoriBk.findFirst({
    where: { nama_kategori: { equals: cleanName, mode: 'insensitive' } },
  });
  if (existing) {
    return { kategori: existing };
  }

  const created = await prisma.kategoriBk.create({
    data: { nama_kategori: cleanName },
  });
  revalidatePath('/jurnal/baru');
  return { kategori: created };
}

export async function updateKategoriAction(id: string, namaKategori: string) {
  const session = await getSession();
  if (!session || (session.role !== 'GURU_BK' && session.role !== 'ADMIN')) {
    return { error: 'Akses ditolak.' };
  }
  const cleanName = namaKategori.trim();
  if (!cleanName) return { error: 'Nama kategori tidak boleh kosong.' };

  const updated = await prisma.kategoriBk.update({
    where: { id },
    data: { nama_kategori: cleanName },
  });
  revalidatePath('/jurnal/baru');
  return { kategori: updated };
}

export async function submitPjrFeedbackAction(
  jurnalId: string,
  pesanPantauan: string
): Promise<JurnalActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'GURU_PJR') {
    return { error: 'Hanya Guru PJR yang dapat mengirim laporan pantauan.' };
  }
  if (!pesanPantauan.trim()) {
    return { error: 'Pesan pantauan tidak boleh kosong.' };
  }

  // Pastikan jurnal ini memang di-share dan milik siswa di ruang binaan PJR
  const jurnal = await prisma.jurnalBk.findUnique({
    where: { id: jurnalId },
    include: { siswa: true },
  });

  if (
    !jurnal ||
    !jurnal.is_shared_with_pjr ||
    jurnal.siswa.ruang_kelas_id !== session.ruangKelasId
  ) {
    return { error: 'Jurnal tidak ditemukan atau tidak dibagikan ke ruang Anda.' };
  }

  await prisma.pjrFeedback.create({
    data: {
      jurnal_id: jurnalId,
      user_pjr_id: session.userId,
      pesan_pantauan: pesanPantauan.trim(),
    },
  });

  revalidatePath('/pjr');
  revalidatePath('/pjr/kasus');
  revalidatePath('/');
  revalidatePath(`/jurnal/${jurnalId}`);

  return { success: 'Laporan pantauan PJR berhasil dikirim ke Guru BK.' };
}

