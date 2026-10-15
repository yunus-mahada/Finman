import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  X,
  CreditCard,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Vault,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { ReportBank } from '../types';
import { formatRp, generateId } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { BankLedgerModal } from './BankLedgerModal';

export const ReportBankView: React.FC = () => {
  const { db, bankBalances, saveBank, deleteBank, navigateWithParams } = useFinancial();

  const summaryTotals = useMemo(() => {
    let totalSaldoAwal = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;
    let totalSaldoAkhir = 0;

    db.reportBank.forEach((bank) => {
      const stats = bankBalances[bank.namaBank];
      totalSaldoAwal += Number(bank.cashSaldo) || 0;
      if (stats) {
        totalMasuk += stats.uangMasukKlien || 0;
        totalKeluar += (stats.uangKeluarVendor || 0) + (stats.uangKeluarOperasional || 0);
        totalSaldoAkhir += stats.saldoAkhir || 0;
      } else {
        totalSaldoAkhir += Number(bank.cashSaldo) || 0;
      }
    });

    return { totalSaldoAwal, totalMasuk, totalKeluar, totalSaldoAkhir };
  }, [db.reportBank, bankBalances]);

  const [activeLedgerBank, setActiveLedgerBank] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReportBank | null>(null);

  const [formId, setFormId] = useState('');
  const [formNamaBank, setFormNamaBank] = useState('');
  const [formNoRekening, setFormNoRekening] = useState('');
  const [formAtasNama, setFormAtasNama] = useState('');
  const [formCashSaldo, setFormCashSaldo] = useState('');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormId(generateId('BNK'));
    setFormNamaBank('');
    setFormNoRekening('');
    setFormAtasNama('');
    setFormCashSaldo('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ReportBank) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormNamaBank(item.namaBank);
    setFormNoRekening(item.noRekening || '');
    setFormAtasNama(item.atasNama || '');
    setFormCashSaldo(item.cashSaldo.toString());
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ReportBank = {
      id: formId,
      namaBank: formNamaBank.trim().toUpperCase(),
      noRekening: formNoRekening.trim(),
      atasNama: formAtasNama.trim(),
      cashSaldo: Number(formCashSaldo) || 0,
    };
    saveBank(item);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
      {/* Top Header Card */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md w-full min-w-0">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-400" />
            <span>Rekening Kas & Bank Aktif</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Monitoring posisi saldo awal, mutasi masuk/keluar, dan saldo riil terhitung per rekening
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-900/30 transition active:scale-95 shrink-0 justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Rekening Bank</span>
        </button>
      </div>

      {/* Top Summary KPI Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Akumulasi Kas & Bank */}
        <div className="bg-[#1A1731] border border-indigo-500/30 rounded-xl p-3.5 shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-medium text-indigo-300">Total Akumulasi Saldo Bank</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-medium">Dashboard</span>
            </div>
            <h3 className="text-xl font-bold text-[#00C896] font-mono tracking-tight">
              {formatRp(summaryTotals.totalSaldoAkhir)}
            </h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Total {db.reportBank.length} rekening aktif
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-900/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Vault className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Saldo Awal */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Total Saldo Awal</span>
            <h3 className="text-lg font-bold text-white font-mono tracking-tight">
              {formatRp(summaryTotals.totalSaldoAwal)}
            </h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Modal kas awal terdaftar
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center shrink-0">
            <Landmark className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Mutasi Masuk */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Total Mutasi Masuk</span>
            <h3 className="text-lg font-bold text-emerald-400 font-mono tracking-tight">
              +{formatRp(summaryTotals.totalMasuk)}
            </h3>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              Pembayaran klien terverifikasi
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ArrowDownLeft className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Mutasi Keluar */}
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Total Mutasi Keluar</span>
            <h3 className="text-lg font-bold text-rose-400 font-mono tracking-tight">
              -{formatRp(summaryTotals.totalKeluar)}
            </h3>
            <span className="text-[10px] text-rose-400/80 block mt-0.5">
              Vendor + Pengeluaran operasional
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-950/40 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <ArrowUpRight className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {db.reportBank.length === 0 ? (
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-8 text-center">
          <Landmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white">Belum Ada Rekening Bank</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Tambahkan rekening bank operasional untuk mengaktifkan mutasi kas, pencatatan transaksi klien, dan operasional.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
          >
            Tambah Rekening Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                className="bg-[#1A1731] border border-white/5 rounded-xl p-4 shadow-lg relative flex flex-col justify-between hover:-translate-y-0.5 transition duration-200 group"
              >
                <div>
                  {/* Bank Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white tracking-wide">
                          {bank.namaBank}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span>{bank.noRekening || 'No Rek. Belum diisi'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(bank)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="Edit Bank"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(bank.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Hapus Bank"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Atas Nama */}
                  {bank.atasNama && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 px-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>a.n {bank.atasNama}</span>
                    </div>
                  )}

                  {/* Calculated Balance Hero */}
                  <div className="bg-[#120F24] border border-white/5 rounded-lg p-3 mb-3">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block mb-0.5">
                      Saldo Akhir Terhitung
                    </span>
                    <h3 className="text-xl font-bold text-[#00C896] font-mono tracking-tight">
                      {formatRp(stats.saldoAkhir)}
                    </h3>
                  </div>

                  {/* Mutasi Flow Breakdown */}
                  <div className="bg-black/20 rounded-lg p-2.5 border border-white/5 text-xs space-y-1.5 mb-3">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Saldo Awal:</span>
                      <span className="font-mono font-medium text-white">
                        {formatRp(bank.cashSaldo)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-400">
                      <span className="flex items-center gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Masuk (Klien):</span>
                      </span>
                      <span className="font-mono font-medium">
                        +{formatRp(stats.uangMasukKlien)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-rose-400">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Keluar (Vendor+Ops):</span>
                      </span>
                      <span className="font-mono font-medium">
                        -{formatRp(totalKeluar)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Piutang & Hutang associated */}
                <div className="grid grid-cols-2 gap-2 bg-[#120F20] border border-white/5 p-3 rounded-xl text-[11px] mb-3">
                  <div
                    onClick={() => navigateWithParams('aging', { filterType: 'Piutang', searchTerm: bank.namaBank })}
                    className="pr-2 border-r border-white/10 cursor-pointer hover:bg-white/5 rounded p-1 transition"
                    title="Buka Aging Piutang terkait bank ini"
                  >
                    <p className="text-emerald-400 uppercase font-semibold mb-0.5 text-[10px] flex items-center justify-between">
                      <span>Piutang</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </p>
                    <p className="font-bold text-emerald-300 font-mono truncate">
                      {formatRp(stats.piutang)}
                    </p>
                  </div>
                  <div
                    onClick={() => navigateWithParams('aging', { filterType: 'Hutang', searchTerm: bank.namaBank })}
                    className="pl-2 cursor-pointer hover:bg-white/5 rounded p-1 transition"
                    title="Buka Aging Hutang terkait bank ini"
                  >
                    <p className="text-rose-400 uppercase font-semibold mb-0.5 text-[10px] flex items-center justify-between">
                      <span>Hutang</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </p>
                    <p className="font-bold text-rose-300 font-mono truncate">
                      {formatRp(stats.hutang)}
                    </p>
                  </div>
                </div>

                {/* Ledger button */}
                <button
                  type="button"
                  onClick={() => setActiveLedgerBank(bank.namaBank)}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Lihat Mutasi Kas & Ledger</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#16132A] rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
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
                <label className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  ID Sistem (Auto)
                </label>
                <input
                  type="text"
                  value={formId}
                  readOnly
                  className="w-full bg-[#0E0C1C]/60 border border-indigo-500/20 rounded-xl px-3.5 py-2 text-xs text-indigo-300/70 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Bank *
                </label>
                <input
                  type="text"
                  value={formNamaBank}
                  onChange={(e) => setFormNamaBank(e.target.value)}
                  placeholder="Contoh: BCA MAHADA / MANDIRI BISNIS"
                  required
                  className="w-full bg-[#0E0C1C] border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-400 uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formNoRekening}
                  onChange={(e) => setFormNoRekening(e.target.value)}
                  placeholder="Contoh: 1234567890"
                  className="w-full bg-[#0E0C1C] border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  value={formAtasNama}
                  onChange={(e) => setFormAtasNama(e.target.value)}
                  placeholder="Contoh: PT Usaha Jaya Sejahtera"
                  className="w-full bg-[#0E0C1C] border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                  Saldo Awal Kas (Rp) *
                </label>
                <input
                  type="number"
                  value={formCashSaldo}
                  onChange={(e) => setFormCashSaldo(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full bg-[#0E0C1C] border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-400 font-mono"
                />
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 transition"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Hapus Rekening Bank?"
        message="Rekening bank ini akan dihapus dari sistem."
        confirmLabel="Ya, Hapus"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteBank(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Bank Ledger Mutation Modal */}
      <BankLedgerModal
        bankName={activeLedgerBank}
        onClose={() => setActiveLedgerBank(null)}
      />
    </div>
  );
};
