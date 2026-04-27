import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';

const userSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email trace format"),
  password: z.string()
    .min(8, "Command string must exceed 8 characters")
    .regex(/[A-Z]/, "Requires upper matrix character")
    .regex(/[0-9]/, "Requires numeric sector")
    .regex(/[@$!%*?&]/, "Requires special vector symbol"),
  confirmPassword: z.string(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Symmetrical command string required",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userSchema>;

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STAFF'
    }
  });

  const pwdValue = watch("password");

  const getPwdStrength = (p: string) => {
    if (!p) return { score: 0, label: 'Invalid Null', color: 'bg-slate-200' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[@$!%*?&]/.test(p)) score++;
    
    if (score <= 2) return { score, label: 'Weak Protocol', color: 'bg-rose-500' };
    if (score === 3) return { score, label: 'Medium Protocol', color: 'bg-amber-500' };
    return { score, label: 'Strong Protocol', color: 'bg-emerald-500' };
  };

  const strength = getPwdStrength(pwdValue);

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await userService.createUser({
         name: data.name,
         email: data.email,
         password: data.password,
         role: data.role
      });
      toast.success(`User generated — ${res.data.name} (${res.data.role.replace(/_/g, ' ')})`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Access node creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setShowPwd(false);
    onClose();
  };

  const availableRoles = currentUser?.role === 'SUPER_ADMIN' 
     ? ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF']
     : ['ACCOUNTANT', 'STAFF'];

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
            className="relative w-full max-w-lg bg-white  rounded-[2.5rem] shadow-3xl overflow-hidden text-slate-900 "
          >
            <div className="p-8 border-b  flex justify-between items-center bg-slate-50 ">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                     <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Create User</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Admin Security Control</p>
                  </div>
               </div>
               <button onClick={handleClose} className="p-3 hover:bg-slate-200  rounded-2xl transition-all">
                 <X size={24} className="text-slate-400" />
               </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Full Name *</label>
                     <input 
                        {...register('name')}
                        type="text" 
                        placeholder="John Doe"
                        className="w-full px-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal"
                     />
                     {errors.name && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email Address (Unique Vector) *</label>
                     <input 
                        {...register('email')}
                        type="email" 
                        placeholder="john@schs.edu"
                        className="w-full px-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal"
                     />
                     {errors.email && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Command String (Password) *</label>
                        <div className="relative">
                           <input 
                              {...register('password')}
                              type={showPwd ? "text" : "password"} 
                              placeholder="Min 8 chars, 1 num, 1 sym"
                              className="w-full pl-4 pr-12 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal"
                           />
                           <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                        </div>
                        {errors.password && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.password.message}</p>}
                        
                        <div className="mt-2 flex items-center justify-between ml-1">
                           <div className="flex gap-1 w-1/2">
                              {[1, 2, 3, 4].map((i) => (
                                 <div key={i} className={clsx("h-1 flex-1 rounded-full", i <= strength.score ? strength.color : "bg-slate-100 ")} />
                              ))}
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{strength.label}</span>
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Confirm Command String *</label>
                        <input 
                           {...register('confirmPassword')}
                           type={showPwd ? "text" : "password"}
                           placeholder="Confirm Password"
                           className="w-full px-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all placeholder:font-normal"
                        />
                        {errors.confirmPassword && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.confirmPassword.message}</p>}
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Assignment Matrix (Role) *</label>
                     <select 
                        {...register('role')}
                        className="w-full px-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black text-sm outline-none transition-all uppercase"
                     >
                        {availableRoles.map(r => (
                           <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                        ))}
                     </select>
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={handleClose} className="flex-1 py-5 bg-slate-100  text-slate-600  rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200  transition-all">Cancel</button>
                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                  >
                     {isSubmitting ? 'Authenticating...' : 'Create User'}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddUserModal;
