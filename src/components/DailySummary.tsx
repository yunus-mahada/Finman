import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Search,
  ExternalLink,
  Plus,
  RotateCcw,
  Building2,
  Receipt,
  ShoppingCart,
  Wallet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatRp, formatDate, exportToCsv } from '../utils/formatters';

interface DailySummaryProps {
  className?: string;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ className = '' }) => {
  const { db, navigateWithParams, setCurrentPage } = useFinancial();

  // Determine today's local date string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Find latest transaction date across all data to offer as quick jump
  const latestTxDate = useMemo(() => {
    const dates: string[] = [
      ...db.transaksiKlien.map((t) => t.tanggal),
      ...db.transaksiVendor.map((t) => t.tanggal),
      ...db.operasional.map((t) => t.tanggal),
    ].filter(Boolean);

    if (dates.length === 0) return todayStr;
    dates.sort((a, b) => b.localeCompare(a));
    return dates[0];
  }, [db, todayStr]);

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filter states
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showTransactionList, setShowTransactionList] = useState<boolean>(true);

  // Available banks
  const availableBanks = useMemo(() => {
    const bankSet = new Set<string>();
    db.reportBank.forEach((b) => bankSet.add(b.namaBank));
    db.transaksiKlien.forEach((t) => t.bank && bankSet.add(t.bank));
    db.transaksiVendor.forEach((t) => t.bank && bankSet.add(t.bank));
    db.operasional.forEach((t) => t.bank && bankSet.add(t.bank));
    return Array.from(bankSet);
  }, [db]);

  // Change date helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const isToday = selectedDate === todayStr;

  // Filtered daily transactions
  // 1. Client transactions (Income)
  const filteredKlien = useMemo(() => {
    if (filterCategory === 'vendor' || filterCategory === 'operasional') return [];
    return db.transaksiKlien.filter((t) => {
      if (t.tanggal !== selectedDate) return false;
      if (filterBank !== 'all' && t.bank !== filterBank) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          t.invoice.toLowerCase().includes(q) ||
          t.klien.toLowerCase().includes(q) ||
          t.brand.toLowerCase().includes(q) ||
          t.sales.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [db.transaksiKlien, selectedDate, filterBank, filterStatus, filterCategory, searchTerm]);

  // 2. Vendor transactions (Expenses - HPP)
  const filteredVendor = useMemo(() => {
    if (filterCategory === 'klien' || filterCategory === 'operasional') return [];
    return db.transaksiVendor.filter((t) => {
      if (t.tanggal !== selectedDate) return false;
      if (filterBank !== 'all' && t.bank !== filterBank) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          t.invoice.toLowerCase().includes(q) ||
          t.namaVendor.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [db.transaksiVendor, selectedDate, filterBank, filterStatus, filterCategory, searchTerm]);

  // 3. Operasional transactions (Expenses - Overhead)
  const filteredOperasional = useMemo(() => {
    if (filterCategory === 'klien' || filterCategory === 'vendor') return [];
    return db.operasional.filter((t) => {
      if (t.tanggal !== selectedDate) return false;
      if (filterBank !== 'all' && t.bank !== filterBank) return false;
      // Operasional does not have status field, include if filterStatus === 'all' or 'Lunas'
      if (filterStatus !== 'all' && filterStatus !== 'Lunas') return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          t.pengeluaran.toLowerCase().includes(q) ||
          t.kategori.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [db.operasional, selectedDate, filterBank, filterStatus, filterCategory, searchTerm]);

  // Calculations for the selected day based on filtered transaction data
  // Real cash in: payments received from clients
  const totalIncome = useMemo(() => {
    return filteredKlien.reduce((sum, item) => sum + (item.pembayaranKlien || 0), 0);
  }, [filteredKlien]);

  // Invoiced amount (potential omset)
  const totalInvoiced = useMemo(() => {
    return filteredKlien.reduce((sum, item) => sum + (item.nilaiInvoice || 0), 0);
  }, [filteredKlien]);

  // Expenses: Vendor payments + Operasional payments
  const vendorExpenses = useMemo(() => {
    return filteredVendor.reduce((sum, item) => sum + (item.pembayaran || 0), 0);
  }, [filteredVendor]);

  const operasionalExpenses = useMemo(() => {
    return filteredOperasional.reduce((sum, item) => sum + (item.pembayaran || 0), 0);
  }, [filteredOperasional]);

  const totalExpenses = useMemo(() => {
    return vendorExpenses + operasionalExpenses;
  }, [vendorExpenses, operasionalExpenses]);

  // Net Cash Flow for the day
  const netCashFlow = totalIncome - totalExpenses;

  // Total count of transactions on that day
  const totalTransactionsCount =
    filteredKlien.length + filteredVendor.length + filteredOperasional.length;

  // Percentage calculations
  const totalFlow = totalIncome + totalExpenses;
  const incomePercent = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 50;
  const expensePercent = totalFlow > 0 ? 100 - incomePercent : 50;

  // Combined unified transaction list for display
  interface UnifiedTx {
    id: string;
    type: 'income_klien' | 'expense_vendor' | 'expense_operasional';
    title: string;
    subtitle: string;
    bank: string;
    amount: number;
    nominalAsli?: number;
    status?: string;
    rawItem: any;
  }

  const unifiedList = useMemo<UnifiedTx[]>(() => {
    const list: UnifiedTx[] = [];

    filteredKlien.forEach((k) => {
      list.push({
        id: k.id,
        type: 'income_klien',
        title: `Klien: ${k.klien}`,
        subtitle: `Inv #${k.invoice} • Brand ${k.brand} • Sales: ${k.sales}`,
        bank: k.bank,
        amount: k.pembayaranKlien,
        nominalAsli: k.nilaiInvoice,
        status: k.status,
        rawItem: k,
      });
    });

    filteredVendor.forEach((v) => {
      list.push({
        id: v.id,
        type: 'expense_vendor',
        title: `Vendor: ${v.namaVendor}`,
        subtitle: `Ref Inv #${v.invoice} • HPP Proyek`,
        bank: v.bank,
        amount: v.pembayaran,
        nominalAsli: v.nilaiTransaksi,
        status: v.status,
        rawItem: v,
      });
    });

    filteredOperasional.forEach((op) => {
      list.push({
        id: op.id,
        type: 'expense_operasional',
        title: op.pengeluaran,
        subtitle: `Beban Operasional • Kategori: ${op.kategori}`,
        bank: op.bank,
        amount: op.pembayaran,
        status: 'Lunas',
        rawItem: op,
      });
    });

    return list;
  }, [filteredKlien, filteredVendor, filteredOperasional]);

  // Reset filters
  const handleResetFilters = () => {
    setFilterBank('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setSearchTerm('');
  };

  const hasActiveFilters =
    filterBank !== 'all' ||
    filterCategory !== 'all' ||
    filterStatus !== 'all' ||
    searchTerm !== '';

  // Export Daily Summary CSV
  const handleExportCsv = () => {
    const headers = [
      'Tanggal',
      'Tipe Arus Kas',
      'Kategori',
      'Keterangan / Entitas',
      'Nominal Kas Masuk / Keluar',
      'Nilai Total Transaksi',
      'Status Pembayaran',
      'Bank Rekening',
    ];

    const rows = unifiedList.map((tx) => [
      selectedDate,
      tx.type === 'income_klien' ? 'Pemasukan (Income)' : 'Pengeluaran (Expense)',
      tx.type === 'income_klien'
        ? 'Transaksi Klien'
        : tx.type === 'expense_vendor'
        ? 'Transaksi Vendor'
        : 'Biaya Operasional',
      tx.title,
      tx.amount,
      tx.nominalAsli || tx.amount,
      tx.status || '-',
      tx.bank || '-',
    ]);

    exportToCsv(`daily_summary_${selectedDate}`, headers, rows);
  };

  return (
    <div
      className={`bg-[#1A1731] border border-white/5 rounded-xl p-4 shadow-lg relative overflow-hidden ${className}`}
    >
      {/* Top Header & Date Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Daily Summary (Ringkasan Harian)
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Kas Realtime
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kalkulasi mutasi arus kas masuk vs keluar hari ini berdasarkan data transaksi terfilter.
          </p>
        </div>

        {/* Date Selector & Navigator */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Quick Jump Buttons */}
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              isToday
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3 h-3 text-purple-300" />
            <span>Hari Ini</span>
          </button>

          {/* Quick jump to latest active date if not on it and today has 0 records */}
          {latestTxDate !== todayStr && selectedDate !== latestTxDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(latestTxDate)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition flex items-center gap-1"
              title={`Lompat ke tanggal aktif: ${formatDate(latestTxDate)}`}
            >
              <span>Tgl Terakhir ({formatDate(latestTxDate)})</span>
            </button>
          )}

          {/* Day Stepper & Picker */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white font-mono px-1.5 py-0.5 outline-none cursor-pointer"
            />

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={unifiedList.length === 0}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Export CSV Ringkasan Harian"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Date Banner Label */}
      <div className="flex items-center justify-between mt-2.5 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-purple-400" />
          <span>Posisi Kas Tanggal:</span>
          <strong className="text-white font-semibold">{formatDate(selectedDate)}</strong>
          {isToday && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-sans font-bold">
              (Hari Ini)
            </span>
          )}
        </span>
        <span className="text-[11px]">{totalTransactionsCount} Transaksi Ditemukan</span>
      </div>

      {/* Filter Toolbar for Daily Summary */}
      <div className="mt-3 p-2.5 bg-black/25 border border-white/5 rounded-lg space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi hari ini (klien, vendor, inv, biaya)..."
              className="w-full bg-[#120F24] border border-white/10 rounded-lg pl-7.5 pr-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Bank Filter */}
            <div className="flex items-center bg-[#120F24] border border-white/10 rounded-lg px-2 py-0.5 gap-1">
              <Building2 className="w-3 h-3 text-purple-400" />
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#1A1731] text-white">Semua Rekening</option>
                {availableBanks.map((bank) => (
                  <option key={bank} value={bank} className="bg-[#1A1731] text-white">
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            {/* Category / Source Filter */}
            <div className="flex items-center bg-[#120F24] border border-white/10 rounded-lg px-2 py-0.5 gap-1">
              <SlidersHorizontal className="w-3 h-3 text-blue-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#1A1731] text-white">Semua Modul</option>
                <option value="klien" className="bg-[#1A1731] text-white">Pemasukan Klien</option>
                <option value="vendor" className="bg-[#1A1731] text-white">Pengeluaran Vendor</option>
                <option value="operasional" className="bg-[#1A1731] text-white">Beban Operasional</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center bg-[#120F24] border border-white/10 rounded-lg px-2 py-0.5 gap-1">
              <Filter className="w-3 h-3 text-emerald-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#1A1731] text-white">Semua Status</option>
                <option value="Lunas" className="bg-[#1A1731] text-white">Lunas</option>
                <option value="DP" className="bg-[#1A1731] text-white">DP</option>
                <option value="Tempo" className="bg-[#1A1731] text-white">Tempo</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-1 text-xs text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 rounded-lg transition flex items-center gap-1"
                title="Reset Filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter status indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 text-[10px] text-purple-300/80 pt-0.5">
            <span className="font-medium">Filter Aktif:</span>
            {filterBank !== 'all' && (
              <span className="bg-purple-900/40 border border-purple-500/30 px-1.5 py-0.2 rounded text-[10px]">
                Bank: {filterBank}
              </span>
            )}
            {filterCategory !== 'all' && (
              <span className="bg-blue-900/40 border border-blue-500/30 px-1.5 py-0.2 rounded text-[10px]">
                Modul: {filterCategory}
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="bg-emerald-900/40 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[10px]">
                Status: {filterStatus}
              </span>
            )}
            {searchTerm && (
              <span className="bg-amber-900/40 border border-amber-500/30 px-1.5 py-0.2 rounded text-[10px]">
                Pencarian: "{searchTerm}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Primary Metrics: Total Income vs Total Expenses vs Net Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
        {/* Total Income Card */}
        <div className="bg-[#120F24] border border-emerald-500/30 rounded-lg p-3.5 relative overflow-hidden group hover:border-emerald-500/50 transition shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6.5 h-6.5 rounded-md bg-[#143D39] text-[#00C896] flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-emerald-300">Total Income (Pemasukan)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
              {filteredKlien.length} Masuk
            </span>
          </div>

          <div className="text-xl font-bold text-[#00C896] font-mono tracking-tight">
            {formatRp(totalIncome)}
          </div>

          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Omset Invoice:</span>
            <span className="font-mono text-white font-medium">{formatRp(totalInvoiced)}</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-[#120F24] border border-rose-500/30 rounded-lg p-3.5 relative overflow-hidden group hover:border-rose-500/50 transition shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6.5 h-6.5 rounded-md bg-[#4C202B] text-[#F87171] flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-rose-300">Total Expenses (Pengeluaran)</span>
            </div>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.2 rounded">
              {filteredVendor.length + filteredOperasional.length} Keluar
            </span>
          </div>

          <div className="text-xl font-bold text-[#F87171] font-mono tracking-tight">
            {formatRp(totalExpenses)}
          </div>

          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Vendor: {formatRp(vendorExpenses)}</span>
            <span>Ops: {formatRp(operasionalExpenses)}</span>
          </div>
        </div>

        {/* Net Flow (Surplus / Defisit) Card */}
        <div
          className={`bg-[#120F24] border rounded-lg p-3.5 relative overflow-hidden transition shadow-sm ${
            netCashFlow > 0
              ? 'border-blue-500/30 hover:border-blue-500/50'
              : netCashFlow < 0
              ? 'border-amber-500/30 hover:border-amber-500/50'
              : 'border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6.5 h-6.5 rounded-md flex items-center justify-center ${
                  netCashFlow >= 0 ? 'bg-blue-900/40 text-blue-400' : 'bg-amber-900/40 text-amber-400'
                }`}
              >
                {netCashFlow >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-xs font-semibold text-white">Net Cash Flow (Arus Bersih)</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                netCashFlow > 0
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : netCashFlow < 0
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {netCashFlow > 0 ? 'Surplus' : netCashFlow < 0 ? 'Defisit' : 'Seimbang'}
            </span>
          </div>

          <div
            className={`text-xl font-bold font-mono tracking-tight ${
              netCashFlow > 0
                ? 'text-emerald-400'
                : netCashFlow < 0
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {formatRp(netCashFlow)}
          </div>

          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Rasio Kas:</span>
            <span className="font-mono text-purple-300">
              {totalExpenses > 0
                ? `${((totalIncome / totalExpenses) * 100).toFixed(0)}% Cover`
                : totalIncome > 0
                ? '100% Surplus'
                : '0.0x'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Income vs Expense Ratio Progress Bar */}
      <div className="mt-3.5 p-3 bg-black/30 border border-white/5 rounded-lg">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C896]"></span>
            <span className="text-slate-300 font-medium">
              Income: {formatRp(totalIncome)} ({incomePercent}%)
            </span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Perbandingan Kas Harian
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">
              Expenses: {formatRp(totalExpenses)} ({expensePercent}%)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]"></span>
          </div>
        </div>

        {/* Stacked Ratio Bar */}
        <div className="h-3.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
          {totalFlow === 0 ? (
            <div className="w-full h-full bg-white/5 flex items-center justify-center text-[9px] text-slate-500">
              Belum ada pergerakan kas pada tanggal ini
            </div>
          ) : (
            <>
              <div
                style={{ width: `${incomePercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-600 to-[#00C896] transition-all duration-300 relative group"
                title={`Income: ${formatRp(totalIncome)}`}
              />
              <div
                style={{ width: `${expensePercent}%` }}
                className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-300 relative group"
                title={`Expenses: ${formatRp(totalExpenses)}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Collapsible / Expandable Breakdown List of Daily Transactions */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Rincian Transaksi ({unifiedList.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              {formatDate(selectedDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTransactionList(!showTransactionList)}
              className="text-xs text-purple-300 hover:text-purple-200 transition"
            >
              {showTransactionList ? 'Sembunyikan Tabel' : 'Tampilkan Tabel'}
            </button>
          </div>
        </div>

        {showTransactionList && (
          <>
            {unifiedList.length === 0 ? (
              <div className="bg-[#120F24] border border-dashed border-white/10 rounded-xl p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-purple-400/60" />
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Tidak Ada Transaksi Kas Pada {formatDate(selectedDate)}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'Tidak ada transaksi yang cocok dengan kriteria filter yang Anda tentukan.'
                    : 'Belum ada mutasi pemasukan klien, pembayaran vendor, atau beban operasional yang tercatat pada tanggal ini.'}
                </p>

                {/* Quick action buttons to record or jump */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
                  {latestTxDate !== selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(latestTxDate)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Lihat Transaksi Terakhir ({formatDate(latestTxDate)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigateWithParams('klien', { openAddModal: true })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Pemasukan Klien
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateWithParams('vendor', { openAddModal: true })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Beban Vendor
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateWithParams('operasional', { openAddModal: true })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Biaya Operasional
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#120F24]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black/40 text-purple-200/70 uppercase tracking-wider text-[10px] font-semibold border-b border-white/5">
                      <th className="py-2.5 px-3">Arus Kas</th>
                      <th className="py-2.5 px-3">Keterangan / Entitas</th>
                      <th className="py-2.5 px-3 text-center">Rekening Bank</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Kas Riil (Rp)</th>
                      <th className="py-2.5 px-3 text-center">Navigasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {unifiedList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition">
                        {/* Type badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {tx.type === 'income_klien' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                              Pemasukan Klien
                            </span>
                          )}
                          {tx.type === 'expense_vendor' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/30">
                              <ArrowUpRight className="w-3 h-3 text-blue-400" />
                              HPP Vendor
                            </span>
                          )}
                          {tx.type === 'expense_operasional' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950/80 text-orange-300 border border-orange-500/30">
                              <Wallet className="w-3 h-3 text-orange-400" />
                              Operasional
                            </span>
                          )}
                        </td>

                        {/* Title and subtitle */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{tx.title}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                            {tx.subtitle}
                          </div>
                        </td>

                        {/* Bank */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300 text-[11px] whitespace-nowrap">
                          {tx.bank || '-'}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {tx.status ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                tx.status === 'Lunas'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                  : tx.status === 'DP'
                                  ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {tx.status}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-sm ${
                              tx.type === 'income_klien' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'income_klien' ? '+' : '-'} {formatRp(tx.amount)}
                          </span>
                          {tx.nominalAsli && tx.nominalAsli !== tx.amount && (
                            <div className="text-[9px] text-slate-500 font-mono">
                              dari total {formatRp(tx.nominalAsli)}
                            </div>
                          )}
                        </td>

                        {/* Navigation link */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {tx.type === 'income_klien' && (
                            <button
                              type="button"
                              onClick={() =>
                                navigateWithParams('klien', {
                                  searchTerm: tx.rawItem.invoice,
                                })
                              }
                              className="text-purple-400 hover:text-purple-200 p-1 hover:bg-white/5 rounded transition inline-flex items-center gap-1 text-[11px]"
                              title="Buka di Transaksi Klien"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {tx.type === 'expense_vendor' && (
                            <button
                              type="button"
                              onClick={() =>
                                navigateWithParams('vendor', {
                                  searchTerm: tx.rawItem.invoice,
                                })
                              }
                              className="text-blue-400 hover:text-blue-200 p-1 hover:bg-white/5 rounded transition inline-flex items-center gap-1 text-[11px]"
                              title="Buka di Transaksi Vendor"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {tx.type === 'expense_operasional' && (
                            <button
                              type="button"
                              onClick={() =>
                                navigateWithParams('operasional', {
                                  searchTerm: tx.rawItem.pengeluaran,
                                })
                              }
                              className="text-orange-400 hover:text-orange-200 p-1 hover:bg-white/5 rounded transition inline-flex items-center gap-1 text-[11px]"
                              title="Buka di Operasional"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
