import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef } from 'react';
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
import {
  supabase,
  isSupabaseConfigured,
  fetchAllFromSupabase,
  pushAllToSupabase,
  mapKlienToSnake,
  mapVendorToSnake,
  mapOperasionalToSnake,
  mapMasterVendorToSnake,
  mapBankToSnake,
  mapAktualCashToSnake,
} from '../utils/supabaseClient';

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

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface FinancialContextType {
  db: DatabaseState;
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Supabase Silent & Background Status
  isSupabaseConfigured: boolean;
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  syncAllToSupabase: (customDb?: DatabaseState) => Promise<boolean>;
  refreshFromSupabase: (options?: { silent?: boolean }) => Promise<void>;

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

  // Background Sync States
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(isSupabaseConfigured);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured ? 'synced' : 'idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Ref to prevent overlapping fetch runs
  const isFetchingRef = useRef<boolean>(false);

  const navigateWithParams = (page: PageId, params?: NavigationParams) => {
    setNavParams(params || null);
    setCurrentPage(page);
  };

  const clearNavParams = () => {
    setNavParams(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Sync state to local storage as continuous fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed saving to localStorage', e);
    }
  }, [db]);

  // Silent & Background Refresh from Supabase
  const refreshFromSupabase = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!isSupabaseConfigured || !supabase) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const res = await fetchAllFromSupabase();
      if (res.success && res.data) {
        const fetched = res.data;
        const hasServerData =
          (fetched.transaksiKlien && fetched.transaksiKlien.length > 0) ||
          (fetched.reportBank && fetched.reportBank.length > 0) ||
          (fetched.transaksiVendor && fetched.transaksiVendor.length > 0) ||
          (fetched.operasional && fetched.operasional.length > 0) ||
          (fetched.masterVendor && fetched.masterVendor.length > 0);

        if (hasServerData) {
          setDb((prev) => ({
            ...prev,
            ...fetched,
            ketentuan: prev.ketentuan || DEFAULT_KETENTUAN,
          }));
        }

        setIsSupabaseConnected(true);
        setSyncStatus('synced');
        setLastSyncTime(new Date());

        if (!silent) {
          showToast('Data berhasil disegarkan dari Supabase.');
        }
      } else if (res.error) {
        console.warn('Supabase fetch notice:', res.error);
        setSyncStatus('error');
        if (!silent) {
          showToast(`Gagal memuat: ${res.error}`);
        }
      }
    } catch (e) {
      console.error('Failed to load Supabase data:', e);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      isFetchingRef.current = false;
    }
  };

  // Realtime & Periodic Background Sync Setup
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // 1. Initial silent load
    refreshFromSupabase({ silent: true });

    // 2. Realtime WebSocket listener on PostgreSQL changes
    const channel = supabase
      .channel('finman_db_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          // Subtle background sync when other users save data
          refreshFromSupabase({ silent: true });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSupabaseConnected(true);
        }
      });

    // 3. Fallback Periodic Silent Polling (Every 25 seconds when tab is active)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshFromSupabase({ silent: true });
      }
    }, 25000);

    // 4. Instant silent sync when user returns to this window
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshFromSupabase({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isSupabaseConfigured]);

  // Helper for silent asynchronous background mutation
  const triggerBackgroundMutation = (promise: Promise<any>) => {
    setSyncStatus('syncing');
    promise
      .then(({ error }) => {
        if (error) {
          console.error('Background sync error:', error);
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
          setLastSyncTime(new Date());
        }
      })
      .catch((err) => {
        console.error('Background network sync error:', err);
        setSyncStatus('error');
      });
  };

  // Upload/Push entire DB to Supabase
  const syncAllToSupabase = async (customDb?: DatabaseState): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      showToast('Konfigurasi Supabase URL / Anon Key belum terpasang.');
      return false;
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    showToast('Mengunggah seluruh data ke database Supabase...');

    const target = customDb || db;
    const res = await pushAllToSupabase(target);
    setIsSyncing(false);

    if (res.success) {
      setIsSupabaseConnected(true);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      showToast('Sukses! Seluruh data kini telah tersimpan di Supabase.');
      return true;
    } else {
      setIsSupabaseConnected(false);
      setSyncStatus('error');
      showToast(`Gagal kirim ke Supabase: ${res.error}`);
      return false;
    }
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

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('aktual_cash').upsert(mapAktualCashToSnake(newEntry), { onConflict: 'id' })
      );
    }

    showToast('Aktual Cash Balance berhasil diperbarui.');
  };

  // Dynamic Bank Balances
  const bankBalances = useMemo(() => {
    const balances: Record<string, BankCalculatedBalance> = {};

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

    const getBankKey = (name?: string): string | null => {
      if (!name || !name.trim()) return null;
      const target = name.trim().toLowerCase();
      const found = Object.keys(balances).find((k) => k.trim().toLowerCase() === target);
      if (found) return found;
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

  // KPIs
  const kpis = useMemo(() => {
    let totalSaldoBank = 0;
    Object.values(bankBalances).forEach((b) => {
      totalSaldoBank += b.saldoAkhir;
    });

    let totalHutang = 0;
    let totalModalAkhir = 0;
    db.transaksiVendor.forEach((v) => {
      const nilai = Number(v.nilaiTransaksi) || 0;
      const bayar = Number(v.pembayaran) || 0;
      totalModalAkhir += nilai;
      if (nilai > bayar) {
        totalHutang += nilai - bayar;
      }
    });

    let totalModalAwal = 0;
    let totalModalAwalOpen = 0;
    let totalOmset = 0;
    let totalPiutang = 0;
    let openCount = 0;
    let closedCount = 0;

    db.transaksiKlien.forEach((k) => {
      const nilai = Number(k.nilaiInvoice) || 0;
      const bayar = Number(k.pembayaranKlien) || 0;
      const modal = Number(k.modalAwal) || 0;

      totalOmset += nilai;
      totalModalAwal += modal;

      if (k.status === 'Lunas') {
        closedCount += 1;
      } else {
        openCount += 1;
        totalModalAwalOpen += modal;
      }

      if (nilai > bayar) {
        totalPiutang += nilai - bayar;
      }
    });

    let totalOperasional = 0;
    db.operasional.forEach((o) => {
      totalOperasional += Number(o.pembayaran) || 0;
    });

    const freeCash = totalSaldoBank - totalHutang - totalModalAwal - totalOperasional;
    const grossMargin = totalOmset - totalModalAkhir;

    return {
      saldoBank: totalSaldoBank,
      freeCash,
      modalAwalOpen: totalModalAwalOpen,
      totalOmset,
      grossMargin,
      totalOperasional,
      totalPiutang,
      totalHutang,
      totalModalAwal,
      totalModalAkhir,
      invoiceOpen: openCount,
      invoiceClosed: closedCount,
      freeCashBreakdown: {
        saldoBank: totalSaldoBank,
        totalHutang,
        totalModalAwal,
        totalOperasional,
        freeCash,
      },
    };
  }, [db, bankBalances]);

  const aktualCashBalance = useMemo(() => {
    if (db.aktualCash.length === 0) return 0;
    const sorted = [...db.aktualCash].sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
    return sorted[0].nilai;
  }, [db.aktualCash]);

  // Transaksi Klien Handlers
  const saveKlien = (item: TransaksiKlien) => {
    // 1. Instant optimistic update to local state (0ms latency for user)
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

    // 2. Silent background sync to Supabase
    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('transaksi_klien').upsert(mapKlienToSnake(item), { onConflict: 'id' })
      );
    }

    showToast(`Data Transaksi Klien ${item.invoice} tersimpan.`);
  };

  const deleteKlien = (id: string) => {
    setDb((prev) => ({
      ...prev,
      transaksiKlien: prev.transaksiKlien.filter((r) => r.id !== id),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('transaksi_klien').delete().eq('id', id)
      );
    }

    showToast('Data Transaksi Klien berhasil dihapus.');
  };

  const deleteMultipleKlien = (ids: string[]) => {
    setDb((prev) => ({
      ...prev,
      transaksiKlien: prev.transaksiKlien.filter((r) => !ids.includes(r.id)),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('transaksi_klien').delete().in('id', ids)
      );
    }

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

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('transaksi_vendor').upsert(mapVendorToSnake(item), { onConflict: 'id' })
      );
    }

    showToast(`Data Transaksi Vendor (${item.namaVendor}) tersimpan.`);
  };

  const deleteVendor = (id: string) => {
    setDb((prev) => ({
      ...prev,
      transaksiVendor: prev.transaksiVendor.filter((r) => r.id !== id),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('transaksi_vendor').delete().eq('id', id)
      );
    }

    showToast('Data Transaksi Vendor berhasil dihapus.');
  };

  const deleteMultipleVendor = (ids: string[]) => {
    setDb((prev) => ({
      ...prev,
      transaksiVendor: prev.transaksiVendor.filter((r) => !ids.includes(r.id)),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('transaksi_vendor').delete().in('id', ids)
      );
    }

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

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('operasional').upsert(mapOperasionalToSnake(item), { onConflict: 'id' })
      );
    }

    showToast(`Data Operasional "${item.pengeluaran}" tersimpan.`);
  };

  const deleteOperasional = (id: string) => {
    setDb((prev) => ({
      ...prev,
      operasional: prev.operasional.filter((r) => r.id !== id),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('operasional').delete().eq('id', id)
      );
    }

    showToast('Data Operasional berhasil dihapus.');
  };

  const deleteMultipleOperasional = (ids: string[]) => {
    setDb((prev) => ({
      ...prev,
      operasional: prev.operasional.filter((r) => !ids.includes(r.id)),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('operasional').delete().in('id', ids)
      );
    }

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

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('master_vendor').upsert(mapMasterVendorToSnake(item), { onConflict: 'id' })
      );
    }

    showToast(`Master Vendor "${item.namaVendor}" tersimpan.`);
  };

  const deleteMasterVendor = (id: string) => {
    setDb((prev) => ({
      ...prev,
      masterVendor: prev.masterVendor.filter((r) => r.id !== id),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('master_vendor').delete().eq('id', id)
      );
    }

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

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('report_bank').upsert(mapBankToSnake(item), { onConflict: 'id' })
      );
    }

    showToast(`Rekening Bank "${item.namaBank}" tersimpan.`);
  };

  const deleteBank = (id: string) => {
    setDb((prev) => ({
      ...prev,
      reportBank: prev.reportBank.filter((r) => r.id !== id),
    }));

    if (supabase) {
      triggerBackgroundMutation(
        supabase.from('report_bank').delete().eq('id', id)
      );
    }

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
    showToast('Data telah direset ke kondisi default.');
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
    showToast('Seluruh data transaksi lokal telah dikosongkan.');
  };

  const importDatabase = (newData: DatabaseState) => {
    const formatted: DatabaseState = {
      transaksiKlien: newData.transaksiKlien || [],
      transaksiVendor: newData.transaksiVendor || [],
      operasional: newData.operasional || [],
      masterVendor: newData.masterVendor || [],
      reportBank: newData.reportBank || [],
      aktualCash: newData.aktualCash || [],
      ketentuan: newData.ketentuan || DEFAULT_KETENTUAN,
    };
    setDb(formatted);
    showToast('Database berhasil diimpor!');

    if (isSupabaseConfigured) {
      syncAllToSupabase(formatted);
    }
  };

  // Cross-module payment recording
  const recordKlienPayment = (klienId: string, additionalAmount: number, targetBank?: string) => {
    const amount = Number(additionalAmount) || 0;
    if (amount <= 0) return;

    let updatedTarget: TransaksiKlien | null = null;
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
          const itemUpdated: TransaksiKlien = {
            ...k,
            pembayaranKlien: newBayar,
            status: newStatus,
            bank: targetBank || k.bank,
          };
          updatedTarget = itemUpdated;
          return itemUpdated;
        }
        return k;
      });
      return { ...prev, transaksiKlien: updated };
    });

    if (supabase && updatedTarget) {
      triggerBackgroundMutation(
        supabase.from('transaksi_klien').upsert(mapKlienToSnake(updatedTarget), { onConflict: 'id' })
      );
    }

    showToast(`Penerimaan pembayaran piutang klien berhasil dicatat.`);
  };

  const recordVendorPayment = (vendorId: string, additionalAmount: number, targetBank?: string) => {
    const amount = Number(additionalAmount) || 0;
    if (amount <= 0) return;

    let updatedTarget: TransaksiVendor | null = null;
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
          const itemUpdated: TransaksiVendor = {
            ...v,
            pembayaran: newBayar,
            status: newStatus,
            bank: targetBank || v.bank,
          };
          updatedTarget = itemUpdated;
          return itemUpdated;
        }
        return v;
      });
      return { ...prev, transaksiVendor: updated };
    });

    if (supabase && updatedTarget) {
      triggerBackgroundMutation(
        supabase.from('transaksi_vendor').upsert(mapVendorToSnake(updatedTarget), { onConflict: 'id' })
      );
    }

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
        isSupabaseConfigured,
        isSupabaseConnected,
        isSyncing,
        syncStatus,
        lastSyncTime,
        syncAllToSupabase,
        refreshFromSupabase,
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
