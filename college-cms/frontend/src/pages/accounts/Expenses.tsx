import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Search, Edit2, Trash2, Printer, Filter, Settings, 
  TrendingDown, Calendar, CreditCard, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import RecordExpenseModal from '../../components/accounts/RecordExpenseModal';
import ManageCategoriesPanel from '../../components/accounts/ManageCategoriesPanel';
import { clsx } from 'clsx';
import { debounce } from 'lodash';
import { motion } from 'framer-motion';

const Expenses = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [isManagePanelOpen, setManagePanelOpen] = useState(false);
  const [editExpenseData, setEditExpenseData] = useState<any>(null);

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['expense-summary', dateFrom, dateTo],
    queryFn: () => expenseService.getExpenseSummary({ dateFrom, dateTo })
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories', 'all'],
    queryFn: () => expenseService.getCategories(true)
  });

  const debouncedSearch = React.useMemo(() => debounce((val: string) => setSearchTerm(val), 300), []);

  const { data: filterData, isLoading } = useQuery({
    queryKey: ['expenses', searchTerm, categoryId, dateFrom, dateTo, page],
    queryFn: () => expenseService.getExpenses({
      search: searchTerm,
      expenseCategoryId: categoryId,
      dateFrom,
      dateTo,
      page,
      limit
    })
  });

  const handleEdit = (expense: any) => {
    setEditExpenseData(expense);
    setRecordModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const reason = window.prompt("Are you sure? Enter reason for deletion (min 5 chars):");
    if (reason === null) return;
    if (reason.length < 5) return toast.error('Reason must be at least 5 characters long');

    try {
      await expenseService.deleteExpense(id, reason);
      toast.success('Expense record voided successfully');
      // Invalidate manually to trigger refetch
      window.dispatchEvent(new Event('focus'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to void expense');
    }
  };

  const handlePrint = async (id: string) => {
    try {
      await expenseService.downloadVoucher(id);
      toast.success('Voucher compiled successfully');
    } catch (err) {
      toast.error('Failed to generate voucher');
    }
  };

  const canEdit = (tx: any) => {
    if (['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '')) return true;
    const hrs = (new Date().getTime() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60);
    return hrs < 24;
  };

  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <TrendingDown className="text-rose-500" size={32} />
             <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Expense Terminals</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Institutional Operations Disbursal Tracking</p>
        </div>
        <div className="flex justify-end gap-3 flex-wrap">
          <button 
            onClick={() => setManagePanelOpen(true)}
            className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
          >
            <Settings size={20} /> Manage Categories
          </button>
          <button 
            onClick={() => { setEditExpenseData(null); setRecordModalOpen(true); }}
            className="bg-rose-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/30 hover:bg-rose-500 transition-all active:scale-95"
          >
            <Plus size={20} /> Record Expense
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {['This Month', 'Last Month', 'This Year'].map((label, i) => (
            <div key={label} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border dark:border-slate-700 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-700/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
               {isSummaryLoading ? (
                  <div className="h-8 w-1/2 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
               ) : (
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                     ₹{Number(
                        i === 0 ? summary?.data?.totalThisMonth : 
                        i === 1 ? summary?.data?.totalLastMonth : 
                        summary?.data?.totalThisYear
                     ).toLocaleString()}
                  </h2>
               )}
            </div>
         ))}
      </div>

      {/* CATEGORY BREAKDOWN BARS */}
      {!isSummaryLoading && summary?.data?.byCategory && summary?.data?.byCategory?.length > 0 && (
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 block">Current Month Expenditure Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
               {(summary?.data?.byCategory || []).slice(0, 8).map((cat: any) => (
                 <div key={cat.categoryId} className="space-y-2">
                    <div className="flex justify-between items-end">
                       <p className="text-sm font-black uppercase text-slate-800 dark:text-white">{cat.categoryName}</p>
                       <p className="text-xs font-bold text-slate-500">₹{Number(cat.total).toLocaleString()} <span className="opacity-50">({cat.percentage}%)</span></p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-rose-500 rounded-full"
                       />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      )}

      {/* DATA GRID */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b dark:border-slate-700 flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search expenses..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-600 outline-none rounded-xl text-sm font-bold transition-all text-slate-900 dark:text-white placeholder:text-slate-400 focus:shadow-md"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <select 
             className="px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-black uppercase tracking-widest outline-none text-slate-700 dark:text-slate-300 min-w-[200px]"
             value={categoryId}
             onChange={(e) => setCategoryId(e.target.value)}
          >
             <option value="">All Categories</option>
             {(categoriesData?.data || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
             <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none" />
             <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-6">
          <table className="w-full">
            <thead className="border-b dark:border-slate-700 bg-white dark:bg-slate-800">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Category / Desc</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Mode / Invoice</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Processor</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {isLoading ? (
                  <tr>
                     <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                           <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin" />
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Expense Ledger...</p>
                        </div>
                     </td>
                  </tr>
               ) : (filterData?.data?.transactions || []).length === 0 ? (
                  <tr>
                     <td colSpan={6} className="text-center p-12 text-xs font-black uppercase text-slate-400 tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        Empty Global Ledger Output
                     </td>
                  </tr>
               ) : (
                 (filterData?.data?.transactions || []).map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                       <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{new Date(t.transactionDate).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 flex items-center gap-1"><Clock size={10} /> {new Date(t.createdAt).toLocaleTimeString()}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/50 uppercase tracking-widest w-max mb-2">
                             {t.expenseCategory?.name}
                          </p>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 max-w-sm truncate">{t.description}</p>
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-black text-slate-900 dark:text-white">₹{Number(t.amount).toLocaleString()}</p>
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t.paymentMode}</p>
                          {(t.referenceNo || t.invoiceNo) && (
                             <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-1">Ref: {t.referenceNo || 'Nil'} | Inv: {t.invoiceNo || 'Nil'}</p>
                          )}
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-500 uppercase">
                          {t.recordedBy?.name}
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                             {canEdit(t) && (
                                <button onClick={() => handleEdit(t)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center justify-center transition-all" title="Edit Expense">
                                   <Edit2 size={14} />
                                </button>
                             )}
                             <button onClick={() => handlePrint(t.id)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-center transition-all" title="Print Voucher">
                                <Printer size={14} />
                             </button>
                             {isAdmin && (
                                <button onClick={() => handleDelete(t.id)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center transition-all" title="Void Transaction">
                                   <Trash2 size={14} />
                                </button>
                             )}
                          </div>
                       </td>
                    </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info */}
        {!isLoading && filterData?.data?.meta && filterData?.data?.meta?.totalPages > 1 && (
           <div className="px-8 py-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
              <p>Showing Page {page} of {filterData?.data?.meta?.totalPages} ({filterData?.data?.meta?.total} Disbursals)</p>
              <div className="flex gap-2">
                 <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:text-indigo-600 disabled:opacity-50 transition-colors">Prev</button>
                 <button disabled={page === filterData?.data?.meta?.totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:text-indigo-600 disabled:opacity-50 transition-colors">Next</button>
              </div>
           </div>
        )}
      </div>

      <RecordExpenseModal 
         open={isRecordModalOpen} 
         onClose={() => setRecordModalOpen(false)} 
         prefill={editExpenseData} 
      />
      <ManageCategoriesPanel 
         open={isManagePanelOpen} 
         onClose={() => setManagePanelOpen(false)} 
      />
    </div>
  );
};

export default Expenses;
