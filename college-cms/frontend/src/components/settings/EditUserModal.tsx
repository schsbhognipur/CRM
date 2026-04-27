import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const editSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters").max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'])
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  userToEdit: any | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ open, onClose, userToEdit }) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', role: 'STAFF' }
  });

  useEffect(() => {
    if (open && userToEdit) {
      setValue('name', userToEdit.name);
      setValue('role', userToEdit.role);
    }
  }, [open, userToEdit, setValue]);

  const onSubmit = async (data: EditFormValues) => {
    if (!userToEdit) return;
    setIsSubmitting(true);
    try {
      // Clean up body based on current user perms
      const body: any = { name: data.name };
      
      // Submit role only if current user is SUPER_ADMIN and not editing themselves
      if (currentUser?.role === 'SUPER_ADMIN' && currentUser?.id !== userToEdit.id) {
         body.role = data.role;
      }

      await userService.updateUser(userToEdit.id, body);
      toast.success('Matrix parameters augmented via override sequence');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Override sequence failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canEditRole = currentUser?.role === 'SUPER_ADMIN' && currentUser?.id !== userToEdit?.id;

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
                     <UserCog size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Edit Identity</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Parameter Mutation Interface</p>
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
                        className="w-full px-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-sm outline-none transition-all"
                     />
                     {errors.name && <p className="text-xs text-rose-500 font-bold ml-1 mt-1">{errors.name.message}</p>}
                  </div>

                  {canEditRole && (
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Assignment Matrix (Role) *</label>
                        <select 
                           {...register('role')}
                           className="w-full px-4 py-4 bg-slate-50  border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black text-sm outline-none transition-all uppercase"
                        >
                           <option value="SUPER_ADMIN">SUPER ADMIN</option>
                           <option value="ADMIN">ADMIN</option>
                           <option value="ACCOUNTANT">ACCOUNTANT</option>
                           <option value="STAFF">STAFF</option>
                        </select>
                     </div>
                  )}

                  {!canEditRole && userToEdit && (
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Assignment Matrix (Role)</label>
                        <div className="w-full px-4 py-4 bg-slate-100  rounded-2xl font-black text-sm text-slate-500 cursor-not-allowed uppercase border-2 border-transparent">
                           {userToEdit.role.replace(/_/g, ' ')}
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mt-1">Classification modification restricted by access level or self-edit lock.</p>
                     </div>
                  )}
               </div>

               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={handleClose} className="flex-1 py-5 bg-slate-100  text-slate-600  rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200  transition-all">Cancel</button>
                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                  >
                     {isSubmitting ? 'Mutating...' : 'Save Changes'}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditUserModal;
