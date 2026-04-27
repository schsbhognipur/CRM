import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getAccessToken } from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Download, ArrowRight, CheckCircle, Receipt, Trash2, X, Filter } from 'lucide-react';
import { clsx } from 'clsx';

const CreditsPage = () => {
   const queryClient = useQueryClient();
   const [modalOpen, setModalOpen] = useState(false);
   const [step, setStep] = useState(1);
   const [selectedStudent, setSelectedStudent] = useState<any>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterProgram, setFilterProgram] = useState('');
   const [filterYear, setFilterYear] = useState('');

   // Ledger Filters
   const [ledgerSearch, setLedgerSearch] = useState('');
   const [ledgerCourse, setLedgerCourse] = useState('');
   const [ledgerAcademicYear, setLedgerAcademicYear] = useState('');
   const [ledgerPaymentMode, setLedgerPaymentMode] = useState('');
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);

   const [paymentData, setPaymentData] = useState({
      amount: 0,
      paymentMode: 'CASH',
      referenceNo: '',
      remarks: ''
   });

   const { data: recentTransactions, isLoading } = useQuery({
      queryKey: ['transactions', 'credit', page, limit, ledgerSearch, ledgerCourse, ledgerAcademicYear, ledgerPaymentMode],
      queryFn: async () => {
         const { data } = await api.get(`/transactions?type=CREDIT&page=${page}&limit=${limit}&search=${ledgerSearch}&courseId=${ledgerCourse}&academicYearId=${ledgerAcademicYear}&paymentMode=${ledgerPaymentMode}`);
         return data.data;
      }
   });

   const { data: searchResults } = useQuery({
      queryKey: ['students', 'search', searchTerm, filterProgram, filterYear],
      queryFn: async () => {
         if (searchTerm.length < 2 && !filterProgram && !filterYear) return [];
         const { data } = await api.get(`/students?search=${searchTerm}&courseId=${filterProgram}&yearOfStudy=${filterYear}`);
         return data.students;
      },
      enabled: searchTerm.length >= 2 || !!filterProgram || !!filterYear
   });

   const { data: summary, refetch: refetchSummary } = useQuery({
      queryKey: ['collections-summary'],
      queryFn: async () => {
         const { data } = await api.get('/transactions/summary');
         return data.data;
      }
   });

   const { data: courses } = useQuery({
      queryKey: ['courses'],
      queryFn: async () => {
         const { data } = await api.get('/courses');
         return data.data;
      }
   });

   const { data: academicYears } = useQuery({
      queryKey: ['academic-years'],
      queryFn: async () => {
         const { data } = await api.get('/academic-years');
         return data.data;
      }
   });

   const paymentMutation = useMutation({
      mutationFn: async (data: any) => {
         const { data: res } = await api.post('/transactions/fee-payment', data);
         return res;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['transactions'] });
         queryClient.invalidateQueries({ queryKey: ['dashboard'] });
         refetchSummary();
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
      const token = getAccessToken();
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/transactions/${txId}/receipt-pdf?token=${token}`, '_blank');
   };

   return (
      <div className="space-y-10 animate-fade-in">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-3xl font-black text-slate-900  mb-1">Fiscal Collections</h1>
               <p className="text-slate-500 font-medium">Fee reception and receipt management for SCHS Pharmacy College</p>
            </div>
            <button
               onClick={() => { setModalOpen(true); setStep(1); }}
               className="bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-50 transition-all active:scale-95"
            >
               <Plus size={20} />
               New Entrance Payment
            </button>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <CollectionCard
               title="Intraday Yield"
               subtitle="Total verified today"
               amount={`₹${(summary?.todayTotal || 0).toLocaleString()}`}
               color="indigo"
               pulse
            />
            <CollectionCard
               title="Nett Session Fee"
               subtitle="Total session liability"
               amount={`₹${(summary?.nettSessionFee || 0).toLocaleString()}`}
               color="emerald"
            />
            <CollectionCard
               title="Collected"
               subtitle="Total recovery to date"
               amount={`₹${(summary?.collected || 0).toLocaleString()}`}
               color="blue"
            />
            <CollectionCard
               title="Pending"
               subtitle="Total outstanding"
               amount={`₹${(summary?.pending || 0).toLocaleString()}`}
               color="rose"
            />
            <CollectionCard
               title="Discount Burn"
               subtitle="Scholarship distribution"
               amount={`₹${(summary?.discountBurn || 0).toLocaleString()}`}
               color="amber"
            />
         </div>

         {/* Filter Card */}
         <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-fade-in group hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
               <div className="relative flex-1 group w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-all" size={20} />
                  <input
                     type="text"
                     placeholder="Search ledger by name, enrollment, or receipt..."
                     className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl font-bold transition-all outline-none"
                     value={ledgerSearch}
                     onChange={(e) => { setLedgerSearch(e.target.value); setPage(1); }}
                  />
               </div>
               <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto">
                  <select
                     className="flex-1 lg:w-48 p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                     value={ledgerCourse}
                     onChange={(e) => { setLedgerCourse(e.target.value); setPage(1); }}
                  >
                     <option value="">All Courses</option>
                     {courses?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name.replace(/_/g, '. ')}</option>
                     ))}
                  </select>
                  <select
                     className="flex-1 lg:w-48 p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                     value={ledgerAcademicYear}
                     onChange={(e) => { setLedgerAcademicYear(e.target.value); setPage(1); }}
                  >
                     <option value="">All Session</option>
                     {academicYears?.map((y: any) => (
                        <option key={y.id} value={y.id}>{y.label}</option>
                     ))}
                  </select>
                  <select
                     className="flex-1 lg:w-48 p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                     value={ledgerPaymentMode}
                     onChange={(e) => { setLedgerPaymentMode(e.target.value); setPage(1); }}
                  >
                     <option value="">All Modes</option>
                     <option value="CASH">CASH</option>
                     <option value="UPI">UPI</option>
                     <option value="BANK_TRANSFER">BANK TRANSFER</option>
                     <option value="CHEQUE">CHEQUE</option>
                  </select>
               </div>
            </div>
         </div>

         {/* Transactions Ledger */}
         <div className="bg-white  rounded-[2.5rem] shadow-xl shadow-slate-200/50  border  overflow-hidden">
            <div className="p-8 border-b  flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h3 className="text-xl font-black text-slate-900 ">Recent Entries</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Last 20 validated transactions</p>
               </div>
               <div className="flex gap-2">
                  <button className="p-3 bg-slate-50  rounded-xl text-slate-400 hover:text-indigo-600 transition-all border "><Filter size={18} /></button>
                  <button className="p-3 bg-slate-50  rounded-xl text-slate-400 hover:text-indigo-600 transition-all border "><Download size={18} /></button>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-slate-50 ">
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sr No.</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt ID</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</th>
                        <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 ">
                     {isLoading ? (
                        <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-400 uppercase text-xs tracking-widest animate-pulse">Accessing Ledger Data...</td></tr>
                     ) : (
                        (recentTransactions?.transactions || []).map((tx: any, idx: number) => (
                           <tr key={tx.id} className="hover:bg-slate-50  transition-colors group cursor-pointer">
                              <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-400">
                                 {(page - 1) * limit + idx + 1}
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                 <p className="text-sm font-black text-indigo-600 tracking-tight">{tx.receiptNo}</p>
                                 <p className="text-[10px] font-bold text-slate-400">{new Date(tx.transactionDate).toLocaleDateString()}</p>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                 <div className="text-sm font-black text-slate-800  uppercase">{tx.student?.name}</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.student?.enrollmentNo}</div>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                 <p className="text-lg font-black text-emerald-600">₹{(Number(tx.amount) || 0).toLocaleString()}</p>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                 <span className="px-3 py-1 bg-slate-100  rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {tx.paymentMode}
                                 </span>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap text-right">
                                 <button
                                    onClick={(e) => { e.stopPropagation(); downloadReceipt(tx.id); }}
                                    className="w-11 h-11 bg-slate-50  rounded-2xl text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center ml-auto shadow-sm group-hover:shadow-md"
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
            {/* Pagination Controls */}
            <div className="p-8 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entries per page:</p>
                  <select
                     className="bg-white border-2 border-transparent focus:border-indigo-600 p-2 rounded-xl text-xs font-black outline-none transition-all"
                     value={limit}
                     onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  >
                     <option value={10}>10 Records</option>
                     <option value={20}>20 Records</option>
                     <option value={50}>50 Records</option>
                  </select>
               </div>
               <div className="flex items-center gap-2">
                  <button
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1}
                     className="px-6 py-3 bg-white border-2 border-transparent hover:border-slate-900 disabled:opacity-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                     Back
                  </button>
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                     {page}
                  </div>
                  <button
                     onClick={() => setPage(p => p + 1)}
                     disabled={!recentTransactions?.meta || page >= recentTransactions.meta.totalPages}
                     className="px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20"
                  >
                     Next
                  </button>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Results: {recentTransactions?.meta?.total || 0}
               </p>
            </div>
         </div>

         {/* Modern Payment Wizard */}
         <AnimatePresence>
            {modalOpen && (
               <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-32 pb-20">
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: 50 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 50 }}
                     className="bg-white rounded-[3.5rem] w-full max-w-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden border border-slate-100 flex flex-col relative"
                  >
                     {/* Modal Header */}
                     <div className="bg-indigo-600 p-8 text-white relative flex justify-between items-center overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10">
                           <h2 className="text-2xl font-black uppercase tracking-tight">Entrance Payment</h2>
                           <p className="text-xs font-bold text-indigo-200 mt-1 uppercase tracking-widest">SCHS Fiscal Intelligence</p>
                        </div>
                        <div className="flex gap-2 relative z-10">
                           {[1, 2, 3].map(i => (
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
                                 <div className="flex flex-col gap-4">
                                    <div className="relative group flex-1">
                                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-all" size={20} />
                                       <input
                                          type="text"
                                          placeholder="Name or Enrollment No..."
                                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl font-bold transition-all outline-none"
                                          value={searchTerm}
                                          onChange={(e) => setSearchTerm(e.target.value)}
                                       />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <select
                                          className="p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                                          value={filterProgram}
                                          onChange={(e) => { setFilterProgram(e.target.value); setFilterYear(''); }}
                                       >
                                          <option value="">All Programs</option>
                                          {courses?.map((c: any) => (
                                             <option key={c.id} value={c.id}>{c.name.replace(/_/g, '. ')}</option>
                                          ))}
                                       </select>
                                       <select
                                          className="p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                                          value={filterYear}
                                          onChange={(e) => setFilterYear(e.target.value)}
                                       >
                                          <option value="">All Years</option>
                                          {filterProgram ? (
                                             courses?.find((c: any) => c.id === filterProgram)?.name.includes('D_PHARMA')
                                                ? [1, 2].map(y => <option key={y} value={y}>Year {y}</option>)
                                                : [1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)
                                          ) : [1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                       </select>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                 {searchTerm.length < 2 && !filterProgram && !filterYear ? (
                                    <div className="text-center p-12 bg-slate-50  rounded-3xl border-2 border-dashed border-slate-100 ">
                                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enter search criteria to locate student</p>
                                    </div>
                                 ) : (
                                    (searchResults || []).map((student: any) => (
                                       <button
                                          key={student.id}
                                          onClick={() => handleStudentSelect(student)}
                                          className="w-full p-5 bg-white  border  rounded-2xl hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-600/10 text-left transition-all flex justify-between items-center group"
                                       >
                                          <div>
                                             <div className="font-black text-slate-800  uppercase truncate max-w-[200px]">{student.name}</div>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.enrollmentNo}</p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Pending</p>
                                             <p className="text-lg font-black text-rose-600 group-hover:scale-110 transition-transform">₹{(Number(student.fees[0]?.balance) || 0).toLocaleString()}</p>
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
                                       <p className="text-2xl font-black text-rose-400">₹{(Number(selectedStudent.fees[0]?.balance) || 0).toLocaleString()}</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                 <div className="col-span-2 sm:col-span-1 space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Transfer Amount</label>
                                    <input
                                       type="number"
                                       className="w-full p-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl font-black text-lg transition-all"
                                       value={paymentData.amount}
                                       onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    />
                                 </div>
                                 <div className="col-span-2 sm:col-span-1 space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel Mode</label>
                                    <select
                                       className="w-full p-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black text-lg appearance-none"
                                       value={paymentData.paymentMode}
                                       onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
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
                                       className="w-full p-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold"
                                       placeholder="Transaction ID, Cheque No, or Remarks"
                                       value={paymentData.referenceNo}
                                       onChange={(e) => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
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
                                 <h2 className="text-3xl font-black text-slate-900  mb-2 tracking-tight">Operation Successful</h2>
                                 <p className="text-slate-500 font-medium">Clearance established. Ledger record updated for student Identity.</p>
                              </div>
                              <div className="flex gap-4 pt-4">
                                 <button
                                    onClick={() => downloadReceipt(paymentMutation.data.data.transaction.id)}
                                    className="flex-1 border-2 border-indigo-600 text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all"
                                 >
                                    <Receipt size={20} /> Deploy Receipt PDF
                                 </button>
                                 <button
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 bg-white border-2 border-slate-900 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50"
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

const CollectionCard = ({ title, subtitle, amount, color, pulse }: any) => (
   <div className={clsx(
      "p-8 rounded-[2.5rem] shadow-xl border-l-[10px] transition-all hover:-translate-y-2 relative overflow-hidden h-full flex flex-col justify-center",
      color === 'indigo' ? "bg-white border-indigo-600 shadow-indigo-100/30" :
         color === 'emerald' ? "bg-white border-emerald-600 shadow-emerald-100/30" :
            color === 'blue' ? "bg-white border-blue-600 shadow-blue-100/30" :
               color === 'amber' ? "bg-white border-amber-600 shadow-amber-100/30" :
                  "bg-white border-rose-600 shadow-rose-100/30"
   )}>
      <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-3 -translate-y-3">
         <Receipt size={80} />
      </div>
      <div className="relative z-10">
         <div className="flex items-center gap-2 mb-3">
            {pulse && (
               <div className={clsx(
                  "w-2.5 h-2.5 rounded-full animate-pulse",
                  color === 'indigo' ? "bg-indigo-600" : color === 'emerald' ? "bg-emerald-600" : "bg-rose-600"
               )} />
            )}
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
         </div>
         <p className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{amount}</p>
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-70">{subtitle}</p>
      </div>
   </div>
);

export default CreditsPage;
