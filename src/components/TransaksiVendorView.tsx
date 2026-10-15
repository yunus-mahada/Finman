import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Trash2,
  Plus,
  Edit2,
  ShoppingCart,
  X,
  Calendar,
  Coins,
  ExternalLink,
  Users,
  Filter,
  FilterX,
  ArrowUpDown,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { TransaksiVendor, PaymentStatus, MasterVendor } from '../types';
import { formatRp, exportToCsv, generateId, getDateRangePreset } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { PaymentRecordModal } from './PaymentRecordModal';

export const TransaksiVendorView: React.FC = () => {
  const {
    db,
    saveVendor,
    deleteVendor,
    deleteMultipleVendor,
    saveMasterVendor,
    navParams,
    navigateWithParams,
    clearNavParams,
  } = useFinancial();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'>('all');

  // Category Filters
  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');
  const [filterVendor, setFilterVendor] = useState<'all' | string>('all');
  const [filterBank, setFilterBank] = useState<'all' | string>('all');
  const [filterOnlyOutstanding, setFilterOnlyOutstanding] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'invoice_asc' | 'vendor_asc' | 'nilai_desc' | 'hutang_desc'>('date_desc');

  // Modal Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TransaksiVendor | null>(null);

  // Quick Master Vendor Add Modal State
  const [isQuickVendorOpen, setIsQuickVendorOpen] = useState(false);
  const [quickVendorName, setQuickVendorName] = useState('');
  const [quickVendorPhone, setQuickVendorPhone] = useState('');
  const [quickVendorRekening, setQuickVendorRekening] = useState('');

  // Payment Recording Target Modal
  const [paymentModalTarget, setPaymentModalTarget] = useState<{
    id: string;
    type: 'Hutang';
    invoice: string;
    nama: string;
    totalNilai: number;
    sudahBayar: number;
    sisaOutstanding: number;
    currentBank?: string;
  } | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formNamaVendor, setFormNamaVendor] = useState('');
  const [formNilaiTransaksi, setFormNilaiTransaksi] = useState('');
  const [formPembayaran, setFormPembayaran] = useState('');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('DP');
  const [formBank, setFormBank] = useState('');

  // Handle incoming cross-menu navParams
  useEffect(() => {
    if (navParams) {
      if (navParams.searchTerm) {
        setSearchTerm(navParams.searchTerm);
      }
      if (navParams.prefillVendor) {
        setSearchTerm(navParams.prefillVendor);
        setFilterVendor(navParams.prefillVendor);
        setFormNamaVendor(navParams.prefillVendor);
      }
      if (navParams.prefillInvoice) {
        setFormInvoice(navParams.prefillInvoice);
        setSearchTerm(navParams.prefillInvoice);
      }
      if (navParams.openAddModal) {
        handleOpenAdd();
        if (navParams.prefillInvoice) {
          setFormInvoice(navParams.prefillInvoice);
        }
      }
      clearNavParams();
    }
  }, [navParams]);

  // Confirmation Modals
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Unique list of Client Invoices for autocomplete helper
  const clientInvoiceList = useMemo(() => {
    return Array.from(new Set(db.transaksiKlien.map((k) => k.invoice).filter(Boolean)));
  }, [db.transaksiKlien]);

  // Dynamic vendor and bank options
  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    db.masterVendor.forEach((mv) => {
      if (mv.namaVendor) set.add(mv.namaVendor.trim());
    });
    db.transaksiVendor.forEach((tv) => {
      if (tv.namaVendor) set.add(tv.namaVendor.trim());
    });
    return Array.from(set).sort();
  }, [db.masterVendor, db.transaksiVendor]);

  const bankOptions = useMemo(() => {
    return db.reportBank.map((b) => b.namaBank);
  }, [db.reportBank]);

  // Date preset handler
  const handleApplyDatePreset = (preset: 'all' | 'this_month' | 'last_month' | 'this_year') => {
    setActiveDatePreset(preset);
    const range = getDateRangePreset(preset);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset('all');
    setFilterStatus('all');
    setFilterVendor('all');
    setFilterBank('all');
    setFilterOnlyOutstanding(false);
    setSortBy('date_desc');
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    searchTerm ||
      startDate ||
      endDate ||
      activeDatePreset !== 'all' ||
      filterStatus !== 'all' ||
      filterVendor !== 'all' ||
      filterBank !== 'all' ||
      filterOnlyOutstanding
  );

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return db.transaksiVendor
      .filter((row) => {
        // Text Search
        const matchSearch =
          !searchTerm ||
          [row.invoice, row.namaVendor, row.status, row.bank].some(
            (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
          );

        // Date Range
        let matchDate = true;
        if (startDate && row.tanggal < startDate) matchDate = false;
        if (endDate && row.tanggal > endDate) matchDate = false;

        // Status Category
        const matchStatus = filterStatus === 'all' || row.status === filterStatus;

        // Vendor Category
        const matchVendor = filterVendor === 'all' || row.namaVendor === filterVendor;

        // Bank
        const matchBank = filterBank === 'all' || row.bank === filterBank;

        // Only Outstanding
        const n = Number(row.nilaiTransaksi) || 0;
        const b = Number(row.pembayaran) || 0;
        const hutang = Math.max(0, n - b);
        const matchOutstanding = !filterOnlyOutstanding || hutang > 0;

        return (
          matchSearch &&
          matchDate &&
          matchStatus &&
          matchVendor &&
          matchBank &&
          matchOutstanding
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') return a.tanggal.localeCompare(b.tanggal);
        if (sortBy === 'date_desc') return b.tanggal.localeCompare(a.tanggal);
        if (sortBy === 'invoice_asc') return a.invoice.localeCompare(b.invoice);
        if (sortBy === 'vendor_asc') return a.namaVendor.localeCompare(b.namaVendor);
        if (sortBy === 'nilai_desc')
          return (Number(b.nilaiTransaksi) || 0) - (Number(a.nilaiTransaksi) || 0);
        if (sortBy === 'hutang_desc') {
          const hA = Math.max(0, (Number(a.nilaiTransaksi) || 0) - (Number(a.pembayaran) || 0));
          const hB = Math.max(0, (Number(b.nilaiTransaksi) || 0) - (Number(b.pembayaran) || 0));
          return hB - hA;
        }
        return 0;
      });
  }, [
    db.transaksiVendor,
    searchTerm,
    startDate,
    endDate,
    filterStatus,
    filterVendor,
    filterBank,
    filterOnlyOutstanding,
    sortBy,
  ]);

  // Aggregate stats
  const aggregates = useMemo(() => {
    let totalTransaksi = 0;
    let totalBayar = 0;
    let totalHutang = 0;

    filteredData.forEach((row) => {
      const n = Number(row.nilaiTransaksi) || 0;
      const b = Number(row.pembayaran) || 0;
      totalTransaksi += n;
      totalBayar += b;
      if (n > b) totalHutang += n - b;
    });

    return {
      totalTransaksi,
      totalBayar,
      totalHutang,
    };
  }, [filteredData]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormId(generateId('VND'));
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormInvoice(clientInvoiceList[0] || '');
    setFormNamaVendor(db.masterVendor[0]?.namaVendor || '');
    setFormNilaiTransaksi('');
    setFormPembayaran('');
    setFormStatus('DP');
    setFormBank(db.reportBank[0]?.namaBank || '');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: TransaksiVendor) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormTanggal(item.tanggal);
    setFormInvoice(item.invoice);
    setFormNamaVendor(item.namaVendor);
    setFormNilaiTransaksi(item.nilaiTransaksi.toString());
    setFormPembayaran(item.pembayaran.toString());
    setFormStatus(item.status);
    setFormBank(item.bank || '');
    setIsFormOpen(true);
  };

  // Form Submit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const item: TransaksiVendor = {
      id: formId,
      tanggal: formTanggal,
      invoice: formInvoice.trim(),
      namaVendor: formNamaVendor.trim(),
      nilaiTransaksi: Number(formNilaiTransaksi) || 0,
      pembayaran: Number(formPembayaran) || 0,
      status: formStatus,
      bank: formBank,
    };

    saveVendor(item);
    setIsFormOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Tanggal',
      'Ref Invoice Klien',
      'Nama Vendor',
      'Nilai Transaksi',
      'Pembayaran ke Vendor',
      'Sisa Hutang',
      'Status',
      'Bank Pembayar',
    ];

    const rows = filteredData.map((r) => {
      const n = Number(r.nilaiTransaksi) || 0;
      const b = Number(r.pembayaran) || 0;
      return [
        r.id,
        r.tanggal,
        r.invoice,
        r.namaVendor,
        n,
        b,
        Math.max(0, n - b),
        r.status,
        r.bank,
      ];
    });

    exportToCsv('Transaksi_Vendor', headers, rows);
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    const ids = filteredData.map((d) => d.id);
    deleteMultipleVendor(ids);
    setIsBulkDeleteOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
      {/* Top Controls & Filter Panel */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 shadow-lg space-y-2.5 w-full min-w-0">
        {/* Tier 1: Primary Search Bar & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Enhanced Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/70 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari invoice, nama vendor, status, atau bank..."
              className="w-full bg-[#0E0C1C] border border-blue-500/25 rounded-lg pl-8.5 pr-8 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition"
                title="Hapus kata kunci pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 justify-end shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-[#252140] hover:bg-[#2F2A52] border border-blue-500/20 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs active:scale-95 shrink-0"
              title="Download Data Terfilter ke Spreadsheet CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {filteredData.length > 0 && hasActiveFilters && (
              <button
                onClick={() => setIsBulkDeleteOpen(true)}
                className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 shrink-0"
                title="Hapus Data Terfilter"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Hapus ({filteredData.length})</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 border border-blue-400/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-blue-900/30 transition active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Vendor</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Date Filters (Presets + Custom Range) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-white/5">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Tanggal:
            </span>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeDatePreset === 'all' && !startDate && !endDate
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              Semua Waktu
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('this_month')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeDatePreset === 'this_month'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('last_month')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeDatePreset === 'last_month'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              Bulan Lalu
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('this_year')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeDatePreset === 'this_year'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              Tahun Ini
            </button>
          </div>

          {/* Custom Date Range Picker */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset('custom');
                }}
                className="bg-[#0E0C1C] border border-blue-500/20 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-400 w-32 sm:w-36"
                title="Tanggal Mulai"
              />
            </div>
            <span className="text-slate-500 text-xs">s/d</span>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset('custom');
                }}
                className="bg-[#0E0C1C] border border-blue-500/20 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-400 w-32 sm:w-36"
                title="Tanggal Akhir"
              />
            </div>
          </div>
        </div>

        {/* Tier 3: Category & Status Dropdown Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Status Pembayaran */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-[#0E0C1C] border border-blue-500/25 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="DP">DP (Uang Muka)</option>
                <option value="Tempo">Tempo (Belum Bayar)</option>
              </select>
            </div>

            {/* Filter Nama Vendor */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Vendor:</span>
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="bg-[#0E0C1C] border border-blue-500/25 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-400 cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Semua Vendor</option>
                {vendorOptions.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Rekening Bank Sumber Pembayaran */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Bank:</span>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="bg-[#0E0C1C] border border-blue-500/25 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-400 cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Semua Bank</option>
                {bankOptions.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Toggle: Hanya Hutang Terbuka */}
            <button
              type="button"
              onClick={() => setFilterOnlyOutstanding(!filterOnlyOutstanding)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                filterOnlyOutstanding
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                  : 'bg-[#0E0C1C] text-slate-400 border-blue-500/20 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-rose-400" />
              <span>Hanya Hutang</span>
            </button>
          </div>

          {/* Sort By & Reset */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0E0C1C] border border-blue-500/25 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="date_desc">Tgl Terbaru</option>
                <option value="date_asc">Tgl Terlama</option>
                <option value="invoice_asc">Invoice A-Z</option>
                <option value="vendor_asc">Vendor A-Z</option>
                <option value="nilai_desc">Nilai Terbesar</option>
                <option value="hutang_desc">Hutang Terbesar</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 transition"
                title="Hapus semua filter dan reset ke tampilan awal"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 4: Active Filter Chips & Summary Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
            <span>
              Menampilkan <strong className="text-white font-mono">{filteredData.length}</strong>{' '}
              dari <span className="font-mono">{db.transaksiVendor.length}</span> transaksi
            </span>

            {/* Chips */}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Cari: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterVendor !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Vendor: {filterVendor}
                <button onClick={() => setFilterVendor('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterBank !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Bank: {filterBank}
                <button onClick={() => setFilterBank('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Tgl: {startDate || 'Awal'} s/d {endDate || 'Sekarang'}
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setActiveDatePreset('all');
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterOnlyOutstanding && (
              <span className="inline-flex items-center gap-1 bg-rose-950/60 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Hanya Hutang
                <button
                  onClick={() => setFilterOnlyOutstanding(false)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Quick Aggregate summary preview */}
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <div>
              Total Pengadaan:{' '}
              <span className="font-mono font-semibold text-blue-300">
                {formatRp(aggregates.totalTransaksi)}
              </span>
            </div>
            {aggregates.totalHutang > 0 && (
              <div>
                Hutang:{' '}
                <span className="font-mono font-semibold text-rose-400">
                  {formatRp(aggregates.totalHutang)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-[#16132A] border border-white/5 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium uppercase">
            Total Pengadaan Vendor (HPP)
          </span>
          <p className="text-sm font-bold text-white font-mono mt-0.5">
            {formatRp(aggregates.totalTransaksi)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-lg p-2.5">
          <span className="text-[10px] text-emerald-400 font-medium uppercase">
            Total Terbayar ke Vendor
          </span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {formatRp(aggregates.totalBayar)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-lg p-2.5">
          <span className="text-[10px] text-rose-400 font-medium uppercase">
            Total Sisa Hutang Vendor
          </span>
          <p className="text-sm font-bold text-rose-400 font-mono mt-0.5">
            {formatRp(aggregates.totalHutang)}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl overflow-hidden shadow-md w-full min-w-0">
        <div className="px-3.5 py-2 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 bg-black/25">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300">Tabel Transaksi Vendor</span>
            <span className="text-blue-300 font-mono text-[10px] bg-blue-950/60 border border-blue-500/30 px-1.5 py-0.5 rounded">
              {filteredData.length} baris
            </span>
          </div>
          <span className="text-[10px] text-blue-300/80 font-medium flex items-center gap-1">
            Geser tabel ke samping untuk melihat rincian & aksi &rarr;
          </span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[850px]">
            <thead>
              <tr className="bg-black/40 text-blue-200/80 uppercase tracking-wider border-b border-white/5 font-semibold text-[10px]">
                <th className="px-3 py-2.5 text-emerald-300">Tanggal</th>
                <th className="px-3 py-2.5">Ref. Invoice Klien</th>
                <th className="px-3 py-2.5">Nama Vendor</th>
                <th className="px-3 py-2.5 text-right">Nilai Transaksi</th>
                <th className="px-3 py-2.5 text-right text-emerald-400">Pembayaran</th>
                <th className="px-3 py-2.5 text-right text-rose-400">Sisa Hutang</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center">Bank Pembayar</th>
                <th className="sticky right-0 bg-[#14182E] z-20 px-3 py-2.5 text-center border-l border-white/10 shadow-[-4px_0_8px_rgba(0,0,0,0.35)]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 italic">
                    Belum ada data atau tidak ada yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const n = Number(row.nilaiTransaksi) || 0;
                  const b = Number(row.pembayaran) || 0;
                  const sisaHutang = Math.max(0, n - b);
                  const linkedKlien = db.transaksiKlien.find((k) => k.invoice === row.invoice);

                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition group">
                      <td className="px-3 py-2 text-emerald-300 font-mono font-medium text-xs">
                        {row.tanggal}
                      </td>
                      <td className="px-3 py-2 font-semibold text-white font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{row.invoice || '-'}</span>
                          {linkedKlien && (
                            <button
                              type="button"
                              onClick={() => navigateWithParams('klien', { searchTerm: row.invoice })}
                              className="text-[9px] text-purple-300 bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/20 px-1.5 py-0.2 rounded font-sans flex items-center gap-0.5 transition"
                              title={`Klien: ${linkedKlien.klien} (${linkedKlien.brand || 'Proyek'}). Klik untuk buka detail di Transaksi Klien`}
                            >
                              <span className="truncate max-w-[90px]">{linkedKlien.klien}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-200 font-medium text-xs">
                        {row.namaVendor}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-white text-xs">
                        {formatRp(n)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-400 font-medium text-xs">
                        {formatRp(b)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-rose-400 font-bold bg-rose-950/10 text-xs">
                        {formatRp(sisaHutang)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            row.status === 'Lunas'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                              : row.status === 'DP'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400 text-xs">
                        {row.bank || '-'}
                      </td>
                      <td className="sticky right-0 bg-[#1A1731] group-hover:bg-[#201D3D] z-10 px-3 py-2 text-center border-l border-white/10 shadow-[-4px_0_8px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-center gap-1.5">
                          {sisaHutang > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPaymentModalTarget({
                                  id: row.id,
                                  type: 'Hutang',
                                  invoice: row.invoice,
                                  nama: row.namaVendor,
                                  totalNilai: n,
                                  sudahBayar: b,
                                  sisaOutstanding: sisaHutang,
                                  currentBank: row.bank,
                                })
                              }
                              className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/30 transition"
                              title="Catat Pembayaran Hutang ke Vendor"
                            >
                              <Coins className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/30 transition"
                            title="Edit Transaksi Vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(row.id)}
                            className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/30 transition"
                            title="Hapus Transaksi Vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#16132A] rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Transaksi Vendor' : 'Tambah Transaksi Vendor'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-blue-300 uppercase tracking-wider mb-1">
                  ID Sistem (Auto)
                </label>
                <input
                  type="text"
                  value={formId}
                  readOnly
                  className="w-full bg-[#0E0C1C]/60 border border-blue-500/20 rounded-xl px-3.5 py-2 text-xs text-blue-300/70 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                  Tanggal Transaksi Vendor *
                </label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  required
                  className="w-full bg-[#0E0C1C] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Ref. Invoice Klien *
                </label>
                <input
                  type="text"
                  value={formInvoice}
                  onChange={(e) => setFormInvoice(e.target.value)}
                  placeholder="Contoh: A418"
                  list="client-invoices-list"
                  required
                  className="w-full bg-[#0E0C1C] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-400 font-mono"
                />
                <datalist id="client-invoices-list">
                  {clientInvoiceList.map((inv) => (
                    <option key={inv} value={inv} />
                  ))}
                </datalist>

                {/* Live Client Project Preview Box */}
                {(() => {
                  const matched = db.transaksiKlien.find(
                    (k) => String(k.invoice || '').trim() === String(formInvoice || '').trim()
                  );
                  if (!matched) return (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ketik nomor invoice klien untuk mengaitkan pengadaan ini ke proyek klien.
                    </p>
                  );

                  const existingHPP = db.transaksiVendor
                    .filter((v) => String(v.invoice || '').trim() === String(formInvoice || '').trim() && v.id !== formId)
                    .reduce((sum, v) => sum + (Number(v.nilaiTransaksi) || 0), 0);

                  return (
                    <div className="mt-2 bg-[#120F24] border border-blue-500/30 rounded-xl p-2.5 text-xs space-y-1 animate-in fade-in">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Klien Terhubung: <strong className="text-emerald-300">{matched.klien}</strong></span>
                        <span className="text-[11px] text-purple-300 font-mono font-semibold">{matched.brand || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-white/5">
                        <span>Nilai Invoice: <strong className="text-white font-mono">{formatRp(matched.nilaiInvoice)}</strong></span>
                        <span>HPP Terpasang: <strong className="text-blue-300 font-mono">{formatRp(existingHPP)}</strong></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Nama Vendor (Master) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickVendorOpen(true)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold underline"
                  >
                    <Plus className="w-3 h-3" /> Rekanan Baru
                  </button>
                </div>
                <select
                  value={formNamaVendor}
                  onChange={(e) => setFormNamaVendor(e.target.value)}
                  required
                  className="w-full bg-[#0E0C1C] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-400"
                >
                  <option value="">-- Pilih Rekanan Vendor --</option>
                  {db.masterVendor.map((mv) => (
                    <option key={mv.id} value={mv.namaVendor}>
                      {mv.namaVendor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nilai Transaksi Vendor (Rp) *
                </label>
                <input
                  type="number"
                  value={formNilaiTransaksi}
                  onChange={(e) => setFormNilaiTransaksi(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full bg-[#0E0C1C] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                  Pembayaran Terbayar ke Vendor (Rp)
                </label>
                <input
                  type="number"
                  value={formPembayaran}
                  onChange={(e) => setFormPembayaran(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#0E0C1C] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                    className="w-full bg-[#0E0C1C] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-400"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="DP">DP</option>
                    <option value="Tempo">Tempo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Bank Pembayar
                  </label>
                  <select
                    value={formBank}
                    onChange={(e) => setFormBank(e.target.value)}
                    className="w-full bg-[#0E0C1C] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-blue-400"
                  >
                    <option value="">-- Pilih Bank --</option>
                    {db.reportBank.map((b) => (
                      <option key={b.id} value={b.namaBank}>
                        {b.namaBank}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition"
                >
                  Simpan Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Hapus Transaksi Vendor?"
        message="Transaksi vendor ini akan dihapus. Perhitungan hutang dan modal akhir klien terkait akan disesuaikan otomatis."
        confirmLabel="Ya, Hapus"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteVendor(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Hapus ${filteredData.length} Data Transaksi Vendor?`}
        message="Semua transaksi vendor yang sesuai dengan filter pencarian dan rentang tanggal akan dihapus sekaligus."
        confirmLabel={`Ya, Hapus ${filteredData.length} Data`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      {/* Payment Recording Modal */}
      <PaymentRecordModal
        target={paymentModalTarget}
        onClose={() => setPaymentModalTarget(null)}
      />

      {/* Quick Add Master Vendor Modal */}
      {isQuickVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#16132A] rounded-2xl border border-emerald-500/40 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Tambah Rekanan Vendor Baru</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickVendorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickVendorName.trim()) return;
                const newMv: MasterVendor = {
                  id: generateId('MST'),
                  namaVendor: quickVendorName.trim(),
                  noTlp: quickVendorPhone.trim(),
                  noRekening: quickVendorRekening.trim(),
                };
                saveMasterVendor(newMv);
                setFormNamaVendor(newMv.namaVendor);
                setIsQuickVendorOpen(false);
                setQuickVendorName('');
                setQuickVendorPhone('');
                setQuickVendorRekening('');
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Nama Vendor *
                </label>
                <input
                  type="text"
                  value={quickVendorName}
                  onChange={(e) => setQuickVendorName(e.target.value)}
                  placeholder="Contoh: Percetakan Harapan"
                  required
                  className="w-full bg-[#0E0C1C] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  No Telepon / WA
                </label>
                <input
                  type="text"
                  value={quickVendorPhone}
                  onChange={(e) => setQuickVendorPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-[#0E0C1C] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  No Rekening
                </label>
                <input
                  type="text"
                  value={quickVendorRekening}
                  onChange={(e) => setQuickVendorRekening(e.target.value)}
                  placeholder="BCA 12345..."
                  className="w-full bg-[#0E0C1C] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickVendorOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition"
                >
                  Simpan & Pilih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
