import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import BookingConfirmation from './pages/BookingConfirmation';
import UserBookings from './pages/UserBookings';
import AdminDashboard from './pages/AdminDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import WalletPage from './pages/WalletPage';
import AdminLogin from './pages/AdminLogin';
import './App.css';

const GOOGLE_CLIENT_ID = '860163349495-dft8tg560fa5jmvs3kr255cn0g1gso70.apps.googleusercontent.com';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/wallet" element={
                <ProtectedRoute><WalletPage /></ProtectedRoute>
              } />
              <Route path="/booking-confirmation" element={
                <ProtectedRoute><BookingConfirmation /></ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute><UserBookings /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/professional" element={
                <ProtectedRoute allowedRoles={['professional', 'admin']}><ProfessionalDashboard /></ProtectedRoute>
              } />
            </Routes>
            <Toaster position="top-center" />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
