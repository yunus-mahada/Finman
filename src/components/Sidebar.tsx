import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  ShoppingCart,
  Wallet,
  Users,
  Landmark,
  CalendarRange,
  Database,
  Building2,
  BookOpen,
  X,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { PageId } from '../types';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { currentPage, setCurrentPage } = useFinancial();

  const handleNav = (page: PageId) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  const navItems = [
    {
      section: 'Menu Utama',
      items: [
        {
          id: 'dashboard' as PageId,
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      section: 'Transaksi Utama',
      items: [
        {
          id: 'klien' as PageId,
          label: 'Transaksi Klien',
          icon: Briefcase,
        },
        {
          id: 'vendor' as PageId,
          label: 'Transaksi Vendor',
          icon: ShoppingCart,
        },
        {
          id: 'operasional' as PageId,
          label: 'Trans. Operasional',
          icon: Wallet,
        },
      ],
    },
    {
      section: 'Master & Laporan',
      items: [
        {
          id: 'master-vendor' as PageId,
          label: 'Master Vendor',
          icon: Users,
        },
        {
          id: 'bank' as PageId,
          label: 'Report Bank',
          icon: Landmark,
        },
        {
          id: 'aging' as PageId,
          label: 'Aging Report',
          icon: CalendarRange,
        },
        {
          id: 'ketentuan' as PageId,
          label: 'Ketentuan',
          icon: BookOpen,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 bg-[#120F24] border-r border-purple-500/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-purple-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.35)] text-white shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-indigo-200 to-white tracking-wide">
                FinMan
              </h1>
              <p className="text-[9px] text-purple-300/60 font-medium tracking-wider uppercase">
                Enterprise Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3.5">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className="px-2.5 text-[10px] font-semibold text-purple-300/40 uppercase tracking-wider mb-1">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left group ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-white border border-purple-500/40 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-semibold'
                          : 'text-slate-300 hover:bg-purple-900/20 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive
                            ? 'text-purple-300'
                            : 'text-slate-400 group-hover:text-purple-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Dedicated Supabase / Vercel Readiness Section */}
          <div className="pt-1">
            <p className="px-2.5 text-[10px] font-semibold text-emerald-400/50 uppercase tracking-wider mb-1">
              Deploy & Integrasi
            </p>
            <button
              onClick={() => handleNav('supabase-prep')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left group ${
                currentPage === 'supabase-prep'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-emerald-400/80 hover:bg-emerald-950/30 hover:text-emerald-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Supabase & Vercel</span>
            </button>
          </div>
        </nav>

        {/* Footer info */}
        <div className="py-2.5 px-3 border-t border-purple-500/10 bg-[#0E0C1C]/60 text-center">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Versi 2.8</span>
            <span className="text-purple-400 font-mono text-[10px]">Ready Supabase</span>
          </div>
        </div>
      </aside>
    </>
  );
};
