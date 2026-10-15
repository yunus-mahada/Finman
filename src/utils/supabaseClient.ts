import { createClient } from '@supabase/supabase-js';
import {
  DatabaseState,
  TransaksiKlien,
  TransaksiVendor,
  Operasional,
  MasterVendor,
  ReportBank,
  AktualCashEntry,
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://xyzcompany.supabase.co' &&
  !supabaseUrl.includes('MY_')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// Mappers: TypeScript (camelCase) <-> Supabase (snake_case)
// ==========================================

export const mapKlienToSnake = (k: TransaksiKlien) => ({
  id: k.id,
  tanggal: k.tanggal,
  invoice: k.invoice,
  brand: k.brand || '',
  klien: k.klien,
  sales: k.sales || '',
  nilai_invoice: Number(k.nilaiInvoice) || 0,
  modal_awal: Number(k.modalAwal) || 0,
  pembayaran_klien: Number(k.pembayaranKlien) || 0,
  status: k.status || 'DP',
  bank: k.bank || '',
});

export const mapKlienFromSnake = (row: any): TransaksiKlien => ({
  id: row.id,
  tanggal: row.tanggal,
  invoice: row.invoice,
  brand: row.brand || '',
  klien: row.klien,
  sales: row.sales || '',
  nilaiInvoice: Number(row.nilai_invoice) || 0,
  modalAwal: Number(row.modal_awal) || 0,
  pembayaranKlien: Number(row.pembayaran_klien) || 0,
  status: row.status || 'DP',
  bank: row.bank || '',
});

export const mapVendorToSnake = (v: TransaksiVendor) => ({
  id: v.id,
  tanggal: v.tanggal,
  invoice: v.invoice,
  nama_vendor: v.namaVendor,
  nilai_transaksi: Number(v.nilaiTransaksi) || 0,
  pembayaran: Number(v.pembayaran) || 0,
  status: v.status || 'DP',
  bank: v.bank || '',
});

export const mapVendorFromSnake = (row: any): TransaksiVendor => ({
  id: row.id,
  tanggal: row.tanggal,
  invoice: row.invoice,
  namaVendor: row.nama_vendor,
  nilaiTransaksi: Number(row.nilai_transaksi) || 0,
  pembayaran: Number(row.pembayaran) || 0,
  status: row.status || 'DP',
  bank: row.bank || '',
});

export const mapOperasionalToSnake = (o: Operasional) => ({
  id: o.id,
  tanggal: o.tanggal,
  pengeluaran: o.pengeluaran,
  kategori: o.kategori,
  pembayaran: Number(o.pembayaran) || 0,
  bank: o.bank || '',
});

export const mapOperasionalFromSnake = (row: any): Operasional => ({
  id: row.id,
  tanggal: row.tanggal,
  pengeluaran: row.pengeluaran,
  kategori: row.kategori,
  pembayaran: Number(row.pembayaran) || 0,
  bank: row.bank || '',
});

export const mapMasterVendorToSnake = (m: MasterVendor) => ({
  id: m.id,
  nama_vendor: m.namaVendor,
  no_tlp: m.noTlp || '',
  no_rekening: m.noRekening || '',
});

export const mapMasterVendorFromSnake = (row: any): MasterVendor => ({
  id: row.id,
  namaVendor: row.nama_vendor,
  noTlp: row.no_tlp || '',
  noRekening: row.no_rekening || '',
});

export const mapBankToSnake = (b: ReportBank) => ({
  id: b.id,
  nama_bank: b.namaBank,
  no_rekening: b.noRekening || '',
  atas_nama: b.atasNama || '',
  cash_saldo: Number(b.cashSaldo) || 0,
});

export const mapBankFromSnake = (row: any): ReportBank => ({
  id: row.id,
  namaBank: row.nama_bank,
  noRekening: row.no_rekening || '',
  atasNama: row.atas_nama || '',
  cashSaldo: Number(row.cash_saldo) || 0,
});

export const mapAktualCashToSnake = (a: AktualCashEntry) => ({
  id: a.id,
  tanggal: a.tanggal,
  nilai: Number(a.nilai) || 0,
});

export const mapAktualCashFromSnake = (row: any): AktualCashEntry => ({
  id: row.id,
  tanggal: row.tanggal,
  nilai: Number(row.nilai) || 0,
});

// ==========================================
// Database Synchronizer API Functions
// ==========================================

export async function fetchAllFromSupabase(): Promise<{
  success: boolean;
  data?: Partial<DatabaseState>;
  error?: string;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    const [klienRes, vendorRes, opRes, mVendorRes, bankRes, cashRes] =
      await Promise.all([
        supabase.from('transaksi_klien').select('*'),
        supabase.from('transaksi_vendor').select('*'),
        supabase.from('operasional').select('*'),
        supabase.from('master_vendor').select('*'),
        supabase.from('report_bank').select('*'),
        supabase.from('aktual_cash').select('*'),
      ]);

    const error =
      klienRes.error ||
      vendorRes.error ||
      opRes.error ||
      mVendorRes.error ||
      bankRes.error ||
      cashRes.error;

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        transaksiKlien: (klienRes.data || []).map(mapKlienFromSnake),
        transaksiVendor: (vendorRes.data || []).map(mapVendorFromSnake),
        operasional: (opRes.data || []).map(mapOperasionalFromSnake),
        masterVendor: (mVendorRes.data || []).map(mapMasterVendorFromSnake),
        reportBank: (bankRes.data || []).map(mapBankFromSnake),
        aktualCash: (cashRes.data || []).map(mapAktualCashFromSnake),
      },
    };
  } catch (err: any) {
    console.error('Failed to communicate with Supabase:', err);
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Upload whole database to Supabase (useful for JSON import or pushing local data)
 */
export async function pushAllToSupabase(db: DatabaseState): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    if (db.masterVendor && db.masterVendor.length > 0) {
      const { error } = await supabase
        .from('master_vendor')
        .upsert(db.masterVendor.map(mapMasterVendorToSnake), { onConflict: 'id' });
      if (error) throw error;
    }

    if (db.reportBank && db.reportBank.length > 0) {
      const { error } = await supabase
        .from('report_bank')
        .upsert(db.reportBank.map(mapBankToSnake), { onConflict: 'id' });
      if (error) throw error;
    }

    if (db.transaksiKlien && db.transaksiKlien.length > 0) {
      const { error } = await supabase
        .from('transaksi_klien')
        .upsert(db.transaksiKlien.map(mapKlienToSnake), { onConflict: 'id' });
      if (error) throw error;
    }

    if (db.transaksiVendor && db.transaksiVendor.length > 0) {
      const { error } = await supabase
        .from('transaksi_vendor')
        .upsert(db.transaksiVendor.map(mapVendorToSnake), { onConflict: 'id' });
      if (error) throw error;
    }

    if (db.operasional && db.operasional.length > 0) {
      const { error } = await supabase
        .from('operasional')
        .upsert(db.operasional.map(mapOperasionalToSnake), { onConflict: 'id' });
      if (error) throw error;
    }

    if (db.aktualCash && db.aktualCash.length > 0) {
      const { error } = await supabase
        .from('aktual_cash')
        .upsert(db.aktualCash.map(mapAktualCashToSnake), { onConflict: 'id' });
      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error syncing data to Supabase:', err);
    return { success: false, error: err.message || 'Gagal sinkronisasi data' };
  }
}
