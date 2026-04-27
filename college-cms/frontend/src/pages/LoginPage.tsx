import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../api/axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'Checking' | 'Online' | 'Offline'>('Checking');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const checkPulse = async () => {
    setBackendStatus('Checking');
    try {
      // Use raw fetch to avoid axios interceptors during health check
      const baseUrl = api.defaults.baseURL || 'http://localhost:5002/api';
      const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
      if (response.ok || response.status === 404) {
        // Even a 404 means the server reacted, so it's "Online"
        setBackendStatus('Online');
      } else {
        setBackendStatus('Offline');
      }
    } catch (err) {
      setBackendStatus('Offline');
    }
  };

  useEffect(() => {
    checkPulse();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (!err.response) {
        setError('CONNECTION ERROR: Terminal Unreachable.');
        setDebugInfo(`Ensure the backend is running at ${api.defaults.baseURL}. This is often a CORS or Firewall issue.`);
      } else if (err.response.status === 401) {
        setError('ACCESS DENIED: Invalid Security Credentials.');
      } else {
        setError(`CRITICAL: Server returned error ${err.response.status}`);
        setDebugInfo(err.response.data?.message || 'Unexpected response pattern.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8F9FB]  transition-colors duration-500">
      {/* Brand Section */}
      <div className="hidden lg:flex relative bg-indigo-950 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-40 h-40 bg-white rounded-[3.5rem] flex items-center justify-center mx-auto border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6"
          >
            <img src="/src/assets/logo.png" alt="SCHS Logo" className="w-full h-full object-contain" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-7xl font-black text-white tracking-[0.05em] uppercase">SCHS</h1>
            <p className="text-2xl font-bold text-indigo-400 tracking-[0.3em]">जीवा ज्योति रशीमहि</p>
          </div>
          <p className="text-indigo-200/50 font-black uppercase tracking-widest text-[10px] max-w-sm mx-auto">Establishing secure connection to institutional ledger.</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-6 relative">
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button
            onClick={checkPulse}
            className={clsx(
              "px-4 py-2 rounded-full border flex items-center gap-2 transition-all group",
              backendStatus === 'Online' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                backendStatus === 'Offline' ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100" :
                  "bg-slate-100 text-slate-400 border-slate-200"
            )}
          >
            {backendStatus === 'Online' ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{backendStatus}</span>
          </button>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900  tracking-tight">Portal Access</h2>
            <p className="text-slate-400 font-bold text-sm tracking-tight">Identify yourself to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Official Email"
                  className="w-full pl-12 pr-4 py-4 bg-white  border-2 border-slate-100  rounded-2xl outline-none transition-all font-bold focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/5 placeholder:text-slate-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Security Code"
                  className="w-full pl-12 pr-4 py-4 bg-white  border-2 border-slate-100  rounded-2xl outline-none transition-all font-bold focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/5 placeholder:text-slate-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2"
                >
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                  </div>
                  {debugInfo && (
                    <div className="p-3 bg-white/60 text-[9px] font-bold text-rose-400 leading-relaxed rounded-lg border border-rose-100/30 font-mono">
                      TRACE: {debugInfo}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95",
                isLoading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700"
              )}
            >
              {isLoading ? 'Decrypting...' : <>Establish Connection <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-[10px] text-center font-black text-slate-300 uppercase tracking-widest">
            Institutional Encryption Protocol Enforced
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
