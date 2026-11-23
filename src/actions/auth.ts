'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { clearSessionCookie, getSession, setSessionCookie } from '@/lib/auth';

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginGuruAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';

  if (!username || !password) {
    return { error: 'Username dan password wajib diisi.' };
  }

  const account = await prisma.userAccount.findUnique({
    where: { username },
    include: {
      pegawai: true,
      ruang_kelas: true,
    },
  });

  if (!account || !account.is_active) {
    return { error: 'Username tidak ditemukan atau akun sedang dinonaktifkan.' };
  }

  const isPasswordValid = await bcrypt.compare(password, account.password_hash);
  if (!isPasswordValid) {
    return { error: 'Password yang Anda masukkan salah.' };
  }

  if (account.role === 'ADMIN') {
    await setSessionCookie(
      {
        userId: account.id,
        pegawaiId: account.pegawai.id,
        username: account.username,
        namaLengkap: account.pegawai.nama_lengkap,
        gelar: account.pegawai.gelar,
        jenisKelamin: account.pegawai.jenis_kelamin,
        role: account.role,
        ruangKelasId: null,
        namaRuang: null,
      },
      remember
    );
    redirect('/admin');
  }

  await setSessionCookie(
    {
      userId: account.id,
      pegawaiId: account.pegawai.id,
      username: account.username,
      namaLengkap: account.pegawai.nama_lengkap,
      gelar: account.pegawai.gelar,
      jenisKelamin: account.pegawai.jenis_kelamin,
      role: account.role,
      ruangKelasId: account.ruang_kelas_id,
      namaRuang: account.ruang_kelas?.nama_ruang ?? null,
    },
    remember
  );

  if (account.role === 'GURU_PJR') {
    redirect('/pjr');
  }
  redirect('/');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}

export async function updateUsernameAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sesi login telah berakhir.' };

  const newUsername = String(formData.get('username') ?? '').trim().toLowerCase();

  if (!newUsername || newUsername.length < 3) {
    return { error: 'Username minimal 3 karakter.' };
  }

  if (newUsername === session.username) {
    return { error: 'Username baru sama dengan username saat ini.' };
  }

  const existing = await prisma.userAccount.findUnique({
    where: { username: newUsername },
  });
  if (existing) {
    return { error: `Username "${newUsername}" sudah digunakan pengguna lain.` };
  }

  const updated = await prisma.userAccount.update({
    where: { id: session.userId },
    data: { username: newUsername },
    include: { pegawai: true, ruang_kelas: true },
  });

  await setSessionCookie({
    userId: updated.id,
    pegawaiId: updated.pegawai.id,
    username: updated.username,
    namaLengkap: updated.pegawai.nama_lengkap,
    gelar: updated.pegawai.gelar,
    jenisKelamin: updated.pegawai.jenis_kelamin,
    role: updated.role,
    ruangKelasId: updated.ruang_kelas_id,
    namaRuang: updated.ruang_kelas?.nama_ruang ?? null,
  });

  return { success: 'Username berhasil diperbarui!' };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sesi login telah berakhir.' };

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '').trim();
  const confirmPassword = String(formData.get('confirmPassword') ?? '').trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Semua kolom password wajib diisi.' };
  }

  if (newPassword.length < 6) {
    return { error: 'Password baru minimal 6 karakter.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Konfirmasi password baru tidak cocok.' };
  }

  const account = await prisma.userAccount.findUnique({
    where: { id: session.userId },
  });
  if (!account) {
    return { error: 'Akun tidak ditemukan.' };
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, account.password_hash);
  if (!isCurrentValid) {
    return { error: 'Password lama yang Anda masukkan salah.' };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.userAccount.update({
    where: { id: session.userId },
    data: { password_hash: newHash },
  });

  return { success: 'Password berhasil diperbarui!' };
}

export async function updateOwnProfileAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sesi login telah berakhir.' };

  const namaLengkap = String(formData.get('namaLengkap') ?? '').trim();
  const gelar = String(formData.get('gelar') ?? '').trim();
  const jenisKelaminRaw = String(formData.get('jenisKelamin') ?? '').trim();
  const noWhatsapp = String(formData.get('noWhatsapp') ?? '').trim();

  if (!namaLengkap || namaLengkap.length < 2) {
    return { error: 'Nama lengkap wajib diisi minimal 2 karakter.' };
  }

  if (jenisKelaminRaw !== 'L' && jenisKelaminRaw !== 'P') {
    return { error: 'Jenis kelamin tidak valid.' };
  }

  const updatedPegawai = await prisma.pegawai.update({
    where: { id: session.pegawaiId },
    data: {
      nama_lengkap: namaLengkap,
      gelar: gelar || null,
      jenis_kelamin: jenisKelaminRaw,
      no_whatsapp: noWhatsapp || null,
    },
  });

  await setSessionCookie({
    ...session,
    namaLengkap: updatedPegawai.nama_lengkap,
    gelar: updatedPegawai.gelar,
    jenisKelamin: updatedPegawai.jenis_kelamin,
  });

  return { success: 'Profil berhasil diperbarui!' };
}

