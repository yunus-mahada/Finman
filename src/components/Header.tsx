import React, { useState, useEffect } from 'react';
import { Menu, RefreshCw, Database, Cloud, CloudOff, Check } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    currentPage,
    setCurrentPage,
    showToast,
    isSupabaseConfigured,
    syncStatus,
    lastSyncTime,
    refreshFromSupabase,
  } = useFinancial();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    setCurrentDateStr(formatted);
  }, []);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Keuangan',
      subtitle: 'Ringkasan performa finansial, kas bank, piutang & hutang operasional',
    },
    klien: {
      title: 'Transaksi Klien',
      subtitle: 'Pencatatan invoice, modal awal, modal akhir (HPP vendor) dan profit margin',
    },
    vendor: {
      title: 'Transaksi Vendor',
      subtitle: 'Pengadaan barang/jasa vendor, status pembayaran dan komitmen hutang',
    },
    operasional: {
      title: 'Transaksi Operasional',
      subtitle: 'Beban biaya rutin, gaji, utilitas, kantor dan operasional harian',
    },
    'master-vendor': {
      title: 'Master Data Vendor',
      subtitle: 'Katalog data rekanan vendor, kontak telepon dan rekening transfer',
    },
    bank: {
      title: 'Report Kas & Bank',
      subtitle: 'Monitoring mutasi rekening, saldo awal, cash flow dan posisi kas riil',
    },
    aging: {
      title: 'Aging Report (Umur Piutang & Hutang)',
      subtitle: 'Analisis jatuh tempo tagihan klien dan kewajiban vendor per kelompok umur',
    },
    ketentuan: {
      title: 'Ketentuan & Standar Keuangan',
      subtitle: 'Pusat penyimpanan rumus kalkulasi finansial, SOP, dan kebijakan likuiditas bisnis',
    },
    'supabase-prep': {
      title: 'Persiapan Supabase & Vercel',
      subtitle: 'Skema PostgreSQL, SQL Insert generator, dan panduan deploy online',
    },
  };

  const currentInfo = pageTitles[currentPage] || {
    title: 'FinMan Dashboard',
    subtitle: 'Manajemen Keuangan Bisnis',
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (isSupabaseConfigured) {
      await refreshFromSupabase();
    } else {
      setTimeout(() => {
        showToast('Data lokal diperbarui.');
      }, 400);
    }
    setIsRefreshing(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0B0914]/85 backdrop-blur-md px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            {currentInfo.title}
          </h2>
          <p className="hidden md:block text-[11px] text-slate-400">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Subtle Background Sync Status Chip */}
        {isSupabaseConfigured ? (
          <div
            className={`hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all duration-300 ${
              syncStatus === 'syncing'
                ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                : syncStatus === 'error'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20'
            }`}
            title={
              lastSyncTime
                ? `Terakhir disinkronkan: ${lastSyncTime.toLocaleTimeString('id-ID')}`
                : 'Sinkronisasi otomatis latar belakang aktif'
            }
          >
            {syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                <span className="font-medium">Sinkron Latar Belakang...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <CloudOff className="w-3 h-3 text-amber-400" />
                <span className="font-medium">Offline (Tersimpan Lokal)</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">Tersinkron Realtime</span>
                {lastSyncTime && (
                  <span className="text-[10px] text-emerald-400/70 font-mono hidden md:inline">
                    ({lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-medium">Penyimpanan Lokal (Offline)</span>
          </div>
        )}

        {/* Date */}
        <span className="hidden xl:inline text-[11px] text-slate-400 font-medium font-mono">
          {currentDateStr}
        </span>

        {/* Supabase shortcut button */}
        {currentPage !== 'supabase-prep' && (
          <button
            onClick={() => setCurrentPage('supabase-prep')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-purple-300 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 px-2.5 py-1 rounded-lg transition"
            title="Buka Skema & Panduan Supabase"
          >
            <Database className="w-3 h-3 text-purple-400" />
            <span>Koneksi Supabase</span>
          </button>
        )}

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className={`w-7.5 h-7.5 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 text-slate-300 hover:text-white transition active:scale-95 ${
            isRefreshing ? 'animate-spin text-purple-400' : ''
          }`}
          title="Segarkan Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
