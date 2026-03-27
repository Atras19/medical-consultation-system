import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import type { User, Comment } from '../types/types';

const AdminDashboard: React.FC = () => {
    const { user, setPersistenceMode, persistenceMode, loading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [refresh, setRefresh] = useState(0);

    const [showRegisterDoctor, setShowRegisterDoctor] = useState(false);
    const [newDoctor, setNewDoctor] = useState({ 
        firstName: '', lastName: '', email: '', password: '', 
        specialization: '' 
    });

    useEffect(() => {
        if (loading || !user) return;
        
        const fetchData = async () => {
             try {
                 const [usersData, commentsData] = await Promise.all([
                     apiClient('/users'),
                     apiClient('/comments')
                 ]);
                 setUsers(usersData);
                 setComments(Array.isArray(commentsData) ? commentsData : []);
             } catch(e) {
                 console.error(e);
             }
        };
        fetchData();
    }, [refresh, user, loading]);

    if (loading) return <div className="p-10 text-center">Ładowanie panelu administratora...</div>;
    if (!user || user.role !== 'admin') return <div>Access Denied</div>;

    const handlePersistenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPersistenceMode(e.target.value as any);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
        try {
            await apiClient(`/users/${userId}`, { method: 'DELETE' });
            setRefresh(prev => prev + 1);
        } catch(e: any) { alert(e.message); }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Usunąć ten komentarz?')) return;
        try {
            await apiClient(`/comments/${commentId}`, { method: 'DELETE' });
            setRefresh(prev => prev + 1);
        } catch(e: any) { alert(e.message); }
    };

    const toggleBan = async (targetUser: User) => {
        try {
            const action = targetUser.isBanned ? 'unban' : 'ban';
            await apiClient(`/users/${targetUser.id}/${action}`, { method: 'PATCH' });
            setRefresh(prev => prev + 1);
        } catch(e: any) {
            alert(e.message);
        }
    };

    const handleRegisterDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {   
            await apiClient('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    ...newDoctor,
                    role: 'doctor' 
                })
            });
            alert('Lekarz zarejestrowany pomyślnie');
            setShowRegisterDoctor(false);
            setNewDoctor({ firstName: '', lastName: '', email: '', password: '', specialization: '' });
            setRefresh(prev => prev + 1);
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (!user || user.role !== 'admin') return <div>Access Denied</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Panel Administratora</h1>
                
                <div className="flex flex-col md:flex-row gap-4">
                     <button
                        onClick={() => setShowRegisterDoctor(!showRegisterDoctor)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
                    >
                        {showRegisterDoctor ? 'Anuluj Rejestrację' : 'Dodaj Lekarza'}
                    </button>

                    <div className="bg-white px-3 py-2 rounded-lg shadow border border-gray-200 flex flex-col">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sesja</span>
                        <select 
                            value={persistenceMode} 
                            onChange={handlePersistenceChange}
                            className="bg-transparent text-sm font-semibold outline-none cursor-pointer"
                        >
                            <option value="SESSION">Local Storage (Trwała)</option>
                            <option value="LOCAL">Session Storage (Karta)</option>
                            <option value="NONE">Brak (Tylko pamięć)</option>
                        </select>
                    </div>
                </div>
            </div>

            {showRegisterDoctor && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow border border-blue-100">
                    <h2 className="text-lg font-bold mb-4 text-blue-800">Rejestracja Nowego Lekarza</h2>
                    <form onSubmit={handleRegisterDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required placeholder="Imie" value={newDoctor.firstName} onChange={e => setNewDoctor({...newDoctor, firstName: e.target.value})} className="border p-2 rounded" />
                        <input required placeholder="Nazwisko" value={newDoctor.lastName} onChange={e => setNewDoctor({...newDoctor, lastName: e.target.value})} className="border p-2 rounded" />
                        <input required type="email" placeholder="Email" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} className="border p-2 rounded" />
                        <input required type="password" placeholder="Hasło" value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})} className="border p-2 rounded" />
                        <input required placeholder="Specjalizacja" value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} className="border p-2 rounded col-span-2" />
                        <div className="col-span-2">
                             <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 w-full">Zarejestruj Lekarza</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden border mb-10">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Użytkownik</th>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Rola</th>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Email</th>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Status</th>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                                <td className="p-4 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                                <td className="p-4 text-gray-600">{u.role}</td>
                                <td className="p-4 text-gray-600">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {u.isBanned ? 'Zablokowany' : 'Aktywny'}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    {u.role !== 'admin' && (
                                        <>
                                            {u.role === 'patient' && (
                                                <button 
                                                    onClick={() => toggleBan(u)}
                                                    className={`px-3 py-1 rounded text-sm font-bold text-white transition shadow-sm ${
                                                        u.isBanned ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'
                                                    }`}
                                                >
                                                    {u.isBanned ? 'Odblokuj' : 'Zablokuj'}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="px-3 py-1 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                                            >
                                                Usuń
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Brak użytkowników do wyświetlenia.
                    </div>
                )}
            </div>

            <h2 className="text-xl font-bold mb-4 text-gray-800">Zarządzanie Komentarzami</h2>
            <div className="bg-white rounded-xl shadow overflow-hidden border">
                <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Autor</th>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Ocena</th>
                            <th className="p-4 text-sm font-bold text-gray-500 w-1/2 uppercase">Treść</th>
                            <th className="p-4 text-sm font-bold text-gray-500 uppercase">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-bold">{c.authorName}</td>
                                <td className="p-4 text-yellow-500 font-bold">{c.rating} ★</td>
                                <td className="p-4 italic text-gray-600">"{c.content}"</td>
                                <td className="p-4">
                                     <button 
                                        onClick={() => handleDeleteComment(c.id)}
                                        className="px-3 py-1 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                                    >
                                        Usuń
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {comments.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Brak komentarzy
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;