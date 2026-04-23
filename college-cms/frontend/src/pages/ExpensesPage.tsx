import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Plus, 
  Settings, 
  ArrowUpRight, 
  Receipt, 
  CreditCard,
  Trash2,
  Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ExpensesPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['transactions', 'debit'],
    queryFn: async () => {
      const { data } = await api.get('/transactions?type=DEBIT');
      return data;
    }
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/expense-summary');
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await api.get('/expense-categories');
      return data;
    }
  });

  if (isLoading) return <div className="p-10">Fetching expense records...</div>;

  const chartData = summary?.byCategory.map((c: any) => ({
    name: c.categoryName,
    value: Number(c.total)
  })) || [];

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
           <ArrowUpRight className="text-red-500" />
           Accounts - Debit / Expenses
        </h1>
        <div className="flex gap-3">
           <button className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <Settings size={18} /> Categories
           </button>
           <button 
             onClick={() => setModalOpen(true)}
             className="bg-red-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-red-500/20"
           >
              <Plus size={20} /> Record Expense
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Stats */}
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard title="This Month" amount={`₹${summary?.thisMonth || 0}`} change="+12%" color="text-red-600" />
            <StatCard title="Last Month" amount={`₹${summary?.lastMonth || 0}`} change="-5%" color="text-gray-900" />
            
            <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700">
               <h3 className="text-lg font-bold mb-6">Recent Expenses</h3>
               <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                 {(expenses?.transactions || []).map((ex: any) => (
                   <div key={ex.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-full flex items-center justify-center">
                            <Receipt size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white uppercase">{ex.description}</p>
                            <p className="text-xs text-gray-500 uppercase">{new Date(ex.transactionDate).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-black text-red-600">₹{ex.amount}</p>
                         <p className="text-xs text-gray-400 font-bold uppercase">{ex.paymentMode}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
         </div>

         {/* Chart */}
         <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border dark:border-gray-700 flex flex-col items-center">
            <h3 className="text-lg font-bold mb-6 w-full">Expense Breakdown</h3>
            <div className="w-full h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                       data={chartData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {chartData.map((_entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip />
                     <Legend />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, change, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
    <div className="flex items-end justify-between">
       <h2 className={`text-4xl font-black ${color}`}>{amount}</h2>
       <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">{change}</span>
    </div>
  </div>
);

export default ExpensesPage;
