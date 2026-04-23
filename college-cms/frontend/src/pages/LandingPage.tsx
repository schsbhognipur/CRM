import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Stethoscope, 
  BookOpen, 
  Database, 
  GraduationCap,
  Globe,
  PieChart
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <span className="text-sm font-black tracking-tighter uppercase text-slate-900">SCHS PHARMACY</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
             <a href="#features" className="hover:text-emerald-600 transition-colors">Digital Ledger</a>
             <a href="#governance" className="hover:text-emerald-600 transition-colors">Governance</a>
             <a href="#security" className="hover:text-emerald-600 transition-colors">Security</a>
          </div>
          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Enter Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-emerald-100/30 rounded-full blur-[160px] opacity-60" />
           <div className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-100 mb-8 inline-block">
              Next-Gen Institutional CMS
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.05]">
              Pharmacy Management,<br/>
              <span className="text-emerald-600">Reimagined for Excellence.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience a calming, high-fidelity administrative suite designed to streamline student records, financial integrity, and institutional growth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to="/login"
                className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                Access Administration <ArrowRight size={18} />
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-100 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                <Globe size={18} className="text-emerald-600" /> Public Registry
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats / Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { 
               icon: Stethoscope, 
               title: "Clinical Fidelity", 
               desc: "Track student progress with medical-grade data accuracy across 4 academic years.",
               color: "text-emerald-600",
               bg: "bg-emerald-50"
             },
             { 
               icon: PieChart, 
               title: "Fiscal Intelligence", 
               desc: "Automated fee audits and revenue forecasting with zero-latency dashboarding.",
               color: "text-indigo-600",
               bg: "bg-indigo-50"
             },
             { 
               icon: BookOpen, 
               title: "Modular Academic", 
               desc: "Seamlessly map fee structures to courses, components, and institutional budgets.",
               color: "text-rose-600",
               bg: "bg-rose-50"
             }
           ].map((feature, i) => (
             <motion.div 
               key={i}
               initial={{ y: 30, opacity: 0 }}
               whileInView={{ y: 0, opacity: 1 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-100 hover:shadow-2xl hover:shadow-emerald-200/20 transition-all group"
             >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                   <feature.icon className={feature.color} size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-slate-900 py-32 text-center overflow-hidden relative">
         <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white rounded-full opacity-50" />
         </div>
         
         <div className="max-w-4xl mx-auto px-6 relative z-10">
           <GraduationCap className="text-emerald-500 mx-auto mb-8" size={64} />
           <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">Dedicated to the Future of Pharmacists.</h2>
           <p className="text-slate-400 text-lg font-medium mb-12 max-w-2xl mx-auto">
             SCHS Pharmacy College employs advanced data governance to ensure transparency, security, and elite performance across the entire campus ecosystem.
           </p>
           <Link to="/login" className="text-emerald-400 font-black text-xs uppercase tracking-[0.4em] hover:text-white transition-colors">
              Secure Auth Protocol →
           </Link>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100 text-center">
         <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white" size={16} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">SCHS PHARMACY COLLEGE</span>
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
            © 2026 Institutional Management Portal • v4.2.0 • Data Hosted in Secure Cloud Vault
         </p>
      </footer>
    </div>
  );
};

export default LandingPage;
