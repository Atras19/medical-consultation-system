import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, User, LogOut } from 'lucide-react';

export const Layout: React.FC = () => {
  const { cart } = useCart();
  const { user, role, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex gap-6 items-center">
            <h1 className="text-xl font-bold text-blue-600">Konsultacje lekarskie</h1>
            <div className="space-x-4 text-sm font-medium">
                <Link to="/" className="hover:text-blue-600 transition">Kalendarz (Pacjent)</Link>
                <Link to="/doctor" className="hover:text-blue-600 transition">Panel Lekarza</Link>
            </div>
        </div>
        <div className="flex items-center gap-4">
            {isAuthenticated ? (
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium hidden sm:inline">
                        {user?.firstName} {user?.lastName} ({role})
                    </span>
                    <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Wyloguj">
                        <LogOut size={20} />
                    </button>
                </div>
            ) : (
                <div className="text-sm space-x-2">
                    <Link to="/login" className="text-blue-600 hover:underline">Zaloguj</Link>
                </div>
            )}

            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full flex items-center gap-2 transition">
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {cart.length}
                    </span>
                )}
                <span className="hidden sm:inline">Koszyk</span>
            </Link>
        </div>
      </nav>
      <main className="p-4 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
