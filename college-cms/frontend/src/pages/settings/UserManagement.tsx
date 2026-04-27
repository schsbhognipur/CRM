import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Search, Plus, Edit2, ShieldAlert, Key, Loader2, Copy, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import AddUserModal from '../../components/settings/AddUserModal';
import EditUserModal from '../../components/settings/EditUserModal';
import { debounce } from 'lodash';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<any>(null);

  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [manualPassword, setManualPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const debouncedSearch = React.useMemo(() => debounce((val: string) => { setSearchTerm(val); setPage(1); }, 300), []);

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchTerm, roleFilter, statusFilter, page],
    queryFn: () => userService.getUsers({
      search: searchTerm,
      role: roleFilter,
      isActive: statusFilter,
      page,
      limit
    })
  });

  const users = data?.data?.users || [];
  const meta = data?.data?.meta || { total: 0, page: 1, limit: 20 };

  const totalUsers = meta.total;
  const activeUsers = users.filter((u: any) => u.isActive).length; // Rough local calc for demo stat row, usually we'd make a separate aggregate call but prompt says "computed from the list"
  const inactiveUsers = users.filter((u: any) => !u.isActive).length;

  const handleToggleActive = async (u: any) => {
     if (user?.id === u.id) return toast.error("Cannot toggle your own account");
     if (u.role === 'SUPER_ADMIN') return toast.error("Cannot deactivate a SUPER_ADMIN");

     const confirmMsg = `Are you sure you want to ${u.isActive ? 'deactivate' : 'activate'} ${u.name}?${u.isActive ? ' They will lose access immediately.' : ''}`;
     if (window.confirm(confirmMsg)) {
        try {
           await userService.toggleActive(u.id);
           queryClient.invalidateQueries({ queryKey: ['users'] });
           toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`);
        } catch (err: any) {
           toast.error(err.response?.data?.message || 'Action failed');
        }
     }
  };

  const executePasswordReset = async () => {
     if (!resetPwdUserId) return;
     if (!autoGenerate && manualPassword.length < 8) return toast.error("Password string too short");

     setIsResetting(true);
     try {
        const payload = autoGenerate ? undefined : manualPassword;
        const res = await userService.resetPassword(resetPwdUserId, payload);
        if (autoGenerate && res.data.generatedPassword) {
           setGeneratedPassword(res.data.generatedPassword);
        } else {
           toast.success("Security token redefined successfully");
           setResetPwdUserId(null);
           setManualPassword('');
        }
     } catch (err: any) {
        toast.error(err.response?.data?.message || 'Access override rejected');
     } finally {
        setIsResetting(false);
     }
  };

  const copyToClipboard = () => {
     if (generatedPassword) {
        navigator.clipboard.writeText(generatedPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
     }
  };

  const getRoleColors = (role: string) => {
     switch (role) {
        case 'SUPER_ADMIN': return 'bg-purple-100  text-purple-700  border-purple-200';
        case 'ADMIN': return 'bg-blue-100  text-blue-700  border-blue-200';
        case 'ACCOUNTANT': return 'bg-emerald-100  text-emerald-700  border-emerald-200';
        default: return 'bg-slate-100  text-slate-600  border-slate-200';
     }
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Users className="text-indigo-600" size={32} />
             <h1 className="text-3xl font-black text-slate-900  tracking-tight uppercase">User Management</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Identity & Access Control</p>
        </div>
        
        {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
           <button 
             onClick={() => setAddModalOpen(true)}
             className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 whitespace-nowrap"
           >
             <Plus size={20} /> Add User
           </button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Total Active Entities', val: totalUsers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Live Connections', val: activeUsers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Suspended Tokens', val: inactiveUsers, color: 'text-rose-600', bg: 'bg-rose-50' }
         ].map((stat, i) => (
            <div key={i} className="bg-white  p-6 rounded-3xl shadow-sm border  flex items-center justify-between group">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                  <h2 className="text-2xl font-black text-slate-900  leading-tight">{isLoading ? '-' : stat.val}</h2>
               </div>
               <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", stat.bg, stat.color)}>
                  <Users size={24} />
               </div>
            </div>
         ))}
      </div>

      {/* DATA GRID */}
      <div className="bg-white  rounded-[2.5rem] shadow-xl shadow-slate-200/50  border  overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b  flex flex-col md:flex-row gap-4 bg-slate-50  items-center">
          <div className="relative flex-1 group w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by identity or email..."
              className="w-full pl-12 pr-4 py-3 bg-white  border-2 border-slate-100  focus:border-indigo-600 outline-none rounded-xl text-sm font-bold transition-all text-slate-900  placeholder:text-slate-400"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <select 
             className="px-4 py-3 bg-white  border-2 border-slate-100  rounded-xl text-sm font-black uppercase tracking-widest outline-none text-slate-700  min-w-[180px]"
             value={roleFilter}
             onChange={(e) => setRoleFilter(e.target.value)}
          >
             <option value="">All Matrices</option>
             <option value="SUPER_ADMIN">Super Admin</option>
             <option value="ADMIN">Admin</option>
             <option value="ACCOUNTANT">Accountant</option>
             <option value="STAFF">Staff</option>
          </select>
          <select 
             className="px-4 py-3 bg-white  border-2 border-slate-100  rounded-xl text-sm font-black uppercase tracking-widest outline-none text-slate-700  min-w-[180px]"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
          >
             <option value="">All Statuses</option>
             <option value="true">Active</option>
             <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-6">
          <table className="w-full">
            <thead className="border-b  bg-white ">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Identity</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Access Role</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Network Status</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Initialization</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 ">
               {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                       <td colSpan={5} className="bg-slate-50  h-16 border-b border-white " />
                    </tr>
                  ))
               ) : users.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="text-center p-12 text-xs font-black uppercase text-slate-400 tracking-widest hover:bg-slate-50  transition-colors">
                        Empty Sector Query
                     </td>
                  </tr>
               ) : (
                 users.map((u: any) => {
                    const isSelf = user?.id === u.id;
                    const roleColor = getRoleColors(u.role);
                    
                    return (
                    <tr key={u.id} className={clsx("hover:bg-slate-50  transition-colors group", isSelf && "bg-indigo-50/10 ")}>
                       <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                             <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm border", roleColor)}>
                                {initials(u.name)}
                             </div>
                             <div>
                                <h3 className="text-sm font-black text-slate-900  uppercase flex items-center gap-2">
                                   {u.name} {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100  text-indigo-600 ">(YOU)</span>}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-500 tracking-wide mt-0.5">{u.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap">
                          <span className={clsx("text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border", roleColor)}>
                             {u.role.replace(/_/g, ' ')}
                          </span>
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap">
                          {u.isActive ? (
                             <span className="text-[10px] font-black text-emerald-600 bg-emerald-50  px-3 py-1.5 rounded-lg border border-emerald-100  uppercase tracking-widest">Active Link</span>
                          ) : (
                             <span className="text-[10px] font-black text-rose-500 bg-rose-50  px-3 py-1.5 rounded-lg border border-rose-100  uppercase tracking-widest">Suspended</span>
                          )}
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-500 uppercase">
                          {new Date(u.createdAt).toLocaleDateString()}
                       </td>
                       <td className="px-8 py-6 whitespace-nowrap text-right">
                          <div className={clsx("flex justify-end gap-1 transition-opacity", !isSelf && "opacity-50 group-hover:opacity-100")}>
                             <button 
                                disabled={isSelf}
                                onClick={() => setEditUserData(u)} 
                                className="w-8 h-8 rounded-xl bg-slate-100  text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-all disabled:opacity-20" 
                                title={isSelf ? "Cannot edit own matrix" : "Edit Entity"}
                             >
                                <Edit2 size={14} />
                             </button>
                             <button 
                                disabled={isSelf || u.role === 'SUPER_ADMIN'}
                                onClick={() => handleToggleActive(u)} 
                                className="w-8 h-8 rounded-xl bg-slate-100  text-slate-500 hover:text-amber-600 flex items-center justify-center transition-all disabled:opacity-20" 
                                title="Toggle Network Link"
                             >
                                <ShieldAlert size={14} />
                             </button>
                             {user?.role === 'SUPER_ADMIN' && (
                                <button 
                                   disabled={isSelf}
                                   onClick={() => setResetPwdUserId(u.id)} 
                                   className="w-8 h-8 rounded-xl bg-slate-100  text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all disabled:opacity-20" 
                                   title="Reset Security Key"
                                >
                                   <Key size={14} />
                                </button>
                             )}
                          </div>
                       </td>
                    </tr>
                 )})
               )}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal open={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
      <EditUserModal open={!!editUserData} onClose={() => setEditUserData(null)} userToEdit={editUserData} />

      {/* Password Reset Embedded Dialog */}
      <AnimatePresence>
         {resetPwdUserId && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !generatedPassword && setResetPwdUserId(null)} />
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }} className="relative bg-white  p-8 rounded-3xl shadow-2xl max-w-sm w-full border ">
                 {!generatedPassword ? (
                    <>
                       <div className="w-12 h-12 bg-rose-100  text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                          <Key size={24} />
                       </div>
                       <h3 className="text-xl font-black uppercase text-slate-900  leading-tight">Security Override</h3>
                       <p className="text-xs font-bold text-slate-500 mt-2 mb-6">You are asserting ROOT protocols to override the user's password matrix. Select method:</p>
                       
                       <label className="flex items-center gap-3 mb-4 cursor-pointer">
                          <input type="checkbox" checked={autoGenerate} onChange={() => setAutoGenerate(!autoGenerate)} className="w-5 h-5 accent-indigo-600 rounded" />
                          <span className="text-sm font-bold text-slate-700 ">Auto-Generate Token</span>
                       </label>

                       {!autoGenerate && (
                          <input 
                             type="text" 
                             placeholder="New Password (min 8 chars)"
                             className="w-full px-4 py-3 bg-slate-50  border-2 border-slate-100  focus:border-indigo-600 rounded-xl font-bold text-sm outline-none transition-all mb-4"
                             value={manualPassword}
                             onChange={e => setManualPassword(e.target.value)}
                          />
                       )}

                       <div className="flex gap-2">
                          <button onClick={() => setResetPwdUserId(null)} className="flex-1 py-3 bg-slate-100  text-slate-600  rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Abort</button>
                          <button onClick={executePasswordReset} disabled={isResetting} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center">
                             {isResetting ? <Loader2 className="animate-spin" size={16} /> : 'Override'}
                          </button>
                       </div>
                    </>
                 ) : (
                    <div className="text-center">
                       <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                          <CheckCircle2 size={32} />
                       </div>
                       <h3 className="text-xl font-black uppercase text-slate-900 ">Token Issued</h3>
                       <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-2 mb-6 animate-pulse">Copy this now — it will be permanently encrypted</p>
                       
                       <div className="flex items-center justify-between p-4 bg-slate-100  rounded-xl mb-6">
                           <code className="text-lg font-black text-slate-800  select-all">{generatedPassword}</code>
                           <button onClick={copyToClipboard} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors">
                              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                           </button>
                       </div>
                       <button onClick={() => { setGeneratedPassword(null); setResetPwdUserId(null); }} className="w-full py-4 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Close Console</button>
                    </div>
                 )}
              </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
