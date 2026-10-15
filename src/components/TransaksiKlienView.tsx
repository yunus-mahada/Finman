import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Trash2,
  Plus,
  Edit2,
  FileSpreadsheet,
  X,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Coins,
  Filter,
  FilterX,
  ArrowUpDown,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { TransaksiKlien, PaymentStatus } from '../types';
import { formatRp, exportToCsv, generateId, getDateRangePreset } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { PaymentRecordModal } from './PaymentRecordModal';

export const TransaksiKlienView: React.FC = () => {
  const {
    db,
    saveKlien,
    deleteKlien,
    deleteMultipleKlien,
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
  const [filterBrand, setFilterBrand] = useState<'all' | string>('all');
  const [filterBank, setFilterBank] = useState<'all' | string>('all');
  const [filterOnlyOutstanding, setFilterOnlyOutstanding] = useState(false);
  const [sortBy, setSortBy] = useState<
    | 'date_desc'
    | 'date_asc'
    | 'invoice_asc'
    | 'invoice_desc'
    | 'nilai_desc'
    | 'nilai_asc'
    | 'bayar_desc'
    | 'piutang_desc'
    | 'margin_desc'
  >('date_desc');

  // Expandable invoice drill-down (shows linked vendor bills)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  // Quick Payment Modal Target
  const [paymentModalTarget, setPaymentModalTarget] = useState<{
    id: string;
    type: 'Piutang';
    invoice: string;
    nama: string;
    totalNilai: number;
    sudahBayar: number;
    sisaOutstanding: number;
    currentBank?: string;
  } | null>(null);

  // Handle cross-menu navigation parameters
  useEffect(() => {
    if (navParams) {
      if (navParams.searchTerm) {
        setSearchTerm(navParams.searchTerm);
      }
      if (navParams.prefillInvoice) {
        setSearchTerm(navParams.prefillInvoice);
        setExpandedInvoice(navParams.prefillInvoice);
      }
      if (navParams.openAddModal) {
        handleOpenAdd();
      }
      clearNavParams();
    }
  }, [navParams]);

  // Modal Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TransaksiKlien | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formKlien, setFormKlien] = useState('');
  const [formSales, setFormSales] = useState('');
  const [formNilaiInvoice, setFormNilaiInvoice] = useState('');
  const [formModalAwal, setFormModalAwal] = useState('');
  const [formPembayaranKlien, setFormPembayaranKlien] = useState('');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('DP');
  const [formBank, setFormBank] = useState('');

  // Confirmation Modals
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Dynamic category options
  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    db.transaksiKlien.forEach((k) => {
      if (k.brand) set.add(k.brand.trim());
    });
    return Array.from(set).sort();
  }, [db.transaksiKlien]);

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
    setFilterBrand('all');
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
      filterBrand !== 'all' ||
      filterBank !== 'all' ||
      filterOnlyOutstanding
  );

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return db.transaksiKlien
      .filter((row) => {
        // Text Search (invoice, klien, sales, brand, status, bank)
        const matchSearch =
          !searchTerm ||
          [row.invoice, row.klien, row.sales, row.brand, row.status, row.bank].some(
            (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
          );

        // Date Range
        let matchDate = true;
        if (startDate && row.tanggal < startDate) matchDate = false;
        if (endDate && row.tanggal > endDate) matchDate = false;

        // Status Category
        const matchStatus = filterStatus === 'all' || row.status === filterStatus;

        // Brand Category
        const matchBrand = filterBrand === 'all' || row.brand === filterBrand;

        // Bank
        const matchBank = filterBank === 'all' || row.bank === filterBank;

        // Only Outstanding
        const n = Number(row.nilaiInvoice) || 0;
        const p = Number(row.pembayaranKlien) || 0;
        const piutang = Math.max(0, n - p);
        const matchOutstanding = !filterOnlyOutstanding || piutang > 0;

        return (
          matchSearch &&
          matchDate &&
          matchStatus &&
          matchBrand &&
          matchBank &&
          matchOutstanding
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') {
          return a.tanggal.localeCompare(b.tanggal) || a.invoice.localeCompare(b.invoice);
        }
        if (sortBy === 'date_desc') {
          return b.tanggal.localeCompare(a.tanggal) || b.invoice.localeCompare(a.invoice);
        }
        if (sortBy === 'invoice_asc') {
          return a.invoice.localeCompare(b.invoice);
        }
        if (sortBy === 'invoice_desc') {
          return b.invoice.localeCompare(a.invoice);
        }
        if (sortBy === 'nilai_desc') {
          return (Number(b.nilaiInvoice) || 0) - (Number(a.nilaiInvoice) || 0);
        }
        if (sortBy === 'nilai_asc') {
          return (Number(a.nilaiInvoice) || 0) - (Number(b.nilaiInvoice) || 0);
        }
        if (sortBy === 'bayar_desc') {
          return (Number(b.pembayaranKlien) || 0) - (Number(a.pembayaranKlien) || 0);
        }
        if (sortBy === 'piutang_desc') {
          const pA = Math.max(0, (Number(a.nilaiInvoice) || 0) - (Number(a.pembayaranKlien) || 0));
          const pB = Math.max(0, (Number(b.nilaiInvoice) || 0) - (Number(b.pembayaranKlien) || 0));
          return pB - pA;
        }
        return b.tanggal.localeCompare(a.tanggal);
      });
  }, [
    db.transaksiKlien,
    searchTerm,
    startDate,
    endDate,
    filterStatus,
    filterBrand,
    filterBank,
    filterOnlyOutstanding,
    sortBy,
  ]);

  // Aggregate sums
  const aggregates = useMemo(() => {
    let totalInvoice = 0;
    let totalPembayaran = 0;
    let totalPiutang = 0;
    let totalModalAwal = 0;
    let totalModalAkhir = 0;

    filteredData.forEach((row) => {
      const n = Number(row.nilaiInvoice) || 0;
      const p = Number(row.pembayaranKlien) || 0;
      const mAwal = Number(row.modalAwal) || 0;

      // Find all vendor tx with matching invoice
      const safeInv = String(row.invoice || '').trim();
      const mAkhir = db.transaksiVendor
        .filter((v) => String(v.invoice || '').trim() === safeInv)
        .reduce((sum, v) => sum + (Number(v.nilaiTransaksi) || 0), 0);

      totalInvoice += n;
      totalPembayaran += p;
      if (n > p) totalPiutang += n - p;
      totalModalAwal += mAwal;
      totalModalAkhir += mAkhir;
    });

    const totalMargin = totalInvoice - totalModalAkhir;
    return {
      totalInvoice,
      totalPembayaran,
      totalPiutang,
      totalModalAwal,
      totalModalAkhir,
      totalMargin,
    };
  }, [filteredData, db.transaksiVendor]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormId(generateId('KLN'));
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormInvoice('');
    setFormBrand('');
    setFormKlien('');
    setFormSales('');
    setFormNilaiInvoice('');
    setFormModalAwal('');
    setFormPembayaranKlien('');
    setFormStatus('DP');
    setFormBank(db.reportBank[0]?.namaBank || '');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: TransaksiKlien) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormTanggal(item.tanggal);
    setFormInvoice(item.invoice);
    setFormBrand(item.brand || '');
    setFormKlien(item.klien);
    setFormSales(item.sales || '');
    setFormNilaiInvoice(item.nilaiInvoice.toString());
    setFormModalAwal(item.modalAwal.toString());
    setFormPembayaranKlien(item.pembayaranKlien.toString());
    setFormStatus(item.status);
    setFormBank(item.bank || '');
    setIsFormOpen(true);
  };

  // Form Submit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const item: TransaksiKlien = {
      id: formId,
      tanggal: formTanggal,
      invoice: formInvoice.trim(),
      brand: formBrand.trim(),
      klien: formKlien.trim(),
      sales: formSales.trim(),
      nilaiInvoice: Number(formNilaiInvoice) || 0,
      modalAwal: Number(formModalAwal) || 0,
      pembayaranKlien: Number(formPembayaranKlien) || 0,
      status: formStatus,
      bank: formBank,
    };

    saveKlien(item);
    setIsFormOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Tanggal',
      'No Invoice',
      'Brand',
      'Nama Klien',
      'Sales',
      'Nilai Invoice',
      'Pembayaran Klien',
      'Sisa Piutang',
      'Status',
      'Bank Penerima',
      'Modal Awal',
      'Modal Akhir Vendor',
      'Margin',
    ];

    const rows = filteredData.map((r) => {
      const n = Number(r.nilaiInvoice) || 0;
      const p = Number(r.pembayaranKlien) || 0;
      const safeInv = String(r.invoice || '').trim();
      const mAkhir = db.transaksiVendor
        .filter((v) => String(v.invoice || '').trim() === safeInv)
        .reduce((sum, v) => sum + (Number(v.nilaiTransaksi) || 0), 0);
      const margin = n - mAkhir;

      return [
        r.id,
        r.tanggal,
        r.invoice,
        r.brand,
        r.klien,
        r.sales,
        n,
        p,
        Math.max(0, n - p),
        r.status,
        r.bank,
        r.modalAwal,
        mAkhir,
        margin,
      ];
    });

    exportToCsv('Transaksi_Klien', headers, rows);
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    const ids = filteredData.map((d) => d.id);
    deleteMultipleKlien(ids);
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/70 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari invoice, klien, sales, brand, status, atau bank..."
              className="w-full bg-[#0E0C1C] border border-purple-500/25 rounded-lg pl-8.5 pr-8 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 transition shadow-inner"
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
              className="flex items-center gap-1.5 bg-[#252140] hover:bg-[#2F2A52] border border-purple-500/20 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs active:scale-95 shrink-0"
              title="Download Data Terfilter ke Spreadsheet CSV"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
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
              className="flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] border border-purple-400/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-purple-900/30 transition active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Klien</span>
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
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
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
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
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
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
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
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
                  : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              Tahun Ini
            </button>
          </div>

          {/* Custom Date Range Picker */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset('custom');
                }}
                className="bg-[#0E0C1C] border border-purple-500/20 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400 w-32 sm:w-36"
                title="Tanggal Mulai"
              />
            </div>
            <span className="text-slate-500 text-xs">s/d</span>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset('custom');
                }}
                className="bg-[#0E0C1C] border border-purple-500/20 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400 w-32 sm:w-36"
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
                className="bg-[#0E0C1C] border border-purple-500/25 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="DP">DP (Uang Muka)</option>
                <option value="Tempo">Tempo (Belum Bayar)</option>
              </select>
            </div>

            {/* Filter Brand / Kategori Proyek */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Brand:</span>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-[#0E0C1C] border border-purple-500/25 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400 cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Semua Brand</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Rekening Bank Penerima */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Bank:</span>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="bg-[#0E0C1C] border border-purple-500/25 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400 cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Semua Bank</option>
                {bankOptions.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Toggle: Hanya Piutang Terbuka */}
            <button
              type="button"
              onClick={() => setFilterOnlyOutstanding(!filterOnlyOutstanding)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                filterOnlyOutstanding
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                  : 'bg-[#0E0C1C] text-slate-400 border-purple-500/20 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Hanya Piutang</span>
            </button>
          </div>

          {/* Sort By & Reset */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0E0C1C] border border-purple-500/25 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400 cursor-pointer"
              >
                <option value="date_desc">Tgl Terbaru</option>
                <option value="date_asc">Tgl Terlama</option>
                <option value="invoice_asc">Invoice A-Z</option>
                <option value="nilai_desc">Nilai Terbesar</option>
                <option value="piutang_desc">Piutang Terbesar</option>
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
              dari <span className="font-mono">{db.transaksiKlien.length}</span> transaksi
            </span>

            {/* Chips */}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Cari: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterBrand !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Brand: {filterBrand}
                <button onClick={() => setFilterBrand('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterBank !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Bank: {filterBank}
                <button onClick={() => setFilterBank('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[11px]">
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
              <span className="inline-flex items-center gap-1 bg-amber-950/60 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px]">
                Hanya Piutang
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
              Total Nilai:{' '}
              <span className="font-mono font-semibold text-purple-300">
                {formatRp(aggregates.totalInvoice)}
              </span>
            </div>
            {aggregates.totalPiutang > 0 && (
              <div>
                Piutang:{' '}
                <span className="font-mono font-semibold text-amber-400">
                  {formatRp(aggregates.totalPiutang)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-[#16132A] border border-white/5 rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] text-slate-400 font-medium uppercase truncate block">Total Invoice</span>
          <p className="text-sm font-bold text-white font-mono mt-0.5 truncate">
            {formatRp(aggregates.totalInvoice)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] text-emerald-400 font-medium uppercase truncate block">Diterima (Kas Masuk)</span>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5 truncate">
            {formatRp(aggregates.totalPembayaran)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] text-amber-400 font-medium uppercase truncate block">Sisa Piutang</span>
          <p className="text-sm font-bold text-amber-400 font-mono mt-0.5 truncate">
            {formatRp(aggregates.totalPiutang)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] text-amber-300 font-medium uppercase truncate block">Modal Awal Est.</span>
          <p className="text-sm font-bold text-amber-300 font-mono mt-0.5 truncate">
            {formatRp(aggregates.totalModalAwal)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] text-blue-400 font-medium uppercase truncate block">Modal Akhir (HPP)</span>
          <p className="text-sm font-bold text-blue-400 font-mono mt-0.5 truncate">
            {formatRp(aggregates.totalModalAkhir)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] text-emerald-300 font-medium uppercase truncate block">Laba Kotor Margin</span>
          <p className="text-sm font-bold text-emerald-300 font-mono mt-0.5 truncate">
            {formatRp(aggregates.totalMargin)}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl overflow-hidden shadow-lg w-full min-w-0">
        <div className="px-3.5 py-2 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 bg-black/25">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300">Tabel Transaksi Klien</span>
            <span className="text-purple-300 font-mono text-[10px] bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 rounded">
              {filteredData.length} baris
            </span>
          </div>
          <span className="text-[10px] text-purple-300/80 font-medium flex items-center gap-1">
            Geser tabel ke samping untuk melihat rincian modal, margin & aksi &rarr;
          </span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[1150px]">
            <thead>
              <tr className="bg-black/40 text-purple-200/80 uppercase tracking-wider border-b border-white/5 font-semibold text-[10px]">
                <th className="w-7 px-2 py-2.5 text-center"></th>
                <th
                  onClick={() => setSortBy(sortBy === 'date_desc' ? 'date_asc' : 'date_desc')}
                  className="px-3 py-2.5 cursor-pointer hover:text-white transition select-none"
                  title="Klik untuk urutkan tanggal"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th
                  onClick={() => setSortBy(sortBy === 'invoice_asc' ? 'invoice_desc' : 'invoice_asc')}
                  className="px-3 py-2.5 cursor-pointer hover:text-white transition select-none"
                  title="Klik untuk urutkan nomor invoice"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="px-3 py-2.5">Brand</th>
                <th className="px-3 py-2.5 text-emerald-300">Klien</th>
                <th className="px-3 py-2.5 text-amber-300">Sales</th>
                <th
                  onClick={() => setSortBy(sortBy === 'nilai_desc' ? 'nilai_asc' : 'nilai_desc')}
                  className="px-3 py-2.5 text-right cursor-pointer hover:text-white transition select-none"
                  title="Klik untuk urutkan nilai invoice"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Nilai Invoice</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th
                  onClick={() => setSortBy(sortBy === 'bayar_desc' ? 'nilai_asc' : 'bayar_desc')}
                  className="px-3 py-2.5 text-right text-emerald-400 cursor-pointer hover:text-white transition select-none"
                  title="Klik untuk urutkan pembayaran"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Pembayaran</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center">Bank</th>
                <th className="px-3 py-2.5 text-right text-amber-200 bg-amber-950/20">Modal Awal</th>
                <th className="px-3 py-2.5 text-center text-amber-400 bg-amber-950/20">% Awal</th>
                <th className="px-3 py-2.5 text-right text-blue-300 bg-blue-950/20">Modal Akhir (HPP)</th>
                <th className="px-3 py-2.5 text-center text-blue-400 bg-blue-950/20">% Akhir</th>
                <th
                  onClick={() => setSortBy(sortBy === 'piutang_desc' ? 'date_desc' : 'piutang_desc')}
                  className="px-3 py-2.5 text-right text-emerald-300 bg-emerald-950/20 cursor-pointer hover:text-white transition select-none"
                  title="Klik untuk urutkan margin"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margin</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="px-3 py-2.5 text-center text-emerald-400 bg-emerald-950/20">% Margin</th>
                <th className="sticky right-0 bg-[#16132D] z-20 px-3 py-2.5 text-center border-l border-white/10 shadow-[-4px_0_8px_rgba(0,0,0,0.35)]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={17} className="text-center py-10 text-slate-500 italic">
                    Belum ada data atau tidak ada yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const n = Number(row.nilaiInvoice) || 0;
                  const bayar = Number(row.pembayaranKlien) || 0;
                  const mAwal = Number(row.modalAwal) || 0;

                  // Dynamic sum and list of vendor bills matching this invoice
                  const safeInv = String(row.invoice || '').trim();
                  const linkedVendors = db.transaksiVendor.filter(
                    (v) => String(v.invoice || '').trim() === safeInv
                  );
                  const mAkhir = linkedVendors.reduce(
                    (sum, v) => sum + (Number(v.nilaiTransaksi) || 0),
                    0
                  );

                  const margin = n - mAkhir;
                  const persenAwal = n > 0 ? ((mAwal / n) * 100).toFixed(1) : '0';
                  const persenAkhir = n > 0 ? ((mAkhir / n) * 100).toFixed(1) : '0';
                  const persenMargin = n > 0 ? ((margin / n) * 100).toFixed(1) : '0';
                  const isExpanded = expandedInvoice === row.invoice;
                  const sisaPiutang = Math.max(0, n - bayar);

                  return (
                    <React.Fragment key={row.id}>
                      <tr className={`hover:bg-white/5 transition group ${isExpanded ? 'bg-purple-950/20' : ''}`}>
                        <td className="w-7 px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedInvoice(isExpanded ? null : row.invoice)}
                            className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
                            title={isExpanded ? 'Tutup Rincian Vendor' : 'Buka Rincian Biaya Vendor (HPP)'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-purple-300" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-slate-400 font-mono text-xs">{row.tanggal}</td>
                        <td className="px-3 py-2 font-semibold text-white font-mono flex items-center gap-1.5 text-xs">
                          <span>{row.invoice}</span>
                          {linkedVendors.length > 0 && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-sans">
                              {linkedVendors.length}v
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-300 text-xs">{row.brand || '-'}</td>
                        <td className="px-3 py-2 font-medium text-emerald-300 text-xs">{row.klien}</td>
                        <td className="px-3 py-2 text-amber-300 text-xs">{row.sales || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono font-medium text-white text-xs">
                          {formatRp(n)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-400 font-medium text-xs">
                          {formatRp(bayar)}
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
                        <td className="px-3 py-2 text-center text-slate-400 text-xs">{row.bank || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono text-amber-200 bg-amber-950/10 text-xs">
                          {formatRp(mAwal)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-amber-400 bg-amber-950/10 text-xs">
                          {persenAwal}%
                        </td>
                        <td
                          onClick={() => setExpandedInvoice(isExpanded ? null : row.invoice)}
                          className="px-3 py-2 text-right font-mono text-blue-300 bg-blue-950/10 cursor-pointer hover:underline text-xs"
                          title="Klik untuk melihat rincian vendor"
                        >
                          {formatRp(mAkhir)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-blue-400 bg-blue-950/10 text-xs">
                          {persenAkhir}%
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-bold bg-emerald-950/10 text-xs ${
                            margin >= 0 ? 'text-emerald-300' : 'text-rose-400'
                          }`}
                        >
                          {formatRp(margin)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/10 text-xs">
                          {persenMargin}%
                        </td>
                        <td
                          className={`sticky right-0 z-10 px-3 py-2 text-center border-l border-white/10 shadow-[-4px_0_8px_rgba(0,0,0,0.35)] ${
                            isExpanded ? 'bg-[#181430]' : 'bg-[#1A1731] group-hover:bg-[#231F3F]'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            {sisaPiutang > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPaymentModalTarget({
                                    id: row.id,
                                    type: 'Piutang',
                                    invoice: row.invoice,
                                    nama: row.klien,
                                    totalNilai: n,
                                    sudahBayar: bayar,
                                    sisaOutstanding: sisaPiutang,
                                    currentBank: row.bank,
                                  })
                                }
                                className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-600/30 transition"
                                title="Catat Penerimaan Pembayaran Klien"
                              >
                                <Coins className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="p-1 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/30 transition"
                              title="Edit Klien"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(row.id)}
                              className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/30 transition"
                              title="Hapus Klien"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Drill-down Sub-panel */}
                      {isExpanded && (
                        <tr className="bg-[#100D22]">
                          <td colSpan={17} className="px-6 py-4">
                            <div className="bg-[#17142E] border border-purple-500/30 rounded-xl p-4 shadow-inner">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-white/5 gap-3">
                                <div>
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                                    <span>Rincian Pengadaan Vendor untuk Invoice {row.invoice}</span>
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Klien: <strong className="text-emerald-300">{row.klien}</strong> &middot; Nilai Invoice: <span className="font-mono text-white">{formatRp(n)}</span> &middot; Margin Riil: <span className="font-mono text-emerald-400 font-bold">{formatRp(margin)} ({persenMargin}%)</span>
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateWithParams('vendor', {
                                      prefillInvoice: row.invoice,
                                      openAddModal: true,
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Tambah Biaya Vendor untuk Invoice Ini</span>
                                </button>
                              </div>

                              {linkedVendors.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-4 text-center">
                                  Belum ada biaya vendor yang direferensikan ke nomor invoice ini. Modal akhir vendor masih Rp 0.
                                </p>
                              ) : (
                                <div className="mt-3 overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="text-blue-300/70 border-b border-white/5 text-[10px] uppercase tracking-wider font-semibold">
                                        <th className="py-2 px-3">Tanggal Vendor</th>
                                        <th className="py-2 px-3">Nama Rekanan Vendor</th>
                                        <th className="py-2 px-3 text-right">Nilai Pengadaan</th>
                                        <th className="py-2 px-3 text-right">Dibayar ke Vendor</th>
                                        <th className="py-2 px-3 text-center">Status</th>
                                        <th className="py-2 px-3 text-center">Bank Pembayar</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-slate-300">
                                      {linkedVendors.map((v) => (
                                        <tr key={v.id} className="hover:bg-white/5">
                                          <td className="py-2 px-3 font-mono text-slate-400">{v.tanggal}</td>
                                          <td className="py-2 px-3 font-medium text-white">{v.namaVendor}</td>
                                          <td className="py-2 px-3 text-right font-mono font-medium text-white">
                                            {formatRp(v.nilaiTransaksi)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono text-emerald-400">
                                            {formatRp(v.pembayaran)}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/50 text-blue-300 border border-blue-500/20">
                                              {v.status}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center text-slate-400">{v.bank}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t border-white/10 font-bold text-white bg-black/20">
                                        <td colSpan={2} className="py-2 px-3 text-right">Total Modal Akhir:</td>
                                        <td className="py-2 px-3 text-right font-mono text-blue-300">{formatRp(mAkhir)}</td>
                                        <td className="py-2 px-3 text-right font-mono text-emerald-400">
                                          {formatRp(linkedVendors.reduce((s, v) => s + (Number(v.pembayaran) || 0), 0))}
                                        </td>
                                        <td colSpan={2}></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
          <div className="w-full max-w-2xl bg-[#16132A] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Transaksi Klien' : 'Tambah Transaksi Klien'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1">
                    ID Sistem (Auto)
                  </label>
                  <input
                    type="text"
                    value={formId}
                    readOnly
                    className="w-full bg-[#0E0C1C]/60 border border-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-purple-300/70 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    required
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    No. Invoice *
                  </label>
                  <input
                    type="text"
                    value={formInvoice}
                    onChange={(e) => setFormInvoice(e.target.value)}
                    placeholder="Contoh: A425"
                    required
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Brand / Proyek
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Contoh: ALB / Campaign Ramadan"
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nama Klien *
                  </label>
                  <input
                    type="text"
                    value={formKlien}
                    onChange={(e) => setFormKlien(e.target.value)}
                    placeholder="Contoh: PT Sumber Rejeki"
                    required
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    Sales Person
                  </label>
                  <input
                    type="text"
                    value={formSales}
                    onChange={(e) => setFormSales(e.target.value)}
                    placeholder="Nama sales yang menangani klien"
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nilai Invoice (Rp) *
                  </label>
                  <input
                    type="number"
                    value={formNilaiInvoice}
                    onChange={(e) => setFormNilaiInvoice(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    Estimasi Modal Awal (Rp)
                  </label>
                  <input
                    type="number"
                    value={formModalAwal}
                    onChange={(e) => setFormModalAwal(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                    Pembayaran Klien Masuk (Rp)
                  </label>
                  <input
                    type="number"
                    value={formPembayaranKlien}
                    onChange={(e) => setFormPembayaranKlien(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Status Invoice
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="DP">DP</option>
                    <option value="Tempo">Tempo</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Bank Penerima
                  </label>
                  <select
                    value={formBank}
                    onChange={(e) => setFormBank(e.target.value)}
                    className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400"
                  >
                    <option value="">-- Pilih Bank Rekening --</option>
                    {db.reportBank.map((b) => (
                      <option key={b.id} value={b.namaBank}>
                        {b.namaBank} ({b.noRekening})
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/30 transition"
                >
                  Simpan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Hapus Transaksi Klien?"
        message="Data transaksi ini akan dihapus dari sistem. Perhitungan mutasi bank dan profit invoice akan diperbarui secara otomatis."
        confirmLabel="Ya, Hapus"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteKlien(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Hapus ${filteredData.length} Data Transaksi?`}
        message="Semua transaksi klien yang sesuai dengan filter pencarian dan rentang tanggal aktif saat ini akan dihapus sekaligus."
        confirmLabel={`Ya, Hapus ${filteredData.length} Data`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      {/* Quick Payment Modal */}
      <PaymentRecordModal
        target={paymentModalTarget}
        onClose={() => setPaymentModalTarget(null)}
      />
    </div>
  );
};
