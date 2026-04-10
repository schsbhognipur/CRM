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
  ExternalLink,
  ChevronRight
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
      return data;
    }
  });

  const { data: activity } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/activity-feed');
      return data;
    }
  });

  if (summaryLoading || chartLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* KPI Row - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Active Intake" 
          value={summary?.students.total} 
          subtext={`+${summary?.students.new_this_month} new`} 
          icon={<Users size={18} className="text-indigo-600" />}
          gradient="from-indigo-500/5 to-transparent"
          trend="up"
        />
        <KPICard 
          title="Yield" 
          value={`₹${(summary?.fees.totalExpected / 100000).toFixed(1)}L`} 
          subtext={`${summary?.fees.collectionRate}% target`} 
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          gradient="from-emerald-500/5 to-transparent"
          trend="up"
        />
        <KPICard 
          title="Receivables" 
          value={`₹${(summary?.fees.totalOutstanding / 100000).toFixed(1)}L`} 
          subtext="Pending" 
          icon={<Clock size={18} className="text-amber-600" />}
          gradient="from-amber-500/5 to-transparent"
          trend="down"
        />
        <KPICard 
          title="Surplus" 
          value={`₹${(summary?.finances.monthCredit - summary?.finances.monthDebit).toLocaleString()}`} 
          subtext="Net Monthly" 
          icon={<CreditCard size={18} className="text-rose-600" />}
          gradient="from-rose-500/5 to-transparent"
          trend={summary?.finances.monthCredit >= summary?.finances.monthDebit ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Strategic Chart - Height Adjusted for Single Page */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-lg shadow-slate-200/40 dark:shadow-none border dark:border-slate-700">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Revenue Analysis</h3>
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

        {/* Audit Trail - Compact */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-lg shadow-slate-200/40 dark:shadow-none border dark:border-slate-700 flex flex-col h-[320px] xl:h-auto">
           <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Audit</h3>
              <Activity size={16} className="text-indigo-600" />
           </div>
           
           <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
              {activity?.slice(0, 8).map((log: any, i: number) => (
                <div key={log.id} className="flex gap-3">
                   <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                      <UserCircle size={14} className="text-slate-400" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start">
                         <p className="text-[11px] font-black text-slate-800 dark:text-white truncate">{log.user.name.split(' ')[0]}</p>
                         <span className="text-[8px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{log.action.replace(/_/g, ' ')}</p>
                   </div>
                </div>
              ))}
           </div>
           
           <button className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all">Full Audit</button>
        </div>
      </div>

      {/* Transactional Intelligence - Compact Cards */}
      <div className="bg-slate-900 p-6 rounded-[2rem] text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px]" />
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black">Ledger Pulses</h3>
               <button className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Active Monitoring</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {summary?.recentTransactions.slice(0, 3).map((tx: any, i: number) => (
                 <div key={tx.id} className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                       <div className={clsx(
                         "w-8 h-8 rounded-lg flex items-center justify-center",
                         tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                       )}>
                          {tx.type === 'CREDIT' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                       </div>
                       <div className="text-right">
                          <p className={`text-sm font-black ${tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                          </p>
                       </div>
                    </div>

                    <div className="flex justify-between items-center">
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-black truncate">{tx.student?.name || tx.description}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{tx.subType.replace(/_/g, ' ')}</p>
                       </div>
                       <div className="p-1.5 bg-white/5 rounded-lg text-slate-500 group-hover:text-indigo-400 transition-colors">
                          <Receipt size={14} />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtext, icon, gradient, trend }: any) => (
  <div className="relative bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-lg shadow-slate-100 dark:shadow-none border dark:border-slate-700 overflow-hidden group">
     <div className={clsx("absolute inset-0 bg-gradient-to-br transition-opacity", gradient)} />
     <div className="relative z-10 flex items-center gap-3">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700 shadow-sm border-transparent group-hover:border-slate-200 transition-all">{icon}</div>
        <div className="min-w-0 flex-1">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
           <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{value}</h2>
           <p className="text-[8px] font-bold text-slate-500 truncate mt-0.5">{subtext}</p>
        </div>
        <div className={clsx(
          "w-1.5 h-1.5 rounded-full",
          trend === 'up' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
        )} />
     </div>
  </div>
);

export default DashboardPage;
