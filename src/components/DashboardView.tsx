import React, { useState } from 'react';
import {
  Vault,
  Coins,
  TrendingUp,
  PieChart,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Edit2,
  ShieldCheck,
  ArrowRight,
  Rocket,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatRp } from '../utils/formatters';
import { BankDonutChart } from './BankDonutChart';
import { AktualCashModal } from './AktualCashModal';
import { FreeCashModal } from './FreeCashModal';
// import { DailySummary } from './DailySummary';

export const DashboardView: React.FC = () => {
  const { kpis, bankBalances, setCurrentPage, navigateWithParams, db } = useFinancial();
  const [aktualModalOpen, setAktualModalOpen] = useState(false);
  const [freeCashModalOpen, setFreeCashModalOpen] = useState(false);

  const hasEmptyData = db.reportBank.length === 0;

  // Recent client invoices preview
  const recentInvoices = db.transaksiKlien.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full min-w-0">
      {/* Onboarding Guide if no bank data exists */}
      {hasEmptyData && (
        <div className="bg-gradient-to-r from-[#2D1B63] to-[#1E1140] border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-purple-200 font-bold text-base mb-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            <span>Panduan Pengisian Awal FinMan</span>
          </div>
          <p className="text-sm text-purple-100/80 mb-5 max-w-3xl leading-relaxed">
            Sistem mendeteksi bahwa data rekening bank belum tersedia. Agar seluruh rumus
            dan perhitungan mutasi berjalan akurat, ikuti alur berikut:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <span className="text-[11px] font-bold bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-md inline-block mb-2">
                Langkah 1
              </span>
              <h4 className="text-sm font-semibold text-white">Input Report Bank</h4>
              <p className="text-xs text-slate-400 mt-1">
                Daftarkan rekening bank operasional beserta Saldo Awal.
              </p>
              <button
                onClick={() => setCurrentPage('bank')}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                Ke Menu Bank <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <span className="text-[11px] font-bold bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-md inline-block mb-2">
                Langkah 2
              </span>
              <h4 className="text-sm font-semibold text-white">Input Master Vendor</h4>
              <p className="text-xs text-slate-400 mt-1">
                Daftarkan rekanan pihak ketiga untuk pengadaan invoice.
              </p>
              <button
                onClick={() => setCurrentPage('master-vendor')}
                className="mt-3 text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                Ke Master Vendor <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md inline-block mb-2">
                Langkah 3
              </span>
              <h4 className="text-sm font-semibold text-white">Input Transaksi</h4>
              <p className="text-xs text-slate-400 mt-1">
                Catat Transaksi Klien, Vendor, dan Operasional harian.
              </p>
              <button
                onClick={() => setCurrentPage('klien')}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                Ke Transaksi Klien <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 KPI Cards (Compact & Interlinked) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Saldo Bank / Aktual Cash */}
        <div
          onClick={() => setCurrentPage('bank')}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-purple-500/40 hover:-translate-y-0.5 transition cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-purple-300 transition">
                Saldo Bank (Semua Rekening)
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAktualModalOpen(true);
                }}
                className="text-slate-500 hover:text-white p-0.5 rounded transition"
                title="Rincian Saldo Akumulasi Seluruh Rekening"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-white font-mono tracking-tight">
              {formatRp(kpis.saldoBank)}
            </h3>
            <span className="text-[10px] text-purple-400/80 block mt-0.5">
              Akumulasi {db.reportBank.length} Rekening &rarr;
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#253258] text-blue-400 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <Vault className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Free Cash */}
        <div
          onClick={() => setFreeCashModalOpen(true)}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-emerald-500/40 hover:-translate-y-0.5 transition cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-emerald-300 transition">
                Free Cash (Siap Pakai)
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFreeCashModalOpen(true);
                }}
                className="text-slate-500 hover:text-emerald-300 p-0.5 rounded transition"
                title="Rincian & Logika Perhitungan Free Cash"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <h3
              className={`text-lg lg:text-xl font-bold font-mono tracking-tight ${
                kpis.freeCash >= 0 ? 'text-[#00C896]' : 'text-rose-400'
              }`}
            >
              {formatRp(kpis.freeCash)}
            </h3>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              Pasca hutang, modal & beban &rarr;
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#143D39] text-[#00C896] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <Coins className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Saldo Awal / Total Omset */}
        <div
          onClick={() => setCurrentPage('klien')}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-purple-500/40 hover:-translate-y-0.5 transition cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1 group-hover:text-purple-300 transition">
              Total Omset Invoice
            </span>
            <h3 className="text-lg lg:text-xl font-bold text-[#C084FC] font-mono tracking-tight">
              {formatRp(kpis.totalOmset)}
            </h3>
            <span className="text-[10px] text-purple-300/80 block mt-0.5">
              {db.transaksiKlien.length} invoice klien &rarr;
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#37265D] text-[#C084FC] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Gross Margin */}
        <div
          onClick={() => setCurrentPage('klien')}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-sky-500/40 hover:-translate-y-0.5 transition cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1 group-hover:text-sky-300 transition">Gross Margin</span>
            <h3 className="text-lg lg:text-xl font-bold text-[#38BDF8] font-mono tracking-tight">
              {formatRp(kpis.grossMargin)}
            </h3>
            <span className="text-[10px] text-sky-400/80 block mt-0.5">
              {kpis.totalOmset > 0
                ? `${((kpis.grossMargin / kpis.totalOmset) * 100).toFixed(1)}% margin &rarr;`
                : '0% margin &rarr;'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#1E3A8A] text-[#38BDF8] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <PieChart className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Operasional */}
        <div
          onClick={() => setCurrentPage('operasional')}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-orange-500/40 hover:-translate-y-0.5 transition cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1 group-hover:text-orange-300 transition">
              Total Operasional
            </span>
            <h3 className="text-lg lg:text-xl font-bold text-[#F97316] font-mono tracking-tight">
              {formatRp(kpis.totalOperasional)}
            </h3>
            <span className="text-[10px] text-orange-400/80 block mt-0.5">
              {db.operasional.length} biaya terbayar &rarr;
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#432010] text-[#F97316] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <Wallet className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Middle 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Piutang Klien (Direct link to Aging Piutang) */}
        <div
          onClick={() => navigateWithParams('aging', { filterType: 'Piutang' })}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md hover:border-amber-500/40 hover:-translate-y-0.5 transition cursor-pointer group"
        >
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1 group-hover:text-amber-300 transition">
              Piutang Belum Tertagih
            </span>
            <h3 className="text-xl font-bold text-[#FBBF24] font-mono tracking-tight">
              {formatRp(kpis.totalPiutang)}
            </h3>
            <span className="text-[10px] text-amber-400/90 block mt-0.5">
              Aging Piutang &rarr;
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#45361A] text-[#FBBF24] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <ArrowDownLeft className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Hutang Vendor (Direct link to Aging Hutang) */}
        <div
          onClick={() => navigateWithParams('aging', { filterType: 'Hutang' })}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md hover:border-rose-500/40 hover:-translate-y-0.5 transition cursor-pointer group"
        >
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1 group-hover:text-rose-300 transition">
              Hutang Komitmen Vendor
            </span>
            <h3 className="text-xl font-bold text-[#F87171] font-mono tracking-tight">
              {formatRp(kpis.totalHutang)}
            </h3>
            <span className="text-[10px] text-rose-400/90 block mt-0.5">
              Aging Hutang &rarr;
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#4C202B] text-[#F87171] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <ArrowUpRight className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Status Invoice Klien (Direct link to Klien) */}
        <div
          onClick={() => setCurrentPage('klien')}
          className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-md hover:border-indigo-500/40 hover:-translate-y-0.5 transition cursor-pointer group"
        >
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1 group-hover:text-indigo-300 transition">
              Status Invoice Klien
            </span>
            <h3 className="text-xl font-bold text-white font-mono tracking-tight">
              {kpis.invoiceOpen}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">Open</span> /{' '}
              {kpis.invoiceClosed}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">Closed</span>
            </h3>
            <span className="text-[10px] text-indigo-400/90 block mt-0.5">
              Transaksi Klien &rarr;
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#282B4D] text-indigo-300 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <Receipt className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Daily Summary Component (Disembunyikan sementara sesuai permintaan) */}
      {/* <DailySummary /> */}

      {/* Bottom Section: Bank Chart & Financial Health Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bank Donut Chart Card */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Distribusi Saldo Bank
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {Object.keys(bankBalances).length} Rekening
              </span>
            </div>
            <div className="h-48">
              <BankDonutChart bankBalances={bankBalances} />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Perhitungan otomatis mutasi</span>
            <button
              onClick={() => setCurrentPage('bank')}
              className="text-purple-300 hover:text-purple-200 font-medium text-xs"
            >
              Lihat Detail &rarr;
            </button>
          </div>
        </div>

        {/* Financial Health Banner */}
        <div className="lg:col-span-2 rounded-xl p-5 lg:p-6 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#3B217D] via-[#2A175B] to-[#170E33] border border-purple-500/30 shadow-xl">
          <div className="absolute -right-6 -top-6 text-white/5 pointer-events-none">
            <ShieldCheck className="w-56 h-56" />
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[11px] font-semibold mb-2.5 border border-purple-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Monitoring Cash Flow Perusahaan</span>
            </div>

            <h2 className="text-lg lg:text-xl font-bold text-white mb-2 tracking-tight">
              Kesehatan Finansial & Likuiditas
            </h2>
            <p className="text-xs text-purple-100/80 mb-4 leading-relaxed">
              Pastikan rasio Free Cash selalu positif setelah memperhitungkan hutang tempo vendor dan
              estimasi operasional bulan berjalan. Pantau umur tagihan pada Aging Report secara
              berkala agar arus kas tidak tersendat.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setCurrentPage('aging')}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-md flex items-center gap-1.5"
              >
                Buka Aging Report <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage('ketentuan')}
                className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                <span>Ketentuan & Rumus</span>
              </button>
              <button
                onClick={() => setCurrentPage('klien')}
                className="bg-white/10 hover:bg-white/15 text-purple-200 border border-white/10 px-3.5 py-2 rounded-lg text-xs font-medium transition"
              >
                Lihat Semua Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Peta Keterhubungan Alur Data Antar Menu */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Matriks Keterhubungan Data FinMan</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Semua modul otomatis terhubung dan saling mempengaruhi kalkulasi kas & margin
            </p>
          </div>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-md">
            Sistem Sinkronisasi Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3.5">
          {/* Card 1: Klien */}
          <div
            onClick={() => setCurrentPage('klien')}
            className="p-3 rounded-lg bg-[#120F24] border border-emerald-500/20 hover:border-emerald-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-emerald-300 text-xs">1. Transaksi Klien</span>
              <span className="text-[9px] text-slate-500">Pemasukan</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{formatRp(kpis.totalOmset)}</div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              Menerbitkan invoice, menyetor pembayaran ke <span className="text-purple-300">Report Bank</span>, dan piutang di <span className="text-amber-300">Aging</span>.
            </p>
            <span className="text-[10px] text-emerald-400 group-hover:underline block mt-2">&rarr; Buka Klien</span>
          </div>

          {/* Card 2: Vendor */}
          <div
            onClick={() => setCurrentPage('vendor')}
            className="p-3 rounded-lg bg-[#120F24] border border-blue-500/20 hover:border-blue-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-blue-300 text-xs">2. Transaksi Vendor</span>
              <span className="text-[9px] text-slate-500">HPP Proyek</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{formatRp(kpis.totalModalAkhir)}</div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              Mengambil rekanan dari <span className="text-emerald-300">Master Vendor</span>, otomatis menghitung Modal Akhir di <span className="text-purple-300">Invoice Klien</span>.
            </p>
            <span className="text-[10px] text-blue-400 group-hover:underline block mt-2">&rarr; Buka Vendor</span>
          </div>

          {/* Card 3: Operasional */}
          <div
            onClick={() => setCurrentPage('operasional')}
            className="p-3 rounded-lg bg-[#120F24] border border-orange-500/20 hover:border-orange-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-orange-300 text-xs">3. Trans. Operasional</span>
              <span className="text-[9px] text-slate-500">Beban Usaha</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{formatRp(kpis.totalOperasional)}</div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              Memotong kas di <span className="text-purple-300">Report Bank</span> secara riil, menentukan sisa <span className="text-emerald-300">Free Cash</span> perusahaan.
            </p>
            <span className="text-[10px] text-orange-400 group-hover:underline block mt-2">&rarr; Buka Operasional</span>
          </div>

          {/* Card 4: Report Bank */}
          <div
            onClick={() => setCurrentPage('bank')}
            className="p-3 rounded-lg bg-[#120F24] border border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-purple-300 text-xs">4. Report Kas & Bank</span>
              <span className="text-[9px] text-slate-500">Pusat Likuiditas</span>
            </div>
            <div className="text-sm font-bold text-[#00C896] font-mono">{formatRp(kpis.saldoBank)}</div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              Menampung mutasi kredit dari Klien dan mutasi debit dari Vendor & Operasional dengan buku kas mutasi.
            </p>
            <span className="text-[10px] text-purple-400 group-hover:underline block mt-2">&rarr; Buka Report Bank</span>
          </div>
        </div>
      </div>

      {/* Recent Client Transactions Preview */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-white">Transaksi Klien Terkini</h3>
            <p className="text-[11px] text-slate-400">Monitoring cepat status invoice dan profitabilitas</p>
          </div>
          <button
            onClick={() => setCurrentPage('klien')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Buka Transaksi Klien &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-purple-200/70 text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-2 px-2.5">Tanggal</th>
                <th className="py-2 px-2.5">Invoice</th>
                <th className="py-2 px-2.5">Klien</th>
                <th className="py-2 px-2.5 text-right">Nilai Invoice</th>
                <th className="py-2 px-2.5 text-right">Pembayaran</th>
                <th className="py-2 px-2.5 text-center">Status</th>
                <th className="py-2 px-2.5 text-center">Bank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition">
                  <td className="py-2 px-2.5 text-slate-400 font-mono text-xs">{inv.tanggal}</td>
                  <td className="py-2 px-2.5 font-semibold text-white font-mono text-xs">{inv.invoice}</td>
                  <td className="py-2 px-2.5 text-slate-200 text-xs">{inv.klien}</td>
                  <td className="py-2 px-2.5 text-right font-mono font-medium text-white text-xs">
                    {formatRp(inv.nilaiInvoice)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-emerald-400 font-medium text-xs">
                    {formatRp(inv.pembayaranKlien)}
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inv.status === 'Lunas'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : inv.status === 'DP'
                          ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-center text-xs text-slate-400">{inv.bank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal update aktual cash & rincian rekening */}
      <AktualCashModal
        isOpen={aktualModalOpen}
        onClose={() => setAktualModalOpen(false)}
      />

      {/* Modal penjelasan dan rincian Free Cash */}
      <FreeCashModal
        isOpen={freeCashModalOpen}
        onClose={() => setFreeCashModalOpen(false)}
      />
    </div>
  );
};
