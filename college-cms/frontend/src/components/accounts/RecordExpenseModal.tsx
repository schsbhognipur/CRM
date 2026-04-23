import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { expenseService } from '../../services/expenseService';
import { clsx } from 'clsx';

const expenseSchema = z.object({
  expenseCategoryId: z.string().min(1, "Category is required"),
  amount: z.number().min(1, "Amount must be at least ₹1").max(10000000, "Amount exceeds limit"),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'DD']),
  referenceNo: z.string().optional(),
  invoiceNo: z.string().max(50, "Invoice No too long").optional(),
  description: z.string().min(3, "Description must be at least 3 characters").max(500, "Description too long"),
  transactionDate: z.string().refine(val => new Date(val) <= new Date(), "Date cannot be in the future"),
  remarks: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.paymentMode !== 'CASH' && (!data.referenceNo || data.referenceNo.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Reference No is required for digital/bank transfers",
      path: ["referenceNo"]
    });
  }
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface RecordExpenseModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: any; // For edit mode
}

const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({ open, onClose, prefill }) => {
  const queryClient = useQueryClient();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseService.getCategories(false), // only active
    enabled: open
  });
  const categories = categoriesData?.data || [];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      paymentMode: 'CASH',
      transactionDate: new Date().toISOString().split('T')[0],
      referenceNo: '',
      invoiceNo: '',
      description: '',
      remarks: '',
      expenseCategoryId: ''
    }
  });

  const paymentMode = watch('paymentMode');
  const expenseCategoryId = watch('expenseCategoryId');

  useEffect(() => {
    if (prefill && open) {
      Object.keys(prefill).forEach((key) => {
        if (key === 'transactionDate') {
           setValue(key as any, new Date(prefill[key]).toISOString().split('T')[0]);
        } else {
           setValue(key as any, prefill[key]);
        }
      });
    } else if (open && !prefill) {
      reset();
    }
  }, [prefill, open, reset, setValue]);

  const onSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      if (prefill?.id) {
         await expenseService.updateExpense(prefill.id, data);
         toast.success('Expense updated successfully');
      } else {
         const res = await expenseService.createExpense(data);
         toast.success(`Expense recorded — ₹${data.amount} for ${res.data.category.name}`);
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCategory = async () => {
    if (newCatName.trim().length < 2) return toast.error('Category name too short');
    setIsSavingCat(true);
    try {
      const res = await expenseService.createCategory({ name: newCatName, description: newCatDesc });
      toast.success('Category added');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setValue('expenseCategoryId', res.data.id);
      setShowAddCategory(false);
      setNewCatName('');
      setNewCatDesc('');
    } catch (err: any) {
       toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
       setIsSavingCat(false);
    }
  };

  const handleClose = () => {
    reset();
    setShowAddCategory(false);
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
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-3xl text-slate-900 dark:text-white"
          >
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 border-b dark:border-slate-700 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{prefill ? 'Update Expense' : 'Record Expense'}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Disbursement Terminal</p>
               </div>
               <button onClick={handleClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">
                 <X size={24} className="text-slate-400" />
               </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
               {/* Row 1: Category */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Expense Category *</label>
                  <select 
                    {...register('expenseCategoryId')}
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black uppercase text-sm outline-none transition-all"
                  >
                     <option value="" disabled>Select Category</option>
                     {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                  </select>
                  {errors.expenseCategoryId && <p className="text-xs text-rose-500 font-bold ml-1">{errors.expenseCategoryId.message}</p>}
                  
                  {!showAddCategory ? (
                     <button type="button" onClick={() => setShowAddCategory(true)} className="flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest ml-1 transition-all">
                        <PlusCircle size={14} /> Add New Category
                     </button>
                  ) : (
                     <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-900 rounded-2xl space-y-3">
                        <input 
                           type="text" 
                           placeholder="Category Name" 
                           className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold outline-none border focus:border-indigo-600"
                           value={newCatName}
                           onChange={e => setNewCatName(e.target.value)}
                        />
                        <div className="flex gap-2">
                           <button type="button" onClick={() => setShowAddCategory(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-white rounded-xl transition-colors">Cancel</button>
                           <button type="button" onClick={handleSaveCategory} disabled={isSavingCat} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">Save Category</button>
                        </div>
                     </div>
                  )}
               </div>

               {/* Row 2: Amount & Mode */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Disbursement Amount *</label>
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                           type="number" step="0.01" 
                           disabled={!!prefill} // Cannot update amount after creation
                           {...register('amount', { valueAsNumber: true })}
                           className={clsx("w-full pl-10 pr-4 py-4 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition-all", !!prefill ? "bg-slate-100 dark:bg-slate-800 text-slate-400" : "bg-slate-50 dark:bg-slate-900")}
                        />
                     </div>
                     {errors.amount && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.amount.message}</p>}
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Payment Mode *</label>
                     <select 
                       {...register('paymentMode')}
                       className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black text-sm outline-none transition-all uppercase"
                     >
                        <option value="CASH">CASH</option>
                        <option value="UPI">UPI</option>
                        <option value="CHEQUE">CHEQUE</option>
                        <option value="BANK_TRANSFER">BANK TRANSFER</option>
                        <option value="DD">DD</option>
                     </select>
                  </div>
               </div>

               {/* Row 3: Reference & Invoice */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">
                        Reference No {paymentMode !== 'CASH' && '*'}
                     </label>
                     <input 
                        type="text"
                        {...register('referenceNo')}
                        placeholder="UTP / Cheque No"
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal"
                     />
                     {errors.referenceNo && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.referenceNo.message}</p>}
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Invoice No</label>
                     <input 
                        type="text"
                        {...register('invoiceNo')}
                        placeholder="Optional"
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal"
                     />
                     {errors.invoiceNo && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.invoiceNo.message}</p>}
                  </div>
               </div>

               {/* Row 4: Description */}
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Description *</label>
                  <textarea 
                     rows={3}
                     {...register('description')}
                     placeholder="Describe the expense in detail"
                     className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal resize-none"
                  />
                  {errors.description && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.description.message}</p>}
               </div>

               {/* Row 5: Date and Remarks */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Transaction Date *</label>
                     <input 
                        type="date"
                        disabled={!!prefill} // Cannot update date
                        {...register('transactionDate')}
                        max={new Date().toISOString().split('T')[0]}
                        className={clsx("w-full px-4 py-4 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black text-sm outline-none transition-all", !!prefill ? "bg-slate-100 dark:bg-slate-800 text-slate-400" : "bg-slate-50 dark:bg-slate-900")}
                     />
                     {errors.transactionDate && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.transactionDate.message}</p>}
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Internal Remarks</label>
                     <input 
                        type="text"
                        {...register('remarks')}
                        placeholder="Optional"
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal"
                     />
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={handleClose} className="flex-1 py-5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Cancel</button>
                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                     {isSubmitting ? 'Processing...' : (prefill ? 'Update Expense' : 'Record Expense')}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecordExpenseModal;
