import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useFinancial();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#1F1B38] text-white px-4 py-3 rounded-xl border border-purple-500/40 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="text-sm font-medium text-slate-100">{toastMessage}</span>
    </div>
  );
};
