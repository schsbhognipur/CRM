import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Receipt,
  UserCircle,
  Zap
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  useRealtimeDashboard();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary');
      return data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard', 'chart'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/monthly-chart');
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: activity } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/activity-feed');
      return Array.isArray(data) ? data : [];
    }
  });

  if (summaryLoading || chartLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
         <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Data Stream...</p>
      </div>
    );
  }

  // Ensure students data is safe
  const studentStats = summary?.students || { total: 0, new_this_month: 0 };
  const feeStats = summary?.fees || { totalExpected: 0, totalCollected: 0, totalOutstanding: 0, collectionRate: 0 };
  const financeStats = summary?.finances || { monthCredit: 0, monthDebit: 0 };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Session Badge */}
      <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
               <Zap size={20} />
            </div>
            <div>
               <h2 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Active Academic Pulse</h2>
               <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-tight">Current Session: {summary?.activeYear || 'N/A'}</p>
            </div>
         </div>
         <div className="flex gap-2">
            <div className="px-3 py-1 bg-white rounded-lg border border-indigo-200 text-[9px] font-bold text-indigo-600 uppercase tracking-widest shadow-sm">Live System</div>
            <div className="px-3 py-1 bg-emerald-500 rounded-lg text-[9px] font-bold text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20">Active Session</div>
         </div>
      </div>

      {/* KPI Row - High Visibility Dynamics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Intraday Yield"
          value={`₹${(financeStats.todayCredit || 0).toLocaleString('en-IN')}`}
          subtext="Today's Live Pulse"
          icon={<Activity size={28} className="text-indigo-600" />}
          gradient="from-indigo-600/10 to-transparent"
          textColor="text-indigo-900"
          trend="up"
          pulse={false}
        />
        <KPICard
          title="Nett Sessions"
          value={`₹${(feeStats.totalExpected || 0).toLocaleString('en-IN')}`}
          subtext="Total Institutional Target"
          icon={<Receipt size={28} className="text-slate-600" />}
          gradient="from-slate-500/10 to-transparent"
          textColor="text-slate-900"
          trend="up"
        />
        <KPICard
          title="Collected"
          value={`₹${(feeStats.totalPaid || 0).toLocaleString('en-IN')}`}
          subtext={`${feeStats.collectionRate || 0}% Yield Accuracy`}
          icon={<TrendingUp size={28} className="text-emerald-600" />}
          gradient="from-emerald-500/10 to-transparent"
          textColor="text-emerald-700"
          trend="up"
        />
        <KPICard
          title="Discount Burn"
          value={`₹${(feeStats.totalDiscount || 0).toLocaleString('en-IN')}`}
          subtext="Institutional Waivers"
          icon={<Zap size={28} className="text-orange-600" />}
          gradient="from-orange-500/10 to-transparent"
          textColor="text-orange-700"
          trend="up"
        />
        <KPICard
          title="Pending"
          value={`₹${(feeStats.totalOutstanding || 0).toLocaleString('en-IN')}`}
          subtext="Net Receivables"
          icon={<Clock size={28} className="text-rose-600" />}
          gradient="from-rose-500/10 to-transparent"
          textColor="text-rose-700"
          trend="down"
        />
      </div>

      {/* Expense Dynamics - Institutional Outflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <KPICard 
           title="Total Expenses" 
           value={`₹${(financeStats.totalDebit || 0).toLocaleString('en-IN')}`} 
           subtext="All-Time Institutional Outflow" 
           icon={<ArrowDownRight size={28} className="text-rose-600" />}
           gradient="from-rose-500/10 to-transparent"
           textColor="text-rose-900"
           trend="up"
         />
         <KPICard 
           title="Monthly Burn" 
           value={`₹${(financeStats.monthDebit || 0).toLocaleString('en-IN')}`} 
           subtext="Current Month Expenditure" 
           icon={<Activity size={28} className="text-rose-600" />}
           gradient="from-rose-500/10 to-transparent"
           textColor="text-rose-700"
           trend="up"
         />
         <KPICard 
           title="Today's Outflow" 
           value={`₹${(financeStats.todayDebit || 0).toLocaleString('en-IN')}`} 
           subtext="Intraday Expense Pulse" 
           icon={<Zap size={28} className="text-rose-500" />}
           gradient="from-rose-500/10 to-transparent"
           textColor="text-rose-600"
           trend="up"
           pulse={false}
         />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Strategic Chart */}
        <div className="xl:col-span-2 bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="text-lg font-black text-slate-900 leading-tight">Revenue Analysis</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">YTD Metrics</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Credits</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Expenses</span>
                 </div>
              </div>
           </div>
           
           <div className="h-[240px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.05}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94A3B8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94A3B8'}} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="credits" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCredits)" />
                    <Area type="monotone" dataKey="debits" stroke="#F43F5E" strokeWidth={2.5} fill="none" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col h-[320px] xl:h-auto">
           <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-slate-900">Audit</h3>
              <Activity size={16} className="text-indigo-600" />
           </div>
           
           <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
              {(Array.isArray(activity) ? activity : []).slice(0, 10).map((log: any, i: number) => (
                <div key={log.id} className="flex gap-3">
                   <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <UserCircle size={14} className="text-slate-400" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start">
                         <p className="text-[11px] font-black text-slate-800 truncate">{log.user?.name?.split(' ')[0] || 'System'}</p>
                         <span className="text-[8px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{log.action.replace(/_/g, ' ')}</p>
                   </div>
                </div>
              ))}
              {(!activity || activity.length === 0) && (
                <div className="text-center py-10">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent audit logs</p>
                </div>
              )}
           </div>
           
           <button className="mt-4 w-full py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">Full Audit</button>
        </div>
      </div>

      {/* Transactional & Sectional Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Course Wise Collection */}
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Program Performance</h3>
               <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Activity size={16} />
               </div>
            </div>
            <div className="space-y-4">
               {(summary?.courseStats || []).map((course: any) => (
                  <div key={course.name} className="group">
                     <div className="flex justify-between items-end mb-2">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.name.replace(/_/g, '. ')}</p>
                           <p className="text-xs font-black text-slate-800">₹{course.paid.toLocaleString()} <span className="text-[9px] text-slate-400 italic">of ₹{course.expected.toLocaleString()}</span></p>
                        </div>
                        <p className="text-sm font-black text-indigo-600">{course.yield}%</p>
                     </div>
                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${course.yield}%` }}
                           className="h-full bg-indigo-600 rounded-full"
                        />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Pulse View */}
         <div className="bg-slate-900 p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-slate-900/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="relative z-10 h-full flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Real-Time Pulses</h3>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Sink</span>
                  </div>
               </div>

               <div className="flex-1 space-y-4">
                  {(summary?.recentTransactions || []).slice(0, 3).map((tx: any, i: number) => (
                    <div key={tx.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                       <div className="flex justify-between items-center">
                          <div className="flex gap-3 items-center">
                             <div className={clsx(
                               "w-8 h-8 rounded-lg flex items-center justify-center",
                               tx.type === 'CREDIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                             )}>
                                {tx.type === 'CREDIT' ? <TrendingUp size={14} /> : <ArrowUpRight size={14} />}
                             </div>
                             <div>
                                <p className="text-xs font-black text-white truncate max-w-[120px]">{tx.student?.name || 'System'}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{(tx.subType || 'General').replace(/_/g, ' ')}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={`text-sm font-black ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ₹{(Number(tx.amount) || 0).toLocaleString()}
                             </p>
                             <p className="text-[8px] font-bold text-slate-500">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               
               <button className="mt-4 py-3 bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">View All Activity</button>
            </div>
         </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtext, icon, gradient, trend, pulse, textColor }: any) => {
  return (
    <motion.div 
      initial={{ scale: 1 }}
      animate={pulse ? { 
        scale: [1, 1.05, 1],
        boxShadow: ["0 10px 15px -3px rgba(0,0,0,0.1)", "0 20px 25px -5px rgba(79,70,229,0.1)", "0 10px 15px -3px rgba(0,0,0,0.1)"]
      } : {}}
      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      className="relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group"
    >
       <div className={clsx("absolute inset-0 bg-gradient-to-br transition-opacity duration-500", gradient)} />
       <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
             <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-50 group-hover:border-indigo-100 transition-all">
                {pulse && <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl animate-ping" />}
                {icon}
             </div>
             <div className={clsx(
               "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
               trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
             )}>
                {trend === 'up' ? '↑ Rising' : '↓ Risk'}
             </div>
          </div>
          <div>
             <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-3">{title}</p>
             <h2 className={clsx("text-4xl font-black leading-tight tracking-tighter", textColor || "text-slate-900")}>{value}</h2>
             <p className="text-xs font-bold text-slate-500 mt-2 opacity-60 tracking-tight">{subtext}</p>
          </div>
       </div>
       {pulse && (
         <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-500 overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
            />
         </div>
       )}
    </motion.div>
  );
};

export default DashboardPage;
