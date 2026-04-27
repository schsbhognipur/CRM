import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, Search, User, CreditCard, ChevronRight, 
  ArrowLeft, CheckCircle2, Download, Receipt,
  Banknote, Smartphone, ReceiptText, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { transactionService } from '../../services/transactionService';
import { studentService } from '../../services/studentService';
import { clsx } from 'clsx';
import converter from 'number-to-words';

interface FeePaymentModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'FIND_STUDENT' | 'PAYMENT_DETAILS' | 'RECEIPT_PREVIEW';

const FeePaymentModal: React.FC<FeePaymentModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('FIND_STUDENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- STEP 1: FIND STUDENT ---
  useEffect(() => {
    if (open && step === 'FIND_STUDENT' && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [open, step]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const results = await transactionService.searchStudents(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    try {
      const fees = await transactionService.getStudentFees(student.id);
      setStudentFees(fees);
      if (fees.length > 0) {
        setSelectedFee(fees[0]);
        setStep('PAYMENT_DETAILS');
      } else {
        setSelectedFee(null);
        toast.info(`No active ledger for ${student.name}. You can trigger a sync below.`);
      }
    } catch (err) {
      toast.error('Terminal fault: Failed to acquire active ledgers');
    }
  };

  const handleManualSync = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const res = await studentService.syncStudentFee(selectedStudent.id);
      if (res.success) {
        toast.success('Matrix Sync Successful: Ledger generated');
        const fees = await transactionService.getStudentFees(selectedStudent.id);
        setStudentFees(fees);
        if (fees.length > 0) {
          setSelectedFee(fees[0]);
          setStep('PAYMENT_DETAILS');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Matrix Sync Failed: Verify Fee Structure existence');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STEP 2: PAYMENT DETAILS FORM ---
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      amount: 0,
      paymentMode: 'CASH',
      referenceNo: '',
      transactionDate: new Date().toISOString().split('T')[0],
      remarks: ''
    }
  });

  const paymentMode = watch('paymentMode');
  const paymentAmount = watch('amount');

  useEffect(() => {
    if (selectedFee) {
      setValue('amount', Number(selectedFee.balance));
    }
  }, [selectedFee]);

  const onSubmit = async (data: any) => {
    console.log('[FeePaymentModal] Triggering Payment with raw data:', data);
    console.log('[FeePaymentModal] Selected Fee Node:', selectedFee);

    if (!selectedFee) {
      toast.error('Please select a fee record');
      return;
    }
    
    if (Number(data.amount) <= 0) {
       toast.error('Payment quantum must be greater than zero');
       return;
    }
    
    if (Number(data.amount) > Number(selectedFee.balance)) {
       toast.error('Payment quantum exceeds pending ledger balance');
       return;
    }

    if (data.paymentMode !== 'CASH' && !data.referenceNo) {
       toast.error(`Reference Terminal ID required for ${data.paymentMode} payments`);
       return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        studentFeeId: selectedFee.id,
        amount: Number(data.amount),
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo,
        transactionDate: data.transactionDate,
        remarks: data.remarks
      };

      console.log('[FeePaymentModal] Firing Payload to Server:', payload);

      const response = await transactionService.recordFeePayment(payload);
      console.log('[FeePaymentModal] Server Response:', response);

      if (response.success) {
        setSuccessData(response.data);
        setStep('RECEIPT_PREVIEW');
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['student', selectedStudent.id] });
      }
    } catch (error: any) {
      console.error('[FeePaymentModal] Catch-block Error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!successData?.transaction?.id) return;
    try {
      const blob = await transactionService.getReceiptPdf(successData.transaction.id);
      transactionService.downloadReceipt(blob, successData.transaction.receiptNo);
      toast.success('Official receipt downloaded successfully');
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };

  const handleClose = () => {
    setStep('FIND_STUDENT');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStudent(null);
    setSelectedFee(null);
    setSuccessData(null);
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative lg:w-[680px] w-full max-h-[90vh] bg-white  rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col border "
          >
            {/* Header */}
            <div className="p-8 border-b  flex justify-between items-center bg-slate-50 ">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                     <Receipt size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800  uppercase tracking-tight">Fee Collection</h2>
                    <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest mt-0.5">Automated Fiscal Terminal</p>
                  </div>
               </div>
               <button onClick={handleClose} className="p-3 hover:bg-slate-200  rounded-2xl transition-all">
                 <X size={24} className="text-slate-400" />
               </button>
            </div>

            {/* Stepper Progress */}
            <div className="px-8 py-4 bg-white  border-b  flex items-center gap-4">
               {[
                 { id: 'FIND_STUDENT', label: 'Identity Lookup' },
                 { id: 'PAYMENT_DETAILS', label: 'Fiscal Parameters' },
                 { id: 'RECEIPT_PREVIEW', label: 'Finalization' }
               ].map((s, i) => (
                 <div key={s.id} className="flex items-center gap-3">
                    <div className={clsx(
                      "w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all",
                      step === s.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : 
                      (i < ['FIND_STUDENT','PAYMENT_DETAILS','RECEIPT_PREVIEW'].indexOf(step) ? "bg-emerald-500 text-white" : "bg-slate-100  text-slate-400")
                    )}>
                       {i < ['FIND_STUDENT','PAYMENT_DETAILS','RECEIPT_PREVIEW'].indexOf(step) ? <CheckCircle2 size={12} /> : i + 1}
                    </div>
                    <span className={clsx(
                      "text-[10px] font-black uppercase tracking-widest leading-none",
                      step === s.id ? "text-slate-900 " : "text-slate-400"
                    )}>{s.label}</span>
                    {i < 2 && <div className="w-8 h-[2px] bg-slate-100 " />}
                 </div>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {step === 'FIND_STUDENT' && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="p-8 space-y-6"
                  >
                     <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
                        <input 
                          type="text" 
                          ref={searchInputRef}
                          placeholder="Identify student by name, enrollment, or phone..."
                          className="w-full pl-14 pr-6 py-5 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-3xl font-bold text-slate-800  outline-none transition-all placeholder:text-slate-400"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>

                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Matches</p>
                         {searchResults.map((student) => (
                            <div key={student.id} className="space-y-2">
                               <button
                                 onClick={() => handleSelectStudent(student)}
                                 className="w-full p-5 bg-white  hover:bg-slate-50  border  rounded-3xl flex items-center justify-between group transition-all"
                               >
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-slate-100  rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50  group-hover:text-indigo-600 transition-all font-black uppercase">
                                        {student.name.charAt(0)}
                                     </div>
                                     <div className="text-left">
                                        <p className="text-sm font-black text-slate-900  uppercase leading-tight">{student.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{student.enrollmentNo} • Year {student.yearOfStudy}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     {student.fees && student.fees.length > 0 ? (
                                     <div className="text-right">
                                           <span className="text-xs font-black text-rose-500 bg-rose-50  px-3 py-1.5 rounded-xl border border-rose-100  uppercase tracking-tight">₹{Number(student.fees[0].balance).toLocaleString()}</span>
                                        </div>
                                     ) : (
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-xl">Clearance</span>
                                     )}
                                     <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                  </div>
                               </button>

                               {selectedStudent?.id === student.id && studentFees.length === 0 && (
                                 <motion.div 
                                   initial={{ opacity: 0, y: -10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="p-4 bg-amber-50  border border-amber-100  rounded-2xl flex items-center justify-between"
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center">
                                          <User size={16} />
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-black text-amber-800  uppercase tracking-tight">No Ledger Found</p>
                                          <p className="text-[9px] font-medium text-amber-600/70  leading-none">Matrix synchronization required</p>
                                       </div>
                                    </div>
                                    <button
                                      disabled={isSubmitting}
                                      onClick={handleManualSync}
                                      className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                       {isSubmitting ? 'Syncing...' : 'Force Sync Matrix'}
                                    </button>
                                 </motion.div>
                               )}
                            </div>
                         ))}
                        {searchQuery.length >= 2 && searchResults.length === 0 && (
                           <div className="text-center py-12">
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Digital Registry Empty</p>
                           </div>
                        )}
                        {searchQuery.length < 2 && (
                           <div className="text-center py-12">
                              <p className="text-sm font-bold text-slate-300 italic">Awaiting secure input...</p>
                           </div>
                        )}
                     </div>
                  </motion.div>
                )}

                {step === 'PAYMENT_DETAILS' && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="p-8 space-y-8"
                  >
                     {/* Identity Header */}
                     <div className="flex items-center justify-between p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-2xl uppercase">
                              {selectedStudent?.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-lg font-black uppercase tracking-tight leading-tight">{selectedStudent?.name}</p>
                              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-0.5">{selectedStudent?.enrollmentNo} • {selectedStudent?.course.name}</p>
                           </div>
                        </div>
                        <button onClick={() => setStep('FIND_STUDENT')} className="p-2.5 hover:bg-white/10 rounded-xl text-white transition-all">
                           <ArrowLeft size={20} />
                        </button>
                     </div>

                     {/* Fee Selection */}
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Ledger Records</p>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                           {studentFees.map((fee) => (
                              <button
                                key={fee.id}
                                onClick={() => setSelectedFee(fee)}
                                className={clsx(
                                  "w-full p-4 rounded-2xl border-2 transition-all text-left group",
                                  selectedFee?.id === fee.id 
                                    ? "border-indigo-600 bg-indigo-50/30 " 
                                    : "border-slate-50  bg-slate-50  hover:bg-slate-100"
                                )}
                              >
                                 <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs font-black text-slate-900  uppercase tracking-tight">{fee.academicYear.label}</p>
                                    <span className={clsx(
                                       "text-[8px] font-black uppercase px-2 py-1 rounded-lg tracking-widest border",
                                       fee.status === 'PENDING' ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-amber-50 text-amber-500 border-amber-100"
                                    )}>{fee.status}</span>
                                 </div>
                                 <div className="flex justify-between items-end">
                                    <div>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">Balance Pending</p>
                                       <p className="text-sm font-black text-slate-800  tracking-tight">₹{Number(fee.balance).toLocaleString()}</p>
                                    </div>
                                     <div className="flex-1 px-4 text-center">
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Collected</p>
                                        <p className="text-sm font-black text-emerald-600 tracking-tight">₹{Number(fee.paidAmount).toLocaleString()}</p>
                                     </div>
                                    <div className="text-right">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">Total Dues</p>
                                       <p className="text-[10px] font-black text-slate-600 ">₹{Number(fee.totalAmount).toLocaleString()}</p>
                                    </div>
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Payment Controller */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Payment Quantum *</label>
                              <div className="relative">
                                 <input 
                                   type="number"
                                   {...register('amount', { required: true, min: 1 })}
                                   className="w-full pl-10 pr-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black text-slate-900  outline-none"
                                 />
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                              </div>
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter mt-2 ml-1">Current Ledger Gap: ₹{selectedFee ? Number(selectedFee.balance).toLocaleString() : 0}</p>
                           </div>

                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Transaction Vector *</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {[
                                   { id: 'CASH', icon: <Banknote size={14} /> },
                                   { id: 'UPI', icon: <Smartphone size={14} /> },
                                   { id: 'BANK_TRANSFER', label: 'E-Transfer', icon: <Smartphone size={14} /> },
                                   { id: 'CHEQUE', icon: <ReceiptText size={14} /> }
                                 ].map((mode) => (
                                    <label key={mode.id} className={clsx(
                                       "relative flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                                       paymentMode === mode.id ? "border-indigo-600 bg-indigo-50/50 text-indigo-700" : "border-slate-50  bg-slate-50  text-slate-500"
                                    )}>
                                       <input type="radio" value={mode.id} {...register('paymentMode')} className="hidden" />
                                       {mode.icon}
                                       <span className="text-[9px] font-black uppercase tracking-widest">{mode.id.replace(/_/g, ' ')}</span>
                                    </label>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {paymentMode !== 'CASH' && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reference Terminal ID *</label>
                                 <input 
                                   type="text"
                                   {...register('referenceNo')}
                                   placeholder="UTP / Ref No / Cheque No"
                                   className="w-full px-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-slate-900  outline-none"
                                 />
                              </motion.div>
                           )}

                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Pulse Date</label>
                              <div className="relative">
                                 <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                 <input 
                                   type="date"
                                   {...register('transactionDate')}
                                   className="w-full pl-10 pr-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-slate-900  outline-none"
                                 />
                              </div>
                           </div>

                           <button
                             type="button"
                             onClick={() => onSubmit(watch())}
                             disabled={isSubmitting}
                             className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95 group overflow-hidden relative"
                           >
                              <div className="relative z-10 flex items-center justify-center gap-3">
                                 <CreditCard size={20} className={clsx(isSubmitting ? "hidden" : "")}/>
                                 {isSubmitting ? 'Authenticating...' : 'Authorize Payment'}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                           </button>
                        </div>
                     </div>
                  </motion.div>
                )}

                {step === 'RECEIPT_PREVIEW' && successData && (
                  <motion.div
                    key="step3"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 space-y-8"
                  >
                     <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-4 text-emerald-600">
                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                           <CheckCircle2 size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-black uppercase tracking-tight">System Confirmation Successful</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Fiscal Pulse Recorded in Global Ledger</p>
                        </div>
                     </div>

                     <div className="bg-white  border-2 border-slate-100  rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                        
                        <div className="flex justify-between items-start">
                           <div>
                              <h3 className="text-lg font-black text-slate-900  leading-none">Receipt Clearance</h3>
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Official Document</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Receipt No</p>
                              <p className="text-lg font-black text-slate-900  tracking-widest">{successData.transaction.receiptNo}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 py-8 border-y-2 border-dashed border-slate-100 ">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Node</p>
                              <p className="text-sm font-black uppercase text-slate-800 ">{successData.student.name}</p>
                              <p className="text-[10px] font-bold text-slate-500">{successData.student.enrollmentNo}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Pulse</p>
                              <p className="text-lg font-black text-slate-900 ">₹{Number(successData.transaction.amount).toLocaleString()}</p>
                              <p className="text-[10px] font-bold text-slate-500 italic">({converter.toWords(Number(successData.transaction.amount))} only)</p>
                           </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <div className="space-y-1">
                              <p>Terminal: {successData.transaction.paymentMode}</p>
                              {successData.transaction.referenceNo && <p>Reference: {successData.transaction.referenceNo}</p>}
                           </div>
                           <div className="text-right">
                              <p>Date: {new Date(successData.transaction.transactionDate).toLocaleDateString()}</p>
                              <p>Status: Authenticated</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button
                          onClick={handleDownload}
                          className="flex-1 py-5 bg-white  border-2 border-slate-200  text-slate-600  rounded-[1.5rem] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                           <Download size={20} />
                           Generate PDF
                        </button>
                        <button
                          onClick={handleClose}
                          className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
                        >
                           Done & Finalize
                        </button>
                     </div>
                     <div className="text-center">
                        <button 
                           onClick={() => {
                              setStep('FIND_STUDENT');
                              setSearchQuery('');
                              reset();
                           }} 
                           className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                        >
                           Record Another Transaction Node
                        </button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FeePaymentModal;
