import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Pin,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  ArrowRight,
  Landmark,
  Receipt,
  ShoppingCart,
  Coins,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { KetentuanItem, KetentuanKategori } from '../types';
import { formatRp, generateId } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export const KetentuanView: React.FC = () => {
  const { db, kpis, saveKetentuan, deleteKetentuan, setCurrentPage } = useFinancial();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KetentuanItem | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState<KetentuanKategori>('Rumus & Logika');
  const [formRingkasan, setFormRingkasan] = useState('');
  const [formRumus, setFormRumus] = useState('');
  const [formPenjelasan, setFormPenjelasan] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);

  // Delete Target
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Semua Kategori' },
    { id: 'Rumus & Logika', label: 'Rumus & Logika' },
    { id: 'Kebijakan Kas', label: 'Kebijakan Kas' },
    { id: 'Klien & Piutang', label: 'Klien & Piutang' },
    { id: 'Vendor & Hutang', label: 'Vendor & Hutang' },
    { id: 'Operasional', label: 'Operasional' },
    { id: 'Umum', label: 'Umum' },
  ];

  const items = db.ketentuan || [];

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (selectedCategory !== 'all' && item.kategori !== selectedCategory) {
          return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchJudul = item.judul.toLowerCase().includes(q);
          const matchRingkasan = item.ringkasan.toLowerCase().includes(q);
          const matchRumus = (item.rumus || '').toLowerCase().includes(q);
          const matchPenjelasan = item.penjelasan.toLowerCase().includes(q);
          if (!matchJudul && !matchRingkasan && !matchRumus && !matchPenjelasan) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned items first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.id.localeCompare(b.id);
      });
  }, [items, selectedCategory, searchTerm]);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingItem(null);
    setFormId(generateId('KTN'));
    setFormJudul('');
    setFormKategori('Rumus & Logika');
    setFormRingkasan('');
    setFormRumus('');
    setFormPenjelasan('');
    setFormIsPinned(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: KetentuanItem) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormJudul(item.judul);
    setFormKategori(item.kategori);
    setFormRingkasan(item.ringkasan || '');
    setFormRumus(item.rumus || '');
    setFormPenjelasan(item.penjelasan || '');
    setFormIsPinned(Boolean(item.isPinned));
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const item: KetentuanItem = {
      id: formId,
      judul: formJudul.trim(),
      kategori: formKategori,
      ringkasan: formRingkasan.trim(),
      rumus: formRumus.trim() || undefined,
      penjelasan: formPenjelasan.trim(),
      tanggalUpdate: today,
      isPinned: formIsPinned,
    };
    saveKetentuan(item);
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteKetentuan(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Live Free Cash metrics for the simulator card
  const isHealthyFreeCash = kpis.freeCash >= 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
      {/* Top Header Card */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md w-full min-w-0">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Ketentuan & Standar Keuangan Perusahaan</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pusat penyimpanan data penting, rumus kalkulasi finansial, SOP, dan kebijakan likuiditas bisnis
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 border border-purple-400/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-purple-900/30 transition active:scale-95 shrink-0 justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Ketentuan Baru</span>
        </button>
      </div>

      {/* Featured Live Simulator Card: Free Cash Realtime */}
      <div className="bg-gradient-to-br from-[#211742] via-[#1A1333] to-[#110D24] border border-purple-500/25 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Simulasi Rumus Free Cash (Data Realtime)</h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-medium">
                  Live Database
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Kalkulasi otomatis dana likuid bebas kewajiban berdasarkan transaksi terkini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                isHealthyFreeCash
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
              }`}
            >
              {isHealthyFreeCash ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Likuiditas Sehat</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Defisit Likuiditas</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Mathematical Formula Banner */}
        <div className="mt-3.5 bg-black/40 border border-purple-500/20 rounded-xl p-3">
          <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider block mb-1">
            Rumus Perhitungan:
          </span>
          <div className="font-mono text-xs sm:text-sm text-purple-200 font-bold bg-[#140F2B] px-3 py-2 rounded-lg border border-purple-500/30 overflow-x-auto whitespace-nowrap">
            Free cash = total saldo bank - hutang vendor - modal awal - beban operasional
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3.5">
          {/* 1. Saldo Bank */}
          <div className="bg-[#161230] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block mb-0.5">1. Total Saldo Bank</span>
            <span className="text-base font-bold text-white font-mono block">
              +{formatRp(kpis.saldoBank)}
            </span>
            <span className="text-[10px] text-purple-400/90 block mt-0.5">
              Akumulasi {db.reportBank.length} rekening
            </span>
          </div>

          {/* 2. Hutang Vendor */}
          <div className="bg-[#161230] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block mb-0.5">2. Hutang Vendor</span>
            <span className="text-base font-bold text-rose-400 font-mono block">
              -{formatRp(kpis.totalHutang)}
            </span>
            <span className="text-[10px] text-rose-300/80 block mt-0.5">
              Kewajiban tempo belum bayar
            </span>
          </div>

          {/* 3. Modal Awal */}
          <div className="bg-[#161230] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block mb-0.5">3. Modal Awal</span>
            <span className="text-base font-bold text-amber-400 font-mono block">
              -{formatRp(kpis.totalModalAwal)}
            </span>
            <span className="text-[10px] text-amber-300/80 block mt-0.5">
              Total modal {db.transaksiKlien.length} invoice klien
            </span>
          </div>

          {/* 4. Beban Operasional */}
          <div className="bg-[#161230] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block mb-0.5">4. Beban Operasional</span>
            <span className="text-base font-bold text-orange-400 font-mono block">
              -{formatRp(kpis.totalOperasional)}
            </span>
            <span className="text-[10px] text-orange-300/80 block mt-0.5">
              {db.operasional.length} beban terbayar
            </span>
          </div>

          {/* 5. Hasil Free Cash */}
          <div
            className={`rounded-xl p-3 border ${
              isHealthyFreeCash
                ? 'bg-[#122A26] border-emerald-500/30 text-emerald-300'
                : 'bg-[#2E141D] border-rose-500/30 text-rose-300'
            }`}
          >
            <span className="text-[10px] opacity-80 block mb-0.5">= Free Cash Hasil</span>
            <span
              className={`text-lg font-bold font-mono block ${
                isHealthyFreeCash ? 'text-[#00C896]' : 'text-rose-400'
              }`}
            >
              {formatRp(kpis.freeCash)}
            </span>
            <span className="text-[10px] opacity-80 block mt-0.5">
              Kas bebas setelah beban
            </span>
          </div>
        </div>

        {/* Operational Note */}
        <div className="mt-3 text-[11px] text-slate-400 bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between flex-wrap gap-2">
          <span>
            * Perhitungan Free Cash otomatis diperbarui secara realtime setiap kali terjadi penambahan atau perubahan data transaksi, saldo bank, hutang vendor, modal awal, maupun beban operasional.
          </span>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="text-xs text-purple-300 hover:text-purple-200 font-medium flex items-center gap-1 shrink-0"
          >
            Lihat di Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md w-full min-w-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari ketentuan, rumus, atau kata kunci..."
            className="w-full bg-[#0E0C1C] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ketentuan Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#1A1731] border border-white/5 rounded-xl p-8 text-center">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white">Ketentuan Tidak Ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Tidak ada ketentuan atau rumus yang cocok dengan filter atau kata kunci pencarian Anda.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isFormula = item.kategori === 'Rumus & Logika' || Boolean(item.rumus);

            const categoryColors: Record<string, string> = {
              'Rumus & Logika': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
              'Kebijakan Kas': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              'Klien & Piutang': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
              'Vendor & Hutang': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              Operasional: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
              Umum: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
            };

            const colorClass =
              categoryColors[item.kategori] ||
              'bg-purple-500/20 text-purple-300 border-purple-500/30';

            return (
              <div
                key={item.id}
                className="bg-[#1A1731] border border-white/5 rounded-xl p-4 shadow-md flex flex-col justify-between hover:border-purple-500/30 transition group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${colorClass}`}
                      >
                        {item.kategori}
                      </span>
                      {item.isPinned && (
                        <span className="flex items-center gap-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="Edit Ketentuan"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(item.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Hapus Ketentuan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition tracking-tight">
                    {item.judul}
                  </h4>
                  {item.ringkasan && (
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {item.ringkasan}
                    </p>
                  )}

                  {/* Formula Box if available */}
                  {item.rumus && (
                    <div className="mt-3 bg-[#100D22] border border-purple-500/25 rounded-lg p-2.5">
                      <span className="text-[9px] uppercase tracking-wider text-purple-300/80 font-bold block mb-1">
                        Rumus / Formula:
                      </span>
                      <code className="text-xs font-mono font-bold text-purple-200 block overflow-x-auto whitespace-pre-wrap">
                        {item.rumus}
                      </code>
                    </div>
                  )}

                  {/* Detailed Explanation / Body */}
                  {item.penjelasan && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 text-xs text-slate-400 leading-relaxed space-y-1 whitespace-pre-line">
                      {item.penjelasan}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>ID: {item.id}</span>
                  <span>Diperbarui: {item.tanggalUpdate || '2026-07-15'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Ketentuan Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#16132A] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden p-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Data Ketentuan' : 'Tambah Data Ketentuan Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simpan rumus perhitungan, aturan operasional, atau SOP penting
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-3.5">
              {/* Judul */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Judul Ketentuan / Rumus *
                </label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Rumus Perhitungan Free Cash"
                  required
                  className="w-full bg-[#0E0C1C] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Kategori *
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as KetentuanKategori)}
                  className="w-full bg-[#0E0C1C] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400"
                >
                  <option value="Rumus & Logika">Rumus & Logika</option>
                  <option value="Kebijakan Kas">Kebijakan Kas</option>
                  <option value="Klien & Piutang">Klien & Piutang</option>
                  <option value="Vendor & Hutang">Vendor & Hutang</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              {/* Rumus (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Rumus / Formula Matematis (Opsional)
                </label>
                <input
                  type="text"
                  value={formRumus}
                  onChange={(e) => setFormRumus(e.target.value)}
                  placeholder="Contoh: Free Cash = Saldo Bank - Hutang Vendor - Modal Awal Open"
                  className="w-full bg-[#0E0C1C] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40"
                />
              </div>

              {/* Ringkasan */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Ringkasan Singkat
                </label>
                <input
                  type="text"
                  value={formRingkasan}
                  onChange={(e) => setFormRingkasan(e.target.value)}
                  placeholder="Ringkasan 1 kalimat penjelasan ketentuan..."
                  className="w-full bg-[#0E0C1C] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40"
                />
              </div>

              {/* Penjelasan Detail */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                  Penjelasan Lengkap / Langkah Perhitungan / SOP
                </label>
                <textarea
                  rows={5}
                  value={formPenjelasan}
                  onChange={(e) => setFormPenjelasan(e.target.value)}
                  placeholder="Rincian penjelasan komponen rumus, aturan pencatatan, atau panduan operasional..."
                  className="w-full bg-[#0E0C1C] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 font-sans"
                />
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsPinned"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded border-white/10 bg-[#0E0C1C] text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="formIsPinned" className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
                  <Pin className="w-3 h-3 text-amber-400" />
                  <span>Sematkan ke bagian paling atas (Pin)</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/30 transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Ketentuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Ketentuan"
        message="Apakah Anda yakin ingin menghapus data ketentuan ini? Data yang terhapus tidak dapat dikembalikan."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
