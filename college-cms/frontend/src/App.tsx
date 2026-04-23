import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { settingsService } from './services/settingsService';

const PrefetchEngine = () => {
   const queryClient = useQueryClient();
   
   useEffect(() => {
     queryClient.prefetchQuery({ queryKey: ['courses'], queryFn: settingsService.getCourses });
     queryClient.prefetchQuery({ queryKey: ['academic-years'], queryFn: settingsService.getAcademicYears });
     queryClient.prefetchQuery({ queryKey: ['active-academic-year'], queryFn: settingsService.getActiveAcademicYear });
     queryClient.prefetchQuery({ queryKey: ['fee-components'], queryFn: settingsService.getFeeComponents });
   }, [queryClient]);
   
   return null;
};

function App() {
  return (
    <ErrorBoundary>
       <AuthProvider>
          <PrefetchEngine />
          <Toaster richColors position="top-right" />
          <RouterProvider router={router} />
       </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
