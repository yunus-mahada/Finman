import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Server,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  ArrowDownToLine,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { generateSupabaseSQL } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export const SupabasePrepView: React.FC = () => {
  const {
    db,
    showToast,
    resetData,
    clearAll,
    importDatabase,
    isSupabaseConfigured,
    isSupabaseConnected,
    isSyncing,
    syncAllToSupabase,
    refreshFromSupabase,
  } = useFinancial();

  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'env' | 'backup'>('status');

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const supabaseSQL = generateSupabaseSQL(db);

  const sampleEnv = `# Konfigurasi Supabase untuk Vercel (masukkan di Project Settings -> Environment Variables)
VITE_SUPABASE_URL="https://xyzcompany.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(supabaseSQL);
    setCopiedSQL(true);
    showToast('SQL skema Supabase berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(sampleEnv);
    setCopiedEnv(true);
    showToast('Template Environment Variable disalin!');
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `finman_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('File backup JSON berhasil diunduh.');
  };

  // Import JSON Backup & Push to Supabase
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.transaksiKlien && json.reportBank) {
          importDatabase(json);
          showToast('File JSON berhasil dimuat ke memori!');
          if (isSupabaseConfigured) {
            await syncAllToSupabase(json);
          }
        } else {
          showToast('Format JSON tidak sesuai dengan skema FinMan.');
        }
      } catch (err) {
        showToast('Gagal memproses file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePushToSupabase = async () => {
    await syncAllToSupabase();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Overview Banner & Live Status */}
      <div className={`border rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isSupabaseConfigured
          ? 'bg-gradient-to-r from-[#17302B] via-[#12232E] to-[#120F24] border-emerald-500/30'
          : 'bg-gradient-to-r from-[#2c1d11] via-[#1f162b] to-[#120F24] border-amber-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
            isSupabaseConfigured
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white">
                Koneksi Database Cloud (Supabase)
              </h3>
              {isSupabaseConfigured ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Terhubung ke Supabase
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <AlertCircle className="w-3 h-3" />
                  Mode Lokal (Offline)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {isSupabaseConfigured
                ? 'Aplikasi terhubung ke Supabase. Setiap transaksi otomatis tersimpan di cloud PostgreSQL dan langsung dapat dilihat oleh seluruh pengguna di semua perangkat.'
                : 'Variabel lingkungan Supabase belum terbaca di aplikasi ini. Data saat ini masih tersimpan di memori browser lokal (LocalStorage).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSupabaseConfigured && (
            <button
              onClick={handlePushToSupabase}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition disabled:opacity-50"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Mengunggah...' : 'Kirim Data ke Supabase'}</span>
            </button>
          )}

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup JSON</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1A1731] border border-white/5 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-3 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'status'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Sinkronisasi & Panduan
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'sql'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Skema SQL Supabase
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'env'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Environment Variables
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'backup'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Backup & Pulihkan JSON
          </button>
        </div>

        {activeTab === 'status' && (
          <div className="space-y-5">
            {/* Sync Action Card */}
            <div className="p-5 bg-[#120F24] border border-purple-500/20 rounded-xl">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-purple-400" />
                Sinkronkan Data Antar Pengguna
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Jika salah satu pengguna (misal User A) baru saja mengunggah file JSON atau menginput data,
                klik tombol di bawah untuk mengunggah seluruh data tersebut langsung ke database Supabase agar
                semua rekan Anda dapat langsung melihatnya.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePushToSupabase}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isSyncing ? 'Sedang Memproses...' : 'Kirim Semua Data Saat Ini ke Supabase'}</span>
                </button>

                <button
                  onClick={refreshFromSupabase}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition disabled:opacity-50"
                >
                  <ArrowDownToLine className="w-4 h-4 text-purple-400" />
                  <span>Tarik Ulang Data dari Supabase</span>
                </button>
              </div>
            </div>

            {/* Steps Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#120F24] border border-white/5 rounded-xl p-3.5">
                <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold font-mono mb-2">
                  01
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Jalankan SQL Skema</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Buka tab <strong>Skema SQL</strong>, salin seluruh script, lalu jalankan di menu <strong>SQL Editor</strong> pada dashboard Supabase Anda.
                </p>
              </div>

              <div className="bg-[#120F24] border border-white/5 rounded-xl p-3.5">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold font-mono mb-2">
                  02
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Pasang Env di Vercel</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pastikan <span className="text-emerald-300 font-mono text-[10px]">VITE_SUPABASE_URL</span> & <span className="text-emerald-300 font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</span> sudah terpasang di Vercel Settings.
                </p>
              </div>

              <div className="bg-[#120F24] border border-white/5 rounded-xl p-3.5">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold font-mono mb-2">
                  03
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Redeploy di Vercel</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Setiap kali menambahkan environment variable di Vercel, lakukan <strong>Redeploy</strong> agar variabel baru aktif di build aplikasi.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  PostgreSQL DDL & Seed Script
                </h4>
                <p className="text-xs text-slate-400">
                  Termasuk tabel master_vendor, report_bank, transaksi_klien, transaksi_vendor, operasional, dan aktual_cash
                </p>
              </div>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
              >
                {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSQL ? 'Tersalin!' : 'Salin Semua SQL'}</span>
              </button>
            </div>

            <pre className="p-4 bg-[#0B0914] border border-white/5 rounded-xl text-xs font-mono text-purple-200 overflow-x-auto max-h-[420px] leading-relaxed selection:bg-purple-600 selection:text-white">
              {supabaseSQL}
            </pre>
          </div>
        )}

        {activeTab === 'env' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Konfigurasi .env untuk Vercel
                </h4>
                <p className="text-xs text-slate-400">
                  Pastikan nama variabel persis seperti di bawah ini pada menu Environment Variables di Vercel:
                </p>
              </div>
              <button
                onClick={handleCopyEnv}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Tersalin!' : 'Salin Template .env'}</span>
              </button>
            </div>

            <pre className="p-4 bg-[#0B0914] border border-white/5 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
              {sampleEnv}
            </pre>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Cadangkan & Pulihkan Database
              </h4>
              <p className="text-xs text-slate-400">
                Data transaksi dapat diekspor sebagai file JSON untuk backup sewaktu-waktu atau dipulihkan ke sistem
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-black/20 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white mb-1">Unduh Backup JSON</h5>
                  <p className="text-xs text-slate-400 mb-4">
                    Simpan salinan data lengkap ke file JSON di komputer Anda.
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-5 bg-black/20 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white mb-1">Pulihkan dari JSON</h5>
                  <p className="text-xs text-slate-400 mb-4">
                    Muat data dari file cadangan JSON dan sinkronkan ke Supabase.
                  </p>
                </div>
                <label className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition border border-white/10">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Pilih & Upload File JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-wrap gap-3 items-center justify-between">
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-950/30 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset ke Default (Kosong)</span>
              </button>

              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-950/30 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Seluruh Data</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset ke Default Kosong?"
        message="Seluruh data transaksi dan rekening akan direset ke kondisi default kosong siap input."
        confirmLabel="Ya, Reset"
        danger={false}
        onConfirm={() => {
          resetData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Kosongkan Semua Data?"
        message="Seluruh catatan transaksi, vendor, bank, dan operasional akan dikosongkan. Pastikan Anda sudah mencadangkan file JSON terlebih dahulu."
        confirmLabel="Ya, Kosongkan"
        danger={true}
        onConfirm={() => {
          clearAll();
          setIsClearConfirmOpen(false);
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};
