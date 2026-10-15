import React, { useMemo } from 'react';
import {
  X,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ShoppingCart,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatRp } from '../utils/formatters';

interface BankLedgerModalProps {
  bankName: string | null;
  onClose: () => void;
}

interface LedgerEntry {
  id: string;
  tanggal: string;
  tipe: 'Masuk Klien' | 'Keluar Vendor' | 'Keluar Operasional';
  keterangan: string;
  ref: string;
  debit: number;
  kredit: number;
}

export const BankLedgerModal: React.FC<BankLedgerModalProps> = ({ bankName, onClose }) => {
  const { db, bankBalances, navigateWithParams } = useFinancial();

  const bankInfo = useMemo(() => {
    if (!bankName) return null;
    return db.reportBank.find((b) => b.namaBank === bankName);
  }, [db.reportBank, bankName]);

  const stats = useMemo(() => {
    if (!bankName) return null;
    return bankBalances[bankName];
  }, [bankBalances, bankName]);

  // Build sorted ledger entries
  const ledgerEntries = useMemo(() => {
    if (!bankName) return [];
    const entries: LedgerEntry[] = [];

    // Klien incoming payments
    db.transaksiKlien
      .filter((k) => k.bank === bankName && Number(k.pembayaranKlien) > 0)
      .forEach((k) => {
        entries.push({
          id: `KLN-${k.id}`,
          tanggal: k.tanggal,
          tipe: 'Masuk Klien',
          keterangan: `Penerimaan Invoice ${k.invoice} - ${k.klien} (${k.brand || 'Proyek'})`,
          ref: k.invoice,
          debit: 0,
          kredit: Number(k.pembayaranKlien) || 0,
        });
      });

    // Vendor outgoing payments
    db.transaksiVendor
      .filter((v) => v.bank === bankName && Number(v.pembayaran) > 0)
      .forEach((v) => {
        entries.push({
          id: `VND-${v.id}`,
          tanggal: v.tanggal,
          tipe: 'Keluar Vendor',
          keterangan: `Pembayaran Vendor ${v.namaVendor} (Ref Inv: ${v.invoice})`,
          ref: v.invoice,
          debit: Number(v.pembayaran) || 0,
          kredit: 0,
        });
      });

    // Operasional outgoing expenses
    db.operasional
      .filter((o) => o.bank === bankName && Number(o.pembayaran) > 0)
      .forEach((o) => {
        entries.push({
          id: `OP-${o.id}`,
          tanggal: o.tanggal,
          tipe: 'Keluar Operasional',
          keterangan: `${o.pengeluaran} [${o.kategori}]`,
          ref: '-',
          debit: Number(o.pembayaran) || 0,
          kredit: 0,
        });
      });

    // Sort ascending by date for chronological running balance calculation
    entries.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    let running = Number(bankInfo?.cashSaldo) || 0;
    return entries.map((entry) => {
      running = running + entry.kredit - entry.debit;
      return {
        ...entry,
        runningBalance: running,
      };
    });
  }, [db, bankName, bankInfo]);

  if (!bankName || !bankInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-[#16132A] rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Mutasi Rekening: {bankInfo.namaBank}
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                  {bankInfo.noRekening || 'No Rek'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                a.n {bankInfo.atasNama || 'Pemilik Rekening'} &middot; Terhubung dengan Transaksi Klien, Vendor & Operasional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shrink-0">
          <div className="bg-[#120F24] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Saldo Awal
            </span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {formatRp(bankInfo.cashSaldo)}
            </span>
          </div>

          <div className="bg-[#120F24] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">
              Total Masuk (Klien)
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
              +{formatRp(stats?.uangMasukKlien || 0)}
            </span>
          </div>

          <div className="bg-[#120F24] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider block">
              Total Keluar (Vendor+Ops)
            </span>
            <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">
              -{formatRp((stats?.uangKeluarVendor || 0) + (stats?.uangKeluarOperasional || 0))}
            </span>
          </div>

          <div className="bg-[#120F24] border border-emerald-500/30 rounded-xl p-3">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">
              Saldo Akhir Riil
            </span>
            <span className="text-sm font-bold text-[#00C896] font-mono mt-0.5 block">
              {formatRp(stats?.saldoAkhir || 0)}
            </span>
          </div>
        </div>

        {/* Table of transactions */}
        <div className="flex-1 overflow-y-auto border border-white/5 rounded-xl bg-black/20">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="sticky top-0 bg-[#151228] z-10 border-b border-white/5 text-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Tipe Mutasi</th>
                <th className="px-4 py-3">Keterangan / Transaksi Terhubung</th>
                <th className="px-4 py-3 text-right text-emerald-400">Masuk (Kredit)</th>
                <th className="px-4 py-3 text-right text-rose-400">Keluar (Debit)</th>
                <th className="px-4 py-3 text-right text-purple-300">Saldo Berjalan</th>
                <th className="px-4 py-3 text-center">Buka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {/* Row for Saldo Awal */}
              <tr className="bg-white/5 font-medium">
                <td className="px-4 py-2.5 font-mono text-slate-400">-</td>
                <td className="px-4 py-2.5 text-slate-400">Saldo Awal</td>
                <td className="px-4 py-2.5 text-slate-300 italic">Posisi kas pembukaan rekening</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-400">-</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-400">-</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-white">
                  {formatRp(bankInfo.cashSaldo)}
                </td>
                <td className="px-4 py-2.5 text-center text-slate-500">-</td>
              </tr>

              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                    Belum ada riwayat mutasi pembayaran masuk atau keluar untuk rekening ini.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-mono text-slate-400">{row.tanggal}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          row.tipe === 'Masuk Klien'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20'
                            : row.tipe === 'Keluar Vendor'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-500/20'
                            : 'bg-orange-950/60 text-orange-300 border border-orange-500/20'
                        }`}
                      >
                        {row.tipe === 'Masuk Klien' ? (
                          <Receipt className="w-3 h-3 text-emerald-400" />
                        ) : row.tipe === 'Keluar Vendor' ? (
                          <ShoppingCart className="w-3 h-3 text-blue-400" />
                        ) : (
                          <Wallet className="w-3 h-3 text-orange-400" />
                        )}
                        <span>{row.tipe}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{row.keterangan}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                      {row.kredit > 0 ? `+${formatRp(row.kredit)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-rose-400">
                      {row.debit > 0 ? `-${formatRp(row.debit)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white bg-white/5">
                      {formatRp(row.runningBalance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (row.tipe === 'Masuk Klien') {
                            navigateWithParams('klien', { prefillInvoice: row.ref });
                          } else if (row.tipe === 'Keluar Vendor') {
                            navigateWithParams('vendor', { prefillInvoice: row.ref });
                          } else {
                            navigateWithParams('operasional', {
                              searchTerm: row.keterangan.split('[')[0].trim(),
                            });
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="Buka transaksi ini di modul aslinya"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            Total mutasi tercatat: <strong>{ledgerEntries.length} transaksi</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
