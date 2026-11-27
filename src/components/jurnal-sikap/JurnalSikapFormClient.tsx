'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Home,
  Loader2,
  Lock,
  PenLine,
  Plus,
  Save,
  Search,
  Tag,
  User,
  X,
} from 'lucide-react';
import type { JenisJurnalSikap } from '@prisma/client';
import {
  createJurnalSikapAction,
  updateJurnalSikapAction,
} from '@/actions/jurnal-sikap';
import { compressImageFile } from '@/lib/image-compress';
import {
  getMajorBadgeClass,
  getMajorTextClass,
  scrollDropdownIntoView,
} from '@/lib/utils';
import { SaveSuccessModal } from '@/components/ui/SaveSuccessModal';
import { triggerGlobalToast } from '@/components/ui/GlobalToast';

export interface SikapStudentOption {
  id: string;
  noAbsen: number | null;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  ruangNama: string;
  jurusanKode: string;
  pjrNama: string | null;
}

export interface KonselorOption {
  id: string;
  namaLengkap: string;
}

export interface InitialJurnalSikapData {
  id: string;
  tanggal: string;
  siswaId: string;
  jenis: JenisJurnalSikap;
  konselorId: string;
  prestasiDalam: string;
  sikapPerilaku: string;
  permasalahan: string;
  kendala: string;
  solusi: string;
  catatan: string;
  tindakLanjut: string;
  existingPhotos: { driveId: string; fileName: string | null }[];
}

const MAX_PHOTOS = 5;

interface NewPhotoDraft {
  id: string;
  base64Data: string;
  mimeType: string;
  previewUrl: string;
  sizeKb: number;
}

const JENIS_OPTIONS: {
  value: JenisJurnalSikap;
  label: string;
  shortDesc: string;
  Icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  iconBg: string;
}[] = [
  {
    value: 'BERPRESTASI',
    label: 'Berprestasi',
    shortDesc: 'Prestasi & sikap positif',
    Icon: Award,
    activeClass:
      'border-[#047857] bg-[#ECFDF5] text-[#17331E] ring-2 ring-[#047857]/15',
    iconBg: 'bg-[#047857] text-white',
  },
  {
    value: 'BERMASALAH',
    label: 'Bermasalah',
    shortDesc: 'Butuh bimbingan',
    Icon: AlertTriangle,
    activeClass:
      'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/15',
    iconBg: 'bg-amber-500 text-white',
  },
  {
    value: 'HOME_VISIT',
    label: 'Home Visit',
    shortDesc: 'Kunjungan rumah + foto',
    Icon: Home,
    activeClass:
      'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/15',
    iconBg: 'bg-blue-600 text-white',
  },
];

const CARD_CLASS =
  'flex flex-col gap-3 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]';

const TEXTAREA_CLASS =
  'min-h-20 w-full resize-none overflow-hidden rounded-[11px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12';

function autoResizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function JurnalSikapFormClient({
  students,
  konselorList,
  defaultKonselorId,
  canChangeKonselor = false,
  counselorName = 'Guru Skanada',
  liveDate = '-',
  defaultDate,
  gdriveConfigured,
  initialData,
  redirectAfterSave = '/guru',
}: {
  students: SikapStudentOption[];
  konselorList: KonselorOption[];
  defaultKonselorId: string;
  canChangeKonselor?: boolean;
  counselorName?: string;
  liveDate?: string;
  defaultDate: string;
  gdriveConfigured: boolean;
  initialData?: InitialJurnalSikapData;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialData);

  const [tanggal, setTanggal] = useState(initialData?.tanggal || defaultDate);
  const [jenis, setJenis] = useState<JenisJurnalSikap>(
    initialData?.jenis || 'BERPRESTASI'
  );

  // Siswa picker
  const [selectedStudent, setSelectedStudent] =
    useState<SikapStudentOption | null>(
      initialData
        ? students.find((s) => s.id === initialData.siswaId) ?? null
        : null
    );
  const [studentQuery, setStudentQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentWrapRef = useRef<HTMLDivElement>(null);

  // Konselor picker
  const [konselorId, setKonselorId] = useState(
    initialData?.konselorId || defaultKonselorId
  );
  const [konselorQuery, setKonselorQuery] = useState('');
  const [showKonselorDropdown, setShowKonselorDropdown] = useState(false);
  const konselorWrapRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [prestasiDalam, setPrestasiDalam] = useState(
    initialData?.prestasiDalam || ''
  );
  const [sikapPerilaku, setSikapPerilaku] = useState(
    initialData?.sikapPerilaku || ''
  );
  const [permasalahan, setPermasalahan] = useState(
    initialData?.permasalahan || ''
  );
  const [kendala, setKendala] = useState(initialData?.kendala || '');
  const [solusi, setSolusi] = useState(initialData?.solusi || '');
  const [catatan, setCatatan] = useState(initialData?.catatan || '');
  const [showCatatan, setShowCatatan] = useState(
    Boolean(initialData?.catatan?.trim())
  );
  const [tindakLanjut, setTindakLanjut] = useState(
    initialData?.tindakLanjut || ''
  );

  // Home Visit multi-photo state (maks 5 foto)
  const [existingPhotos, setExistingPhotos] = useState<
    { driveId: string; fileName: string | null }[]
  >(initialData?.existingPhotos ?? []);
  const [removedDriveIds, setRemovedDriveIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhotoDraft[]>([]);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    id: string;
    studentName: string;
    metaText: string;
    badgeText?: string;
  } | null>(null);

  useEffect(() => {
    function handleOutside(e: PointerEvent) {
      if (
        studentWrapRef.current &&
        !studentWrapRef.current.contains(e.target as Node)
      ) {
        setShowStudentDropdown(false);
      }
      if (
        konselorWrapRef.current &&
        !konselorWrapRef.current.contains(e.target as Node)
      ) {
        setShowKonselorDropdown(false);
      }
    }
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  useEffect(() => {
    if (showStudentDropdown) {
      scrollDropdownIntoView(studentWrapRef.current, 140);
    }
  }, [showStudentDropdown]);

  useEffect(() => {
    if (showKonselorDropdown) {
      scrollDropdownIntoView(konselorWrapRef.current, 60);
    }
  }, [showKonselorDropdown]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 30);
    return students
      .filter(
        (s) =>
          s.namaLengkap.toLowerCase().includes(q) ||
          s.ruangNama.toLowerCase().includes(q) ||
          s.jurusanKode.toLowerCase().includes(q) ||
          (s.noAbsen ? String(s.noAbsen).includes(q) : false)
      )
      .slice(0, 30);
  }, [students, studentQuery]);

  const filteredKonselor = useMemo(() => {
    const q = konselorQuery.trim().toLowerCase();
    if (!q) return konselorList;
    return konselorList.filter((k) =>
      k.namaLengkap.toLowerCase().includes(q)
    );
  }, [konselorList, konselorQuery]);

  const selectedKonselor = useMemo(
    () => konselorList.find((k) => k.id === konselorId) ?? null,
    [konselorList, konselorId]
  );

  const formattedTanggal = (() => {
    if (!tanggal) return 'Pilih tanggal';
    const [y, m, d] = tanggal.split('-').map(Number);
    if (!y || !m || !d) return tanggal;
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  })();

  const totalSelectedPhotos = existingPhotos.length + newPhotos.length;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - totalSelectedPhotos;
    if (remainingSlots <= 0) {
      triggerGlobalToast(`Maksimal ${MAX_PHOTOS} foto untuk satu Home Visit.`, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      triggerGlobalToast(
        `Hanya ${remainingSlots} foto tambahan yang diproses (maksimal ${MAX_PHOTOS} foto).`,
        'info'
      );
    }

    setErrorMsg(null);
    setCompressingPhoto(true);
    try {
      const compressedList = await Promise.all(
        toProcess.map(async (file, idx) => {
          const res = await compressImageFile(file);
          return {
            id: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
            base64Data: res.base64Data,
            mimeType: res.mimeType,
            previewUrl: res.previewUrl,
            sizeKb: res.sizeKb,
          };
        })
      );
      setNewPhotos((prev) => [...prev, ...compressedList]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses foto.';
      setErrorMsg(msg);
      triggerGlobalToast(msg, 'error');
    } finally {
      setCompressingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemoveExistingPhoto(driveId: string) {
    setExistingPhotos((prev) => prev.filter((p) => p.driveId !== driveId));
    setRemovedDriveIds((prev) =>
      prev.includes(driveId) ? prev : [...prev, driveId]
    );
  }

  function handleRemoveNewPhoto(draftId: string) {
    setNewPhotos((prev) => prev.filter((p) => p.id !== draftId));
  }

  function resetFormForNextEntry() {
    setSelectedStudent(null);
    setStudentQuery('');
    setPrestasiDalam('');
    setSikapPerilaku('');
    setPermasalahan('');
    setKendala('');
    setSolusi('');
    setCatatan('');
    setShowCatatan(false);
    setTindakLanjut('');
    setExistingPhotos([]);
    setRemovedDriveIds([]);
    setNewPhotos([]);
    setErrorMsg(null);
    setSuccessModalData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudent) {
      const msg = 'Silakan pilih identitas siswa terlebih dahulu!';
      setErrorMsg(msg);
      triggerGlobalToast(msg, 'error');
      studentWrapRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      setShowStudentDropdown(true);
      return;
    }

    setSubmitting(true);
    const payload = {
      tanggal,
      siswaId: selectedStudent.id,
      jenis,
      konselorId,
      prestasiDalam,
      sikapPerilaku,
      permasalahan,
      kendala,
      solusi,
      catatan,
      tindakLanjut,
      newPhotos: newPhotos.map((p) => ({
        base64Data: p.base64Data,
        mimeType: p.mimeType,
      })),
      removedDriveIds,
    };

    const res =
      isEdit && initialData
        ? await updateJurnalSikapAction(initialData.id, payload)
        : await createJurnalSikapAction(payload);

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      triggerGlobalToast(res.error, 'error');
      return;
    }

    if (isEdit && initialData) {
      triggerGlobalToast('Perubahan Jurnal Sikap berhasil disimpan');
      router.push(`/guru/${initialData.id}`);
      router.refresh();
      return;
    }

    const jenisLabel =
      jenis === 'BERPRESTASI'
        ? 'Berprestasi'
        : jenis === 'HOME_VISIT'
          ? 'Home Visit'
          : 'Bermasalah';

    setSuccessModalData({
      id: res.id || '',
      studentName: selectedStudent.namaLengkap,
      metaText: `${selectedStudent.ruangNama} • ${selectedStudent.jurusanKode} | ${jenisLabel}`,
      badgeText:
        jenis === 'HOME_VISIT' && newPhotos.length > 0
          ? `${newPhotos.length} bukti foto Home Visit terlampir`
          : 'Tercatat & diteruskan ke Guru BK',
    });
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Bar Hari & Tanggal Ringkas (selaras dengan Beranda) */}
      <div className="mb-3.5 flex items-center justify-between gap-2 rounded-[10px] border border-zinc-200/80 bg-white px-3 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2 font-semibold text-zinc-600">
          <Calendar className="h-4 w-4 shrink-0 text-[#047857]" />
          <span className="truncate">{liveDate}</span>
        </div>
        <span className="shrink-0 rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#047857]">
          JURNAL SIKAP
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TANGGAL PENILAIAN */}
        <section className={CARD_CLASS}>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-[#17331E] uppercase">
                Tanggal Penilaian
              </span>
            </div>
            <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
              Wajib
            </span>
          </div>

          <div className="relative flex w-full items-center justify-between rounded-[11px] border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-600 transition-all focus-within:border-[#047857] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#047857]/12">
            <span>{formattedTanggal}</span>
            <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              type="date"
              required
              aria-label="Tanggal Penilaian"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
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

        {/* IDENTITAS SISWA (selaras 100% dengan JurnalFormClient) */}
        <section className={CARD_CLASS}>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-[#17331E] uppercase">
                Identitas Siswa
              </span>
            </div>
            <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
              Wajib Dipilih
            </span>
          </div>

          {!selectedStudent ? (
            <div ref={studentWrapRef} className="relative scroll-mt-24">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value);
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
                            {s.noAbsen
                              ? `Absen ${String(s.noAbsen).padStart(2, '0')} • `
                              : ''}
                            {s.ruangNama}{' '}
                            <span className="text-zinc-300">|</span>{' '}
                            <span
                              className={`font-semibold ${getMajorTextClass(
                                s.jurusanKode
                              )}`}
                            >
                              {s.jurusanKode}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                            s.jenisKelamin === 'L'
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
                      className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${
                        selectedStudent.jenisKelamin === 'L'
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
                    setStudentQuery('');
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

        {/* KATEGORI PENILAIAN SIKAP */}
        <section className={CARD_CLASS}>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                <Tag className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-[#17331E] uppercase">
                Kategori Penilaian Sikap
              </span>
            </div>
            <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
              Pilih 1
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {JENIS_OPTIONS.map((opt) => {
              const Icon = opt.Icon;
              const active = jenis === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setJenis(opt.value)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[11px] border p-2.5 text-left transition-all ${
                    active
                      ? opt.activeClass
                      : 'border-zinc-200 bg-zinc-50/70 text-zinc-700 hover:border-zinc-300 hover:bg-white'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      active ? opt.iconBg : 'bg-white border border-zinc-200 text-zinc-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">
                      {opt.label}
                    </div>
                    <div className="mt-0.5 truncate text-[10.5px] opacity-75">
                      {opt.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* DETAIL CATATAN PENILAIAN (dengan numbered labels selaras JurnalFormClient) */}
        <section className={CARD_CLASS}>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                <PenLine className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-[#17331E] uppercase">
                {jenis === 'BERPRESTASI'
                  ? 'Catatan Prestasi & Sikap'
                  : jenis === 'HOME_VISIT'
                    ? 'Catatan Home Visit'
                    : 'Catatan Pembinaan'}
              </span>
            </div>
          </div>

          {jenis === 'BERPRESTASI' ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                    1
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Berprestasi dalam hal
                    <span className="ml-0.5 text-rose-600">*</span>
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={prestasiDalam}
                  onChange={(e) => {
                    setPrestasiDalam(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Contoh: Juara 1 LKS Kabupaten, nilai praktik terbaik, aktif kegiatan sekolah..."
                  className={TEXTAREA_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                    2
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Sikap / Perilaku
                    <span className="ml-0.5 text-rose-600">*</span>
                  </span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={sikapPerilaku}
                  onChange={(e) => {
                    setSikapPerilaku(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Uraikan sikap atau perilaku positif yang ditunjukkan siswa..."
                  className={TEXTAREA_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                    3
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Tindak Lanjut
                    <span className="ml-0.5 text-rose-600">*</span>
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={tindakLanjut}
                  onChange={(e) => {
                    setTindakLanjut(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Rencana apresiasi / pengembangan prestasi siswa..."
                  className={TEXTAREA_CLASS}
                />
              </div>

              {/* Catatan Tambahan (Collapsible / Opsional seperti Jurnal BK) */}
              {showCatatan || catatan.trim().length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                        4
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
                    rows={2}
                    value={catatan}
                    onChange={(e) => {
                      setCatatan(e.target.value);
                      autoResizeTextarea(e.currentTarget);
                    }}
                    placeholder="Catatan tambahan untuk Guru BK..."
                    className={TEXTAREA_CLASS}
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
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                    1
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Permasalahan
                    <span className="ml-0.5 text-rose-600">*</span>
                  </span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={permasalahan}
                  onChange={(e) => {
                    setPermasalahan(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Uraikan permasalahan atau hal yang membutuhkan bimbingan..."
                  className={TEXTAREA_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                    2
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Kendala<span className="ml-0.5 text-rose-600">*</span>
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={kendala}
                  onChange={(e) => {
                    setKendala(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Faktor pemicu atau kendala yang dihadapi..."
                  className={TEXTAREA_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                    3
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Solusi<span className="ml-0.5 text-rose-600">*</span>
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={solusi}
                  onChange={(e) => {
                    setSolusi(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Solusi atau kesepakatan yang diberikan..."
                  className={TEXTAREA_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] font-mono text-[10.5px] font-bold text-[#047857]">
                    4
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Tindak Lanjut
                    <span className="ml-0.5 text-rose-600">*</span>
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={tindakLanjut}
                  onChange={(e) => {
                    setTindakLanjut(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Rencana tindak lanjut pembinaan..."
                  className={TEXTAREA_CLASS}
                />
              </div>

              {/* Catatan Tambahan (Collapsible / Opsional seperti Jurnal BK) */}
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
                    rows={2}
                    value={catatan}
                    onChange={(e) => {
                      setCatatan(e.target.value);
                      autoResizeTextarea(e.currentTarget);
                    }}
                    placeholder="Catatan tambahan untuk Guru BK..."
                    className={TEXTAREA_CLASS}
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
            </>
          )}

          {/* Upload Multi-Foto khusus HOME_VISIT (maks 5 foto) */}
          {jenis === 'HOME_VISIT' && (
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 font-mono text-[10.5px] font-bold text-blue-700">
                    6
                  </span>
                  <span className="text-xs font-bold tracking-wide text-zinc-600 uppercase">
                    Bukti Foto Home Visit
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400">
                    (Opsional)
                  </span>
                </label>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-500">
                  {totalSelectedPhotos}/{MAX_PHOTOS}
                </span>
              </div>

              {!gdriveConfigured && (
                <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  Info: Penyimpanan foto belum diaktifkan oleh Admin. Anda tetap bisa menyimpan Home Visit tanpa foto.
                </p>
              )}

              {totalSelectedPhotos > 0 ? (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                  {existingPhotos.map((photo, idx) => (
                    <div
                      key={photo.driveId}
                      className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/jurnal-sikap/foto/${photo.driveId}`}
                        alt={photo.fileName || `Foto tersimpan ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(photo.driveId)}
                        aria-label="Hapus foto"
                        className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-zinc-950/75 text-white shadow-xs transition-colors hover:bg-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {newPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-xl border border-[#A7F3D0] bg-zinc-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.previewUrl}
                        alt={`Foto baru ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-zinc-950/70 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white">
                        {photo.sizeKb}KB
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPhoto(photo.id)}
                        aria-label="Hapus foto"
                        className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-zinc-950/75 text-white shadow-xs transition-colors hover:bg-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {totalSelectedPhotos < MAX_PHOTOS && (
                    <button
                      type="button"
                      disabled={compressingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition-colors hover:border-[#047857] hover:bg-[#ECFDF5]/40 hover:text-[#047857] disabled:opacity-60"
                    >
                      {compressingPhoto ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[#047857]" />
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          <span className="text-[10.5px] font-semibold">
                            Tambah
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={compressingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[11px] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center transition-colors hover:border-[#047857] hover:bg-[#ECFDF5]/40 disabled:opacity-60"
                >
                  {compressingPhoto ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-[#047857]" />
                      <span className="text-xs font-semibold text-zinc-700">
                        Memproses foto...
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5 text-[#047857]" />
                      <span className="text-xs font-semibold text-zinc-800">
                        Pilih Foto dari Galeri atau Kamera
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Bisa pilih hingga {MAX_PHOTOS} foto sekaligus
                      </span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </section>

        {/* KONSELOR / GURU PENCATAT */}
        <section className={CARD_CLASS}>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#ECFDF5] text-[#047857]">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-[#17331E] uppercase">
                Konselor / Guru Pencatat
              </span>
            </div>
            <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
              {canChangeKonselor ? 'Bisa Diubah' : 'Otomatis'}
            </span>
          </div>

          {!canChangeKonselor ? (
            <div className="flex items-center justify-between gap-2 rounded-[11px] border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-800">
              <span className="truncate font-semibold">
                {selectedKonselor?.namaLengkap || counselorName}
              </span>
              <Lock
                className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                aria-label="Terkunci sesuai akun login"
              />
            </div>
          ) : (
            <div ref={konselorWrapRef} className="relative space-y-2 scroll-mt-24">
              <button
                type="button"
                onClick={() => setShowKonselorDropdown((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between rounded-[11px] border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100/70"
              >
                <span className="truncate font-semibold">
                  {selectedKonselor?.namaLengkap || 'Pilih Nama Guru'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                    showKonselorDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {konselorId !== defaultKonselorId && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-1.5 text-[11px] text-amber-800">
                  <span className="truncate">
                    Mewakili guru lain • Diinput oleh{' '}
                    <strong>{counselorName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setKonselorId(defaultKonselorId)}
                    className="shrink-0 cursor-pointer font-bold text-amber-900 hover:underline"
                  >
                    Reset
                  </button>
                </div>
              )}

              {showKonselorDropdown && (
                <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-40 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl">
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={konselorQuery}
                      onChange={(e) => setKonselorQuery(e.target.value)}
                      placeholder="Cari nama guru..."
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pr-3 pl-8 text-xs focus:border-[#047857] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredKonselor.map((k) => {
                      const selected = k.id === konselorId;
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => {
                            setKonselorId(k.id);
                            setShowKonselorDropdown(false);
                            setKonselorQuery('');
                          }}
                          className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium ${
                            selected
                              ? 'bg-[#ECFDF5] font-semibold text-[#047857]'
                              : 'text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          <span className="truncate">{k.namaLengkap}</span>
                          {selected && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#047857]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* TOMBOL SIMPAN UTAMA (selaras dengan JurnalFormClient) */}
        <button
          type="submit"
          disabled={submitting || compressingPhoto}
          className="skanada-btn-primary flex w-full cursor-pointer items-center justify-center gap-2 bg-emerald-700 px-4 py-3.5 text-[15px] hover:bg-emerald-800 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span>
            {isEdit ? 'Simpan Perubahan' : 'Simpan Jurnal Penilaian Sikap'}
          </span>
        </button>
      </form>

      <SaveSuccessModal
        open={Boolean(successModalData)}
        title="Jurnal Sikap Tersimpan!"
        subtitle="Catatan penilaian sikap siswa berhasil dikirim ke sistem."
        studentName={successModalData?.studentName || ''}
        metaText={successModalData?.metaText || ''}
        badgeText={successModalData?.badgeText}
        detailHref={
          successModalData?.id ? `/guru/${successModalData.id}` : redirectAfterSave
        }
        homeHref={redirectAfterSave}
        onCreateAnother={resetFormForNextEntry}
      />
    </div>
  );
}
