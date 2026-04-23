import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../../services/transactionService';
import api from '../../api/axios';
import { Search, Eye, Download, SearchIcon, Plus, FileText, Banknote, CreditCard, ChevronRight } from 'lucide-react';
import FeePaymentModal from '../../components/accounts/FeePaymentModal';
import { toast } from 'sonner';

const FeeCollection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Reuse dashboard summary for top cards
  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary');
      return data;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'credits', 'fee_payment', searchTerm],
    queryFn: async () => {
      const response = await transactionService.getTransactions({
        type: 'CREDIT',
        subType: 'FEE_PAYMENT',
        search: searchTerm,
        limit: 50
      });
      return response;
    }
  });

  const handleDownload = async (id: string, receiptNo: string) => {
    try {
      const blob = await transactionService.getReceiptPdf(id);
      transactionService.downloadReceipt(blob, receiptNo);
      toast.success('Receipt downloaded successfully');
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };

  const todayTotal = summary?.finances?.monthCredit || 0; // Simulated today total using monthCredit as requested fallback
  const monthTotal = summary?.finances?.monthCredit || 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header and Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Banknote className="text-indigo-600" size={32} />
             <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Fee Collection</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Institutional Revenue & Fiscal Terminals</p>
        </div>
        <div className="flex justify-end gap-3 flex-wrap">
          <button 
            onClick={() => setPaymentModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus size={20} /> Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Today's Pulse</p>
               <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">₹{Number(todayTotal).toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl"><Banknote size={24} /></div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Monthly Ledger</p>
               <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">₹{Number(monthTotal).toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl"><CreditCard size={24} /></div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 overflow-hidden space-y-4">
        <div className="p-6 border-b dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative flex-1 group max-w-sm">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search receipts..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-600 outline-none rounded-xl text-sm font-bold transition-all text-slate-900 dark:text-white placeholder:text-slate-400 focus:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto pb-6">
          <table className="w-full">
            <thead className="border-b dark:border-slate-700">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt No</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode / Ref</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {isLoading ? (
                  <tr>
                     <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                           <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Fiscal Ledger Node...</p>
                        </div>
                     </td>
                  </tr>
               ) : (data?.transactions || []).length === 0 ? (
                  <tr>
                     <td colSpan={6} className="text-center p-8 text-xs font-black uppercase text-slate-400 tracking-widest">
                        No transactions found
                     </td>
                  </tr>
               ) : (
                 (data?.transactions || []).map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                       <td className="px-8 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                          {new Date(t.transactionDate).toLocaleDateString()}
                       </td>
                       <td className="px-8 py-4 whitespace-nowrap">
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                             {t.receiptNo}
                          </span>
                       </td>
                       <td className="px-8 py-4 whitespace-nowrap">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{t.student?.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest">{t.student?.enrollmentNo}</p>
                       </td>
                       <td className="px-8 py-4 whitespace-nowrap text-sm font-black text-emerald-600">
                          ₹{Number(t.amount).toLocaleString()}
                       </td>
                       <td className="px-8 py-4 whitespace-nowrap">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t.paymentMode}</p>
                          {t.referenceNo && <p className="text-[9px] font-bold text-slate-400 tracking-widest">{t.referenceNo}</p>}
                       </td>
                       <td className="px-8 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2 text-slate-400">
                             {/* Placeholder for Eye icon since modal in step 3 triggers preview directly, doing it directly for lists is harder without setting state. Let's just hook up download */}
                             <button
                               onClick={() => handleDownload(t.id, t.receiptNo)}
                               className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 rounded-xl transition-all"
                               title="Download PDF"
                             >
                                <Download size={18} />
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

      <FeePaymentModal open={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
    </div>
  );
};

export default FeeCollection;
