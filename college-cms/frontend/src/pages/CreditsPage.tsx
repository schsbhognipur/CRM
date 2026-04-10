import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Download, ArrowRight, CheckCircle, Receipt, Trash2, X, Filter } from 'lucide-react';
import { clsx } from 'clsx';

const CreditsPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMode: 'CASH',
    referenceNo: '',
    remarks: ''
  });

  const { data: recentTransactions, isLoading } = useQuery({
    queryKey: ['transactions', 'credit'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?type=CREDIT');
      return data;
    }
  });

  const { data: searchResults } = useQuery({
    queryKey: ['students', 'search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 3) return [];
      const { data } = await api.get(`/students?search=${searchTerm}`);
      return data.data;
    },
    enabled: searchTerm.length >= 3
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await api.post('/transactions/fee-payment', data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setStep(3);
    }
  });

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    const balance = student.fees[0]?.balance || 0;
    setPaymentData(p => ({ ...p, amount: Number(balance) }));
    setStep(2);
  };

  const downloadReceipt = (txId: string) => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/transactions/${txId}/receipt-pdf`, '_blank');
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Fiscal Collections</h1>
            <p className="text-slate-500 font-medium">Fee reception and receipt management for SCHS Pharmacy College</p>
         </div>
         <button 
           onClick={() => { setModalOpen(true); setStep(1); }}
           className="bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
         >
           <Plus size={20} />
           New Entrance Payment
         </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <CollectionCard title="Intraday Yield" subtitle="Total verified today" amount="₹24.5K" color="indigo" />
         <CollectionCard title="Monthly Aggregate" subtitle="Net collections this month" amount="₹8.42L" color="emerald" />
         <CollectionCard title="Total Receivables" subtitle="System-wide outstanding" amount="₹42.1L" color="rose" />
      </div>

      {/* Transactions Ledger */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 overflow-hidden">
        <div className="p-8 border-b dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Entries</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Last 20 validated transactions</p>
           </div>
           <div className="flex gap-2">
              <button className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border dark:border-slate-700"><Filter size={18} /></button>
              <button className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border dark:border-slate-700"><Download size={18} /></button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
             <thead>
               <tr className="bg-slate-50 dark:bg-slate-900/50">
                 <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt ID</th>
                 <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                 <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                 <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</th>
                 <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {isLoading ? (
                 <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-400 uppercase text-xs tracking-widest animate-pulse">Accessing Ledger Data...</td></tr>
               ) : (
                 recentTransactions?.data.map((tx: any) => (
                   <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer">
                      <td className="px-8 py-6 whitespace-nowrap">
                         <p className="text-sm font-black text-indigo-600 tracking-tight">{tx.receiptNo}</p>
                         <p className="text-[10px] font-bold text-slate-400">{new Date(tx.transactionDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-800 dark:text-white uppercase">{tx.student?.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.student?.enrollmentNo}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-lg font-black text-emerald-600">₹{tx.amount.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                         <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {tx.paymentMode}
                         </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-right">
                        <button 
                           onClick={(e) => { e.stopPropagation(); downloadReceipt(tx.id); }}
                           className="w-11 h-11 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center ml-auto shadow-sm group-hover:shadow-md"
                        >
                           <Download size={20} />
                        </button>
                      </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>
      </div>

      {/* Modern Payment Wizard */}
      <AnimatePresence>
         {modalOpen && (
           <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-2xl shadow-3xl overflow-hidden border dark:border-slate-700"
             >
               {/* Modal Header */}
               <div className="bg-indigo-600 p-8 text-white relative flex justify-between items-center overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="relative z-10">
                     <h2 className="text-2xl font-black uppercase tracking-tight">Entrance Payment</h2>
                     <p className="text-xs font-bold text-indigo-200 mt-1 uppercase tracking-widest">SCHS Fiscal Intelligence</p>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    {[1,2,3].map(i => (
                      <div key={i} className={clsx("w-3 h-3 rounded-full transition-all duration-300", step === i ? "bg-white scale-125" : "bg-indigo-400 opacity-50")} />
                    ))}
                  </div>
                  <button onClick={() => setModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                     <X size={24} />
                  </button>
               </div>

               <div className="p-10">
                 {step === 1 && (
                   <div className="space-y-8">
                      <div>
                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Locate Student Identity</label>
                         <div className="relative group">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-all" size={20} />
                           <input 
                              type="text" 
                              placeholder="Type enrollment no or full name..." 
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl font-bold transition-all outline-none"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                           />
                         </div>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                         {searchTerm.length < 3 ? (
                            <div className="text-center p-12 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enter min 3 characters to search</p>
                            </div>
                         ) : (
                            searchResults?.map((student: any) => (
                              <button 
                                 key={student.id}
                                 onClick={() => handleStudentSelect(student)}
                                 className="w-full p-5 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-2xl hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-600/10 text-left transition-all flex justify-between items-center group"
                              >
                                 <div>
                                    <div className="font-black text-slate-800 dark:text-white uppercase truncate max-w-[200px]">{student.name}</div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.enrollmentNo}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Pending</p>
                                    <p className="text-lg font-black text-rose-600 group-hover:scale-110 transition-transform">₹{student.fees[0]?.balance.toLocaleString()}</p>
                                 </div>
                              </button>
                            ))
                         )}
                      </div>
                   </div>
                 )}

                 {step === 2 && selectedStudent && (
                   <div className="space-y-8 animate-fade-in">
                      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-900/40 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10"><Receipt size={80} /></div>
                         <div className="flex justify-between items-end relative z-10">
                            <div>
                               <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Authenticated Payload for</p>
                               <h3 className="text-2xl font-black text-white">{selectedStudent.name}</h3>
                               <p className="text-xs font-bold text-indigo-200 mt-1 uppercase tracking-tighter">{selectedStudent.enrollmentNo}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1">Fiscal Liability</p>
                               <p className="text-2xl font-black text-rose-400">₹{selectedStudent.fees[0].balance.toLocaleString()}</p>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="col-span-2 sm:col-span-1 space-y-2">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Transfer Amount</label>
                           <input 
                              type="number" 
                              className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl font-black text-lg transition-all" 
                              value={paymentData.amount}
                              onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                           />
                         </div>
                         <div className="col-span-2 sm:col-span-1 space-y-2">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel Mode</label>
                           <select 
                             className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black text-lg appearance-none"
                             value={paymentData.paymentMode}
                             onChange={(e) => setPaymentData({...paymentData, paymentMode: e.target.value})}
                           >
                             <option value="CASH">CASH ENTRY</option>
                             <option value="UPI">UPI DIGITAL</option>
                             <option value="CHEQUE">CHEQUE PAY</option>
                             <option value="BANK_TRANSFER">WIRED BANK</option>
                           </select>
                         </div>
                         <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Reference No</label>
                            <input 
                               type="text" 
                               className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold" 
                               placeholder="Transaction ID, Cheque No, or Remarks"
                               value={paymentData.referenceNo}
                               onChange={(e) => setPaymentData({...paymentData, referenceNo: e.target.value})}
                            />
                         </div>
                      </div>

                      <button 
                        onClick={() => paymentMutation.mutate({ studentFeeId: selectedStudent.fees[0].id, ...paymentData })}
                        disabled={paymentMutation.isPending}
                        className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {paymentMutation.isPending ? 'Verifying Transaction...' : 'Establish Clearance & Generate Receipt'}
                      </button>
                   </div>
                 )}

                 {step === 3 && (
                   <div className="text-center space-y-8 py-12 animate-fade-in">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.25rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20"
                      >
                         <CheckCircle size={48} />
                      </motion.div>
                      <div>
                         <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Operation Successful</h2>
                         <p className="text-slate-500 font-medium">Clearance established. Ledger record updated for student Identity.</p>
                      </div>
                      <div className="flex gap-4 pt-4">
                         <button 
                           onClick={() => downloadReceipt(paymentMutation.data.transaction.id)}
                           className="flex-1 border-2 border-indigo-600 text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all"
                         >
                            <Receipt size={20} /> Deploy Receipt PDF
                         </button>
                         <button 
                           onClick={() => setModalOpen(false)}
                           className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-800"
                         >
                            Finish Mission
                         </button>
                      </div>
                   </div>
                 )}
               </div>
             </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const CollectionCard = ({ title, subtitle, amount, color }: any) => (
  <div className={clsx(
    "p-8 rounded-[2.5rem] shadow-xl border-l-[10px] transition-all hover:-translate-y-2 relative overflow-hidden",
    color === 'indigo' ? "bg-white dark:bg-slate-800 border-indigo-600 shadow-indigo-100 dark:shadow-none" : 
    color === 'emerald' ? "bg-white dark:bg-slate-800 border-emerald-600 shadow-emerald-100 dark:shadow-none" : 
    "bg-white dark:bg-slate-800 border-rose-600 shadow-rose-100 dark:shadow-none"
  )}>
    <div className="absolute top-0 right-0 p-4 opacity-5">
       <Receipt size={60} />
    </div>
    <div className="relative z-10">
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
       <p className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{amount}</p>
       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{subtitle}</p>
    </div>
  </div>
);

export default CreditsPage;
