import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { LayoutGrid, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

const FeeComponents = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['fee-components'],
    queryFn: () => settingsService.getFeeComponents()
  });

  const components = data?.data || [];

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await settingsService.updateFeeComponent(id, { isActive: !currentStatus });
      queryClient.invalidateQueries({ queryKey: ['fee-components'] });
      toast.success(currentStatus ? 'Component suspended' : 'Component activated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  const handleSaveUpdate = async (id: string) => {
     if (!editName || editName.trim().length < 2) return setEditingId(null);
     setIsSaving(true);
     try {
        await settingsService.updateFeeComponent(id, { name: editName, description: editDesc });
        toast.success('Matrix parameters augmented');
        queryClient.invalidateQueries({ queryKey: ['fee-components'] });
     } catch (err: any) {
        toast.error(err.response?.data?.message || 'Mutation failed');
     } finally {
        setIsSaving(false);
        setEditingId(null);
     }
  };

  const handleCreateNew = async () => {
     if (!newName || newName.trim().length < 2) return toast.error('String designation too short');
     setIsSaving(true);
     try {
        await settingsService.createFeeComponent({ name: newName, description: newDesc });
        toast.success('New Base Component injected');
        queryClient.invalidateQueries({ queryKey: ['fee-components'] });
        setIsAdding(false);
        setNewName('');
        setNewDesc('');
     } catch (err: any) {
        toast.error(err.response?.data?.message || 'Injection failed');
     } finally {
        setIsSaving(false);
     }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <LayoutGrid className="text-indigo-600" size={32} />
             <h1 className="text-3xl font-black text-slate-900  tracking-tight uppercase">Billing Components</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Fee Structure Base Classes</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setNewName(''); setNewDesc(''); }}
          disabled={isAdding}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
        >
          <Plus size={20} /> Add Component
        </button>
      </div>

      <div className="bg-white  rounded-[2.5rem] shadow-xl shadow-slate-200/50  border  overflow-hidden">
         <div className="overflow-x-auto pb-6 mt-2">
            <table className="w-full">
               <thead className="border-b ">
                  <tr>
                     <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Name</th>
                     <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description Parameter</th>
                     <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapping Count</th>
                     <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 ">
                  {isAdding && (
                     <tr className="bg-indigo-50/50 ">
                        <td className="px-8 py-4">
                           <input autoFocus type="text" placeholder="Designation" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-white  border-2 border-indigo-600 rounded-lg text-sm font-bold outline-none" />
                        </td>
                        <td className="px-8 py-4">
                           <input type="text" placeholder="Optional" value={newDesc} onChange={e => setNewDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateNew()} className="w-full px-3 py-2 bg-white  border-2 border-transparent focus:border-indigo-600 rounded-lg text-sm outline-none" />
                        </td>
                        <td className="px-8 py-4 text-xs font-bold text-slate-400">-</td>
                        <td className="px-8 py-4">
                           <div className="flex gap-2">
                              <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white rounded-lg">Cancel</button>
                              <button onClick={handleCreateNew} disabled={isSaving} className="px-3 py-2 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg uppercase tracking-widest flex items-center gap-1"><Save size={12}/> Save</button>
                           </div>
                        </td>
                     </tr>
                  )}

                  {isLoading ? (
                     <tr><td colSpan={4} className="p-10 text-center animate-pulse text-indigo-600">Loading Configuration...</td></tr>
                  ) : (
                     components.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50  transition-colors">
                           <td className="px-8 py-5">
                              {editingId === c.id ? (
                                 <input autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 bg-white  border-2 border-indigo-600 rounded-lg text-sm font-bold outline-none" />
                              ) : (
                                 <span onClick={() => { setEditingId(c.id); setEditName(c.name); setEditDesc(c.description || ''); }} className="text-sm font-black text-slate-800  uppercase cursor-pointer hover:text-indigo-600 decoration-dashed underline-offset-4 hover:underline">
                                    {c.name}
                                 </span>
                              )}
                           </td>
                           <td className="px-8 py-5">
                              {editingId === c.id ? (
                                 <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} onBlur={() => handleSaveUpdate(c.id)} onKeyDown={e => e.key === 'Enter' && handleSaveUpdate(c.id)} className="w-full px-3 py-2 bg-white  border-2 border-transparent focus:border-indigo-600 rounded-lg text-sm outline-none" />
                              ) : (
                                 <span className="text-xs font-bold text-slate-500">{c.description || <span className="opacity-40 italic">Null</span>}</span>
                              )}
                           </td>
                           <td className="px-8 py-5 text-xs font-black text-slate-900 ">{c._count?.structureComponents || 0}</td>
                           <td className="px-8 py-5">
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" checked={c.isActive} onChange={() => handleToggleActive(c.id, c.isActive)} />
                                 <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all  peer-checked:bg-indigo-600"></div>
                              </label>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default FeeComponents;
