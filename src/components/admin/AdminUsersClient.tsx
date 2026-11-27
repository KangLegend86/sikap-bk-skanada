'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Edit3,
  KeyRound,
  Loader2,
  Plus,
  Power,
  Search,
  Shield,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import {
  createUserAccountAction,
  generateMissingGuruAccountsAction,
  resetUserPasswordAction,
  toggleUserActiveAction,
  updateUserRoleRuangAction,
} from '@/actions/admin';
import { formatNamaGuru } from '@/lib/utils';

type UserRole = 'ADMIN' | 'GURU_BK' | 'GURU_PJR' | 'GURU';

interface PegawaiOption {
  id: string;
  nama_lengkap: string;
}

interface RuangOption {
  id: string;
  nama_ruang: string;
}

interface UserItem {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  pegawaiNama: string;
  ruangKelasId: string | null;
  ruangNama: string | null;
}

const ROLE_BADGE: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  GURU_BK: 'bg-emerald-100 text-emerald-800',
  GURU_PJR: 'bg-blue-100 text-blue-800',
  GURU: 'bg-amber-100 text-amber-800',
};

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  GURU_BK: 'Guru BK',
  GURU_PJR: 'Guru PJR',
  GURU: 'Guru',
};

export function AdminUsersClient({
  pegawaiList,
  ruangList,
  users,
  missingGuruCount,
}: {
  pegawaiList: PegawaiOption[];
  ruangList: RuangOption[];
  users: UserItem[];
  missingGuruCount: number;
}) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('GURU');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('GURU');
  const [editRuangId, setEditRuangId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);
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

  async function handleGenerateMissing() {
    setGenerating(true);
    setFeedback(null);
    const res = await generateMissingGuruAccountsAction();
    setGenerating(false);
    if (res?.error) {
      setFeedback({ type: 'err', msg: res.error });
    } else if (res?.success) {
      setFeedback({ type: 'ok', msg: res.success });
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

  function openEditModal(u: UserItem) {
    setEditingUser(u);
    setEditRole(u.role);
    setEditRuangId(u.ruangKelasId ?? '');
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    setFeedback(null);
    const res = await updateUserRoleRuangAction(
      editingUser.id,
      editRole,
      editRole === 'GURU_PJR' || editRole === 'GURU_BK'
        ? editRuangId || null
        : null
    );
    setSavingEdit(false);
    if (res?.error) {
      setFeedback({ type: 'err', msg: res.error });
    } else if (res?.success) {
      setFeedback({ type: 'ok', msg: res.success });
      setEditingUser(null);
      router.refresh();
    }
  }

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.pegawaiNama.toLowerCase().includes(q) ||
      (u.ruangNama?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-5">
      {missingGuruCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div>
            <p className="text-sm font-bold text-emerald-950">
              Ada {missingGuruCount} pegawai yang belum memiliki akun login
            </p>
            <p className="text-xs text-emerald-800/80">
              Buat akun role Guru secara otomatis dengan 1 klik (password default: skanada2026).
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateMissing}
            disabled={generating}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#047857] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate Akun Guru
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create Form */}
        <form
          onSubmit={handleCreateUser}
          className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-1 h-fit"
        >
          <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <UserPlus className="h-4 w-4 text-[#047857]" />
            Buat Akun Login Baru
          </h3>
          <p className="text-xs text-zinc-500">
            Gunakan 1 akun pribadi per guru. Guru BK yang merangkap PJR cukup diberi 1 akun Guru BK lalu pilih Ruang Kelas Binaan.
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
                  {formatNamaGuru(p.nama_lengkap)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Peran Utama (Role) *
            </label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="GURU">Guru (Jurnal Sikap)</option>
              <option value="GURU_PJR">Guru PJR (Wali Kelas)</option>
              <option value="GURU_BK">Guru BK</option>
              <option value="ADMIN">Admin / Koordinator BK</option>
            </select>
          </div>

          {(role === 'GURU_PJR' || role === 'GURU_BK') && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Ruang Kelas Binaan {role === 'GURU_PJR' ? '*' : '(Opsional jika merangkap PJR)'}
              </label>
              <select
                name="ruang_kelas_id"
                required={role === 'GURU_PJR'}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">
                  {role === 'GURU_BK' ? 'Tidak merangkap PJR' : 'Pilih Ruang Kelas'}
                </option>
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
              placeholder="contoh: anik_khoiriyah"
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
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#047857] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-60"
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <Shield className="h-4 w-4 text-[#047857]" />
              Daftar Akun Terdaftar ({filteredUsers.length} / {users.length})
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama / username..."
                  className="w-44 rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs focus:border-[#047857] focus:bg-white focus:outline-none"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'ALL' | UserRole)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700"
              >
                <option value="ALL">Semua Role</option>
                <option value="GURU_BK">Guru BK</option>
                <option value="GURU_PJR">Guru PJR</option>
                <option value="GURU">Guru</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {filteredUsers.map((u) => (
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
                      {ROLE_LABEL[u.role]}
                    </span>
                    {u.ruangNama && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/70">
                        PJR {u.ruangNama}
                      </span>
                    )}
                    {!u.is_active && (
                      <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        NONAKTIF
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{u.pegawaiNama}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    title="Ubah Peran / Kelas PJR"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Peran/Kelas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetPw(u.id, u.username)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    title="Reset Password"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset PW
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(u.id, u.is_active)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      u.is_active
                        ? 'border-red-200 text-red-700 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
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

      {/* Modal Edit Peran & Ruang Kelas (Kenaikan Kelas / Rangkap PJR) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900">
                Ubah Peran & Kelas — {editingUser.username}
              </h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-zinc-500">{editingUser.pegawaiNama}</p>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Peran Utama
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="GURU">Guru (Jurnal Sikap)</option>
                  <option value="GURU_PJR">Guru PJR (Wali Kelas)</option>
                  <option value="GURU_BK">Guru BK</option>
                  <option value="ADMIN">Admin / Koordinator BK</option>
                </select>
              </div>

              {(editRole === 'GURU_PJR' || editRole === 'GURU_BK') && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">
                    Ruang Kelas Binaan (PJR){' '}
                    {editRole === 'GURU_PJR' ? '*' : '(Opsional jika merangkap PJR)'}
                  </label>
                  <select
                    value={editRuangId}
                    onChange={(e) => setEditRuangId(e.target.value)}
                    required={editRole === 'GURU_PJR'}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">
                      {editRole === 'GURU_BK'
                        ? 'Tidak merangkap PJR'
                        : 'Pilih Ruang Kelas'}
                    </option>
                    {ruangList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nama_ruang}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#047857] px-4 py-2 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-60"
                >
                  {savingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
