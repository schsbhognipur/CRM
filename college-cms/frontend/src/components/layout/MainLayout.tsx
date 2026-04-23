import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { PageLoader } from '../ui/Loaders';

const MainLayout = () => {
   return (
      <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen overflow-hidden">
         <Sidebar />
         <main className="flex-1 overflow-y-auto custom-scrollbar p-10 relative">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <Suspense fallback={<PageLoader />}>
               <Outlet />
            </Suspense>
         </main>
      </div>
   );
};

export default MainLayout;
