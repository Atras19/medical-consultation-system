import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
    const { registerUser } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: 'male',
        dateOfBirth: ''
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
             await registerUser({ ...formData, role: 'patient' });
             alert('Rejestracja pomyślna! Możesz się teraz zalogować.');
             navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 py-10">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-green-800">Rejestracja Pacjenta</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium">Imię</label>
                            <input required name="firstName" onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Nazwisko</label>
                            <input required name="lastName" onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input type="email" required name="email" onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Hasło</label>
                        <input type="password" required name="password" onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium">Płeć</label>
                            <select name="gender" onChange={handleChange} className="w-full border p-2 rounded">
                                <option value="male">Mężczyzna</option>
                                <option value="female">Kobieta</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Data Urodzenia</label>
                            <input type="date" required name="dateOfBirth" max={new Date().toISOString().split('T')[0]} onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition disabled:bg-green-300"
                    >
                        {loading ? 'Rejestrowanie...' : 'Zarejestruj'}
                    </button>
                    <p className="text-center text-sm">
                        Masz już konto? <a href="/login" className="text-green-600 hover:underline">Zaloguj się</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
