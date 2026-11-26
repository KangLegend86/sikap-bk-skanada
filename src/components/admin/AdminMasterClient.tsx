'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Loader2,
  Plus,
  Tag,
  UserPlus,
  Users,
} from 'lucide-react';
import { createPegawaiAction, createSiswaAction } from '@/actions/admin';
import { createKategoriAction } from '@/actions/jurnal';
import { formatNamaGuru, getMajorBadgeClass } from '@/lib/utils';

interface JurusanItem {
  id: string;
  kode: string;
  nama_lengkap: string;
}

interface RuangItem {
  id: string;
  nama_ruang: string;
  tingkat: string;
}

interface SiswaItem {
  id: string;
  no_absen: number | null;
  nama_lengkap: string;
  jenis_kelamin: 'L' | 'P';
  jurusanKode: string;
  ruangNama: string;
}

interface PegawaiItem {
  id: string;
  nip_nik: string | null;
  nama_lengkap: string;
  jenis_kelamin: 'L' | 'P';
  no_whatsapp: string | null;
}

interface KategoriItem {
  id: string;
  nama_kategori: string;
}

export function AdminMasterClient({
  jurusanList,
  ruangList,
  siswaList,
  pegawaiList,
  kategoriList,
}: {
  jurusanList: JurusanItem[];
  ruangList: RuangItem[];
  siswaList: SiswaItem[];
  pegawaiList: PegawaiItem[];
  kategoriList: KategoriItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'siswa' | 'pegawai' | 'kategori' | 'kelas'>(
    'siswa'
  );
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);
  const [newKat, setNewKat] = useState('');

  async function handleAddSiswa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    const form = e.currentTarget;
    const res = await createSiswaAction(new FormData(form));
    setLoading(false);
    if (res?.error) {
      setFeedback({ type: 'err', msg: res.error });
    } else if (res?.success) {
      setFeedback({ type: 'ok', msg: res.success });
      form.reset();
      router.refresh();
    }
  }

  async function handleAddPegawai(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    const form = e.currentTarget;
    const res = await createPegawaiAction(new FormData(form));
    setLoading(false);
    if (res?.error) {
      setFeedback({ type: 'err', msg: res.error });
    } else if (res?.success) {
      setFeedback({ type: 'ok', msg: res.success });
      form.reset();
      router.refresh();
    }
  }

  async function handleAddKategori(e: React.FormEvent) {
    e.preventDefault();
    if (!newKat.trim()) return;
    setLoading(true);
    setFeedback(null);
    const res = await createKategoriAction(newKat.trim());
    setLoading(false);
    if (res?.error) {
      setFeedback({ type: 'err', msg: res.error });
    } else {
      setFeedback({ type: 'ok', msg: 'Kategori baru berhasil ditambahkan.' });
      setNewKat('');
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'siswa', label: `Siswa (${siswaList.length})` },
          { key: 'pegawai', label: `Pegawai / GTK (${pegawaiList.length})` },
          { key: 'kategori', label: `Kategori BK (${kategoriList.length})` },
          { key: 'kelas', label: 'Ruang & Jurusan' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key as typeof tab);
              setFeedback(null);
            }}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              tab === t.key
                ? 'bg-[#047857] text-white'
                : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-medium ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {feedback.msg}
        </div>
      )}

      {/* TAB: SISWA */}
      {tab === 'siswa' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleAddSiswa}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-1"
          >
            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <UserPlus className="h-4 w-4 text-[#047857]" />
              Tambah Siswa Baru
            </h3>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Nama Lengkap *
              </label>
              <input
                name="nama_lengkap"
                required
                placeholder="Nama lengkap siswa"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  No. Absen
                </label>
                <input
                  name="no_absen"
                  type="number"
                  min={1}
                  placeholder="Opsional"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Jenis Kelamin *
                </label>
                <select
                  name="jenis_kelamin"
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Ruang Kelas *
                </label>
                <select
                  name="ruang_kelas_id"
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Pilih Ruang</option>
                  {ruangList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nama_ruang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Jurusan *
                </label>
                <select
                  name="jurusan_id"
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Pilih Jurusan</option>
                  {jurusanList.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.kode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Nama Wali / Orang Tua (Opsional)
              </label>
              <input
                name="nama_wali"
                placeholder="Nama orang tua / wali"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                No. HP / WA Ortu (Opsional)
              </label>
              <input
                name="no_hp_ortu"
                placeholder="08xxxxxxxxxx"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#047857] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Simpan Siswa
            </button>
          </form>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-2">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
              <Users className="h-4 w-4 text-[#047857]" />
              Daftar Siswa Aktif ({siswaList.length})
            </h3>
            <div className="max-h-[460px] divide-y divide-zinc-100 overflow-y-auto">
              {siswaList.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {s.no_absen ? `${s.no_absen}. ` : ''}
                      {s.nama_lengkap}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {s.ruangNama}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                        s.jurusanKode
                      )}`}
                    >
                      {s.jurusanKode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PEGAWAI */}
      {tab === 'pegawai' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleAddPegawai}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-1"
          >
            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <UserPlus className="h-4 w-4 text-[#047857]" />
              Tambah Pegawai / GTK
            </h3>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Nama Lengkap &amp; Gelar *
              </label>
              <input
                name="nama_lengkap"
                required
                placeholder="Contoh: Zumrotus Sa'adah, S.Pd."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Jenis Kelamin *
              </label>
              <select
                name="jenis_kelamin"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                <option value="L">Laki-laki (Bapak)</option>
                <option value="P">Perempuan (Ibu)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                NIP / NIK (Opsional)
              </label>
              <input
                name="nip_nik"
                placeholder="Nomor Induk Pegawai"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                No. WhatsApp
              </label>
              <input
                name="no_whatsapp"
                placeholder="08xxxxxxxxxx"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#047857] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Simpan Pegawai
            </button>
          </form>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-2">
            <h3 className="mb-3 text-sm font-bold text-zinc-900">
              Daftar Pegawai / GTK ({pegawaiList.length})
            </h3>
            <div className="max-h-[460px] divide-y divide-zinc-100 overflow-y-auto">
              {pegawaiList.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {formatNamaGuru(p.nama_lengkap)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {p.jenis_kelamin === 'L' ? 'Bapak (L)' : 'Ibu (P)'}
                      {p.nip_nik ? ` • NIP/NIK: ${p.nip_nik}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {p.no_whatsapp ?? 'No WA belum diisi'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: KATEGORI */}
      {tab === 'kategori' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <Tag className="h-4 w-4 text-[#047857]" />
            Kategori Permasalahan BK
          </h3>
          <form onSubmit={handleAddKategori} className="mt-3 flex gap-2">
            <input
              value={newKat}
              onChange={(e) => setNewKat(e.target.value)}
              placeholder="Tambah kategori baru (contoh: Perundungan / Bullying)..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !newKat.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#047857] px-4 py-2 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {kategoriList.map((k) => (
              <span
                key={k.id}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800"
              >
                #{k.nama_kategori}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TAB: RUANG & JURUSAN */}
      {tab === 'kelas' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-bold text-zinc-900">
              Kompetensi Keahlian / Jurusan ({jurusanList.length})
            </h3>
            <div className="space-y-2">
              {jurusanList.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs"
                >
                  <span
                    className={`rounded px-2 py-0.5 font-bold ${getMajorBadgeClass(
                      j.kode
                    )}`}
                  >
                    {j.kode}
                  </span>
                  <span className="font-medium text-zinc-700">
                    {j.nama_lengkap}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-bold text-zinc-900">
              Ruang Kelas Heterogen ({ruangList.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {ruangList.map((r) => (
                <span
                  key={r.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800"
                >
                  {r.nama_ruang}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

