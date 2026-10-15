import React from 'react';
import { X, Landmark, ArrowDownLeft, ArrowUpRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatRp } from '../utils/formatters';

interface AktualCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AktualCashModal: React.FC<AktualCashModalProps> = ({ isOpen, onClose }) => {
  const { db, bankBalances, kpis, setCurrentPage } = useFinancial();

  if (!isOpen) return null;

  const handleGoToBank = () => {
    onClose();
    setCurrentPage('bank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#16132A] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden p-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Akumulasi Saldo Seluruh Rekening Bank</h3>
              <p className="text-xs text-slate-400">Rincian saldo riil per rekening yang terdaftar di sistem</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5 overflow-y-auto pr-1">
          {/* Hero Card Total Akumulasi */}
          <div className="bg-gradient-to-r from-[#201842] to-[#161230] border border-purple-500/30 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-purple-300 block mb-0.5">
                  Total Saldo Bank di Dashboard (Akumulasi)
                </span>
                <h2 className="text-2xl font-bold text-white font-mono tracking-tight">
                  {formatRp(kpis.saldoBank)}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Total Rekening</span>
                <span className="text-sm font-bold text-purple-200 font-mono">
                  {db.reportBank.length} Bank
                </span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Otomatis dihitung dari saldo awal dan seluruh mutasi transaksi (klien, vendor, operasional).</span>
            </div>
          </div>

          {/* List of Registered Banks */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Daftar Rekening & Saldo Akhir Terhitung
            </h4>

            {db.reportBank.length === 0 ? (
              <div className="text-center py-6 bg-[#0E0C1C] rounded-xl border border-white/5 text-slate-400 text-xs">
                Belum ada rekening bank yang terdaftar.
              </div>
            ) : (
              <div className="space-y-2">
                {db.reportBank.map((bank) => {
                  const stats = bankBalances[bank.namaBank] || {
                    saldoAwal: Number(bank.cashSaldo) || 0,
                    uangMasukKlien: 0,
                    uangKeluarVendor: 0,
                    uangKeluarOperasional: 0,
                    piutang: 0,
                    hutang: 0,
                    saldoAkhir: Number(bank.cashSaldo) || 0,
                  };
                  const totalKeluar = stats.uangKeluarVendor + stats.uangKeluarOperasional;

                  return (
                    <div
                      key={bank.id}
                      className="bg-[#0E0C1C] border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-purple-500/30 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{bank.namaBank}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {bank.noRekening ? `(${bank.noRekening})` : ''}
                          </span>
                        </div>
                        {bank.atasNama && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            a.n {bank.atasNama}
                          </span>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                          <span className="text-slate-400">
                            Awal: {formatRp(bank.cashSaldo)}
                          </span>
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                            +{formatRp(stats.uangMasukKlien)}
                          </span>
                          <span className="text-rose-400 flex items-center gap-0.5">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            -{formatRp(totalKeluar)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right sm:shrink-0">
                        <span className="text-[10px] text-slate-400 block">Saldo Akhir</span>
                        <span className="text-sm font-bold text-[#00C896] font-mono">
                          {formatRp(stats.saldoAkhir)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleGoToBank}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 transition flex items-center gap-1.5"
          >
            <span>Kelola di Report Bank</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
