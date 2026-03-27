import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NavBar } from './components/NavBar';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import PatientDashboard from './pages/PatientDashboard.tsx';
import DoctorDashboard from './pages/DoctorDashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import DoctorPublicPage from './pages/DoctorPublicPage';
import CartPage from './pages/CartPage.tsx';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <div>Brak uprawnień.</div>;
    return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
       <CartProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <NavBar />
          <main className="container mx-auto p-4 flex-1">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route path="/dashboard/patient" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <PatientDashboard />
                    </ProtectedRoute>
                } />

                <Route path="/cart" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <CartPage />
                    </ProtectedRoute>
                } />
                
                <Route path="/doctors/:id" element={<DoctorPublicPage />} />

                <Route path="/dashboard/doctor" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorDashboard />
                    </ProtectedRoute>
                } />

                <Route path="/dashboard/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
          </main>
        </div>
       </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
