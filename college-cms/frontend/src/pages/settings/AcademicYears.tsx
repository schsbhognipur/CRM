import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { CalendarRange, Plus, Edit2, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  label: z.string().min(4, "Label must be at least 4 chars"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required")
}).refine(d => new Date(d.startDate) < new Date(d.endDate), {
  message: "End Date must trail Start Date",
  path: ["endDate"]
});

type FormValues = z.infer<typeof schema>;

const AcademicYears = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => settingsService.getAcademicYears()
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const handleActivate = async (id: string, label: string) => {
    if (window.confirm(`Activate Academic Year ${label}? This will shift the global timeline.`)) {
       try {
          await settingsService.activateAcademicYear(id);
          toast.success(`Timeline shifted to ${label}`);
          queryClient.invalidateQueries({ queryKey: ['academic-years'] });
          queryClient.invalidateQueries({ queryKey: ['active-academic-year'] });
       } catch (err: any) {
          toast.error(err.response?.data?.message || 'Activation failed');
       }
    }
  };

  const onSubmit = async (vals: FormValues) => {
     try {
        if (editId) {
           await settingsService.updateAcademicYear(editId, vals);
           toast.success('Academic Year updated');
        } else {
           await settingsService.createAcademicYear(vals);
           toast.success('Academic Year initialized');
        }
        queryClient.invalidateQueries({ queryKey: ['academic-years'] });
        closeModal();
     } catch (err: any) {
        toast.error(err.response?.data?.message || 'Transaction failed');
     }
  };

  const openModal = (yr?: any) => {
     if (yr) {
        setEditId(yr.id);
        setValue('label', yr.label);
        setValue('startDate', new Date(yr.startDate).toISOString().split('T')[0]);
        setValue('endDate', new Date(yr.endDate).toISOString().split('T')[0]);
     } else {
        setEditId(null);
        reset({ label: '', startDate: '', endDate: '' });
     }
     setIsModalOpen(true);
  };

  const closeModal = () => {
     setIsModalOpen(false);
     reset();
  };

  const years = data?.data || [];

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <CalendarRange className="text-indigo-600" size={32} />
             <h1 className="text-3xl font-black text-slate-900  tracking-tight uppercase">Academic Timeline</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Structural Configuration & Temporal Control</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} /> New Timeline Sector
        </button>
      </div>

      {isLoading ? (
         <div className="text-center py-20 animate-pulse text-indigo-600"><CalendarRange className="mx-auto" size={48} /></div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {years.map((y: any) => (
               <div key={y.id} className={clsx("p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group", y.isActive ? "bg-emerald-50  border-emerald-500 shadow-xl shadow-emerald-500/10" : "bg-white  border-slate-200 ")}>
                  {y.isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />}
                  
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 ">{y.label}</h3>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                           {new Date(y.startDate).toLocaleDateString()} — {new Date(y.endDate).toLocaleDateString()}
                        </p>
                     </div>
                     {y.isActive ? (
                        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700   px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 ">
                           <CheckCircle2 size={14} /> Active
                        </div>
                     ) : (
                        <button onClick={() => openModal(y)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100  hover:bg-indigo-50  rounded-xl transition-all">
                           <Edit2 size={16} />
                        </button>
                     )}
                  </div>

                  {!y.isActive && (
                     <button 
                        onClick={() => handleActivate(y.id, y.label)}
                        className="mt-6 w-full py-3 rounded-xl border-2 border-slate-200  flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600  hover:border-indigo-600 hover:text-indigo-600 transition-all group-hover:bg-white "
                     >
                        <Play size={14} /> Shift Timeline Here
                     </button>
                  )}
               </div>
            ))}
         </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModal} />
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white  p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900  mb-6">
                     {editId ? 'Mutate Timeline' : 'Generate Sector'}
                  </h3>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Label String *</label>
                        <input {...register('label')} placeholder="e.g. 2025-26" className="w-full px-4 py-3 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-xl font-bold text-sm outline-none transition-all" />
                        {errors.label && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1">{errors.label.message}</p>}
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Initialization Date *</label>
                        <input type="date" {...register('startDate')} className="w-full px-4 py-3 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-xl font-bold text-sm outline-none transition-all" />
                        {errors.startDate && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1">{errors.startDate.message}</p>}
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Termination Date *</label>
                        <input type="date" {...register('endDate')} className="w-full px-4 py-3 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-xl font-bold text-sm outline-none transition-all" />
                        {errors.endDate && <p className="text-[10px] text-rose-500 font-bold ml-1 mt-1">{errors.endDate.message}</p>}
                     </div>
                     <div className="flex gap-2 pt-4">
                        <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100  text-slate-600  rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Abort</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors">Commit</button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AcademicYears;
