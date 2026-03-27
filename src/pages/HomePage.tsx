import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import type { Doctor } from '../types/types';

const HomePage: React.FC = () => {
    const { user, isAuthenticated } = useAuth(); 
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const navigate = useNavigate();
    const showActionBtn = !user || user.role === 'patient';

    useEffect(() => {
        apiClient('/doctors').then((data: any) => {
             if(Array.isArray(data)) setDoctors(data);
             else setDoctors([]);
        }).catch(err => {
            console.error("Failed to load doctors", err);
            setDoctors([]);
        });
    }, []);

    const handleAction = (doctorId: string) => {
        if (isAuthenticated) {
            navigate(`/dashboard/patient?bookDoctor=${doctorId}`);
        } else {
             navigate('/login');
        }
    };

    return (
        <div className="space-y-8">
            <section className="text-center bg-blue-600 text-white p-12 rounded-xl shadow-lg">
                <h1 className="text-4xl font-bold mb-4">Witaj w MedCenter {user ? `- ${user.firstName}` : ''}</h1>
                <p className="text-xl mb-6">Twoje zdrowie w najlepszych rękach. Umów wizytę online szybko i wygodnie.</p>
                {!isAuthenticated && (
                    <div className="flex justify-center gap-4">
                        <Link to="/register" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100">
                            Zarejestruj się
                        </Link>
                         <Link to="/login" className="bg-blue-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900">
                            Zaloguj się
                        </Link>
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Nasi Specjaliści</h2>
                {doctors.length === 0 ? (
                    <p className="text-gray-500 text-center animate-pulse">Ładowanie listy lekarzy...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(doc => (
                            <div key={doc.id} className="bg-white p-6 rounded-xl shadow border hover:shadow-lg transition">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                                        👨‍⚕️
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{doc.firstName} {doc.lastName}</h3>
                                        <p className="text-blue-600">{doc.specialization}</p>
                                        <div className="flex items-center gap-1 mt-1 text-sm">
                                            <span className="text-yellow-500 font-bold">★ {doc.averageRating ?? '-'}</span>
                                            <span className="text-gray-400">/ 5</span>
                                        </div>
                                    </div>
                                </div>
                                {showActionBtn && (
                                    <button 
                                        onClick={() => handleAction(doc.id)}
                                        className="w-full bg-blue-50 text-blue-700 py-2 rounded font-semibold hover:bg-blue-100 transition"
                                    >
                                        {isAuthenticated ? 'Umów wizytę' : 'Zaloguj, aby umówić'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default HomePage;
