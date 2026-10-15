export type PageId =
  | 'dashboard'
  | 'klien'
  | 'vendor'
  | 'operasional'
  | 'master-vendor'
  | 'bank'
  | 'aging'
  | 'ketentuan'
  | 'supabase-prep';

export type PaymentStatus = 'Lunas' | 'DP' | 'Tempo';

export type KetentuanKategori =
  | 'Rumus & Logika'
  | 'Kebijakan Kas'
  | 'Klien & Piutang'
  | 'Vendor & Hutang'
  | 'Operasional'
  | 'Umum';

export interface KetentuanItem {
  id: string;
  judul: string;
  kategori: KetentuanKategori;
  ringkasan: string;
  rumus?: string;
  penjelasan: string;
  tanggalUpdate: string;
  isPinned?: boolean;
}

export interface TransaksiKlien {
  id: string;
  tanggal: string; // YYYY-MM-DD
  invoice: string;
  brand: string;
  klien: string;
  sales: string;
  nilaiInvoice: number;
  modalAwal: number;
  pembayaranKlien: number;
  status: PaymentStatus;
  bank: string;
}

export interface TransaksiVendor {
  id: string;
  tanggal: string; // YYYY-MM-DD
  invoice: string; // Ref invoice klien
  namaVendor: string;
  nilaiTransaksi: number;
  pembayaran: number;
  status: PaymentStatus;
  bank: string;
}

export interface Operasional {
  id: string;
  tanggal: string; // YYYY-MM-DD
  pengeluaran: string;
  kategori: string;
  pembayaran: number;
  bank: string;
}

export interface MasterVendor {
  id: string;
  namaVendor: string;
  noTlp: string;
  noRekening: string;
}

export interface ReportBank {
  id: string;
  namaBank: string;
  noRekening: string;
  atasNama: string;
  cashSaldo: number; // Saldo awal
}

export interface AktualCashEntry {
  id: string;
  tanggal: string;
  nilai: number;
}

export interface BankCalculatedBalance {
  saldoAwal: number;
  uangMasukKlien: number;
  uangKeluarVendor: number;
  uangKeluarOperasional: number;
  piutang: number;
  hutang: number;
  saldoAkhir: number;
}

export interface DatabaseState {
  transaksiKlien: TransaksiKlien[];
  transaksiVendor: TransaksiVendor[];
  operasional: Operasional[];
  masterVendor: MasterVendor[];
  reportBank: ReportBank[];
  aktualCash: AktualCashEntry[];
  ketentuan?: KetentuanItem[];
}

export interface NavigationParams {
  filterType?: 'Semua' | 'Piutang' | 'Hutang';
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  prefillInvoice?: string;
  prefillVendor?: string;
  prefillBank?: string;
  openAddModal?: boolean;
}
