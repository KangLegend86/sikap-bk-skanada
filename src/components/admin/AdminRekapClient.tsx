'use client';

import { Download, Printer } from 'lucide-react';

export interface RekapRow {
  id: string;
  tanggal: string;
  siswaNama: string;
  ruang: string;
  jurusanKode: string;
  konselor: string;
  kategori: string;
  permasalahan: string;
  tindakLanjut: string;
  status: string;
}

export function AdminRekapClient({ rows }: { rows: RekapRow[] }) {
  function handleExportCsv() {
    const headers = [
      'No',
      'Tanggal',
      'Nama Siswa',
      'Ruang Kelas',
      'Jurusan',
      'Guru BK',
      'Kategori',
      'Permasalahan',
      'Tindak Lanjut',
      'Status',
    ];

    const escapeCsv = (val: string) =>
      `"${String(val).replaceAll('"', '""').replaceAll('\n', ' ')}"`;

    const lines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r, idx) =>
        [
          String(idx + 1),
          r.tanggal,
          r.siswaNama,
          r.ruang,
          r.jurusanKode,
          r.konselor,
          r.kategori,
          r.permasalahan,
          r.tindakLanjut,
          r.status,
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-ejurnal-bk-skanada-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#047857] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#065F46]"
      >
        <Printer className="h-4 w-4" />
        Cetak / Simpan PDF (Kop Surat)
      </button>

      <button
        type="button"
        onClick={handleExportCsv}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
      >
        <Download className="h-4 w-4" />
        Unduh CSV / Excel
      </button>
    </div>
  );
}

