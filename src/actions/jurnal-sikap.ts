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

const MAX_HOME_VISIT_PHOTOS = 5;

export interface PhotoUploadItem {
  base64Data: string;
  mimeType: string;
}

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
  // Multi-foto opsional khusus HOME_VISIT (maks 5 foto)
  newPhotos?: PhotoUploadItem[];
  removedDriveIds?: string[];
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

  const newPhotos =
    input.jenis === 'HOME_VISIT'
      ? (input.newPhotos ?? []).slice(0, MAX_HOME_VISIT_PHOTOS)
      : [];

  let uploadedPhotos: { fileId: string; fileName: string; urutan: number }[] = [];

  if (newPhotos.length > 0) {
    if (!isGdriveConfigured()) {
      return {
        error:
          'Penyimpanan foto belum dikonfigurasi oleh Admin. Simpan tanpa foto terlebih dahulu atau hubungi Admin.',
      };
    }

    try {
      uploadedPhotos = await Promise.all(
        newPhotos.map(async (photo, idx) => {
          const targetName = buildHomeVisitFileName(
            input.tanggal,
            siswa.ruang_kelas.nama_ruang,
            siswa.nama_lengkap,
            idx + 1
          );
          const uploaded = await uploadHomeVisitPhoto({
            base64Data: photo.base64Data,
            mimeType: photo.mimeType || 'image/jpeg',
            fileName: targetName,
            tanggalIso: input.tanggal,
          });
          return {
            fileId: uploaded.fileId,
            fileName: uploaded.fileName,
            urutan: idx + 1,
          };
        })
      );
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal mengunggah bukti foto. Silakan coba lagi.',
      };
    }
  }

  const tanggalDate = input.tanggal
    ? new Date(`${input.tanggal}T08:00:00+07:00`)
    : new Date();

  const firstPhoto = uploadedPhotos[0] ?? null;

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
      foto_drive_id: firstPhoto?.fileId ?? null,
      foto_file_name: firstPhoto?.fileName ?? null,
      konselor_id: resolvedKonselorId,
      created_by_id: session.userId,
      ...(uploadedPhotos.length > 0
        ? {
            foto_list: {
              create: uploadedPhotos.map((p) => ({
                drive_id: p.fileId,
                file_name: p.fileName,
                urutan: p.urutan,
              })),
            },
          }
        : {}),
    },
  });

  revalidatePath('/guru');
  revalidatePath('/guru/riwayat');
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
    include: { foto_list: { orderBy: { urutan: 'asc' } } },
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
    : existing.konselor_id;

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

  // Kumpulkan semua foto eksisting (gabung foto_list + legacy foto_drive_id)
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

  let finalPhotos: { driveId: string; fileName: string | null }[] = [];

  if (input.jenis !== 'HOME_VISIT') {
    // Jika berganti dari HOME_VISIT ke jenis lain, hapus semua foto lama
    await Promise.all(
      existingPhotos.map((p) => deleteHomeVisitPhoto(p.driveId))
    );
    finalPhotos = [];
  } else {
    const removedSet = new Set(input.removedDriveIds ?? []);
    const toDelete = existingPhotos.filter((p) => removedSet.has(p.driveId));
    const kept = existingPhotos.filter((p) => !removedSet.has(p.driveId));

    const remainingSlots = Math.max(0, MAX_HOME_VISIT_PHOTOS - kept.length);
    const toUpload = (input.newPhotos ?? []).slice(0, remainingSlots);

    let uploadedNew: { driveId: string; fileName: string | null }[] = [];
    if (toUpload.length > 0) {
      if (!isGdriveConfigured()) {
        return {
          error: 'Penyimpanan foto belum dikonfigurasi oleh Admin.',
        };
      }
      try {
        uploadedNew = await Promise.all(
          toUpload.map(async (photo, idx) => {
            const targetName = buildHomeVisitFileName(
              input.tanggal,
              siswa.ruang_kelas.nama_ruang,
              siswa.nama_lengkap,
              kept.length + idx + 1
            );
            const uploaded = await uploadHomeVisitPhoto({
              base64Data: photo.base64Data,
              mimeType: photo.mimeType || 'image/jpeg',
              fileName: targetName,
              tanggalIso: input.tanggal,
            });
            return {
              driveId: uploaded.fileId,
              fileName: uploaded.fileName,
            };
          })
        );
      } catch (err) {
        return {
          error:
            err instanceof Error
              ? err.message
              : 'Gagal mengunggah bukti foto baru.',
        };
      }
    }

    if (toDelete.length > 0) {
      await Promise.all(toDelete.map((p) => deleteHomeVisitPhoto(p.driveId)));
    }

    finalPhotos = [...kept, ...uploadedNew];
  }

  const tanggalDate = input.tanggal
    ? new Date(`${input.tanggal}T08:00:00+07:00`)
    : existing.tanggal;

  const firstPhoto = finalPhotos[0] ?? null;

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
      foto_drive_id: firstPhoto?.driveId ?? null,
      foto_file_name: firstPhoto?.fileName ?? null,
      konselor_id: resolvedKonselorId,
      foto_list: {
        deleteMany: {},
        create: finalPhotos.map((p, idx) => ({
          drive_id: p.driveId,
          file_name: p.fileName,
          urutan: idx + 1,
        })),
      },
    },
  });

  revalidatePath('/guru');
  revalidatePath('/guru/riwayat');
  revalidatePath(`/guru/${id}`);
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
    include: { foto_list: true },
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

  const driveIds = new Set<string>();
  if (existing.foto_drive_id) driveIds.add(existing.foto_drive_id);
  for (const f of existing.foto_list) {
    driveIds.add(f.drive_id);
  }

  if (driveIds.size > 0) {
    await Promise.all(
      Array.from(driveIds).map((driveId) => deleteHomeVisitPhoto(driveId))
    );
  }

  await prisma.jurnalSikap.delete({ where: { id } });

  revalidatePath('/guru');
  revalidatePath('/guru/riwayat');
  revalidatePath('/jurnal-sikap');
  revalidatePath(`/siswa/${existing.siswa_id}`);

  return { success: 'Jurnal Penilaian Sikap berhasil dihapus.' };
}
