import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  CreditCard, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Bell,
  Search as SearchIcon,
  UserCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Student Directory', path: '/students', icon: Users },
    { name: 'Fee Collection', path: '/accounts/credits', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'Expense Vouchers', path: '/accounts/expenses', icon: ArrowUpRight, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'Analytics Reports', path: '/reports', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'Defaulters', path: '/fees/defaulters', icon: AlertCircle, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { name: 'User Management', path: '/settings/users', icon: UserCircle, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50  flex text-slate-900 ">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto custom-scrollbar",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
         <div className="h-full flex flex-col p-6">
           <div className="flex items-center gap-4 px-2 mb-10">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                 <Settings size={24} className="animate-spin-slow" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">SCHS</h1>
                 <p className="text-[12px] font-black text-indigo-600 uppercase tracking-widest -mt-1">Institutional CRM</p>
              </div>
           </div>

           <nav className="flex-1 space-y-2">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-2xl transition-all group relative",
                      isActive 
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                        : "text-slate-400 hover:bg-slate-50  hover:text-indigo-600"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <item.icon size={26} className={clsx("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
                      <span className="font-black text-xl tracking-tighter uppercase">{item.name}</span>
                    </div>
                    {isActive && (
                      <motion.div layoutId="activeNav" className="absolute left-0 w-1.5 h-8 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    )}
                    <ChevronRight size={16} className={clsx("transition-opacity", isActive ? "opacity-60" : "opacity-0")} />
                  </Link>
                );
              })}
           </nav>

           <div className="pt-6 border-t  space-y-4">
              <div className="bg-slate-50  p-4 rounded-2xl border ">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">System Status</p>
                 </div>
                 <p className="text-xs font-bold text-slate-700 ">Terminal Active</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 p-4 w-full rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all group font-bold text-base"
              >
                <LogOut size={28} className="group-hover:translate-x-1 transition-transform" />
                <span>Log Out</span>
              </button>
           </div>
         </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0 min-h-screen">
        <header className="h-20 bg-white/80  backdrop-blur-xl border-b  px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-600  hover:bg-slate-100  rounded-xl">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
             <div className="hidden md:flex items-center bg-slate-100  rounded-2xl px-4 py-2 border border-transparent focus-within:border-indigo-500 focus-within:bg-white  transition-all w-80">
                <SearchIcon size={18} className="text-slate-400" />
                <input type="text" placeholder="Global system search..." className="bg-transparent border-none text-sm w-full px-3 focus:ring-0 text-slate-700  placeholder:text-slate-400" />
             </div>
          </div>

          <div className="flex items-center gap-6">
             <button className="relative p-2.5 text-slate-400 hover:bg-slate-100  rounded-2xl transition-all">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white " />
             </button>
             
             <div className="h-8 w-[1px] bg-slate-200  hidden sm:block" />

             <div className="flex items-center gap-4 group cursor-pointer">
                <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-slate-800  leading-none mb-1">{user?.name}</p>
                   <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">{user?.role}</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 ring-2 ring-transparent group-hover:ring-indigo-500 transition-all">
                   <span className="text-lg font-black">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                </div>
             </div>
          </div>
        </header>

        <main className="p-6 flex-1">
           <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                 <Outlet />
              </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
