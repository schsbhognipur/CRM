import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/LoginPage';

// Pages
import DashboardPage from '../pages/DashboardPage';
import StudentsPage from '../pages/StudentsPage';
import AddStudentPage from '../pages/students/AddStudentPage';
import StudentProfile from '../pages/StudentProfile';
import FeeCollection from '../pages/accounts/FeeCollection';
import Expenses from '../pages/accounts/Expenses';

// Reports Placeholders
const ReportsPage = React.lazy(() => import('../pages/ReportsPage').catch(() => ({ default: () => <Placeholder title="Reports Engine Offline" /> })));
const DayBookPage = () => <Placeholder title="Day Book Ledger" />;
const FeeCollectionReportPage = () => <Placeholder title="Fee Collection Report" />;
const OutstandingFeesPage = () => <Placeholder title="Outstanding Fees Radar" />;
const ExpenseLedgerPage = () => <Placeholder title="Expense Ledger Core" />;
const DefaultersPage = React.lazy(() => import('../pages/DefaultersPage').catch(() => ({ default: () => <Placeholder title="Defaulters Registry" /> })));

// Settings
import AcademicYears from '../pages/settings/AcademicYears';
import FeeStructures from '../pages/settings/FeeStructures';
import FeeComponents from '../pages/settings/FeeComponents';
import UserManagement from '../pages/settings/UserManagement';

const Placeholder = ({ title }: { title: string }) => (
   <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50  border-2 border-dashed border-slate-200  rounded-[2.5rem]">
      <h2 className="text-2xl font-black uppercase text-slate-400 tracking-widest">{title}</h2>
      <p className="text-xs font-bold text-slate-500 mt-2">Coming soon in next deployment phase.</p>
   </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/students/new',
    element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AddStudentPage /></ProtectedRoute>
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
       { index: true, element: <Navigate to="/dashboard" replace /> },
       { path: 'dashboard', element: <DashboardPage /> },
       
       { path: 'students', element: <StudentsPage /> },
       { path: 'students/defaulters', element: <React.Suspense fallback={<Placeholder title="Loading..." />}><DefaultersPage /></React.Suspense> },
       { path: 'students/:id', element: <StudentProfile /> },
       
       { path: 'accounts/credits', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}><FeeCollection /></ProtectedRoute> },
       { path: 'accounts/expenses', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}><Expenses /></ProtectedRoute> },
       
       {
          path: 'reports',
          element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}><React.Suspense fallback={<Placeholder title="Loading..." />}><ReportsPage /></React.Suspense></ProtectedRoute>
       },
       { path: 'reports/day-book', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}><DayBookPage /></ProtectedRoute> },
       { path: 'reports/fee-collection', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}><FeeCollectionReportPage /></ProtectedRoute> },
       { path: 'reports/outstanding', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}><OutstandingFeesPage /></ProtectedRoute> },
       { path: 'reports/expenses', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}><ExpenseLedgerPage /></ProtectedRoute> },

       {
          path: 'settings',
          element: <Outlet />,
          children: [
             { path: 'academic-years', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AcademicYears /></ProtectedRoute> },
             { path: 'fee-structures', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><FeeStructures /></ProtectedRoute> },
             { path: 'fee-components', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><FeeComponents /></ProtectedRoute> },
             { path: 'users', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><UserManagement /></ProtectedRoute> }
          ]
       }
    ]
  },
  {
     path: '*',
     element: <Navigate to="/dashboard" replace />
  }
]);
