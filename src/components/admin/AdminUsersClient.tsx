'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  Power,
  Shield,
  UserPlus,
} from 'lucide-react';
import {
  createUserAccountAction,
  resetUserPasswordAction,
  toggleUserActiveAction,
} from '@/actions/admin';
import { formatNamaGuru } from '@/lib/utils';

interface PegawaiOption {
  id: string;
  nama_lengkap: string;
  gelar: string | null;
}

interface RuangOption {
  id: string;
  nama_ruang: string;
}

interface UserItem {
  id: string;
  username: string;
  role: 'ADMIN' | 'GURU_BK' | 'GURU_PJR';
  is_active: boolean;
  pegawaiNama: string;
  ruangNama: string | null;
}

const ROLE_BADGE: Record<'ADMIN' | 'GURU_BK' | 'GURU_PJR', string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  GURU_BK: 'bg-emerald-100 text-emerald-800',
  GURU_PJR: 'bg-blue-100 text-blue-800',
};

export function AdminUsersClient({
  pegawaiList,
  ruangList,
  users,
}: {
  pegawaiList: PegawaiOption[];
  ruangList: RuangOption[];
  users: UserItem[];
}) {
  const router = useRouter();
  const [role, setRole] = useState<'ADMIN' | 'GURU_BK' | 'GURU_PJR'>('GURU_BK');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    const form = e.currentTarget;
    const res = await createUserAccountAction(new FormData(form));
    setLoading(false);
    if (res?.error) {
      setFeedback({ type: 'err', msg: res.error });
    } else if (res?.success) {
      setFeedback({ type: 'ok', msg: res.success });
      form.reset();
      router.refresh();
    }
  }

  async function handleToggle(userId: string, current: boolean) {
    await toggleUserActiveAction(userId, !current);
    router.refresh();
  }

  async function handleResetPw(userId: string, username: string) {
    const pw = window.prompt(
      `Masukkan password baru untuk akun "${username}" (minimal 6 karakter):`,
      'skanada2026'
    );
    if (!pw || pw.trim().length < 6) return;
    const res = await resetUserPasswordAction(userId, pw.trim());
    if (res?.success) {
      setFeedback({
        type: 'ok',
        msg: `Password akun "${username}" berhasil direset.`,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Create Form */}
      <form
        onSubmit={handleCreateUser}
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-1"
      >
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
          <UserPlus className="h-4 w-4 text-[#0D6A37]" />
          Buat Akun Login Baru
        </h3>
        <p className="text-xs text-zinc-500">
          Satu pegawai dapat memiliki lebih dari satu akun jika merangkap peran (mis. Guru BK sekaligus Guru PJR).
        </p>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
              feedback.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {feedback.msg}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Pegawai / GTK *
          </label>
          <select
            name="pegawai_id"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Pilih Pegawai</option>
            {pegawaiList.map((p) => (
              <option key={p.id} value={p.id}>
                {formatNamaGuru(p.nama_lengkap, p.gelar)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Peran (Role) *
          </label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="GURU_BK">Guru BK</option>
            <option value="GURU_PJR">Guru PJR</option>
            <option value="ADMIN">Admin / Koordinator BK</option>
          </select>
        </div>

        {role === 'GURU_PJR' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Ruang Kelas Binaan *
            </label>
            <select
              name="ruang_kelas_id"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Pilih Ruang Kelas</option>
              {ruangList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama_ruang}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Username *
          </label>
          <input
            name="username"
            required
            placeholder="contoh: bk.farhan atau pjr.10a"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Password Awal *
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            defaultValue="skanada2026"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D6A37] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#09532A] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Buat Akun
        </button>
      </form>

      {/* Account List */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-2">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
          <Shield className="h-4 w-4 text-[#0D6A37]" />
          Daftar Akun Terdaftar ({users.length})
        </h3>

        <div className="divide-y divide-zinc-100">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-zinc-900">
                    {u.username}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      ROLE_BADGE[u.role]
                    }`}
                  >
                    {u.role}
                  </span>
                  {u.ruangNama && (
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                      {u.ruangNama}
                    </span>
                  )}
                  {!u.is_active && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{u.pegawaiNama}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetPw(u.id, u.username)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset PW
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(u.id, u.is_active)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    u.is_active
                      ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

