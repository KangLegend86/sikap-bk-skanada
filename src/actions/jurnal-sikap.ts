'use server';

import { revalidatePath } from 'next/cache';
import type { JenisJurnalSikap } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  buildHomeVisitFileName,
  deleteHomeVisitPhoto,
  isGdriveConfigured,
  uploadHomeVisitPhoto,
} from '@/lib/gdrive';

export interface JurnalSikapInput {
  tanggal: string;
  siswaId: string;
  jenis: JenisJurnalSikap;
  konselorId: string;
  prestasiDalam?: string;
  sikapPerilaku?: string;
  permasalahan?: string;
  kendala?: string;
  solusi?: string;
  catatan?: string;
  tindakLanjut: string;
  // Foto opsional khusus HOME_VISIT
  photoBase64?: string | null;
  photoMimeType?: string | null;
  removeExistingPhoto?: boolean;
}

export type JurnalSikapActionResult = {
  error?: string;
  success?: string;
  id?: string;
};

function validateInput(input: JurnalSikapInput): string | null {
  if (!input.siswaId) return 'Silakan pilih siswa terlebih dahulu.';
  if (!input.konselorId) return 'Silakan pilih nama konselor / guru.';
  if (!input.tindakLanjut?.trim()) return 'Tindak lanjut wajib diisi.';

  if (input.jenis === 'BERPRESTASI') {
    if (!input.prestasiDalam?.trim()) {
      return 'Kolom "Berprestasi dalam hal" wajib diisi.';
    }
    if (!input.sikapPerilaku?.trim()) {
      return 'Kolom "Sikap / Perilaku" wajib diisi.';
    }
  } else {
    if (!input.permasalahan?.trim()) {
      return 'Kolom "Permasalahan" wajib diisi.';
    }
    if (!input.kendala?.trim()) {
      return 'Kolom "Kendala" wajib diisi.';
    }
    if (!input.solusi?.trim()) {
      return 'Kolom "Solusi" wajib diisi.';
    }
  }

  return null;
}

export async function createJurnalSikapAction(
  input: JurnalSikapInput
): Promise<JurnalSikapActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  const canChooseOtherKonselor = session.role === 'ADMIN';
  const resolvedKonselorId = canChooseOtherKonselor
    ? input.konselorId
    : session.pegawaiId;

  const validationError = validateInput({
    ...input,
    konselorId: resolvedKonselorId,
  });
  if (validationError) return { error: validationError };

  const siswa = await prisma.siswa.findUnique({
    where: { id: input.siswaId },
    include: { ruang_kelas: true },
  });
  if (!siswa) {
    return { error: 'Data siswa tidak ditemukan.' };
  }

  let fotoDriveId: string | null = null;
  let fotoFileName: string | null = null;

  if (input.jenis === 'HOME_VISIT' && input.photoBase64) {
    if (!isGdriveConfigured()) {
      return {
        error:
          'Penyimpanan Google Drive belum dikonfigurasi oleh Admin (GDRIVE_SCRIPT_URL di .env). Simpan tanpa foto terlebih dahulu atau hubungi Admin.',
      };
    }

    try {
      const targetName = buildHomeVisitFileName(
        input.tanggal,
        siswa.ruang_kelas.nama_ruang,
        siswa.nama_lengkap
      );
      const uploaded = await uploadHomeVisitPhoto({
        base64Data: input.photoBase64,
        mimeType: input.photoMimeType || 'image/jpeg',
        fileName: targetName,
        tanggalIso: input.tanggal,
      });
      fotoDriveId = uploaded.fileId;
      fotoFileName = uploaded.fileName;
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal mengunggah bukti foto ke Google Drive.',
      };
    }
  }

  const tanggalDate = input.tanggal
    ? new Date(`${input.tanggal}T08:00:00+07:00`)
    : new Date();

  const created = await prisma.jurnalSikap.create({
    data: {
      tanggal: Number.isNaN(tanggalDate.getTime()) ? new Date() : tanggalDate,
      siswa_id: siswa.id,
      snapshot_ruang: siswa.ruang_kelas.nama_ruang,
      jenis: input.jenis,
      prestasi_dalam:
        input.jenis === 'BERPRESTASI' ? input.prestasiDalam?.trim() || null : null,
      sikap_perilaku:
        input.jenis === 'BERPRESTASI' ? input.sikapPerilaku?.trim() || null : null,
      permasalahan:
        input.jenis !== 'BERPRESTASI' ? input.permasalahan?.trim() || null : null,
      kendala:
        input.jenis !== 'BERPRESTASI' ? input.kendala?.trim() || null : null,
      solusi:
        input.jenis !== 'BERPRESTASI' ? input.solusi?.trim() || null : null,
      catatan: input.catatan?.trim() || null,
      tindak_lanjut: input.tindakLanjut.trim(),
      foto_drive_id: fotoDriveId,
      foto_file_name: fotoFileName,
      konselor_id: resolvedKonselorId,
      created_by_id: session.userId,
    },
  });

  revalidatePath('/guru');
  revalidatePath('/jurnal-sikap');
  revalidatePath(`/siswa/${siswa.id}`);

  return {
    success: 'Jurnal Penilaian Sikap berhasil disimpan.',
    id: created.id,
  };
}

export async function updateJurnalSikapAction(
  id: string,
  input: JurnalSikapInput
): Promise<JurnalSikapActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  const existing = await prisma.jurnalSikap.findUnique({
    where: { id },
  });
  if (!existing) {
    return { error: 'Data jurnal sikap tidak ditemukan.' };
  }

  const canModify =
    existing.created_by_id === session.userId ||
    session.role === 'ADMIN' ||
    session.role === 'GURU_BK';

  if (!canModify) {
    return { error: 'Anda tidak memiliki izin mengubah catatan ini.' };
  }

  const canChooseOtherKonselor = session.role === 'ADMIN';
  const resolvedKonselorId = canChooseOtherKonselor
    ? input.konselorId
    : session.pegawaiId;

  const validationError = validateInput({
    ...input,
    konselorId: resolvedKonselorId,
  });
  if (validationError) return { error: validationError };

  const siswa = await prisma.siswa.findUnique({
    where: { id: input.siswaId },
    include: { ruang_kelas: true },
  });
  if (!siswa) {
    return { error: 'Data siswa tidak ditemukan.' };
  }

  let fotoDriveId = existing.foto_drive_id;
  let fotoFileName = existing.foto_file_name;

  // Jika jenis diubah dari HOME_VISIT ke jenis lain, hapus foto lama jika ada
  if (input.jenis !== 'HOME_VISIT') {
    if (existing.foto_drive_id) {
      await deleteHomeVisitPhoto(existing.foto_drive_id);
    }
    fotoDriveId = null;
    fotoFileName = null;
  } else {
    // Jenis HOME_VISIT
    if (input.photoBase64) {
      if (!isGdriveConfigured()) {
        return {
          error:
            'Penyimpanan Google Drive belum dikonfigurasi oleh Admin (GDRIVE_SCRIPT_URL di .env).',
        };
      }
      try {
        const targetName = buildHomeVisitFileName(
          input.tanggal,
          siswa.ruang_kelas.nama_ruang,
          siswa.nama_lengkap
        );
        const uploaded = await uploadHomeVisitPhoto({
          base64Data: input.photoBase64,
          mimeType: input.photoMimeType || 'image/jpeg',
          fileName: targetName,
          tanggalIso: input.tanggal,
        });
        // Hapus foto lama setelah foto baru sukses terunggah
        if (existing.foto_drive_id) {
          await deleteHomeVisitPhoto(existing.foto_drive_id);
        }
        fotoDriveId = uploaded.fileId;
        fotoFileName = uploaded.fileName;
      } catch (err) {
        return {
          error:
            err instanceof Error
              ? err.message
              : 'Gagal mengunggah bukti foto baru ke Google Drive.',
        };
      }
    } else if (input.removeExistingPhoto && existing.foto_drive_id) {
      await deleteHomeVisitPhoto(existing.foto_drive_id);
      fotoDriveId = null;
      fotoFileName = null;
    }
  }

  const tanggalDate = input.tanggal
    ? new Date(`${input.tanggal}T08:00:00+07:00`)
    : existing.tanggal;

  await prisma.jurnalSikap.update({
    where: { id },
    data: {
      tanggal: Number.isNaN(tanggalDate.getTime()) ? existing.tanggal : tanggalDate,
      siswa_id: siswa.id,
      snapshot_ruang: siswa.ruang_kelas.nama_ruang,
      jenis: input.jenis,
      prestasi_dalam:
        input.jenis === 'BERPRESTASI' ? input.prestasiDalam?.trim() || null : null,
      sikap_perilaku:
        input.jenis === 'BERPRESTASI' ? input.sikapPerilaku?.trim() || null : null,
      permasalahan:
        input.jenis !== 'BERPRESTASI' ? input.permasalahan?.trim() || null : null,
      kendala:
        input.jenis !== 'BERPRESTASI' ? input.kendala?.trim() || null : null,
      solusi:
        input.jenis !== 'BERPRESTASI' ? input.solusi?.trim() || null : null,
      catatan: input.catatan?.trim() || null,
      tindak_lanjut: input.tindakLanjut.trim(),
      foto_drive_id: fotoDriveId,
      foto_file_name: fotoFileName,
      konselor_id: resolvedKonselorId,
    },
  });

  revalidatePath('/guru');
  revalidatePath(`/guru/${id}/edit`);
  revalidatePath('/jurnal-sikap');
  revalidatePath(`/jurnal-sikap/${id}`);
  revalidatePath(`/siswa/${existing.siswa_id}`);
  revalidatePath(`/siswa/${siswa.id}`);

  return {
    success: 'Jurnal Penilaian Sikap berhasil diperbarui.',
    id,
  };
}

export async function deleteJurnalSikapAction(
  id: string
): Promise<JurnalSikapActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sesi login telah berakhir.' };
  }

  const existing = await prisma.jurnalSikap.findUnique({
    where: { id },
  });
  if (!existing) {
    return { error: 'Data jurnal sikap tidak ditemukan.' };
  }

  const canDelete =
    existing.created_by_id === session.userId ||
    session.role === 'ADMIN' ||
    session.role === 'GURU_BK';

  if (!canDelete) {
    return { error: 'Anda tidak memiliki izin menghapus catatan ini.' };
  }

  if (existing.foto_drive_id) {
    await deleteHomeVisitPhoto(existing.foto_drive_id);
  }

  await prisma.jurnalSikap.delete({ where: { id } });

  revalidatePath('/guru');
  revalidatePath('/jurnal-sikap');
  revalidatePath(`/siswa/${existing.siswa_id}`);

  return { success: 'Jurnal Penilaian Sikap berhasil dihapus.' };
}
