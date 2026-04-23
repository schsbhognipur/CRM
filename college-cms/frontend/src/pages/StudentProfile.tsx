import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  CreditCard, 
  History, 
  FileText,
  Camera,
  Download,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  IdCard,
  Hash,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Overview');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${id}`);
      return data;
    }
  });

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      return api.post(`/students/${id}/photo`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
    }
  });

  const downloadReceipt = (txId: string) => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/transactions/${txId}/receipt-pdf`, '_blank');
  };

  if (isLoading) return (
     <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Accessing Student Core Data...</p>
        </div>
     </div>
  );
  
  if (!student) return <div className="text-center p-20 font-bold">Terminal Error: Identity not found.</div>;

  const tabs = ['Overview', 'Fee History', 'Transaction History'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
         <button 
           onClick={() => navigate(-1)} 
           className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm uppercase tracking-widest"
         >
            <ChevronLeft size={20} /> Back to Directory
         </button>
         <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Edit Identity</button>
            <button className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all">Print Dossier</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Identification Sidebar */}
         <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-600 to-indigo-400" />
               
               <div className="relative z-10">
                  <div className="relative inline-block group mb-6">
                     <div className="w-32 h-32 rounded-[2rem] bg-slate-100 dark:bg-slate-900 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={48} className="text-slate-300" />
                        )}
                     </div>
                     <label className="absolute -bottom-2 -right-2 bg-indigo-600 p-2.5 rounded-2xl cursor-pointer text-white shadow-lg lg:opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                        <Camera size={18} />
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && photoMutation.mutate(e.target.files[0])} />
                     </label>
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{student.name}</h2>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6">{student.enrollmentNo}</p>
                  
                  <div className="flex flex-col gap-3">
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border dark:border-slate-700 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                        <div className="flex items-center gap-2">
                           <div className={clsx("w-2 h-2 rounded-full animate-pulse", student.status === 'ACTIVE' ? "bg-emerald-500" : "bg-rose-500")} />
                           <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{student.status}</p>
                        </div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border dark:border-slate-700 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Academic Unit</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{student.course.name}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CreditCard size={100} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6">Financial Balance</p>
               <h3 className="text-4xl font-black mb-2">₹{student.fees[0]?.balance.toLocaleString()}</h3>
               <p className="text-xs font-bold text-indigo-200 uppercase tracking-tighter mb-8">Pending Fiscal Dues</p>
               <button 
                  onClick={() => navigate('/accounts/credits')}
                  className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/50 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
               >
                  Verify Payment <ArrowRight size={16} />
               </button>
            </div>
         </div>

         {/* Content Area */}
         <div className="lg:col-span-3 space-y-8">
            {/* Tabs */}
            <div className="flex p-1.5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 w-fit">
               {tabs.map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={clsx(
                     "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                     activeTab === tab 
                       ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                       : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.2 }}
               >
                  {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <InfoSection title="Vital Records" icon={<IdCard size={20} className="text-indigo-600" />}>
                          <DetailRow label="Legal Name" value={student.name} />
                          <DetailRow label="Parent Authority (F)" value={student.fatherName} />
                          <DetailRow label="Parent Authority (M)" value={student.motherName} />
                          <DetailRow label="Temporal Marker (DOB)" value={new Date(student.dob).toLocaleDateString()} />
                          <DetailRow label="Gender Marker" value={student.gender} />
                          <DetailRow label="Regional ID (Aadhar)" value={student.aadharNo || 'NOT_DECLARED'} />
                       </InfoSection>

                       <InfoSection title="Logistics & Geo" icon={<MapPin size={20} className="text-rose-500" />}>
                          <DetailRow label="Primary Comms" value={student.phone} />
                          <DetailRow label="Digital Node (Email)" value={student.email || 'NO_EMAIL_RECORDED'} />
                          <DetailRow label="Locality" value={student.city} />
                          <DetailRow label="Jurisdiction (State)" value={student.state} />
                          <DetailRow label="Postal Code" value={student.pinCode} />
                          <div className="pt-4 mt-4 border-t dark:border-slate-700">
                             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Full Vector Address</p>
                             <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{student.address}</p>
                          </div>
                       </InfoSection>
                    </div>
                  )}

                  {activeTab === 'Fee History' && (
                    <div className="space-y-6">
                       {student.fees.map((fee: any) => (
                         <div key={fee.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-indigo-500 transition-all">
                            <div>
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Academic Year {fee.academicYear.label}</p>
                               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Year {fee.yearOfStudy} Curricular Fees</h3>
                               <div className="flex items-center gap-2">
                                  <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[10px] font-black uppercase text-slate-500">{fee.feeStructure.name}</div>
                               </div>
                            </div>
                            <div className="flex gap-12">
                               <div className="text-center">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                  <p className="text-lg font-black text-slate-800 dark:text-white">₹{fee.totalAmount.toLocaleString()}</p>
                               </div>
                               <div className="text-center">
                                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid</p>
                                  <p className="text-lg font-black text-emerald-500">₹{fee.paidAmount.toLocaleString()}</p>
                               </div>
                               <div className="text-center">
                                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Balance</p>
                                  <p className="text-lg font-black text-rose-500">₹{fee.balance.toLocaleString()}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className={clsx(
                                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                 fee.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                               )}>
                                 {fee.status}
                               </span>
                               <button className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                                  <ChevronRight size={18} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}

                  {activeTab === 'Transaction History' && (
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700 overflow-hidden">
                       <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">Financial Ledger</h3>
                          <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Download Full Audit</button>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full">
                             <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                   <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                                   <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref ID</th>
                                   <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                   <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal</th>
                                   <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Export</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {student.transactions?.map((t: any) => (
                                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                     <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(t.transactionDate).toLocaleDateString()}</td>
                                     <td className="px-8 py-5 whitespace-nowrap font-black text-indigo-600 text-sm tracking-tight">{t.receiptNo}</td>
                                     <td className="px-8 py-5 whitespace-nowrap">
                                        <p className="text-sm font-black text-emerald-600">₹{t.amount.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Credit</p>
                                     </td>
                                     <td className="px-8 py-5 whitespace-nowrap text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-900/50 w-fit rounded-lg self-center">{t.paymentMode}</td>
                                     <td className="px-8 py-5 whitespace-nowrap text-right">
                                        <button onClick={() => downloadReceipt(t.id)} className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center mx-auto lg:ml-auto">
                                           <Download size={18} />
                                        </button>
                                     </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  )}
               </motion.div>
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

const InfoSection = ({ title, icon, children }: any) => (
  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-700">
     <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">{icon}</div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
     </div>
     <div className="space-y-5">{children}</div>
  </div>
);

const DetailRow = ({ label, value }: any) => (
  <div className="flex justify-between items-center group">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{value}</span>
  </div>
);

export default StudentProfile;
