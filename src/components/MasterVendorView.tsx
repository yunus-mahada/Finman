import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  X,
  Phone,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { MasterVendor } from '../types';
import { generateId, formatRp } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export const MasterVendorView: React.FC = () => {
  const { db, saveMasterVendor, deleteMasterVendor, showToast, navigateWithParams } = useFinancial();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterVendor | null>(null);

  const [formId, setFormId] = useState('');
  const [formNamaVendor, setFormNamaVendor] = useState('');
  const [formNoTlp, setFormNoTlp] = useState('');
  const [formNoRekening, setFormNoRekening] = useState('');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered vendors
  const filteredData = useMemo(() => {
    return db.masterVendor.filter((v) => {
      return (
        !searchTerm ||
        [v.id, v.namaVendor, v.noTlp, v.noRekening].some(
          (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    });
  }, [db.masterVendor, searchTerm]);

  // Count usage in Transaksi Vendor
  const getVendorUsageCount = (vendorName: string) => {
    return db.transaksiVendor.filter((tv) => tv.namaVendor === vendorName).length;
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormId(generateId('MST'));
    setFormNamaVendor('');
    setFormNoTlp('');
    setFormNoRekening('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: MasterVendor) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormNamaVendor(item.namaVendor);
    setFormNoTlp(item.noTlp || '');
    setFormNoRekening(item.noRekening || '');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MasterVendor = {
      id: formId,
      namaVendor: formNamaVendor.trim(),
      noTlp: formNoTlp.trim(),
      noRekening: formNoRekening.trim(),
    };
    saveMasterVendor(item);
    setIsFormOpen(false);
  };

  const handleCopyRekening = (rekening: string, id: string) => {
    if (!rekening) return;
    navigator.clipboard.writeText(rekening);
    setCopiedId(id);
    showToast(`No rekening disalin: ${rekening}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
      {/* Top Controls Bar */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-md w-full min-w-0">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative min-w-[200px] max-w-md flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kode vendor, nama, telepon..."
              className="w-full bg-[#0E0C1C] border border-emerald-500/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Reset
            </button>
          )}
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30 transition active:scale-95 shrink-0 justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Master Vendor</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-black/30 text-emerald-200/80 uppercase tracking-wider border-b border-white/5 font-semibold text-[10px]">
                <th className="px-3 py-2.5">Kode Vendor</th>
                <th className="px-3 py-2.5">Nama Vendor</th>
                <th className="px-3 py-2.5">No. Telepon / WhatsApp</th>
                <th className="px-3 py-2.5">No. Rekening Pembayaran</th>
                <th className="px-3 py-2.5 text-center">Transaksi</th>
                <th className="px-3 py-2.5 text-right">Total Pengadaan</th>
                <th className="px-3 py-2.5 text-right text-emerald-400">Terbayar</th>
                <th className="px-3 py-2.5 text-right text-rose-400">Sisa Hutang</th>
                <th className="px-3 py-2.5 text-center">Aksi & Pintasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 italic">
                    Belum ada data master vendor.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const vendorTxs = db.transaksiVendor.filter((tv) => tv.namaVendor === row.namaVendor);
                  const txCount = vendorTxs.length;
                  const totalPengadaan = vendorTxs.reduce((s, v) => s + (Number(v.nilaiTransaksi) || 0), 0);
                  const totalBayar = vendorTxs.reduce((s, v) => s + (Number(v.pembayaran) || 0), 0);
                  const sisaHutang = Math.max(0, totalPengadaan - totalBayar);
                  const isCopied = copiedId === row.id;

                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition">
                      <td className="px-3 py-2 font-mono text-slate-400 font-medium text-xs">
                        {row.id}
                      </td>
                      <td className="px-3 py-2 font-bold text-white text-xs">
                        {row.namaVendor}
                      </td>
                      <td className="px-3 py-2 text-slate-300 text-xs">
                        {row.noTlp ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <a
                              href={`https://wa.me/${row.noTlp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-emerald-300 hover:underline font-mono"
                            >
                              {row.noTlp}
                            </a>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-200 text-xs">
                        {row.noRekening ? (
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3 text-indigo-400" />
                            <span className="font-mono text-indigo-200">{row.noRekening}</span>
                            <button
                              onClick={() => handleCopyRekening(row.noRekening, row.id)}
                              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
                              title="Salin No Rekening"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/40 text-purple-300 border border-purple-500/20">
                          {txCount} Transaksi
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-white text-xs">
                        {formatRp(totalPengadaan)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-emerald-400 text-xs">
                        {formatRp(totalBayar)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-400 bg-rose-950/10 text-xs">
                        {formatRp(sisaHutang)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigateWithParams('vendor', { searchTerm: row.namaVendor })
                            }
                            className="p-1 rounded text-purple-400 hover:text-white hover:bg-purple-600/30 transition"
                            title="Buka Daftar Transaksi Vendor Ini"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigateWithParams('vendor', {
                                prefillVendor: row.namaVendor,
                                openAddModal: true,
                              })
                            }
                            className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-600/30 transition"
                            title="Tambah Transaksi untuk Vendor Ini"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1 rounded text-blue-400 hover:text-white hover:bg-blue-600/30 transition"
                            title="Edit Vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(row.id)}
                            className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-600/30 transition"
                            title="Hapus Vendor"
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
          <div className="w-full max-w-md bg-[#16132A] rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Master Vendor' : 'Tambah Master Vendor'}
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
                <label className="block text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                  Kode Vendor (Auto)
                </label>
                <input
                  type="text"
                  value={formId}
                  readOnly
                  className="w-full bg-[#0E0C1C]/60 border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-emerald-300/70 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Vendor *
                </label>
                <input
                  type="text"
                  value={formNamaVendor}
                  onChange={(e) => setFormNamaVendor(e.target.value)}
                  placeholder="Contoh: CV Mitra Sukses"
                  required
                  className="w-full bg-[#0E0C1C] border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  No. Telepon / HP
                </label>
                <input
                  type="text"
                  value={formNoTlp}
                  onChange={(e) => setFormNoTlp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-[#0E0C1C] border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  No. Rekening Bank Vendor
                </label>
                <input
                  type="text"
                  value={formNoRekening}
                  onChange={(e) => setFormNoRekening(e.target.value)}
                  placeholder="Contoh: BCA 1234567890 a.n Mitra Sukses"
                  className="w-full bg-[#0E0C1C] border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-400 font-mono"
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 transition"
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
        title="Hapus Master Vendor?"
        message="Master vendor ini akan dihapus dari daftar rekanan."
        confirmLabel="Ya, Hapus"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMasterVendor(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
