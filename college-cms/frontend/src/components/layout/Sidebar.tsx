import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
   LayoutDashboard, GraduationCap, IndianRupee, Receipt,
   BarChart2, Settings, ChevronDown, ChevronRight, LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
   const { user, logout } = useAuth();
   const [reportsOpen, setReportsOpen] = useState(false);
   const [settingsOpen, setSettingsOpen] = useState(false);

   const canAccessAccounting = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(user?.role || '');
   const canAccessSettings = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

   const initials = user?.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ID';
   const roleColor = user?.role === 'SUPER_ADMIN' ? 'bg-purple-600' : user?.role === 'ADMIN' ? 'bg-blue-600' : user?.role === 'ACCOUNTANT' ? 'bg-emerald-600' : 'bg-slate-500';

   const NavItem = ({ to, icon: Icon, label, exact = false }: any) => (
      <NavLink
         to={to}
         end={exact}
         className={({ isActive }) => clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group",
            isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600"
         )}
      >
         {({ isActive }) => (
            <>
               <Icon size={20} className={clsx("transition-transform group-hover:scale-110 relative z-10", isActive && "animate-pulse")} />
               <span className="text-xs font-black uppercase tracking-widest relative z-10">{label}</span>
            </>
         )}
      </NavLink>
   );

   return (
      <div className="w-72 bg-white dark:bg-slate-900 border-r dark:border-slate-800 h-screen flex flex-col pt-6 pb-6 shadow-2xl relative z-40">
         <div className="px-8 mb-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
               <span className="font-black">CM</span>
            </div>
            <div>
               <h1 className="text-lg font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">Sanskriti</h1>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">College Matrix Node</span>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2">
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" exact />
            <NavItem to="/students" icon={GraduationCap} label="Students" />

            {canAccessAccounting && (
               <>
                  <NavItem to="/accounts/credits" icon={IndianRupee} label="Fee Collection" />
                  <NavItem to="/accounts/expenses" icon={Receipt} label="Expenses" />

                  <div className="pt-2">
                     <button
                        onClick={() => setReportsOpen(!reportsOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
                     >
                        <div className="flex items-center gap-3">
                           <BarChart2 size={20} className="group-hover:text-indigo-600" />
                           <span className="text-xs font-black uppercase tracking-widest group-hover:text-indigo-600">Reports</span>
                        </div>
                        {reportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                     </button>
                     <AnimatePresence>
                        {reportsOpen && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-1">
                              <div className="pr-2 pl-6 py-2 space-y-1">
                                 <NavItem to="/reports/day-book" icon={BarChart2} label="Day Book" />
                                 <NavItem to="/reports/fee-collection" icon={BarChart2} label="Fee Roster" />
                                 <NavItem to="/reports/outstanding" icon={BarChart2} label="Outstanding" />
                                 <NavItem to="/reports/expenses" icon={BarChart2} label="Ledgers" />
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </>
            )}

            {canAccessSettings && (
               <div className="pt-2">
                  <button
                     onClick={() => setSettingsOpen(!settingsOpen)}
                     className="w-full flex items-center justify-between px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
                  >
                     <div className="flex items-center gap-3">
                        <Settings size={20} className="group-hover:text-indigo-600" />
                        <span className="text-xs font-black uppercase tracking-widest group-hover:text-indigo-600">Settings</span>
                     </div>
                     {settingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <AnimatePresence>
                     {settingsOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-1">
                           <div className="pr-2 pl-6 py-2 space-y-1">
                              <NavItem to="/settings/academic-years" icon={Settings} label="Timelines" />
                              <NavItem to="/settings/fee-structures" icon={Settings} label="Fee-Structures" />
                              <NavItem to="/settings/fee-components" icon={Settings} label="Fee-Components" />
                              <NavItem to="/settings/users" icon={Settings} label="Access Nodes" />
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            )}
         </div>

         <div className="px-6 mt-auto pt-6 border-t dark:border-slate-800">
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl relative group">
               <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl text-xs font-black", roleColor)}>
                  {initials}
               </div>
               <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest truncate">{user?.role.replace('_', ' ')}</p>
               </div>
               <button
                  onClick={logout}
                  className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-rose-600/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all hover:bg-rose-500 hover:text-white"
                  title="Sever Uplink (Logout)"
               >
                  <LogOut size={16} />
               </button>
            </div>
         </div>
      </div>
   );
};

export default Sidebar;
