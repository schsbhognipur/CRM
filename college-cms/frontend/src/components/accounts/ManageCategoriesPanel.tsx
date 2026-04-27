import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Edit2, CheckCircle2, ChevronRight, PlusCircle, Tag } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../../services/expenseService';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface ManageCategoriesPanelProps {
  open: boolean;
  onClose: () => void;
}

const ManageCategoriesPanel: React.FC<ManageCategoriesPanelProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['expense-categories', 'all'],
    queryFn: () => expenseService.getCategories(true),
    enabled: open
  });

  const categories = data?.data || [];

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await expenseService.updateCategory(id, { isActive: !currentStatus });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success(currentStatus ? 'Category deactivated' : 'Category activated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCreate = async () => {
    if (newName.length < 2) return toast.error('Name must be at least 2 characters');
    setIsSaving(true);
    try {
      await expenseService.createCategory({ name: newName, description: newDesc });
      toast.success('Category created successfully');
      setNewName('');
      setNewDesc('');
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateName = async (id: string) => {
    if (!editName || editName.length < 2) {
       setEditingId(null);
       return;
    }
    try {
      await expenseService.updateCategory(id, { name: editName });
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white  z-[110] shadow-2xl flex flex-col border-l "
          >
            <div className="p-6 border-b  flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                     <Tag size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800  uppercase tracking-tight">Manage Categories</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expense Configuration</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-lg text-slate-400 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoading ? (
                 <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                 </div>
              ) : (
                categories.map((cat: any) => (
                  <div key={cat.id} className="p-4 rounded-2xl border-2 border-slate-100  bg-white  shadow-sm flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                        {editingId === cat.id ? (
                           <input
                             type="text"
                             autoFocus
                             className="flex-1 bg-slate-50  border-2 border-indigo-600 outline-none px-3 py-1.5 rounded-lg text-sm font-bold text-slate-900 "
                             value={editName}
                             onChange={(e) => setEditName(e.target.value)}
                             onBlur={() => handleUpdateName(cat.id)}
                             onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(cat.id)}
                           />
                        ) : (
                           <div 
                             className="flex-1 cursor-pointer group"
                             onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                           >
                              <h3 className="text-sm font-black text-slate-800  uppercase flex items-center gap-2">
                                 {cat.name} 
                                 <Edit2 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </h3>
                              <p className="text-[10px] font-bold text-slate-400">Transactions: {cat._count?.transactions || 0}</p>
                           </div>
                        )}
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input 
                             type="checkbox" 
                             className="sr-only peer" 
                             checked={cat.isActive}
                             onChange={() => handleToggleActive(cat.id, cat.isActive)}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all  peer-checked:bg-emerald-500"></div>
                        </label>
                     </div>
                  </div>
                ))
              )}
              
              {!showAdd ? (
                 <button 
                   onClick={() => setShowAdd(true)}
                   className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200  rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-xs font-black uppercase tracking-widest"
                 >
                    <PlusCircle size={16} /> Add Category
                 </button>
              ) : (
                 <div className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/30  space-y-3">
                    <input 
                      type="text" 
                      placeholder="Category Name" 
                      className="w-full px-3 py-2 rounded-xl bg-white  border  text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                    <input 
                      type="text" 
                      placeholder="Optional Description" 
                      className="w-full px-3 py-2 rounded-xl bg-white  border  text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                       <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-white rounded-xl transition-colors">Cancel</button>
                       <button onClick={handleCreate} disabled={isSaving} className="flex-1 py-2 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm">Save</button>
                    </div>
                 </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ManageCategoriesPanel;
