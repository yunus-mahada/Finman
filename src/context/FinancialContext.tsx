import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  DatabaseState,
  TransaksiKlien,
  TransaksiVendor,
  Operasional,
  MasterVendor,
  ReportBank,
  BankCalculatedBalance,
  PageId,
  NavigationParams,
  KetentuanItem,
} from '../types';

const STORAGE_KEY = 'finman_database_store_v2';

export const DEFAULT_KETENTUAN: KetentuanItem[] = [
  {
    id: 'KTN-01',
    judul: 'Rumus Perhitungan Free Cash',
    kategori: 'Rumus & Logika',
    ringkasan: 'Standar perhitungan dana kas bebas dari kewajiban, modal awal, dan operasional.',
    rumus: 'Free Cash = Total Saldo Bank - Hutang Vendor - Modal Awal - Beban Operasional',
    penjelasan:
      'Perhitungan Free Cash menunjukkan dana yang benar-benar tersedia setelah memperhitungkan seluruh kewajiban dan pengeluaran:\n' +
      '1. Total Saldo Bank: Akumulasi saldo akhir dari seluruh rekening bank aktif di sistem.\n' +
      '2. Hutang Vendor: Total kewajiban tagihan vendor yang belum dibayar (tempo/sisa DP).\n' +
      '3. Modal Awal: Total modal awal yang dialokasikan untuk seluruh transaksi klien.\n' +
      '4. Beban Operasional: Total pengeluaran beban operasional yang dicatat di sistem.',
    tanggalUpdate: '2026-07-15',
    isPinned: true,
  },
  {
    id: 'KTN-02',
    judul: 'Rumus Akumulasi Saldo Kas & Bank',
    kategori: 'Rumus & Logika',
    ringkasan: 'Perhitungan posisi kas bank riil berbasis mutasi transaksi masuk dan keluar.',
    rumus: 'Saldo Akhir Bank = Saldo Awal + Pembayaran Klien - Pengeluaran Vendor - Pengeluaran Operasional',
    penjelasan:
      'Setiap rekening bank (BCA, BSI, Mandiri, dll.) memiliki saldo awal dan mutasi mandiri. Saldo Bank di Dashboard merupakan akumulasi (penjumlahan) dari saldo akhir seluruh rekening bank aktif.',
    tanggalUpdate: '2026-07-15',
    isPinned: true,
  },
  {
    id: 'KTN-03',
    judul: 'Rumus Gross Margin & Profitabilitas',
    kategori: 'Rumus & Logika',
    ringkasan: 'Perhitungan keuntungan kotor proyek sebelum beban operasional.',
    rumus: 'Gross Margin = Total Nilai Invoice Klien (Omset) - Total Modal Akhir Vendor (HPP)',
    penjelasan:
      'Mengukur margin laba kotor dari seluruh proyek yang berjalan. Persentase Margin dihitung dari (Gross Margin / Total Omset) * 100%. Beban operasional umum (overhead kantor) dievaluasi secara terpisah.',
    tanggalUpdate: '2026-07-15',
    isPinned: true,
  },
  {
    id: 'KTN-04',
    judul: 'Ketentuan Piutang Klien & Jadwal Penagihan',
    kategori: 'Klien & Piutang',
    ringkasan: 'Klasifikasi penagihan invoice klien berdasarkan umur piutang (Aging).',
    rumus: 'Piutang = Nilai Invoice - Pembayaran Klien yang Diterima',
    penjelasan:
      'Invoice klien yang belum lunas (status DP atau Tempo) wajib dipantau melalui Aging Report:\n' +
      '- 0-30 Hari: Lancar (Reminder berkala)\n' +
      '- 31-60 Hari: Perhatian (Follow-up tim sales)\n' +
      '- 61-90 Hari: Warning (Surat tagihan resmi)\n' +
      '- > 90 Hari: Kritis (Eskalasi manajemen & penahanan layanan baru).',
    tanggalUpdate: '2026-07-15',
    isPinned: false,
  },
  {
    id: 'KTN-05',
    judul: 'Ketentuan Hutang Vendor & Manajemen Tempo',
    kategori: 'Vendor & Hutang',
    ringkasan: 'SOP pembayaran kewajiban pengadaan dan jasa kepada rekanan vendor.',
    rumus: 'Hutang = Nilai Transaksi Vendor - Pembayaran Riil ke Vendor',
    penjelasan:
      'Pembayaran vendor wajib memprioritaskan invoice yang mendekati tanggal jatuh tempo. Pastikan pembayaran vendor disinkronkan dengan ketersediaan Free Cash agar arus kas tetap likuid.',
    tanggalUpdate: '2026-07-15',
    isPinned: false,
  },
  {
    id: 'KTN-06',
    judul: 'Kebijakan Batas Aman Likuiditas (Minimum Cash Buffer)',
    kategori: 'Kebijakan Kas',
    ringkasan: 'Standar batas minimum Free Cash agar operasional perusahaan tidak terganggu.',
    rumus: 'Minimum Buffer = 1.5x Rata-rata Biaya Operasional Bulanan',
    penjelasan:
      'Free Cash idealnya tidak boleh negatif. Jika Free Cash berada di bawah batas minimum buffer, manajemen wajib mempercepat penagihan piutang dan menunda pengeluaran modal non-esensial.',
    tanggalUpdate: '2026-07-15',
    isPinned: false,
  },
];

export const INITIAL_DATABASE: DatabaseState = {
  transaksiKlien: [],
  transaksiVendor: [],
  operasional: [],
  masterVendor: [],
  reportBank: [],
  aktualCash: [],
  ketentuan: DEFAULT_KETENTUAN,
};

interface FinancialContextType {
  db: DatabaseState;
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // CRUD Transaksi Klien
  saveKlien: (item: TransaksiKlien) => void;
  deleteKlien: (id: string) => void;
  deleteMultipleKlien: (ids: string[]) => void;

  // CRUD Transaksi Vendor
  saveVendor: (item: TransaksiVendor) => void;
  deleteVendor: (id: string) => void;
  deleteMultipleVendor: (ids: string[]) => void;

  // CRUD Operasional
  saveOperasional: (item: Operasional) => void;
  deleteOperasional: (id: string) => void;
  deleteMultipleOperasional: (ids: string[]) => void;

  // CRUD Master Vendor
  saveMasterVendor: (item: MasterVendor) => void;
  deleteMasterVendor: (id: string) => void;

  // CRUD Bank
  saveBank: (item: ReportBank) => void;
  deleteBank: (id: string) => void;

  // CRUD Ketentuan
  saveKetentuan: (item: KetentuanItem) => void;
  deleteKetentuan: (id: string) => void;

  // Aktual Cash
  saveAktualCash: (nilai: number) => void;
  aktualCashBalance: number;

  // Dynamic Calculators
  bankBalances: Record<string, BankCalculatedBalance>;
  kpis: {
    saldoBank: number;
    freeCash: number;
    modalAwalOpen: number;
    totalOmset: number;
    grossMargin: number;
    totalOperasional: number;
    totalPiutang: number;
    totalHutang: number;
    totalModalAwal: number;
    totalModalAkhir: number;
    invoiceOpen: number;
    invoiceClosed: number;
    freeCashBreakdown: {
      saldoBank: number;
      totalHutang: number;
      totalModalAwal: number;
      totalOperasional: number;
      freeCash: number;
    };
  };

  // Cross-Menu Navigation with params
  navParams: NavigationParams | null;
  navigateWithParams: (page: PageId, params?: NavigationParams) => void;
  clearNavParams: () => void;

  // Cross-Menu Quick Actions
  recordKlienPayment: (klienId: string, additionalAmount: number, targetBank?: string) => void;
  recordVendorPayment: (vendorId: string, additionalAmount: number, targetBank?: string) => void;

  // Reset & Import
  resetData: () => void;
  clearAll: () => void;
  importDatabase: (newData: DatabaseState) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DatabaseState>(() => {
    try {
      // Bersihkan cache v1 lama jika ada
      localStorage.removeItem('finman_database_store_v1');

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.transaksiKlien) && Array.isArray(parsed.reportBank)) {
          if (!parsed.ketentuan || parsed.ketentuan.length === 0) {
            parsed.ketentuan = DEFAULT_KETENTUAN;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading localStorage', e);
    }
    return INITIAL_DATABASE;
  });

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [navParams, setNavParams] = useState<NavigationParams | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigateWithParams = (page: PageId, params?: NavigationParams) => {
    setNavParams(params || null);
    setCurrentPage(page);
  };

  const clearNavParams = () => {
    setNavParams(null);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed saving to localStorage', e);
    }
  }, [db]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Save Aktual Cash
  const saveAktualCash = (nilai: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: `AC-${Date.now()}`,
      tanggal: today,
      nilai: Number(nilai) || 0,
    };
    setDb((prev) => ({
      ...prev,
      aktualCash: [...prev.aktualCash, newEntry],
    }));
    showToast('Aktual Cash Balance berhasil diperbarui.');
  };

  // Dynamic Bank Balances (per rekening bank yang terdaftar)
  const bankBalances = useMemo(() => {
    const balances: Record<string, BankCalculatedBalance> = {};

    // 1. Inisialisasi seluruh rekening yang terdaftar di sistem dengan Saldo Awal masing-masing
    db.reportBank.forEach((b) => {
      const initial = Number(b.cashSaldo) || 0;
      balances[b.namaBank] = {
        saldoAwal: initial,
        uangMasukKlien: 0,
        uangKeluarVendor: 0,
        uangKeluarOperasional: 0,
        piutang: 0,
        hutang: 0,
        saldoAkhir: initial,
      };
    });

    // Helper untuk pencocokan nama bank secara case-insensitive & trimmed
    const getBankKey = (name?: string): string | null => {
      if (!name || !name.trim()) return null;
      const target = name.trim().toLowerCase();
      const found = Object.keys(balances).find((k) => k.trim().toLowerCase() === target);
      if (found) return found;
      // Jika bank belum terdaftar di reportBank, buat entri agar mutasi tidak hilang
      balances[name.trim()] = {
        saldoAwal: 0,
        uangMasukKlien: 0,
        uangKeluarVendor: 0,
        uangKeluarOperasional: 0,
        piutang: 0,
        hutang: 0,
        saldoAkhir: 0,
      };
      return name.trim();
    };

    // 2. Akumulasi mutasi masuk dari Transaksi Klien
    db.transaksiKlien.forEach((k) => {
      const bayar = Number(k.pembayaranKlien) || 0;
      const nilai = Number(k.nilaiInvoice) || 0;
      const key = getBankKey(k.bank);
      if (key) {
        balances[key].uangMasukKlien += bayar;
        balances[key].saldoAkhir += bayar;
        if (nilai > bayar) {
          balances[key].piutang += nilai - bayar;
        }
      }
    });

    // 3. Akumulasi mutasi keluar ke Transaksi Vendor
    db.transaksiVendor.forEach((v) => {
      const bayar = Number(v.pembayaran) || 0;
      const nilai = Number(v.nilaiTransaksi) || 0;
      const key = getBankKey(v.bank);
      if (key) {
        balances[key].uangKeluarVendor += bayar;
        balances[key].saldoAkhir -= bayar;
        if (nilai > bayar) {
          balances[key].hutang += nilai - bayar;
        }
      }
    });

    // 4. Akumulasi mutasi keluar biaya Operasional
    db.operasional.forEach((o) => {
      const bayar = Number(o.pembayaran) || 0;
      const key = getBankKey(o.bank);
      if (key) {
        balances[key].uangKeluarOperasional += bayar;
        balances[key].saldoAkhir -= bayar;
      }
    });

    return balances;
  }, [db.reportBank, db.transaksiKlien, db.transaksiVendor, db.operasional]);

  // Akumulasi total saldo kas & bank dari SELURUH rekening yang terdaftar di sistem
  const totalAccumulatedBankBalance = useMemo(() => {
    return Object.values(bankBalances).reduce(
      (sum, b) => sum + (Number(b.saldoAkhir) || 0),
      0
    );
  }, [bankBalances]);

  // Aktual Cash Balance merefleksikan akumulasi seluruh rekening bank
  const aktualCashBalance = totalAccumulatedBankBalance;

  // KPIs
  const kpis = useMemo(() => {
    let totalOmset = 0;
    let totalModalAwal = 0;
    let totalPiutang = 0;
    let invoiceOpen = 0;
    let invoiceClosed = 0;

    db.transaksiKlien.forEach((k) => {
      const n = Number(k.nilaiInvoice) || 0;
      const b = Number(k.pembayaranKlien) || 0;
      const mAwal = Number(k.modalAwal) || 0;

      totalOmset += n;
      totalModalAwal += mAwal;
      if (n > b) totalPiutang += n - b;

      const stat = String(k.status || '').toLowerCase();
      if (stat === 'lunas') {
        invoiceClosed++;
      } else {
        invoiceOpen++;
      }
    });

    let totalHutang = 0;
    let totalModalAkhir = 0;
    db.transaksiVendor.forEach((v) => {
      const n = Number(v.nilaiTransaksi) || 0;
      const b = Number(v.pembayaran) || 0;
      if (n > b) totalHutang += n - b;
      totalModalAkhir += n;
    });

    let totalOperasional = 0;
    db.operasional.forEach((o) => {
      totalOperasional += Number(o.pembayaran) || 0;
    });

    // 1. Saldo Bank: Akumulasi saldo akhir dari seluruh rekening bank yang terdaftar di sistem
    const saldoBank = Object.values(bankBalances).reduce(
      (sum, b) => sum + (Number(b.saldoAkhir) || 0),
      0
    );

    // 2. Komitmen Modal Awal untuk invoice proyek yang masih aktif/berjalan (Open: DP atau Tempo)
    let modalAwalOpen = 0;
    db.transaksiKlien.forEach((k) => {
      const stat = String(k.status || '').toLowerCase();
      if (stat !== 'lunas') {
        modalAwalOpen += Number(k.modalAwal) || 0;
      }
    });

    // Free cash revisi: Total Saldo Bank - Hutang Vendor - Modal Awal - Beban Operasional
    const freeCash = saldoBank - totalHutang - totalModalAwal - totalOperasional;
    const grossMargin = totalOmset - totalModalAkhir;

    const freeCashBreakdown = {
      saldoBank,
      totalHutang,
      totalModalAwal,
      totalOperasional,
      freeCash,
    };

    return {
      saldoBank,
      freeCash,
      modalAwalOpen,
      totalOmset,
      grossMargin,
      totalOperasional,
      totalPiutang,
      totalHutang,
      totalModalAwal,
      totalModalAkhir,
      invoiceOpen,
      invoiceClosed,
      freeCashBreakdown,
    };
  }, [db, bankBalances]);

  // Transaksi Klien Handlers
  const saveKlien = (item: TransaksiKlien) => {
    setDb((prev) => {
      const idx = prev.transaksiKlien.findIndex((r) => r.id === item.id);
      let updated: TransaksiKlien[];
      if (idx > -1) {
        updated = [...prev.transaksiKlien];
        updated[idx] = item;
      } else {
        updated = [item, ...prev.transaksiKlien];
      }
      return { ...prev, transaksiKlien: updated };
    });
    showToast(`Data Transaksi Klien ${item.invoice} tersimpan.`);
  };

  const deleteKlien = (id: string) => {
    setDb((prev) => ({
      ...prev,
      transaksiKlien: prev.transaksiKlien.filter((r) => r.id !== id),
    }));
    showToast('Data Transaksi Klien berhasil dihapus.');
  };

  const deleteMultipleKlien = (ids: string[]) => {
    setDb((prev) => ({
      ...prev,
      transaksiKlien: prev.transaksiKlien.filter((r) => !ids.includes(r.id)),
    }));
    showToast(`${ids.length} data Transaksi Klien dihapus.`);
  };

  // Transaksi Vendor Handlers
  const saveVendor = (item: TransaksiVendor) => {
    setDb((prev) => {
      const idx = prev.transaksiVendor.findIndex((r) => r.id === item.id);
      let updated: TransaksiVendor[];
      if (idx > -1) {
        updated = [...prev.transaksiVendor];
        updated[idx] = item;
      } else {
        updated = [item, ...prev.transaksiVendor];
      }
      return { ...prev, transaksiVendor: updated };
    });
    showToast(`Data Transaksi Vendor (${item.namaVendor}) tersimpan.`);
  };

  const deleteVendor = (id: string) => {
    setDb((prev) => ({
      ...prev,
      transaksiVendor: prev.transaksiVendor.filter((r) => r.id !== id),
    }));
    showToast('Data Transaksi Vendor berhasil dihapus.');
  };

  const deleteMultipleVendor = (ids: string[]) => {
    setDb((prev) => ({
      ...prev,
      transaksiVendor: prev.transaksiVendor.filter((r) => !ids.includes(r.id)),
    }));
    showToast(`${ids.length} data Transaksi Vendor dihapus.`);
  };

  // Operasional Handlers
  const saveOperasional = (item: Operasional) => {
    setDb((prev) => {
      const idx = prev.operasional.findIndex((r) => r.id === item.id);
      let updated: Operasional[];
      if (idx > -1) {
        updated = [...prev.operasional];
        updated[idx] = item;
      } else {
        updated = [item, ...prev.operasional];
      }
      return { ...prev, operasional: updated };
    });
    showToast(`Data Operasional "${item.pengeluaran}" tersimpan.`);
  };

  const deleteOperasional = (id: string) => {
    setDb((prev) => ({
      ...prev,
      operasional: prev.operasional.filter((r) => r.id !== id),
    }));
    showToast('Data Operasional berhasil dihapus.');
  };

  const deleteMultipleOperasional = (ids: string[]) => {
    setDb((prev) => ({
      ...prev,
      operasional: prev.operasional.filter((r) => !ids.includes(r.id)),
    }));
    showToast(`${ids.length} data Operasional dihapus.`);
  };

  // Master Vendor Handlers
  const saveMasterVendor = (item: MasterVendor) => {
    setDb((prev) => {
      const idx = prev.masterVendor.findIndex((r) => r.id === item.id);
      let updated: MasterVendor[];
      if (idx > -1) {
        updated = [...prev.masterVendor];
        updated[idx] = item;
      } else {
        updated = [item, ...prev.masterVendor];
      }
      return { ...prev, masterVendor: updated };
    });
    showToast(`Master Vendor "${item.namaVendor}" tersimpan.`);
  };

  const deleteMasterVendor = (id: string) => {
    setDb((prev) => ({
      ...prev,
      masterVendor: prev.masterVendor.filter((r) => r.id !== id),
    }));
    showToast('Master Vendor dihapus.');
  };

  // Report Bank Handlers
  const saveBank = (item: ReportBank) => {
    setDb((prev) => {
      const idx = prev.reportBank.findIndex((r) => r.id === item.id);
      let updated: ReportBank[];
      if (idx > -1) {
        updated = [...prev.reportBank];
        updated[idx] = item;
      } else {
        updated = [item, ...prev.reportBank];
      }
      return { ...prev, reportBank: updated };
    });
    showToast(`Rekening Bank "${item.namaBank}" tersimpan.`);
  };

  const deleteBank = (id: string) => {
    setDb((prev) => ({
      ...prev,
      reportBank: prev.reportBank.filter((r) => r.id !== id),
    }));
    showToast('Rekening Bank dihapus.');
  };

  // Ketentuan Handlers
  const saveKetentuan = (item: KetentuanItem) => {
    setDb((prev) => {
      const currentList = prev.ketentuan || DEFAULT_KETENTUAN;
      const idx = currentList.findIndex((r) => r.id === item.id);
      let updated: KetentuanItem[];
      if (idx > -1) {
        updated = [...currentList];
        updated[idx] = item;
      } else {
        updated = [item, ...currentList];
      }
      return { ...prev, ketentuan: updated };
    });
    showToast(`Ketentuan "${item.judul}" berhasil disimpan.`);
  };

  const deleteKetentuan = (id: string) => {
    setDb((prev) => {
      const currentList = prev.ketentuan || DEFAULT_KETENTUAN;
      return {
        ...prev,
        ketentuan: currentList.filter((r) => r.id !== id),
      };
    });
    showToast('Ketentuan berhasil dihapus.');
  };

  // Reset & Clear Handlers
  const resetData = () => {
    setDb(INITIAL_DATABASE);
    showToast('Data telah direset ke kondisi default (kosong).');
  };

  const clearAll = () => {
    setDb({
      transaksiKlien: [],
      transaksiVendor: [],
      operasional: [],
      masterVendor: [],
      reportBank: [],
      aktualCash: [],
      ketentuan: DEFAULT_KETENTUAN,
    });
    showToast('Seluruh data transaksi telah dikosongkan.');
  };

  const importDatabase = (newData: DatabaseState) => {
    setDb({
      transaksiKlien: newData.transaksiKlien || [],
      transaksiVendor: newData.transaksiVendor || [],
      operasional: newData.operasional || [],
      masterVendor: newData.masterVendor || [],
      reportBank: newData.reportBank || [],
      aktualCash: newData.aktualCash || [],
      ketentuan: newData.ketentuan || DEFAULT_KETENTUAN,
    });
    showToast('Database berhasil diimpor!');
  };

  // Cross-module payment recording
  const recordKlienPayment = (klienId: string, additionalAmount: number, targetBank?: string) => {
    const amount = Number(additionalAmount) || 0;
    if (amount <= 0) return;

    setDb((prev) => {
      const updated = prev.transaksiKlien.map((k) => {
        if (k.id === klienId) {
          const newBayar = (Number(k.pembayaranKlien) || 0) + amount;
          const nilai = Number(k.nilaiInvoice) || 0;
          let newStatus = k.status;
          if (newBayar >= nilai) {
            newStatus = 'Lunas';
          } else if (newBayar > 0) {
            newStatus = 'DP';
          }
          return {
            ...k,
            pembayaranKlien: newBayar,
            status: newStatus,
            bank: targetBank || k.bank,
          };
        }
        return k;
      });
      return { ...prev, transaksiKlien: updated };
    });
    showToast(`Penerimaan pembayaran piutang klien berhasil dicatat.`);
  };

  const recordVendorPayment = (vendorId: string, additionalAmount: number, targetBank?: string) => {
    const amount = Number(additionalAmount) || 0;
    if (amount <= 0) return;

    setDb((prev) => {
      const updated = prev.transaksiVendor.map((v) => {
        if (v.id === vendorId) {
          const newBayar = (Number(v.pembayaran) || 0) + amount;
          const nilai = Number(v.nilaiTransaksi) || 0;
          let newStatus = v.status;
          if (newBayar >= nilai) {
            newStatus = 'Lunas';
          } else if (newBayar > 0) {
            newStatus = 'DP';
          }
          return {
            ...v,
            pembayaran: newBayar,
            status: newStatus,
            bank: targetBank || v.bank,
          };
        }
        return v;
      });
      return { ...prev, transaksiVendor: updated };
    });
    showToast(`Pembayaran hutang vendor berhasil dicatat.`);
  };

  return (
    <FinancialContext.Provider
      value={{
        db,
        currentPage,
        setCurrentPage,
        toastMessage,
        showToast,
        saveKlien,
        deleteKlien,
        deleteMultipleKlien,
        saveVendor,
        deleteVendor,
        deleteMultipleVendor,
        saveOperasional,
        deleteOperasional,
        deleteMultipleOperasional,
        saveMasterVendor,
        deleteMasterVendor,
        saveBank,
        deleteBank,
        saveKetentuan,
        deleteKetentuan,
        saveAktualCash,
        aktualCashBalance,
        bankBalances,
        kpis,
        navParams,
        navigateWithParams,
        clearNavParams,
        recordKlienPayment,
        recordVendorPayment,
        resetData,
        clearAll,
        importDatabase,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
