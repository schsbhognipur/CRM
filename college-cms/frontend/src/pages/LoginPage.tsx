import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ChevronRight, Settings } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] dark:bg-[#0F172A] selection:bg-indigo-100">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-20">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48" />
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] -ml-48 -mb-48" />
         
         <div className="relative z-10 text-white max-w-lg">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/20"
            >
               <ShieldCheck size={32} />
            </motion.div>
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="text-5xl font-black mb-6 leading-tight"
            >
               Institutional Wisdom <br/> Secured.
            </motion.h2>
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="text-xl text-indigo-100 font-medium leading-relaxed"
            >
               Access the SCHS Pharmacy College Management Intelligence Portal. Optimized for high-fidelity fiscal and student tracking.
            </motion.p>
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="mt-20 flex gap-4"
            >
               <div className="px-5 py-3 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Status</p>
                  <p className="text-sm font-bold">Node Active</p>
               </div>
               <div className="px-5 py-3 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Region</p>
                  <p className="text-sm font-bold">SCHS-PHARMA-1</p>
               </div>
            </motion.div>
         </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-20 bg-white dark:bg-[#0F172A] relative">
         <div className="max-w-md w-full">
            <div className="mb-12">
               <div className="flex items-center gap-3 mb-8 lg:hidden">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                     <Settings size={22} />
                  </div>
                  <div>
                     <h1 className="font-black text-xs text-indigo-600 uppercase tracking-widest leading-none">SCHS</h1>
                     <p className="text-lg font-bold text-slate-800 dark:text-white -mt-0.5">Portal</p>
                  </div>
               </div>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Welcome Back.</h3>
               <p className="text-slate-500 font-medium">Please enter your credentials to access the terminal.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex gap-3 items-center"
              >
                 <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
                    <X size={16} />
                 </div>
                 <p className="text-sm font-bold text-rose-600">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Encrypted Identity (Email)</label>
                  <div className="relative group">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                     <input
                        type="email"
                        required
                        placeholder="admin@college.com"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 rounded-[1.25rem] transition-all outline-none text-slate-900 dark:text-white font-semibold"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Token (Password)</label>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                     <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 rounded-[1.25rem] transition-all outline-none text-slate-900 dark:text-white font-semibold"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                  </div>
               </div>

               <div className="flex items-center justify-between pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer" />
                     <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Keep Session Active</span>
                  </label>
                  <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Credential Recovery</a>
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white py-4 rounded-[1.25rem] font-black text-lg shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 group"
               >
                  {loading ? 'Authenticating...' : (
                    <>
                      Enter Terminal <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
               </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Secure Institutional Gateway • v1.0.4
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

// Internal icon import for error display
import { X } from 'lucide-react';

export default LoginPage;
