import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle,
  AlertCircle,
  Receipt,
  LogOut, 
  Menu, 
  X,
  Settings,
  ArrowUpRight,
  FileText,
  ChevronRight,
  Bell,
  Search as SearchIcon
} from 'lucide-react';
import { clsx } from 'clsx';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Fee Collection', path: '/accounts/credits', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'Expense Vouchers', path: '/accounts/expenses', icon: ArrowUpRight, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'Analytics Reports', path: '/reports', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'Defaulters', path: '/fees/defaulters', icon: AlertCircle, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'User Management', path: '/settings/users', icon: UserCircle, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Institutions', path: '/settings/academic-years', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex font-sans">
      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 bg-white dark:bg-[#1E293B] border-r dark:border-slate-800 w-72 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 lg:translate-x-0 overflow-hidden",
        sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 pb-4">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                   <Settings size={22} className="animate-spin-slow" />
                </div>
                <div>
                   <h1 className="font-black text-xs text-indigo-600 uppercase tracking-widest leading-none">SCHS</h1>
                   <p className="text-lg font-bold text-slate-800 dark:text-white -mt-0.5">CMS Portal</p>
                </div>
             </div>
             
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Main Menu</p>
             <nav className="space-y-1">
                {filteredNav.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        "group flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200",
                        isActive 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" 
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                         <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                         <span className={clsx("text-sm font-semibold tracking-tight", isActive ? "text-white" : "text-slate-600 dark:text-slate-300 group-hover:text-indigo-600")}>
                            {item.name}
                         </span>
                      </div>
                      {isActive && <ChevronRight size={14} className="opacity-50" />}
                    </Link>
                  )
                })}
             </nav>
          </div>

          <div className="mt-auto p-8 pt-4 border-t dark:border-slate-800">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4">
                <div className="flex items-center gap-3 mb-1">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-slate-400 uppercase">System Status</p>
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Terminal Active</p>
             </div>
             
             <button
               onClick={handleLogout}
               className="flex items-center gap-3 p-4 w-full rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all group font-bold text-sm"
             >
               <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
               <span>Log Out</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0 min-h-screen">
        <header className="h-20 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
             <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-4 py-2 border border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all w-80">
                <SearchIcon size={18} className="text-slate-400" />
                <input type="text" placeholder="Global system search..." className="bg-transparent border-none text-sm w-full px-3 focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
             </div>
          </div>

          <div className="flex items-center gap-6">
             <button className="relative p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0F172A]" />
             </button>
             
             <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

             <div className="flex items-center gap-4 group cursor-pointer">
                <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-slate-800 dark:text-white leading-none mb-1">{user?.name}</p>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">{user?.role}</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 ring-2 ring-transparent group-hover:ring-indigo-500 transition-all">
                   <span className="text-lg font-black">{user?.name.charAt(0)}</span>
                </div>
             </div>
          </div>
        </header>

        <main className="p-6 flex-1">
           <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                 <Outlet />
              </motion.div>
           </AnimatePresence>
        </main>

        <footer className="px-8 py-6 border-t dark:border-slate-800 text-center">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} SCHS Pharmacy College • Management System • v1.0.4
           </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
