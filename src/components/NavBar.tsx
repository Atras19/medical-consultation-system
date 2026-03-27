import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

export const NavBar: React.FC = () => {
    const { user, logout, role } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket.connected) socket.connect();
        return () => { 
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const roleNames: { [key: string]: string } = {
        patient: 'Pacjent',
        doctor: 'Lekarz',
        admin: 'Administrator'
    };

    return (
        <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <Link to="/" className="text-xl font-bold text-blue-800">MedCenter</Link>
                
                {role === 'patient' && (
                    <>
                        <Link to="/dashboard/patient" className="text-gray-600 hover:text-blue-600">Pulpit Pacjenta</Link>
                        <Link to="/cart" className="text-gray-600 hover:text-blue-600 font-bold">Koszyk</Link>
                    </>
                )}
                 {role === 'doctor' && (
                    <Link to="/dashboard/doctor" className="text-gray-600 hover:text-blue-600">Pulpit Lekarza</Link>
                )}
                 {role === 'admin' && (
                    <Link to="/dashboard/admin" className="text-gray-600 hover:text-blue-600">Panel Admina</Link>
                )}
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <span className="text-sm font-semibold">
                            {user.firstName} {user.lastName} <span className="text-gray-400 font-normal">({roleNames[role] || role})</span>
                        </span>
                        <button onClick={handleLogout} className="text-red-600 hover:text-red-800 text-sm">
                            Wyloguj
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="text-blue-600 hover:text-blue-800">Logowanie</Link>
                        <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Rejestracja</Link>
                    </>
                )}
            </div>
        </nav>
    );
};
