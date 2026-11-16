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

export async function loginAdminAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    return { error: 'Username dan password wajib diisi.' };
  }

  const account = await prisma.userAccount.findUnique({
    where: { username },
    include: { pegawai: true },
  });

  if (!account || !account.is_active || account.role !== 'ADMIN') {
    return { error: 'Kredensial Admin tidak valid atau akun tidak aktif.' };
  }

  const isPasswordValid = await bcrypt.compare(password, account.password_hash);
  if (!isPasswordValid) {
    return { error: 'Password Admin salah.' };
  }

  await setSessionCookie({
    userId: account.id,
    pegawaiId: account.pegawai.id,
    username: account.username,
    namaLengkap: account.pegawai.nama_lengkap,
    gelar: account.pegawai.gelar,
    jenisKelamin: account.pegawai.jenis_kelamin,
    role: account.role,
    ruangKelasId: null,
    namaRuang: null,
  });

  redirect('/admin');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}

export async function updateOwnAccountAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sesi login telah berakhir.' };

  const newUsername = String(formData.get('username') ?? '').trim().toLowerCase();
  const newPassword = String(formData.get('password') ?? '').trim();

  if (!newUsername || newUsername.length < 3) {
    return { error: 'Username minimal 3 karakter.' };
  }

  // Cek keunikan username jika diubah
  if (newUsername !== session.username) {
    const existing = await prisma.userAccount.findUnique({
      where: { username: newUsername },
    });
    if (existing) {
      return { error: `Username "${newUsername}" sudah digunakan pengguna lain.` };
    }
  }

  const updateData: { username: string; password_hash?: string } = {
    username: newUsername,
  };

  if (newPassword.length > 0) {
    if (newPassword.length < 6) {
      return { error: 'Password baru minimal 6 karakter.' };
    }
    updateData.password_hash = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.userAccount.update({
    where: { id: session.userId },
    data: updateData,
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

  return { success: 'Profil akun berhasil diperbarui!' };
}

