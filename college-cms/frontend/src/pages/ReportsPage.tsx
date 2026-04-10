import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Table as TableIcon, 
  Download, 
  Calendar,
  Filter,
  Users,
  CreditCard,
  ArrowRight,
  Receipt,
  Clock,
  ExternalLink,
  ChevronRight,
  Activity
} from 'lucide-react';
import { clsx } from 'clsx';

const reports = [
  { id: 'daybook', name: 'Strategic Day Book', icon: Calendar, description: 'Register of intraday movement.' },
  { id: 'fees', name: 'Fiscal Collection', icon: Receipt, description: 'Range-bound yield analysis.' },
  { id: 'outstanding', name: 'Receivables Analysis', icon: Clock, description: 'Identification of dormant accounts.' },
  { id: 'expense', name: 'Operational Ledger', icon: CreditCard, description: 'Departmental expenditure tracking.' },
];

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [filters, setFilters] = useState({ date: new Date().toISOString().split('T')[0], from: '', to: '' });

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', activeReport, filters],
    queryFn: async () => {
      if (!activeReport) return null;
      let path = '';
      if (activeReport === 'daybook') path = `/reports/day-book?date=${filters.date}`;
      if (activeReport === 'fees') path = `/reports/fee-collection?dateFrom=${filters.from}&dateTo=${filters.to}`;
      if (activeReport === 'outstanding') path = `/reports/outstanding-fees`;
      if (activeReport === 'expense') path = `/reports/expense-ledger`;
      
      const { data } = await api.get(path);
      return data;
    },
    enabled: !!activeReport
  });

  const exportExcel = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/${activeReport}/excel`, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Intelligence Reports</h1>
          <p className="text-slate-500 font-medium">Analyzing institutional performance for SCHS Pharmacy College</p>
       </div>

       <div className="flex flex-col xl:flex-row gap-8">
          {/* Intelligence Modules */}
          <div className="w-full xl:w-96 space-y-4">
             {reports.map((r, i) => (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveReport(r.id)}
                  className={clsx(
                    "w-full p-6 bg-white dark:bg-slate-800 rounded-[2rem] text-left transition-all relative overflow-hidden group border dark:border-slate-700",
                    activeReport === r.id 
                      ? "border-indigo-600 shadow-2xl shadow-indigo-600/20 ring-4 ring-indigo-50 dark:ring-indigo-900/10" 
                      : "border-transparent shadow-sm hover:border-slate-200"
                  )}
                >
                   <div className="flex items-center gap-5 relative z-10">
                      <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        activeReport === r.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/40" : "bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-indigo-600"
                      )}>
                         <r.icon size={26} />
                      </div>
                      <div>
                         <p className={clsx("font-black text-sm uppercase tracking-tight", activeReport === r.id ? "text-indigo-600" : "text-slate-600 dark:text-slate-300")}>{r.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-slate-500">{r.description}</p>
                      </div>
                   </div>
                   {activeReport === r.id && <div className="absolute top-0 right-0 p-4"><ChevronRight size={16} className="text-indigo-600" /></div>}
                </motion.button>
             ))}
          </div>

          {/* Report Visualization Pane */}
          <div className="flex-1 space-y-6">
             <AnimatePresence mode="wait">
                {!activeReport ? (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="h-[600px] flex flex-col items-center justify-center p-20 text-center bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none"
                   >
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-8">
                         <TableIcon size={48} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Select Intelligence Module</h3>
                      <p className="text-sm text-slate-400 max-w-sm font-medium">Choose a report from the strategic units on the left to generate validated data exports and visualizations.</p>
                   </motion.div>
                ) : (
                   <motion.div 
                     key={activeReport}
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="space-y-8 animate-fadeIn"
                   >
                      {/* Integrated Header */}
                      <div className="bg-slate-900 dark:bg-slate-800/50 p-10 rounded-[3rem] text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Live Report Generation</p>
                               <h2 className="text-3xl font-black uppercase tracking-tight">{reports.find(r => r.id === activeReport)?.name}</h2>
                               <p className="text-sm text-slate-400 font-medium">Security Verified • Terminal ID: SCHS-004</p>
                            </div>
                            <div className="flex gap-4">
                               <button onClick={exportExcel} className="px-6 py-3 bg-white text-slate-900 rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2">
                                  <Download size={18} /> Export Excel
                               </button>
                               <button className="px-6 py-3 bg-indigo-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center gap-2">
                                  <FileText size={18} /> Deploy PDF
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Control Interceptor */}
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 flex flex-wrap gap-8 items-end">
                          {activeReport === 'daybook' && (
                            <div className="min-w-[240px]">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Temporal Filter (Date)</label>
                               <input 
                                 type="date" 
                                 className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-xl p-3 text-sm font-bold transition-all outline-none"
                                 value={filters.date}
                                 onChange={(e) => setFilters({...filters, date: e.target.value})}
                               />
                            </div>
                          )}
                          {(activeReport === 'fees' || activeReport === 'expense') && (
                            <>
                               <div className="min-w-[200px]">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Identity Start</label>
                                  <input type="date" className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm font-bold" />
                               </div>
                               <div className="min-w-[200px]">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Identity End</label>
                                  <input type="date" className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm font-bold" />
                               </div>
                            </>
                          )}
                          <button onClick={() => refetch()} className="bg-slate-900 text-white p-4 rounded-xl hover:bg-indigo-600 shadow-xl transition-all">
                            <Filter size={20} />
                          </button>
                      </div>

                      {/* Dynamic Tactical Stats */}
                      {activeReport === 'daybook' && reportData && (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <ReportCard label="Opening Liquidity" value={`₹${reportData.openingBalance.toLocaleString()}`} color="text-slate-500" />
                            <ReportCard label="Yield Injection" value={`₹${reportData.totalCredits.toLocaleString()}`} color="text-emerald-500" />
                            <ReportCard label="Resource Outflow" value={`₹${reportData.totalDebits.toLocaleString()}`} color="text-rose-500" />
                            <ReportCard label="Closing Posture" value={`₹${reportData.closingBalance.toLocaleString()}`} color="text-indigo-600" />
                         </div>
                      )}

                      {/* The Intelligence Grid (Table) */}
                      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 overflow-hidden">
                        <table className="w-full">
                           <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Metadata</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Pulse</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Methodology</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {isLoading ? (
                                 <tr><td colSpan={4} className="p-32 text-center text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">Compiling Intelligence Matrix...</td></tr>
                              ) : (
                                 <>
                                    {activeReport === 'daybook' && reportData && [...reportData.credits, ...reportData.debits].map((row: any) => (
                                       <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                                          <td className="px-8 py-6">
                                             <div className="text-sm font-black text-slate-800 dark:text-white uppercase truncate max-w-[200px]">{row.student?.name || row.description}</div>
                                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.subType.replace(/_/g, ' ')} • {row.receiptNo}</div>
                                          </td>
                                          <td className="px-8 py-6">
                                             <p className={clsx("text-lg font-black", row.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-500')}>
                                                {row.type === 'CREDIT' ? '+' : '-'}₹{row.amount.toLocaleString()}
                                             </p>
                                          </td>
                                          <td className="px-8 py-6">
                                             <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{row.paymentMode}</span>
                                          </td>
                                          <td className="px-8 py-6 text-right">
                                             <div className="text-sm font-bold text-slate-600 dark:text-slate-400">{new Date(row.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Secure Entry</p>
                                          </td>
                                       </tr>
                                    ))}
                                 </>
                              )}
                           </tbody>
                        </table>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
       </div>
    </div>
  );
};

const ReportCard = ({ label, value, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] border dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-indigo-500 transition-all">
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
     <p className={clsx("text-xl font-black transition-transform group-hover:scale-110 origin-left", color)}>{value}</p>
  </div>
);

export default ReportsPage;
