import React from 'react';
import {
  X,
  Coins,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Building2,
  Receipt,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatRp } from '../utils/formatters';

interface FreeCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreeCashModal: React.FC<FreeCashModalProps> = ({ isOpen, onClose }) => {
  const { kpis, db, setCurrentPage } = useFinancial();

  if (!isOpen) return null;

  const breakdown = kpis.freeCashBreakdown || {
    saldoBank: kpis.saldoBank,
    totalHutang: kpis.totalHutang,
    totalModalAwal: kpis.totalModalAwal,
    totalOperasional: kpis.totalOperasional,
    freeCash: kpis.freeCash,
  };

  const isHealthy = breakdown.freeCash >= 0;

  const handleOpenKetentuan = () => {
    onClose();
    setCurrentPage('ketentuan');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#16132A] rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden p-5 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-[#00C896] flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Logika & Perhitungan Free Cash</h3>
              <p className="text-xs text-slate-400">Total Saldo Bank - Hutang Vendor - Modal Awal - Beban Operasional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1">
          {/* Result Card Hero */}
          <div
            className={`border rounded-xl p-4 shadow-inner ${
              isHealthy
                ? 'bg-gradient-to-r from-[#14332D] to-[#0F2220] border-emerald-500/30'
                : 'bg-gradient-to-r from-[#381622] to-[#240F17] border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-300 block mb-0.5">
                  Posisi Free Cash Saat Ini
                </span>
                <h2
                  className={`text-2xl lg:text-3xl font-bold font-mono tracking-tight ${
                    isHealthy ? 'text-[#00C896]' : 'text-rose-400'
                  }`}
                >
                  {formatRp(breakdown.freeCash)}
                </h2>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                    isHealthy
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  }`}
                >
                  {isHealthy ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Kas Likuid & Aman</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Defisit Likuiditas</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isHealthy ? 'Siap digunakan kapan saja' : 'Percepat penagihan piutang'}
                </span>
              </div>
            </div>
          </div>

          {/* Formula Banner */}
          <div className="bg-black/40 border border-purple-500/20 rounded-xl p-3">
            <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider block mb-1">
              Rumus Perhitungan:
            </span>
            <div className="font-mono text-xs text-purple-200 font-bold bg-[#140F2B] px-3 py-2 rounded-lg border border-purple-500/30 overflow-x-auto whitespace-nowrap">
              Free cash = total saldo bank - hutang vendor - modal awal - beban operasional
            </div>
          </div>

          {/* Step-by-Step Mathematical Deduction */}
          <div>
            <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Rincian Komponen Perhitungan (Realtime)</span>
              <span className="text-[10px] text-slate-400 normal-case font-normal">
                Sinkron dengan data transaksi
              </span>
            </h4>

            <div className="space-y-2 bg-[#0E0C1C] border border-white/5 rounded-xl p-3.5 text-xs">
              {/* Komponen 1: Saldo Bank */}
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    +
                  </span>
                  <div>
                    <span className="font-semibold text-white block">
                      1. Total Saldo Bank
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Akumulasi seluruh ({db.reportBank.length}) rekening bank yang terdaftar di sistem.
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-white text-sm shrink-0">
                  {formatRp(breakdown.saldoBank)}
                </span>
              </div>

              {/* Komponen 2: Hutang Vendor */}
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    -
                  </span>
                  <div>
                    <span className="font-semibold text-rose-300 block">
                      2. Hutang Vendor
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total kewajiban tagihan vendor yang belum dibayar (tempo / sisa DP).
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-400 text-sm shrink-0">
                  -{formatRp(breakdown.totalHutang)}
                </span>
              </div>

              {/* Komponen 3: Modal Awal */}
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    -
                  </span>
                  <div>
                    <span className="font-semibold text-amber-300 block">
                      3. Modal Awal
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total alokasi modal awal dari seluruh transaksi invoice klien ({db.transaksiKlien.length} invoice).
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm shrink-0">
                  -{formatRp(breakdown.totalModalAwal)}
                </span>
              </div>

              {/* Komponen 4: Beban Operasional */}
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    -
                  </span>
                  <div>
                    <span className="font-semibold text-orange-300 block">
                      4. Beban Operasional
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total pengeluaran biaya operasional yang dicatat di sistem ({db.operasional.length} pengeluaran).
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-orange-400 text-sm shrink-0">
                  -{formatRp(breakdown.totalOperasional)}
                </span>
              </div>

              {/* Hasil Akhir */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    =
                  </span>
                  <span className="font-bold text-white text-xs uppercase tracking-wide">
                    Free Cash Hasil
                  </span>
                </div>
                <span
                  className={`font-mono font-bold text-base ${
                    isHealthy ? 'text-[#00C896]' : 'text-rose-400'
                  }`}
                >
                  {formatRp(breakdown.freeCash)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            onClick={handleOpenKetentuan}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/30 transition flex items-center gap-1.5"
          >
            <span>Buka Menu Ketentuan & Rumus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
