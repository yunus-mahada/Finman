import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Trash2,
  Plus,
  Edit2,
  Wallet,
  X,
  Calendar,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { Operasional } from '../types';
import {
  formatRp,
  exportToCsv,
  generateId,
  OPERASIONAL_CATEGORIES,
} from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export const OperasionalView: React.FC = () => {
  const {
    db,
    saveOperasional,
    deleteOperasional,
    deleteMultipleOperasional,
    navParams,
    clearNavParams,
  } = useFinancial();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Operasional | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formPengeluaran, setFormPengeluaran] = useState('');
  const [formKategori, setFormKategori] = useState(OPERASIONAL_CATEGORIES[0]);
  const [formPembayaran, setFormPembayaran] = useState('');
  const [formBank, setFormBank] = useState('');

  // Confirmation Modals
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Handle incoming navParams
  useEffect(() => {
    if (navParams) {
      if (navParams.searchTerm) {
        setSearchTerm(navParams.searchTerm);
      }
      if (navParams.openAddModal) {
        handleOpenAdd();
      }
      clearNavParams();
    }
  }, [navParams]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return db.operasional.filter((row) => {
      const matchSearch =
        !searchTerm ||
        [row.pengeluaran, row.kategori, row.bank].some(
          (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );

      let matchCategory = true;
      if (selectedCategory && row.kategori !== selectedCategory) {
        matchCategory = false;
      }

      let matchDate = true;
      if (startDate && row.tanggal < startDate) matchDate = false;
      if (endDate && row.tanggal > endDate) matchDate = false;

      return matchSearch && matchCategory && matchDate;
    });
  }, [db.operasional, searchTerm, selectedCategory, startDate, endDate]);

  // Aggregate stats
  const aggregates = useMemo(() => {
    let totalBiaya = 0;
    const catMap: Record<string, number> = {};

    filteredData.forEach((row) => {
      const p = Number(row.pembayaran) || 0;
      totalBiaya += p;
      catMap[row.kategori] = (catMap[row.kategori] || 0) + p;
    });

    let topCatName = '-';
    let topCatVal = 0;
    Object.entries(catMap).forEach(([name, val]) => {
      if (val > topCatVal) {
        topCatVal = val;
        topCatName = name;
      }
    });

    return {
      totalBiaya,
      count: filteredData.length,
      topCatName,
      topCatVal,
    };
  }, [filteredData]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormId(generateId('OP'));
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormPengeluaran('');
    setFormKategori(OPERASIONAL_CATEGORIES[0]);
    setFormPembayaran('');
    setFormBank(db.reportBank[0]?.namaBank || '');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: Operasional) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormTanggal(item.tanggal);
    setFormPengeluaran(item.pengeluaran);
    setFormKategori(item.kategori);
    setFormPembayaran(item.pembayaran.toString());
    setFormBank(item.bank || '');
    setIsFormOpen(true);
  };

  // Form Submit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Operasional = {
      id: formId,
      tanggal: formTanggal,
      pengeluaran: formPengeluaran.trim(),
      kategori: formKategori,
      pembayaran: Number(formPembayaran) || 0,
      bank: formBank,
    };

    saveOperasional(item);
    setIsFormOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Tanggal',
      'Nama Pengeluaran',
      'Kategori',
      'Nominal Pembayaran',
      'Sumber Bank',
    ];

    const rows = filteredData.map((r) => [
      r.id,
      r.tanggal,
      r.pengeluaran,
      r.kategori,
      Number(r.pembayaran) || 0,
      r.bank,
    ]);

    exportToCsv('Biaya_Operasional', headers, rows);
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    const ids = filteredData.map((d) => d.id);
    deleteMultipleOperasional(ids);
    setIsBulkDeleteOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
      {/* Top Controls Bar */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shadow-md">
        {/* Search & Date Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[180px] flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pengeluaran, kategori..."
              className="w-full bg-[#0E0C1C] border border-orange-500/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-orange-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0E0C1C] border border-orange-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-orange-400"
          >
            <option value="">Semua Kategori</option>
            {OPERASIONAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Calendar className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400/50 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#0E0C1C] border border-orange-500/20 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-orange-400"
                title="Tanggal Mulai"
              />
            </div>
            <span className="text-slate-500 text-xs">s/d</span>
            <div className="relative">
              <Calendar className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400/50 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#0E0C1C] border border-orange-500/20 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-orange-400"
                title="Tanggal Akhir"
              />
            </div>
            {(startDate || endDate || searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 px-1.5 py-0.5"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-[#252140] hover:bg-[#2F2A52] border border-orange-500/20 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {filteredData.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
              title="Hapus Data Terfilter"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus ({filteredData.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 border border-orange-400/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-orange-900/30 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Operasional</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-[#16132A] border border-white/5 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium uppercase">
            Total Beban Operasional
          </span>
          <p className="text-sm font-bold text-[#F97316] font-mono mt-0.5">
            {formatRp(aggregates.totalBiaya)}
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium uppercase">
            Jumlah Transaksi Biaya
          </span>
          <p className="text-sm font-bold text-white font-mono mt-0.5">
            {aggregates.count} catatan
          </p>
        </div>
        <div className="bg-[#16132A] border border-white/5 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 font-medium uppercase">
            Kategori Terbesar
          </span>
          <p className="text-sm font-bold text-orange-300 truncate mt-0.5">
            {aggregates.topCatName} ({formatRp(aggregates.topCatVal)})
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-black/30 text-orange-200/80 uppercase tracking-wider border-b border-white/5 font-semibold text-[10px]">
                <th className="px-3 py-2.5">Tanggal</th>
                <th className="px-3 py-2.5">Nama Pengeluaran</th>
                <th className="px-3 py-2.5">Kategori</th>
                <th className="px-3 py-2.5 text-right">Nominal Pembayaran</th>
                <th className="px-3 py-2.5 text-center">Bank Pengeluar</th>
                <th className="px-3 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 italic">
                    Belum ada data pengeluaran atau tidak ada yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition">
                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">{row.tanggal}</td>
                    <td className="px-3 py-2 font-semibold text-orange-200 text-xs">
                      {row.pengeluaran}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950/40 text-purple-300 border border-purple-500/20">
                        {row.kategori}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-rose-400 text-xs">
                      -{formatRp(row.pembayaran)}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-300 text-xs">{row.bank || '-'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="p-1 rounded text-blue-400 hover:text-white hover:bg-blue-600/30 transition"
                          title="Edit Operasional"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(row.id)}
                          className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-600/30 transition"
                          title="Hapus Operasional"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#16132A] rounded-2xl border border-orange-500/30 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Biaya Operasional' : 'Tambah Biaya Operasional'}
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
                <label className="block text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-1">
                  ID Sistem (Auto)
                </label>
                <input
                  type="text"
                  value={formId}
                  readOnly
                  className="w-full bg-[#0E0C1C]/60 border border-orange-500/20 rounded-xl px-3.5 py-2 text-xs text-orange-300/70 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Tanggal Pengeluaran *
                </label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  required
                  className="w-full bg-[#0E0C1C] border border-orange-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Pengeluaran / Uraian *
                </label>
                <input
                  type="text"
                  value={formPengeluaran}
                  onChange={(e) => setFormPengeluaran(e.target.value)}
                  placeholder="Contoh: Pembayaran Listrik & Token PLN"
                  required
                  className="w-full bg-[#0E0C1C] border border-orange-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Kategori Biaya *
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full bg-[#0E0C1C] border border-orange-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-400"
                >
                  {OPERASIONAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-300 uppercase tracking-wider mb-1">
                  Nominal Pembayaran (Rp) *
                </label>
                <input
                  type="number"
                  value={formPembayaran}
                  onChange={(e) => setFormPembayaran(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full bg-[#0E0C1C] border border-orange-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Sumber Rekening Bank
                </label>
                <select
                  value={formBank}
                  onChange={(e) => setFormBank(e.target.value)}
                  className="w-full bg-[#0E0C1C] border border-orange-500/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-orange-400"
                >
                  <option value="">-- Pilih Bank Pengeluar --</option>
                  {db.reportBank.map((b) => (
                    <option key={b.id} value={b.namaBank}>
                      {b.namaBank} ({b.noRekening})
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/30 transition"
                >
                  Simpan Operasional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Hapus Catatan Operasional?"
        message="Catatan biaya ini akan dihapus dan saldo kas bank pengeluar akan dikembalikan."
        confirmLabel="Ya, Hapus"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteOperasional(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Hapus ${filteredData.length} Catatan Operasional?`}
        message="Semua transaksi operasional yang sesuai dengan filter pencarian dan rentang tanggal akan dihapus sekaligus."
        confirmLabel={`Ya, Hapus ${filteredData.length} Data`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  );
};
