import { DatabaseState } from '../types';

export function formatRp(amount: number | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function generateId(prefix: string): string {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${randomStr}${timestamp}`;
}

export function calculateAging(dateStr: string | null | undefined): {
  days: number;
  bracket: '0-30 Hari' | '31-60 Hari' | '61-90 Hari' | '>90 Hari';
} {
  if (!dateStr) {
    return { days: 0, bracket: '0-30 Hari' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const txDate = new Date(dateStr);
  txDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - txDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  let bracket: '0-30 Hari' | '31-60 Hari' | '61-90 Hari' | '>90 Hari' = '0-30 Hari';
  if (diffDays <= 30) bracket = '0-30 Hari';
  else if (diffDays <= 60) bracket = '31-60 Hari';
  else if (diffDays <= 90) bracket = '61-90 Hari';
  else bracket = '>90 Hari';

  return { days: diffDays, bracket };
}

export function getDateRangePreset(
  preset: 'this_month' | 'last_month' | 'this_year' | 'all'
): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (preset === 'this_month') {
    return {
      start: toYMD(new Date(year, month, 1)),
      end: toYMD(new Date(year, month + 1, 0)),
    };
  }

  if (preset === 'last_month') {
    return {
      start: toYMD(new Date(year, month - 1, 1)),
      end: toYMD(new Date(year, month, 0)),
    };
  }

  if (preset === 'this_year') {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
    };
  }

  return { start: '', end: '' };
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const OPERASIONAL_CATEGORIES = [
  'Gaji Karyawan',
  'Listrik & Air',
  'Internet & Langganan',
  'Sewa Tempat',
  'Konsumsi & Transport',
  'BPJS',
  'Pajak',
  'Pelatihan',
  'Lain-lain',
];

export function generateSupabaseSQL(db: DatabaseState): string {
  const schemaSQL = `-- ====================================================
-- SCHEMA FINMAN UNTUK SUPABASE POSTGRESQL
-- Jalankan query ini di SQL Editor pada Dashboard Supabase
-- ====================================================

-- 1. Tabel Master Vendor
CREATE TABLE IF NOT EXISTS master_vendor (
    id TEXT PRIMARY KEY,
    nama_vendor TEXT NOT NULL,
    no_tlp TEXT,
    no_rekening TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Report Bank
CREATE TABLE IF NOT EXISTS report_bank (
    id TEXT PRIMARY KEY,
    nama_bank TEXT NOT NULL UNIQUE,
    no_rekening TEXT,
    atas_nama TEXT,
    cash_saldo NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Transaksi Klien
CREATE TABLE IF NOT EXISTS transaksi_klien (
    id TEXT PRIMARY KEY,
    tanggal DATE NOT NULL,
    invoice TEXT NOT NULL,
    brand TEXT,
    klien TEXT NOT NULL,
    sales TEXT,
    nilai_invoice NUMERIC DEFAULT 0,
    modal_awal NUMERIC DEFAULT 0,
    pembayaran_klien NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'DP',
    bank TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Transaksi Vendor
CREATE TABLE IF NOT EXISTS transaksi_vendor (
    id TEXT PRIMARY KEY,
    tanggal DATE NOT NULL,
    invoice TEXT NOT NULL,
    nama_vendor TEXT NOT NULL,
    nilai_transaksi NUMERIC DEFAULT 0,
    pembayaran NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'DP',
    bank TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Transaksi Operasional
CREATE TABLE IF NOT EXISTS operasional (
    id TEXT PRIMARY KEY,
    tanggal DATE NOT NULL,
    pengeluaran TEXT NOT NULL,
    kategori TEXT NOT NULL,
    pembayaran NUMERIC DEFAULT 0,
    bank TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel Aktual Cash Balance
CREATE TABLE IF NOT EXISTS aktual_cash (
    id TEXT PRIMARY KEY,
    tanggal DATE NOT NULL,
    nilai NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Opsional jika tanpa auth dapat diizinkan public read/write
ALTER TABLE master_vendor ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_klien ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_vendor ENABLE ROW LEVEL SECURITY;
ALTER TABLE operasional ENABLE ROW LEVEL SECURITY;
ALTER TABLE aktual_cash ENABLE ROW LEVEL SECURITY;

-- Policy Publik sederhana (Tanpa Login User):
CREATE POLICY "Public full access master_vendor" ON master_vendor FOR ALL USING (true);
CREATE POLICY "Public full access report_bank" ON report_bank FOR ALL USING (true);
CREATE POLICY "Public full access transaksi_klien" ON transaksi_klien FOR ALL USING (true);
CREATE POLICY "Public full access transaksi_vendor" ON transaksi_vendor FOR ALL USING (true);
CREATE POLICY "Public full access operasional" ON operasional FOR ALL USING (true);
CREATE POLICY "Public full access aktual_cash" ON aktual_cash FOR ALL USING (true);
`;

  // Generate seed SQL statements with current data
  let dataSQL = `\n-- ====================================================
-- DATA SEED SAAT INI (INSERT KE SUPABASE)
-- ====================================================\n`;

  if (db.masterVendor.length > 0) {
    dataSQL += `\n-- Insert Master Vendor\n`;
    for (const v of db.masterVendor) {
      dataSQL += `INSERT INTO master_vendor (id, nama_vendor, no_tlp, no_rekening) VALUES ('${escapeSql(v.id)}', '${escapeSql(v.namaVendor)}', '${escapeSql(v.noTlp)}', '${escapeSql(v.noRekening)}') ON CONFLICT (id) DO NOTHING;\n`;
    }
  }

  if (db.reportBank.length > 0) {
    dataSQL += `\n-- Insert Report Bank\n`;
    for (const b of db.reportBank) {
      dataSQL += `INSERT INTO report_bank (id, nama_bank, no_rekening, atas_nama, cash_saldo) VALUES ('${escapeSql(b.id)}', '${escapeSql(b.namaBank)}', '${escapeSql(b.noRekening)}', '${escapeSql(b.atasNama)}', ${b.cashSaldo}) ON CONFLICT (id) DO NOTHING;\n`;
    }
  }

  if (db.transaksiKlien.length > 0) {
    dataSQL += `\n-- Insert Transaksi Klien\n`;
    for (const k of db.transaksiKlien) {
      dataSQL += `INSERT INTO transaksi_klien (id, tanggal, invoice, brand, klien, sales, nilai_invoice, modal_awal, pembayaran_klien, status, bank) VALUES ('${escapeSql(k.id)}', '${escapeSql(k.tanggal)}', '${escapeSql(k.invoice)}', '${escapeSql(k.brand)}', '${escapeSql(k.klien)}', '${escapeSql(k.sales)}', ${k.nilaiInvoice}, ${k.modalAwal}, ${k.pembayaranKlien}, '${escapeSql(k.status)}', '${escapeSql(k.bank)}') ON CONFLICT (id) DO NOTHING;\n`;
    }
  }

  if (db.transaksiVendor.length > 0) {
    dataSQL += `\n-- Insert Transaksi Vendor\n`;
    for (const v of db.transaksiVendor) {
      dataSQL += `INSERT INTO transaksi_vendor (id, tanggal, invoice, nama_vendor, nilai_transaksi, pembayaran, status, bank) VALUES ('${escapeSql(v.id)}', '${escapeSql(v.tanggal)}', '${escapeSql(v.invoice)}', '${escapeSql(v.namaVendor)}', ${v.nilaiTransaksi}, ${v.pembayaran}, '${escapeSql(v.status)}', '${escapeSql(v.bank)}') ON CONFLICT (id) DO NOTHING;\n`;
    }
  }

  if (db.operasional.length > 0) {
    dataSQL += `\n-- Insert Operasional\n`;
    for (const o of db.operasional) {
      dataSQL += `INSERT INTO operasional (id, tanggal, pengeluaran, kategori, pembayaran, bank) VALUES ('${escapeSql(o.id)}', '${escapeSql(o.tanggal)}', '${escapeSql(o.pengeluaran)}', '${escapeSql(o.kategori)}', ${o.pembayaran}, '${escapeSql(o.bank)}') ON CONFLICT (id) DO NOTHING;\n`;
    }
  }

  return schemaSQL + dataSQL;
}

function escapeSql(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}
