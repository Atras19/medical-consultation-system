import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ email, password });
            navigate('/');
        } catch (err: any) {
            let msg = err.message || 'Login failed';
            if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('nieprawidłowy')) {
                msg = 'Email lub hasło są nieprawidłowe';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Logowanie</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full border p-2 rounded focus:ring focus:ring-blue-200"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hasło</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full border p-2 rounded focus:ring focus:ring-blue-200"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
                    >
                        {loading ? 'Logowanie...' : 'Zaloguj się'}
                    </button>
                    <p className="text-center text-sm">
                        Nie masz konta? <a href="/register" className="text-blue-600 hover:underline">Zarejestruj się</a>
                    </p>
                    <p className="text-center text-xs text-gray-500 mt-4">
                        Demo: admin@med.pl / 12345 (Admin)<br/>
                        doc@med.pl / 12345 (Lekarz)<br/>
                        jan@kowalski.pl / 12345 (Pacjent)
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
