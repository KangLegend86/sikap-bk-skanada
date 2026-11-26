'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { JenisKelamin, Role } from '@prisma/client';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Akses ditolak: Khusus Administrator.');
  }
  return session;
}

export async function createSiswaAction(formData: FormData) {
  try {
    await requireAdmin();
    const namaLengkap = String(formData.get('nama_lengkap') ?? '').trim();
    const noAbsenRaw = String(formData.get('no_absen') ?? '').trim();
    const jenisKelamin = String(formData.get('jenis_kelamin') ?? 'L') as JenisKelamin;
    const jurusanId = String(formData.get('jurusan_id') ?? '');
    const ruangKelasId = String(formData.get('ruang_kelas_id') ?? '');
    const namaWali = String(formData.get('nama_wali') ?? '').trim() || null;
    const noHpOrtu = String(formData.get('no_hp_ortu') ?? '').trim() || null;

    if (!namaLengkap || !jurusanId || !ruangKelasId) {
      return { error: 'Nama siswa, jurusan, dan ruang kelas wajib diisi.' };
    }

    await prisma.siswa.create({
      data: {
        nama_lengkap: namaLengkap,
        no_absen: noAbsenRaw ? parseInt(noAbsenRaw, 10) : null,
        jenis_kelamin: jenisKelamin,
        jurusan_id: jurusanId,
        ruang_kelas_id: ruangKelasId,
        nama_wali: namaWali,
        no_hp_ortu: noHpOrtu,
      },
    });

    revalidatePath('/admin/master');
    revalidatePath('/siswa');
    return { success: `Siswa "${namaLengkap}" berhasil ditambahkan.` };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Gagal menambah siswa.' };
  }
}

export async function createPegawaiAction(formData: FormData) {
  try {
    await requireAdmin();
    const nipNik = String(formData.get('nip_nik') ?? '').trim() || null;
    const namaLengkap = String(formData.get('nama_lengkap') ?? '').trim();
    const jenisKelamin = String(formData.get('jenis_kelamin') ?? 'L') as JenisKelamin;
    const noWhatsapp = String(formData.get('no_whatsapp') ?? '').trim() || null;

    if (!namaLengkap) {
      return { error: 'Nama pegawai wajib diisi.' };
    }

    await prisma.pegawai.create({
      data: {
        nip_nik: nipNik,
        nama_lengkap: namaLengkap,
        jenis_kelamin: jenisKelamin,
        no_whatsapp: noWhatsapp,
      },
    });

    revalidatePath('/admin/master');
    revalidatePath('/admin/users');
    return { success: `Pegawai "${namaLengkap}" berhasil ditambahkan.` };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Gagal menambah pegawai.' };
  }
}

export async function createUserAccountAction(formData: FormData) {
  try {
    await requireAdmin();
    const pegawaiId = String(formData.get('pegawai_id') ?? '');
    const username = String(formData.get('username') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const role = String(formData.get('role') ?? 'GURU_BK') as Role;
    const ruangKelasId = String(formData.get('ruang_kelas_id') ?? '').trim() || null;

    if (!pegawaiId || !username || !password) {
      return { error: 'Pegawai, username, dan password wajib diisi.' };
    }
    if (role === 'GURU_PJR' && !ruangKelasId) {
      return { error: 'Untuk peran Guru PJR, wajib memilih Ruang Kelas binaan.' };
    }

    const exists = await prisma.userAccount.findUnique({ where: { username } });
    if (exists) {
      return { error: `Username "${username}" sudah digunakan.` };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.userAccount.create({
      data: {
        pegawai_id: pegawaiId,
        username,
        password_hash: passwordHash,
        role,
        ruang_kelas_id: role === 'GURU_PJR' ? ruangKelasId : null,
      },
    });

    revalidatePath('/admin/users');
    return { success: `Akun "${username}" berhasil dibuat.` };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Gagal membuat akun.' };
  }
}

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.userAccount.update({
    where: { id: userId },
    data: { is_active: isActive },
  });
  revalidatePath('/admin/users');
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  await requireAdmin();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.userAccount.update({
    where: { id: userId },
    data: { password_hash: passwordHash },
  });
  revalidatePath('/admin/users');
  return { success: 'Password berhasil direset.' };
}

