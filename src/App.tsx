import React, { useState } from 'react';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { DashboardView } from './components/DashboardView';
import { TransaksiKlienView } from './components/TransaksiKlienView';
import { TransaksiVendorView } from './components/TransaksiVendorView';
import { OperasionalView } from './components/OperasionalView';
import { MasterVendorView } from './components/MasterVendorView';
import { ReportBankView } from './components/ReportBankView';
import { AgingReportView } from './components/AgingReportView';
import { KetentuanView } from './components/KetentuanView';
import { SupabasePrepView } from './components/SupabasePrepView';

function AppContent() {
  const { currentPage } = useFinancial();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView />;
      case 'klien':
        return <TransaksiKlienView />;
      case 'vendor':
        return <TransaksiVendorView />;
      case 'operasional':
        return <OperasionalView />;
      case 'master-vendor':
        return <MasterVendorView />;
      case 'bank':
        return <ReportBankView />;
      case 'aging':
        return <AgingReportView />;
      case 'ketentuan':
        return <KetentuanView />;
      case 'supabase-prep':
        return <SupabasePrepView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0914] text-slate-100 overflow-x-hidden w-full">
      {/* Fixed Sidebar */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-56 flex flex-col min-h-screen min-w-0 w-full max-w-full">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-3.5 sm:px-5 lg:px-6 py-3.5 max-w-[1600px] w-full min-w-0 mx-auto pb-16">
          {renderActivePage()}
        </main>
      </div>

      {/* Floating Toast Notification */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <FinancialProvider>
      <AppContent />
    </FinancialProvider>
  );
}
