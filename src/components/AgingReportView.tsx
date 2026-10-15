import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  CalendarRange,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatRp, calculateAging, exportToCsv } from '../utils/formatters';
import { PaymentRecordModal } from './PaymentRecordModal';

export const AgingReportView: React.FC = () => {
  const { db, navParams, navigateWithParams, clearNavParams } = useFinancial();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Semua' | 'Piutang' | 'Hutang'>('Semua');
  const [filterBracket, setFilterBracket] = useState<string>('');

  // Payment Recording Modal State
  const [paymentModalTarget, setPaymentModalTarget] = useState<{
    id: string;
    type: 'Piutang' | 'Hutang';
    invoice: string;
    nama: string;
    totalNilai: number;
    sudahBayar: number;
    sisaOutstanding: number;
    currentBank?: string;
  } | null>(null);

  // Consume cross-menu navParams
  useEffect(() => {
    if (navParams) {
      if (navParams.searchTerm) {
        setSearchTerm(navParams.searchTerm);
      }
      if (navParams.filterType) {
        setFilterType(navParams.filterType as 'Semua' | 'Piutang' | 'Hutang');
      }
      clearNavParams();
    }
  }, [navParams]);

  // Collect all outstanding rows from Klien & Vendor
  const agingRows = useMemo(() => {
    const list: Array<{
      id: string;
      tanggal: string;
      invoice: string;
      nama: string;
      brand: string;
      nilai: number;
      outstanding: number;
      kategori: 'Piutang' | 'Hutang';
      days: number;
      bracket: '0-30 Hari' | '31-60 Hari' | '61-90 Hari' | '>90 Hari';
    }> = [];

    // Client Receivables (Piutang)
    db.transaksiKlien.forEach((k) => {
      const n = Number(k.nilaiInvoice) || 0;
      const bayar = Number(k.pembayaranKlien) || 0;
      const out = n - bayar;
      if (out > 0) {
        const { days, bracket } = calculateAging(k.tanggal);
        list.push({
          id: `K-${k.id}`,
          tanggal: k.tanggal,
          invoice: k.invoice,
          nama: k.klien,
          brand: k.brand || '-',
          nilai: n,
          outstanding: out,
          kategori: 'Piutang',
          days,
          bracket,
        });
      }
    });

    // Vendor Payables (Hutang)
    db.transaksiVendor.forEach((v) => {
      const n = Number(v.nilaiTransaksi) || 0;
      const bayar = Number(v.pembayaran) || 0;
      const out = n - bayar;
      if (out > 0) {
        const { days, bracket } = calculateAging(v.tanggal);
        list.push({
          id: `V-${v.id}`,
          tanggal: v.tanggal,
          invoice: v.invoice,
          nama: v.namaVendor,
          brand: '-',
          nilai: n,
          outstanding: out,
          kategori: 'Hutang',
          days,
          bracket,
        });
      }
    });

    // Sort by longest overdue days first
    return list.sort((a, b) => b.days - a.days);
  }, [db.transaksiKlien, db.transaksiVendor]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return agingRows.filter((r) => {
      const matchSearch =
        !searchTerm ||
        [r.invoice, r.nama, r.brand, r.kategori].some(
          (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchType = filterType === 'Semua' || r.kategori === filterType;
      const matchBracket = !filterBracket || r.bracket === filterBracket;

      return matchSearch && matchType && matchBracket;
    });
  }, [agingRows, searchTerm, filterType, filterBracket]);

  // Aggregate stats across filtered data
  const stats = useMemo(() => {
    let totalOut = 0;
    let b30 = 0;
    let b60 = 0;
    let b90 = 0;
    let b90p = 0;

    filteredData.forEach((r) => {
      totalOut += r.outstanding;
      if (r.bracket === '0-30 Hari') b30 += r.outstanding;
      else if (r.bracket === '31-60 Hari') b60 += r.outstanding;
      else if (r.bracket === '61-90 Hari') b90 += r.outstanding;
      else b90p += r.outstanding;
    });

    return { totalOut, b30, b60, b90, b90p };
  }, [filteredData]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Tanggal Invoice',
      'No Invoice',
      'Nama Klien / Vendor',
      'Brand / Proyek',
      'Tipe Transaksi',
      'Nilai Transaksi',
      'Sisa Outstanding',
      'Umur (Hari)',
      'Kelompok Bracket',
    ];

    const rows = filteredData.map((r) => [
      r.tanggal,
      r.invoice,
      r.nama,
      r.brand,
      r.kategori,
      r.nilai,
      r.outstanding,
      r.days,
      r.bracket,
    ]);

    exportToCsv('Aging_Report_FinMan', headers, rows);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
      {/* 5 Bracket KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Outstanding */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 shadow-md border-l-4 border-l-[#C084FC]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Total Outstanding
          </span>
          <h3 className="text-lg font-bold text-white font-mono tracking-tight">
            {formatRp(stats.totalOut)}
          </h3>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {filteredData.length} tagihan terbuka
          </span>
        </div>

        {/* 0-30 Hari */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 shadow-md border-l-4 border-l-[#00C896]">
          <span className="text-[10px] font-bold text-[#00C896] uppercase tracking-wider block mb-0.5">
            0 - 30 Hari (Lancar)
          </span>
          <h3 className="text-lg font-bold text-[#00C896] font-mono tracking-tight">
            {formatRp(stats.b30)}
          </h3>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Tagihan baru</span>
        </div>

        {/* 31-60 Hari */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 shadow-md border-l-4 border-l-[#3B82F6]">
          <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider block mb-0.5">
            31 - 60 Hari
          </span>
          <h3 className="text-lg font-bold text-white font-mono tracking-tight">
            {formatRp(stats.b60)}
          </h3>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Perhatian penagihan</span>
        </div>

        {/* 61-90 Hari */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 shadow-md border-l-4 border-l-[#F59E0B]">
          <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider block mb-0.5">
            61 - 90 Hari
          </span>
          <h3 className="text-lg font-bold text-amber-400 font-mono tracking-tight">
            {formatRp(stats.b90)}
          </h3>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Overdue menengah</span>
        </div>

        {/* >90 Hari */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 shadow-md border-l-4 border-l-[#F43F5E]">
          <span className="text-[10px] font-bold text-[#F43F5E] uppercase tracking-wider block mb-0.5">
            &gt; 90 Hari (Kritis)
          </span>
          <h3 className="text-lg font-bold text-rose-400 font-mono tracking-tight">
            {formatRp(stats.b90p)}
          </h3>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Segera tindak lanjuti</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[180px] flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari invoice, klien, vendor..."
              className="w-full bg-[#0E0C1C] border border-purple-500/20 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-purple-400"
            />
          </div>

          {/* Filter Tipe Transaksi */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#0E0C1C] border border-purple-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400"
          >
            <option value="Semua">Semua Transaksi</option>
            <option value="Piutang">Piutang (Transaksi Klien)</option>
            <option value="Hutang">Hutang (Transaksi Vendor)</option>
          </select>

          {/* Filter Bracket Umur */}
          <select
            value={filterBracket}
            onChange={(e) => setFilterBracket(e.target.value)}
            className="bg-[#0E0C1C] border border-purple-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-400"
          >
            <option value="">Semua Bracket Umur</option>
            <option value="0-30 Hari">0-30 Hari</option>
            <option value="31-60 Hari">31-60 Hari</option>
            <option value="61-90 Hari">61-90 Hari</option>
            <option value=">90 Hari">&gt;90 Hari</option>
          </select>

          {(searchTerm || filterType !== 'Semua' || filterBracket) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('Semua');
                setFilterBracket('');
              }}
              className="text-xs text-purple-400 hover:text-purple-300 px-1.5 py-0.5"
            >
              Reset
            </button>
          )}
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-[#252140] hover:bg-[#2F2A52] border border-purple-500/20 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs shrink-0 justify-center"
        >
          <Download className="w-3.5 h-3.5 text-purple-400" />
          <span>Export Aging CSV</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl overflow-hidden shadow-md w-full min-w-0">
        <div className="px-3.5 py-2 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 bg-black/25">
          <span className="font-medium text-slate-300">
            Daftar Tagihan & Kewajiban ({filteredData.length} baris)
          </span>
          <span className="text-[10px] text-purple-300/80 font-medium flex items-center gap-1">
            Geser tabel ke samping untuk melihat rincian hari & status &rarr;
          </span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[850px]">
            <thead>
              <tr className="bg-black/30 text-white text-[10px] font-bold uppercase tracking-wider border-b border-white/5">
                <th className="px-3.5 py-2.5">Tgl Invoice</th>
                <th className="px-3.5 py-2.5">No. Invoice</th>
                <th className="px-3.5 py-2.5">Klien / Vendor</th>
                <th className="px-3.5 py-2.5">Brand / Proyek</th>
                <th className="px-3.5 py-2.5 text-center">Tipe</th>
                <th className="px-3.5 py-2.5 text-right">Nilai Total</th>
                <th className="px-3.5 py-2.5 text-right text-rose-300">Outstanding</th>
                <th className="px-3.5 py-2.5 text-center">Umur Piutang/Hutang</th>
                <th className="px-3.5 py-2.5 text-center">Bracket Umur</th>
                <th className="px-3.5 py-2.5 text-center">Aksi & Pintasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 italic">
                    Tidak ada outstanding piutang atau hutang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  let bracketBadgeStyle = 'bg-[#143D39] text-[#00C896] border-emerald-500/30';
                  if (row.bracket === '31-60 Hari') {
                    bracketBadgeStyle = 'bg-blue-950/60 text-blue-300 border-blue-500/30';
                  } else if (row.bracket === '61-90 Hari') {
                    bracketBadgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
                  } else if (row.bracket === '>90 Hari') {
                    bracketBadgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-500/30';
                  }

                  const rawId = row.id.replace(/^[KV]-/, '');
                  const currentBank =
                    row.kategori === 'Piutang'
                      ? db.transaksiKlien.find((k) => k.id === rawId)?.bank
                      : db.transaksiVendor.find((v) => v.id === rawId)?.bank;

                  const sudahBayar = Math.max(0, row.nilai - row.outstanding);

                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition">
                      <td className="px-3.5 py-2 text-slate-400 font-mono">{row.tanggal}</td>
                      <td className="px-3.5 py-2 font-bold text-white font-mono">{row.invoice}</td>
                      <td className="px-3.5 py-2 font-semibold text-slate-200">{row.nama}</td>
                      <td className="px-3.5 py-2 text-slate-400">{row.brand}</td>
                      <td className="px-3.5 py-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            row.kategori === 'Piutang'
                              ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {row.kategori === 'Piutang' ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-400" />
                          )}
                          <span>{row.kategori}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-medium text-slate-300">
                        {formatRp(row.nilai)}
                      </td>
                      <td className="px-3.5 py-2 font-bold text-right font-mono text-rose-400 bg-rose-950/15">
                        {formatRp(row.outstanding)}
                      </td>
                      <td className="px-3.5 py-2 text-center font-mono text-slate-300">
                        <span className="font-semibold">{row.days}</span> Hari
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${bracketBadgeStyle}`}
                        >
                          {row.bracket}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentModalTarget({
                                id: rawId,
                                type: row.kategori,
                                invoice: row.invoice,
                                nama: row.nama,
                                totalNilai: row.nilai,
                                sudahBayar,
                                sisaOutstanding: row.outstanding,
                                currentBank: currentBank || undefined,
                              })
                            }
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 ${
                              row.kategori === 'Piutang'
                                ? 'bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white'
                                : 'bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white'
                            }`}
                            title="Catat Pembayaran Masuk/Keluar ke Bank"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Lunasi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (row.kategori === 'Piutang') {
                                navigateWithParams('klien', { searchTerm: row.invoice });
                              } else {
                                navigateWithParams('vendor', { searchTerm: row.invoice });
                              }
                            }}
                            className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-600/30 transition"
                            title="Buka detail transaksi asli"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Payment Recording Modal */}
      <PaymentRecordModal
        target={paymentModalTarget}
        onClose={() => setPaymentModalTarget(null)}
      />
    </div>
  );
};
