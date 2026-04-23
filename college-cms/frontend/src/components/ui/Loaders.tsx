import React from 'react';
import { Loader2 } from 'lucide-react';

export const FullScreenSpinner = () => (
   <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md">
      <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
      <h2 className="text-xl font-black uppercase tracking-widest text-white animate-pulse">Authenticating Vector</h2>
      <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase">Initializing root protocols...</p>
   </div>
);

export const PageLoader = () => (
   <div className="w-full h-[60vh] flex flex-col items-center justify-center">
      <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Configuration</span>
   </div>
);

export const TableSkeleton = ({ rows = 10, columns = 6 }: { rows?: number, columns?: number }) => (
   <div className="w-full animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
         <div key={r} className="flex border-b border-slate-100 dark:border-slate-800 p-4">
            {Array.from({ length: columns }).map((_, c) => (
               <div key={c} className="flex-1 px-4">
                  <div className={`h-4 bg-slate-200 dark:bg-slate-700/50 rounded-full w-${Math.floor(Math.random() * (11 - 6) + 6)}/12`}></div>
               </div>
            ))}
         </div>
      ))}
   </div>
);

export const ErrorBoundaryFallback = ({ error, resetErrorBoundary }: any) => {
   return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-lg text-center border dark:border-slate-700">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
               <Loader2 size={32} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Something went wrong</h1>
            <p className="text-sm font-bold text-slate-500 mb-8 px-4 leading-relaxed tracking-wide">
               {error?.message || "A fatal rendering inconsistency occurred within the matrix."}
            </p>
            <button 
               onClick={() => { resetErrorBoundary?.(); window.location.reload(); }}
               className="w-full py-4 text-xs font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all"
            >
               Force Refresh Page
            </button>
         </div>
      </div>
   );
};
