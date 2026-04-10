import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import UsersPage from './pages/UsersPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfile from './pages/StudentProfile';
import DefaultersPage from './pages/DefaultersPage';
import CreditsPage from './pages/CreditsPage';
import ExpensesPage from './pages/ExpensesPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import { Toaster } from 'sonner';

// Placeholder Components
const Unauthorized = () => <h1 className="text-2xl font-bold text-red-600">403 - Unauthorized</h1>;

function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route path="/fees/defaulters" element={<DefaultersPage />} />
              <Route path="/accounts/credits" element={<CreditsPage />} />
              <Route path="/accounts/expenses" element={<ExpensesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              
              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
                <Route path="/settings/users" element={<UsersPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
