// Moved router configuration out of App.tsx into its own file (router/index.tsx).
// ProtectedRoute logic needs to align with the new AuthContext specifications.
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullScreenSpinner } from './ui/Loaders';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
     // 403 Access Denied fallback
    return (
       <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <h1 className="text-4xl font-black text-rose-500 uppercase tracking-widest mb-4">403 Blocked</h1>
          <p className="text-slate-500 font-bold tracking-widest text-sm">You do not possess the required clearance matrix to parse this sector.</p>
       </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
