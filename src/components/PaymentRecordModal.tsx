import React, { useState } from 'react';
import { X, CheckCircle2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatRp } from '../utils/formatters';

interface PaymentRecordModalProps {
  target: {
    id: string;
    type: 'Piutang' | 'Hutang';
    invoice: string;
    nama: string;
    totalNilai: number;
    sudahBayar: number;
    sisaOutstanding: number;
    currentBank?: string;
  } | null;
  onClose: () => void;
}

export const PaymentRecordModal: React.FC<PaymentRecordModalProps> = ({ target, onClose }) => {
  const { db, recordKlienPayment, recordVendorPayment } = useFinancial();

  const [amount, setAmount] = useState<string>(
    target ? target.sisaOutstanding.toString() : ''
  );
  const [selectedBank, setSelectedBank] = useState<string>(
    target?.currentBank || db.reportBank[0]?.namaBank || ''
  );

  if (!target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount) || 0;
    if (num <= 0) return;

    if (target.type === 'Piutang') {
      recordKlienPayment(target.id, num, selectedBank);
    } else {
      recordVendorPayment(target.id, num, selectedBank);
    }
    onClose();
  };

  const isPiutang = target.type === 'Piutang';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#16132A] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isPiutang ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {isPiutang ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isPiutang ? 'Catat Penerimaan Piutang' : 'Catat Pembayaran Hutang'}
              </h3>
              <p className="text-xs text-slate-400">
                Invoice {target.invoice} &middot; {target.nama}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info card */}
        <div className="bg-[#100E20] border border-white/5 rounded-xl p-3.5 my-4 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Nilai Total Tagihan:</span>
            <span className="font-mono text-white font-medium">{formatRp(target.totalNilai)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Sudah Terbayar:</span>
            <span className="font-mono text-emerald-400 font-medium">{formatRp(target.sudahBayar)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-white/5 font-semibold">
            <span className={isPiutang ? 'text-amber-300' : 'text-rose-300'}>
              Sisa Outstanding:
            </span>
            <span className={`font-mono text-sm ${isPiutang ? 'text-amber-400' : 'text-rose-400'}`}>
              {formatRp(target.sisaOutstanding)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Nominal Pembayaran (Rp) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(target.sisaOutstanding.toString())}
                className="text-[11px] text-purple-400 hover:text-purple-300 underline"
              >
                Bayar Penuh (Lunas)
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              max={target.sisaOutstanding}
              required
              className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-purple-400 font-mono"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Format: <span className="text-emerald-400 font-mono font-medium">{formatRp(Number(amount) || 0)}</span>
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {isPiutang ? 'Rekening Bank Penerima' : 'Rekening Bank Sumber Pembayar'} *
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              required
              className="w-full bg-[#0E0C1C] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-purple-400"
            >
              {db.reportBank.map((b) => (
                <option key={b.id} value={b.namaBank}>
                  {b.namaBank} ({b.noRekening})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition flex items-center gap-1.5 ${
                isPiutang
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi Pembayaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
