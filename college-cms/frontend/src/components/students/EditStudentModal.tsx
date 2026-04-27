import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().optional().or(z.literal('')),
  phone: z.string().length(10, "Phone must be 10 digits"),
  alternatePhone: z.string().length(10, "Phone must be 10 digits").optional().or(z.literal('')),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  dob: z.string().min(1, "Date of Birth is required"),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().length(6, "Pin Code must be 6 digits"),
  aadharNo: z.string().length(12, "Aadhar must be 12 digits").optional().or(z.literal('')),
  discount: z.number().min(0),
  discountType: z.enum(['FLAT', 'PERCENT']),
  discountReason: z.string().optional().or(z.literal('')),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface EditStudentModalProps {
  open: boolean;
  onClose: () => void;
  student: any;
}

const FormField = React.forwardRef<HTMLInputElement, any>(
  ({ label, required, error, onChange, ...props }, ref) => {
    return (
      <div className="space-y-1 relative">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">
          {label} {required && '*'}
        </label>
        <input
          ref={ref}
          onChange={onChange}
          className={clsx(
            "w-full pt-2 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200  transition-all rounded-none appearance-none px-0",
            error ? "!border-b-rose-500 transition-none" : "focus:!border-b-indigo-600 focus:text-indigo-900  placeholder:text-slate-200 "
          )}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1.5 mt-2 text-rose-500 absolute -bottom-5 left-0">
             <AlertCircle size={10} />
             <p className="text-[10px] font-bold uppercase tracking-tighter">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

const EditStudentModal: React.FC<EditStudentModalProps> = ({ open, onClose, student }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema)
  });

  useEffect(() => {
    if (student && open) {
      reset({
        name: student.name,
        fatherName: student.fatherName,
        motherName: student.motherName || '',
        phone: student.phone,
        alternatePhone: student.alternatePhone || '',
        email: student.email || '',
        dob: new Date(student.dob).toISOString().split('T')[0],
        gender: student.gender,
        address: student.address,
        city: student.city,
        state: student.state,
        pinCode: student.pinCode,
        aadharNo: student.aadharNo || '',
        discount: Number(student.fees?.[0]?.discount || 0),
        discountType: student.fees?.[0]?.discountType || 'FLAT',
        discountReason: student.fees?.[0]?.discountReason || '',
      });
    }
  }, [student, open, reset]);

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      await studentService.updateStudent(student.id, data);
      toast.success("Identity vector updated successfully");
      queryClient.invalidateQueries({ queryKey: ['student', student.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to sync identity updates");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative bg-white  rounded-[2.5rem] shadow-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border "
          >
            {/* Header */}
            <div className="p-8 border-b  flex justify-between items-center bg-slate-50 ">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                     <Save size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800  uppercase tracking-tight">Edit Student Profile</h2>
                    <p className="text-[10px] font-black text-slate-400  uppercase tracking-widest mt-0.5">Identity Correction Interface</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 hover:bg-slate-200  rounded-2xl transition-all">
                 <X size={24} className="text-slate-400" />
               </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  
                  {/* Basic Info */}
                  <div className="space-y-10">
                     <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded bg-indigo-100/50  text-indigo-700  font-black text-[10px] tracking-widest uppercase">Identity</span>
                     </div>
                     <div className="space-y-8">
                        <FormField label="Full Name" required error={errors.name?.message} {...register('name')} />
                        <FormField label="Father's Name" required error={errors.fatherName?.message} {...register('fatherName')} />
                        <FormField label="Mother's Name" error={errors.motherName?.message} {...register('motherName')} />
                        <FormField label="Date of Birth" required type="date" error={errors.dob?.message} {...register('dob')} />
                        
                        <div className="space-y-3 pb-2 border-b-[1.5px] border-slate-200 ">
                           <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">Gender *</label>
                           <div className="flex gap-6">
                              {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                                <label key={g} className="flex items-center gap-2 cursor-pointer group">
                                   <input type="radio" value={g} {...register('gender')} className="w-[14px] h-[14px] text-indigo-600 border-slate-300 focus:ring-indigo-600 " />
                                   <span className="text-[12px] font-bold text-slate-700  group-hover:text-indigo-600 transition-colors uppercase">{g}</span>
                                </label>
                              ))}
                           </div>
                        </div>
                        <FormField label="Aadhar Number" maxLength={12} error={errors.aadharNo?.message} {...register('aadharNo')} />
                     </div>
                  </div>

                  {/* Logistics */}
                  <div className="space-y-10">
                     <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded bg-teal-100/50  text-teal-700  font-black text-[10px] tracking-widest uppercase">Logistics</span>
                     </div>
                     <div className="space-y-8">
                        <FormField label="Phone Number" required maxLength={10} error={errors.phone?.message} {...register('phone')} />
                        <FormField label="Alternate Phone" maxLength={10} error={errors.alternatePhone?.message} {...register('alternatePhone')} />
                        <FormField label="Email Address" type="email" error={errors.email?.message} {...register('email')} />
                        <div className="space-y-1 relative">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">Address *</label>
                          <textarea rows={2} className={clsx("w-full pt-2 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200  transition-all rounded-none resize-none px-0", errors.address ? "!border-b-rose-500" : "focus:!border-b-indigo-600 focus:text-indigo-900 ")} {...register('address')} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <FormField label="City" required error={errors.city?.message} {...register('city')} />
                           <FormField label="Pin Code" required maxLength={6} error={errors.pinCode?.message} {...register('pinCode')} />
                        </div>
                        <div className="space-y-1 relative">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">State *</label>
                          <select className={clsx("w-full pt-2 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200  transition-all rounded-none cursor-pointer px-0", errors.state ? "!border-b-rose-500" : "focus:!border-b-indigo-600")} {...register('state')}>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                     </div>
                  </div>

                  {/* Institutional Waivers */}
                  <div className="col-span-full mt-6 pt-10 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-3 mb-10">
                       <span className="px-2.5 py-1 rounded bg-orange-100/50 text-orange-700 font-black text-[10px] tracking-widest uppercase">Institutional Waiver (Scholarship)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      <div className="space-y-1 relative">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] block">Waiver Type</label>
                        <select 
                          className={clsx("w-full pt-2 pb-2 bg-transparent text-sm font-bold outline-none border-[1.5px] border-transparent border-b-slate-200 transition-all rounded-none cursor-pointer px-0", errors.discountType ? "!border-b-rose-500" : "focus:!border-b-orange-500")} 
                          {...register('discountType')}
                        >
                          <option value="FLAT">Flat Amount (₹)</option>
                          <option value="PERCENT">Percentage (%)</option>
                        </select>
                      </div>
                      <FormField 
                        label="Waiver Value" 
                        type="number" 
                        step="any"
                        error={errors.discount?.message} 
                        {...register('discount', { valueAsNumber: true })} 
                      />
                      <div className="col-span-full">
                         <FormField 
                           label="Waiver Reason / Authority" 
                           placeholder="e.g. Merit Scholarship, Management Quota, Special Case"
                           error={errors.discountReason?.message} 
                           {...register('discountReason')} 
                         />
                      </div>
                    </div>
                  </div>
               </form>
            </div>

            {/* Footer */}
            <div className="p-8 border-t  bg-slate-50  flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 bg-white  border border-slate-300  text-slate-700  rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Discard Changes</button>
               <button type="submit" form="edit-student-form" disabled={isSubmitting || !isDirty} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Commit Identity Updates
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditStudentModal;
