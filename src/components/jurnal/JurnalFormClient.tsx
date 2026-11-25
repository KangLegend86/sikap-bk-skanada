'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Edit2,
  Eye,
  Lock,
  LockOpen,
  MessageCircle,
  PenLine,
  Plus,
  Save,
  Search,
  Send,
  Shield,
  Tag,
  User,
  X,
} from 'lucide-react';
import {
  createJurnalAction,
  createKategoriAction,
  updateKategoriAction,
} from '@/actions/jurnal';
import { getMajorBadgeClass, getSapaan } from '@/lib/utils';

export interface StudentOption {
  id: string;
  noAbsen: number | null;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  ruangNama: string;
  jurusanKode: string;
  pjrNama: string | null;
  pjrGender: 'L' | 'P' | null;
  pjrWa: string | null;
}

export interface KategoriOption {
  id: string;
  nama_kategori: string;
}

export function JurnalFormClient({
  students,
  initialCategories,
  counselorName = 'Guru BK',
  liveDate = '-',
  defaultDate = '',
}: {
  students: StudentOption[];
  initialCategories: KategoriOption[];
  counselorName?: string;
  liveDate?: string;
  defaultDate?: string;
}) {
  const router = useRouter();

  // Tanggal konseling state
  const [tanggalKonseling, setTanggalKonseling] = useState(
    defaultDate || new Date().toISOString().slice(0, 10)
  );

  // Siswa state
  const [searchQuery, setSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const studentWrapRef = useRef<HTMLDivElement>(null);

  // Kategori state
  const [categories, setCategories] = useState<KategoriOption[]>(initialCategories);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const catWrapRef = useRef<HTMLDivElement>(null);

  // Modal kategori state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<KategoriOption | null>(null);
  const [catInputName, setCatInputName] = useState('');

  // Kronologi fields
  const [permasalahan, setPermasalahan] = useState('');
  const [kendala, setKendala] = useState('');
  const [solusi, setSolusi] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [catatan, setCatatan] = useState('');
  const [showCatatan, setShowCatatan] = useState(false);

  const autoResizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  // Status & Privasi PJR
  const [status, setStatus] = useState<'DALAM_PROSES' | 'SELESAI'>('DALAM_PROSES');
  const [keteranganStatus, setKeteranganStatus] = useState('');
  const [isSharedWithPjr, setIsSharedWithPjr] = useState(false);

  // UI & Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [waModalOpen, setWaModalOpen] = useState(false);

  useEffect(() => {
    if (!waModalOpen && !catModalOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWaModalOpen(false);
        setCatModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [waModalOpen, catModalOpen]);

  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (studentWrapRef.current && !studentWrapRef.current.contains(e.target as Node)) {
        setShowStudentDropdown(false);
      }
      if (catWrapRef.current && !catWrapRef.current.contains(e.target as Node)) {
        setShowCatDropdown(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  }

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.namaLengkap.toLowerCase().includes(q) ||
      s.ruangNama.toLowerCase().includes(q) ||
      s.jurusanKode.toLowerCase().includes(q) ||
      (s.noAbsen !== null && String(s.noAbsen).includes(q))
    );
  });

  function toggleCategory(id: string) {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSaveCategoryModal() {
    if (!catInputName.trim()) {
      showToast('Nama kategori tidak boleh kosong');
      return;
    }

    if (editingCat) {
      const res = await updateKategoriAction(editingCat.id, catInputName);
      if (res.error) {
        showToast(res.error);
        return;
      }
      if (res.kategori) {
        setCategories((prev) =>
          prev.map((c) => (c.id === res.kategori!.id ? res.kategori! : c))
        );
        showToast(`Kategori diperbarui: ${res.kategori.nama_kategori}`);
      }
    } else {
      const res = await createKategoriAction(catInputName);
      if (res.error) {
        showToast(res.error);
        return;
      }
      if (res.kategori) {
        setCategories((prev) =>
          prev.some((c) => c.id === res.kategori!.id) ? prev : [...prev, res.kategori!]
        );
        setSelectedCatIds((prev) =>
          prev.includes(res.kategori!.id) ? prev : [...prev, res.kategori!.id]
        );
        showToast(`Kategori ditambahkan: ${res.kategori.nama_kategori}`);
      }
    }
    setCatModalOpen(false);
    setCatInputName('');
    setEditingCat(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) {
      showToast('Silakan pilih identitas siswa terlebih dahulu!');
      return;
    }
    if (selectedCatIds.length === 0) {
      showToast('Silakan pilih minimal 1 kategori bimbingan!');
      setShowCatDropdown(true);
      return;
    }

    setIsSubmitting(true);
    const res = await createJurnalAction({
      siswaId: selectedStudent.id,
      tanggalKonseling,
      kategoriIds: selectedCatIds,
      permasalahan,
      kendala,
      solusi,
      tindakLanjut,
      catatan,
      status,
      keteranganStatus,
      isSharedWithPjr,
    });
    setIsSubmitting(false);

    if (res.error) {
      showToast(res.error);
      return;
    }

    showToast(
      isSharedWithPjr
        ? 'Jurnal disimpan & dibagikan ke akun Guru PJR'
        : 'Jurnal rahasia BK berhasil disimpan'
    );
    setTimeout(() => {
      router.push(res.jurnalId ? `/jurnal/${res.jurnalId}` : '/jurnal');
    }, 600);
  }

  function buildWhatsAppDraft(): string {
    const nama = selectedStudent?.namaLengkap ?? '[Nama Siswa]';
    const ruang = selectedStudent?.ruangNama ?? '[Ruang]';
    const jurusan = selectedStudent?.jurusanKode ?? '[Jurusan]';
    const pjrNama = selectedStudent?.pjrNama ?? '[Guru PJR]';
    const sapaan = getSapaan(selectedStudent?.pjrGender);

    const selectedCatNames = categories
      .filter((c) => selectedCatIds.includes(c.id))
      .map((c) => c.nama_kategori)
      .join(', ');

    const statusLabel =
      status === 'DALAM_PROSES' ? '[⏳] DALAM PROSES' : '[✓] SELESAI';

    const tanggalFormatted = tanggalKonseling
      ? new Date(`${tanggalKonseling}T12:00:00+07:00`).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      : '-';

    let msg = `*LAPORAN KOORDINASI BIMBINGAN KONSELING*\n`;
    msg += `*SMKS NU 2 KEDUNGPRING (SKANADA)*\n\n`;
    msg += `Yth. ${sapaan} *${pjrNama}* (PJR ${ruang}),\n`;
    msg += `Berikut ringkasan pembinaan siswa:\n\n`;
    msg += `• *Tanggal*: ${tanggalFormatted}\n`;
    msg += `• *Nama*: ${nama}\n`;
    msg += `• *Kelas / Jurusan*: ${ruang} (${jurusan})\n`;
    msg += `• *Kategori*: ${selectedCatNames || '-'}\n`;
    msg += `• *Permasalahan*: ${permasalahan.trim() || '-'}\n`;
    msg += `• *Tindak Lanjut*: ${tindakLanjut.trim() || '-'}\n`;
    msg += `• *Status*: ${statusLabel}\n`;
    if (keteranganStatus.trim()) {
      msg += `• *Keterangan Status*: ${keteranganStatus.trim()}\n`;
    }
    msg += `\nTerima kasih atas kerja samanya.\n_— Guru BK Skanada_`;
    return msg;
  }

  const selectedCatObjects = categories.filter((c) =>
    selectedCatIds.includes(c.id)
  );

  const nowTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedTanggalKonseling = (() => {
    if (!tanggalKonseling) return 'Pilih tanggal konseling';
    const [y, m, d] = tanggalKonseling.split('-').map(Number);
    if (!y || !m || !d) return tanggalKonseling;
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  })();

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        {/* Info Strip Petugas */}
        <div className="mb-3.5 flex items-center justify-between gap-2 rounded-xl border border-zinc-200/70 bg-white px-3.5 py-2.5 text-xs text-zinc-600 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="flex min-w-0 items-center gap-2 font-semibold text-zinc-800">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#047857]" />
            <span className="truncate">{counselorName}</span>
          </div>
          <span className="shrink-0 rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#047857]">
            {liveDate}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* TANGGAL KONSELING */}
          <section className="flex flex-col gap-2.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Tanggal Konseling
                </span>
              </div>
              <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
                Wajib
              </span>
            </div>
            <div className="relative flex w-full items-center justify-between rounded-[11px] border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-600 transition-all focus-within:border-[#047857] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#047857]/12">
              <span>{formattedTanggalKonseling}</span>
              <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                type="date"
                required
                aria-label="Tanggal Konseling"
                value={tanggalKonseling}
                onChange={(e) => setTanggalKonseling(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {
                    // Fallback ke picker bawaan browser
                  }
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </section>

          {/* 1. IDENTITAS SISWA */}
          <section className="flex flex-col gap-3.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Identitas Siswa
                </span>
              </div>
              <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
                Wajib Dipilih
              </span>
            </div>

            {!selectedStudent ? (
              <div ref={studentWrapRef} className="relative">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Ketik nama siswa, kelas atau absen"
                    className="w-full rounded-[11px] border border-zinc-200 bg-zinc-50 py-2.5 pr-3 pl-9 text-sm text-zinc-900 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
                  />
                </div>

                {showStudentDropdown && (
                  <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-40 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl">
                    {filteredStudents.length === 0 ? (
                      <div className="px-3.5 py-3 text-xs text-zinc-500">
                        Siswa tidak ditemukan
                      </div>
                    ) : (
                      filteredStudents.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setShowStudentDropdown(false);
                          }}
                          className="flex w-full cursor-pointer items-center justify-between gap-2 border-b border-zinc-100 px-3.5 py-2.5 text-left transition-colors last:border-none hover:bg-zinc-50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-zinc-900">
                              {s.namaLengkap}
                            </div>
                            <div className="truncate text-[11.5px] font-medium text-zinc-500">
                              {s.noAbsen ? `Absen ${String(s.noAbsen).padStart(2, '0')} • ` : ''}
                              {s.ruangNama}{' '}
                              <span className="text-zinc-300">|</span>{' '}
                              <span className="font-semibold text-[#047857]">
                                {s.jurusanKode}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-bold ${s.jenisKelamin === 'L'
                              ? 'border-sky-200/80 bg-sky-50 text-sky-700'
                              : 'border-rose-200/80 bg-rose-50 text-rose-600'
                              }`}
                          >
                            {s.jenisKelamin}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-[14px] bg-linear-to-br from-[hsl(240_6%_20%)] to-[hsl(240_4%_30%)] p-3.5 text-white">
                <div className="flex items-start justify-between gap-2 pl-1">
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px] font-bold">
                      {selectedStudent.namaLengkap}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] font-medium text-zinc-200">
                      <span className="font-mono text-[11px] text-zinc-300">
                        Absen {selectedStudent.noAbsen ?? '-'}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span>{selectedStudent.ruangNama}</span>
                      <span className="text-zinc-500">•</span>
                      <span
                        className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${selectedStudent.jenisKelamin === 'L'
                          ? 'border-sky-400/30 bg-sky-500/15 text-sky-300'
                          : 'border-rose-400/30 bg-rose-500/15 text-rose-300'
                          }`}
                      >
                        {selectedStudent.jenisKelamin}
                      </span>
                      <span className="text-zinc-500">|</span>
                      <span
                        className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${getMajorBadgeClass(
                          selectedStudent.jurusanKode
                        )}`}
                      >
                        {selectedStudent.jurusanKode}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setSearchQuery('');
                    }}
                    className="shrink-0 cursor-pointer rounded-[7px] border border-white/15 bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    Ganti
                  </button>
                </div>

                <div className="flex items-center gap-2.5 rounded-[10px] bg-white/6 px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-zinc-200">
                    <User className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="mb-0.5 text-[10px] tracking-wider text-zinc-300 uppercase">
                      Guru PJR
                    </div>
                    <div className="truncate text-[13px] font-semibold text-zinc-100">
                      {selectedStudent.pjrNama || 'Belum ditentukan'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2. KATEGORI BIMBINGAN */}
          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                  <Tag className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Kategori Bimbingan
                </span>
              </div>
              <span className="text-[10px] font-medium text-zinc-400">
                Bisa pilih lebih dari 1
              </span>
            </div>

            {selectedCatObjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedCatObjects.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-xs font-semibold text-[#047857]"
                  >
                    <span>{c.nama_kategori}</span>
                    <button
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-[#047857]/14 text-[#047857] transition-colors hover:bg-[#047857] hover:text-white"
                      title="Hapus pilihan"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div ref={catWrapRef} className="relative">
              <button
                type="button"
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="flex w-full cursor-pointer items-center justify-between rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100/70"
              >
                <span className="flex items-center gap-2.5">
                  <Tag className="h-4 w-4 text-zinc-400" />
                  <span
                    className={
                      selectedCatObjects.length > 0
                        ? 'text-zinc-700'
                        : 'text-zinc-400'
                    }
                  >
                    {selectedCatObjects.length > 0
                      ? 'Tambah pilihan kategori lain...'
                      : 'Pilih atau kelola kategori...'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 transition-transform ${showCatDropdown ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {showCatDropdown && (
                <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-40 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl">
                  {categories.map((c) => {
                    const isChecked = selectedCatIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
                        className="flex cursor-pointer items-center justify-between border-b border-zinc-100 px-3.5 py-2.5 transition-colors hover:bg-zinc-50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border-[1.5px] text-[11px] font-bold transition-colors ${isChecked
                              ? 'border-[#047857] bg-[#047857] text-white'
                              : 'border-zinc-300 bg-white text-transparent'
                              }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span
                            className={`text-[13px] font-semibold ${isChecked ? 'text-[#047857]' : 'text-zinc-900'
                              }`}
                          >
                            {c.nama_kategori}
                          </span>
                        </div>
                        <button
                          type="button"
                          title="Edit Kategori"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCat(c);
                            setCatInputName(c.nama_kategori);
                            setShowCatDropdown(false);
                            setCatModalOpen(true);
                          }}
                          className="flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-[7px] border border-zinc-200 bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setCatInputName('');
                      setShowCatDropdown(false);
                      setCatModalOpen(true);
                    }}
                    className="sticky bottom-0 flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-[#A7F3D0] bg-[#ECFDF5] px-3.5 py-2.5 text-xs font-semibold text-[#047857] hover:bg-[#D1FAE5]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Kategori</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 3. KRONOLOGI PENANGANAN */}
          <section className="flex flex-col gap-3.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                  <PenLine className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Catatan Konseling
                </span>
              </div>
            </div>

            {/* Permasalahan */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                  1
                </span>
                <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                  Permasalahan<span className="ml-0.5 text-rose-600">*</span>
                </span>
              </label>
              <textarea
                required
                value={permasalahan}
                onChange={(e) => {
                  setPermasalahan(e.target.value);
                  autoResizeTextarea(e.currentTarget);
                }}
                rows={3}
                placeholder="Fakta kronologi kejadian atau pelanggaran yang terjadi..."
                className="min-h-24 w-full resize-none overflow-hidden rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
              />
            </div>

            {/* Kendala */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                  2
                </span>
                <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                  Kendala
                </span>
              </label>
              <textarea
                value={kendala}
                onChange={(e) => {
                  setKendala(e.target.value);
                  autoResizeTextarea(e.currentTarget);
                }}
                rows={2}
                placeholder="Faktor pemicu dari siswa, keluarga, atau lingkungan..."
                className="min-h-19 w-full resize-none overflow-hidden rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
              />
            </div>

            {/* Solusi */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                  3
                </span>
                <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                  Solusi
                </span>
              </label>
              <textarea
                value={solusi}
                onChange={(e) => {
                  setSolusi(e.target.value);
                  autoResizeTextarea(e.currentTarget);
                }}
                rows={2}
                placeholder="Kesepakatan / komitmen bersama siswa di ruang BK..."
                className="min-h-19 w-full resize-none overflow-hidden rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
              />
            </div>

            {/* Tindak Lanjut */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                  4
                </span>
                <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                  Tindak Lanjut<span className="ml-0.5 text-rose-600">*</span>
                </span>
              </label>
              <textarea
                required
                value={tindakLanjut}
                onChange={(e) => {
                  setTindakLanjut(e.target.value);
                  autoResizeTextarea(e.currentTarget);
                }}
                rows={2}
                placeholder="Aksi koordinasi keluar (PJR, Orang Tua, Guru Mapel)..."
                className="min-h-19 w-full resize-none overflow-hidden rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
              />
            </div>

            {/* Catatan Tambahan (Collapsible / Opsional) */}
            {showCatatan || catatan.trim().length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                      5
                    </span>
                    <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                      Catatan Tambahan
                    </span>
                  </label>
                  {catatan.trim().length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCatatan(false)}
                      className="cursor-pointer text-[11px] font-medium text-zinc-400 hover:text-zinc-700"
                    >
                      Sembunyikan
                    </button>
                  )}
                </div>
                <textarea
                  value={catatan}
                  onChange={(e) => {
                    setCatatan(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  rows={2}
                  placeholder="Memo tambahan konselor / observasi sikap siswa..."
                  className="min-h-19 w-full resize-none overflow-hidden rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCatatan(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#047857]/45 bg-[#ECFDF5]/40 px-3 py-2.5 text-xs font-semibold text-[#047857] transition-all hover:border-[#047857] hover:bg-[#ECFDF5] active:scale-[0.985]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Catatan Tambahan (Opsional)</span>
              </button>
            )}
          </section>

          {/* 4. STATUS PENANGANAN */}
          <section className="flex flex-col gap-3.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                Status Penanganan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-[13px] border border-zinc-200 bg-zinc-100 p-1.25">
              <button
                type="button"
                onClick={() => setStatus('DALAM_PROSES')}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border px-2 py-2.5 text-xs font-semibold whitespace-nowrap transition-all select-none ${status === 'DALAM_PROSES'
                  ? 'border-zinc-200 bg-white text-amber-700 shadow-xs'
                  : 'border-transparent bg-transparent text-zinc-600 hover:text-zinc-900'
                  }`}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>Dalam Proses</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('SELESAI')}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border px-2 py-2.5 text-xs font-semibold whitespace-nowrap transition-all select-none ${status === 'SELESAI'
                  ? 'border-zinc-200 bg-white text-[#047857] shadow-xs'
                  : 'border-transparent bg-transparent text-zinc-600 hover:text-zinc-900'
                  }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Selesai</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${status === 'DALAM_PROSES'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-[#ECFDF5] text-[#047857]'
                    }`}
                >
                  {status === 'DALAM_PROSES' ? (
                    <Clock className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                </span>
                <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                  Keterangan
                </span>
              </label>
              <textarea
                value={keteranganStatus}
                onChange={(e) => {
                  setKeteranganStatus(e.target.value);
                  autoResizeTextarea(e.currentTarget);
                }}
                rows={2}
                placeholder={
                  status === 'DALAM_PROSES'
                    ? 'Tuliskan alasan masih dalam proses atau kendala...'
                    : 'Tuliskan ringkasan penutupan kasus atau hasil akhir pembinaan...'
                }
                className="min-h-17 w-full resize-none overflow-hidden rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
              />
            </div>
          </section>

          {/* 5. AKSES & PRIVASI PJR */}
          <section className="flex flex-col gap-3.5 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                  <Shield className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Akses & Privasi PJR
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isSharedWithPjr
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : 'text-zinc-400'
                  }`}
              >
                {isSharedWithPjr ? 'Terbuka ke PJR' : 'Rahasia BK'}
              </span>
            </div>

            <div
              onClick={() => setIsSharedWithPjr(!isSharedWithPjr)}
              className={`flex cursor-pointer flex-col gap-2.5 rounded-[13px] border px-3.5 py-3 transition-all select-none ${isSharedWithPjr
                ? 'border-[#A7F3D0] bg-[#ECFDF5]'
                : 'border-zinc-200 bg-zinc-50'
                }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[10px] border transition-colors ${isSharedWithPjr
                      ? 'border-[#047857] bg-[#047857] text-white'
                      : 'border-rose-200 bg-rose-50 text-rose-600'
                      }`}
                  >
                    {isSharedWithPjr ? (
                      <LockOpen className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div
                      className={`text-[13px] font-bold leading-tight ${isSharedWithPjr ? 'text-[#047857]' : 'text-zinc-900'
                        }`}
                    >
                      {isSharedWithPjr
                        ? 'Bagikan ke Guru PJR'
                        : 'Rahasia Internal BK'}
                    </div>
                    <div className="text-[11px] font-medium text-zinc-500">
                      {isSharedWithPjr
                        ? 'Tampil di akun PJR ruang siswa'
                        : 'Terkunci dari akun Guru PJR'}
                    </div>
                  </div>
                </div>

                {/* Toggle Switch Modern */}
                <div
                  aria-hidden="true"
                  className={`relative h-6.5 w-11.5 shrink-0 rounded-full p-0.75 transition-colors ${isSharedWithPjr ? 'bg-[#047857]' : 'bg-zinc-300'
                    }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${isSharedWithPjr ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </div>
              </div>

              <div
                className={`border-t border-dashed pt-2 text-xs leading-relaxed ${isSharedWithPjr
                  ? 'border-[#A7F3D0] text-emerald-800'
                  : 'border-zinc-200 text-zinc-600'
                  }`}
              >
                {isSharedWithPjr ? (
                  <>
                    Tampil di akun <strong>Guru PJR &amp; tim Guru BK</strong>.
                  </>
                ) : (
                  <>
                    Hanya tampil di akun <strong>tim Guru BK &amp; Admin</strong>.
                  </>
                )}
              </div>
            </div>
          </section>

          {/* TOMBOL AKSI */}
          <div className="mt-1 flex flex-col gap-2.5 pb-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(4,120,87,0.28)] transition-all hover:bg-emerald-800 active:scale-[0.985] disabled:opacity-60"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal BK'}</span>
            </button>

            <button
              type="button"
              onClick={() => setWaModalOpen(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-700/50 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-[0_4px_14px_rgba(4,120,87,0.16)] transition-all hover:border-emerald-700/75 hover:bg-zinc-50 active:scale-[0.985]"
            >
              <MessageCircle className="h-4.25 w-4.25 text-emerald-700" />
              <span>Pratinjau WhatsApp PJR</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal Tambah / Edit Kategori */}
      {catModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-zinc-900/55 p-4 backdrop-blur-[3px]">
          <div className="flex w-full max-w-105 flex-col gap-3.5 rounded-[18px] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-zinc-900">
                {editingCat ? 'Edit Nama Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Batal
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-zinc-800">
                Nama Kategori
              </label>
              <input
                type="text"
                autoFocus
                value={catInputName}
                onChange={(e) => setCatInputName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveCategoryModal();
                  }
                }}
                placeholder="Contoh: Absensi, Keluarga, Kesehatan..."
                className="w-full rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveCategoryModal}
              className="w-full cursor-pointer rounded-[13px] bg-[#047857] py-2.5 text-sm font-bold text-white hover:bg-[#065F46]"
            >
              Simpan Kategori
            </button>
          </div>
        </div>
      )}

      {/* Modal Pratinjau WhatsApp */}
      {waModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setWaModalOpen(false)}
            className="fixed inset-0 z-9999 flex touch-none items-center justify-center overscroll-none bg-zinc-900/55 p-4 backdrop-blur-[3px]"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Pratinjau WhatsApp PJR"
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85dvh] w-full max-w-105 touch-pan-y flex-col gap-3 overscroll-contain rounded-[18px] bg-white p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#008069] text-white">
                    <MessageCircle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm leading-tight font-bold text-zinc-900">
                      Pratinjau WhatsApp PJR
                    </h3>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {selectedStudent
                        ? `Kepada: ${selectedStudent.pjrNama || 'Guru PJR'} (PJR ${selectedStudent.ruangNama
                        })`
                        : 'Tujuan: Guru PJR (Siswa belum dipilih)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWaModalOpen(false)}
                  className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Tutup
                </button>
              </div>

              <div
                className={`flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[11px] font-semibold ${isSharedWithPjr
                  ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                  : 'border-zinc-200 bg-zinc-100 text-zinc-700'
                  }`}
              >
                {isSharedWithPjr ? (
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {isSharedWithPjr
                    ? 'Akses PJR Aktif • Jurnal juga tampil di akun Guru PJR'
                    : 'Mode Rahasia BK • Hanya dikirim via WA (tidak tampil di akun PJR)'}
                </span>
              </div>

              {/* Authentic WA Bubble Background */}
              <div
                className="max-h-72 overflow-y-auto overscroll-contain rounded-[14px] border border-zinc-200 p-3.5"
                style={{
                  backgroundColor: '#EFEAE2',
                  backgroundImage:
                    'radial-gradient(#D5CEC2 0.75px, transparent 0.75px)',
                  backgroundSize: '14px 14px',
                }}
              >
                <div className="relative rounded-xl rounded-tl-xs bg-white px-3.5 pt-2.5 pb-5 text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#111B21] shadow-xs">
                  {buildWhatsAppDraft()}
                  <div className="absolute right-2.5 bottom-1 flex items-center gap-1 text-[10px] text-[#667781]">
                    <span>{nowTime}</span>
                    <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(buildWhatsAppDraft());
                    showToast('Pesan berhasil disalin');
                  }}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Salin Pesan
                </button>
                <a
                  href={`https://wa.me/${selectedStudent?.pjrWa || ''}?text=${encodeURIComponent(
                    buildWhatsAppDraft()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#008069] py-2.5 text-xs font-semibold text-white hover:bg-[#006A57]"
                >
                  <Send className="h-3.5 w-3.5" />
                  Kirim via WA
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 z-100 -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-white shadow-xl lg:bottom-6">
          {toastMsg}
        </div>
      )}
    </>
  );
}
