import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultationsService } from '../services/consultationsServices';
import type { Reservation, Doctor } from '../types/types';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { CalendarGrid } from '../components/Calendar/CalendarGrid'; 
import { useCart } from '../context/CartContext';
import { socket } from '../services/socket';


const PatientDashboard: React.FC = () => {
    const { user } = useAuth();
    const { removeLocalOnly } = useCart();
    const [searchParams] = useSearchParams();
    const [myReservations, setMyReservations] = useState<Reservation[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [commentContent, setCommentContent] = useState('');
    const [rating, setRating] = useState(5);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
    
    const [viewMode, setViewMode] = useState<'dashboard' | 'booking'>('dashboard');
    const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        
        const refresh = () => {
             consultationsService.getPatientReservations(user.id).then(setMyReservations);
        };

        socket.on('reservation_new', refresh); 
        socket.on('reservation_update', refresh);
        socket.on('reservation_cancelled', refresh);

        return () => { 
            socket.off('reservation_new', refresh);
            socket.off('reservation_update', refresh);
            socket.off('reservation_cancelled', refresh);
        };
    }, [user]);

    useEffect(() => {
        if (!user) return;
        
        const bookDocParam = searchParams.get('bookDoctor');
        if (bookDocParam) {
            setViewMode('booking');
            setBookingDoctorId(bookDocParam);
        }

        consultationsService.getPatientReservations(user.id).then(setMyReservations); 
        consultationsService.getDoctors().then(setDoctors);
    }, [user, searchParams]);

    const handleStartBooking = () => {
        setViewMode('booking');
        setBookingDoctorId(null); 
    };
    
    const bookingDoctor = doctors.find(d => d.id === bookingDoctorId);

    const visitedDoctorIds = Array.from(new Set(myReservations
        .filter(r => r.status === 'confirmed' || r.status === 'completed')
        .map(r => r.doctorId)));

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctorId) return;
        try {
            await apiClient('/comments', {
                method: 'POST',
                body: JSON.stringify({
                    doctorId: selectedDoctorId,
                    content: commentContent,
                    rating: Number(rating)
                })
            });
            alert('Opinia została dodana pomyślnie!');
            setCommentContent('');
            setSelectedDoctorId(null);
        } catch (err: any) {
            let msg = err.message || '';
            let userMessage = 'Wystąpił nieoczekiwany błąd.';

            if (msg.includes('already rated') || msg.includes('Conflict')) {
                userMessage = 'Już wystawiłeś opinię temu lekarzowi.';
            } else if (msg.includes('patients who had a visit')) {
                userMessage = 'Możesz ocenić lekarza tylko po odbyciu wizyty.';
            } else if (msg.includes('zablokowane') || msg.includes('banned')) {
                userMessage = 'Twoje konto jest zablokowane. Nie możesz dodawać opinii.';
            } else if (msg.includes('Forbidden')) {
                userMessage = 'Nie masz uprawnień do wykonania tej operacji.';
            } else {
                userMessage = msg.replace(/HTTP Error \d+: /, '');
            }
            
            alert(userMessage);
        }
    };

    if (!user) return null;

    if (viewMode === 'booking') {
        return (
            <div className="p-4 space-y-6">
                 <button onClick={() => setViewMode('dashboard')} className="text-blue-600 hover:underline mb-4">
                    &larr; Powrót do pulpitu
                </button>
                
                {bookingDoctorId && bookingDoctor ? (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Umów wizytę: {bookingDoctor.firstName} {bookingDoctor.lastName}</h2>
                        <div className="bg-white p-4 rounded shadow h-[700px]">
                             <BookingCalendarWrapper doctorId={bookingDoctorId} />
                        </div>
                    </div>
                ) : (
                    <div>
                         <h2 className="text-2xl font-bold mb-6">Wybierz lekarza</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {doctors.map(doc => (
                                <div key={doc.id} className="bg-white p-6 rounded-xl shadow border hover:shadow-lg transition">
                                    <h3 className="font-bold text-lg">{doc.firstName} {doc.lastName}</h3>
                                    <p className="text-blue-600 mb-4">{doc.specialization}</p>
                                    <button 
                                        onClick={() => setBookingDoctorId(doc.id)}
                                        className="w-full bg-blue-50 text-blue-700 py-2 rounded font-semibold hover:bg-blue-100"
                                    >
                                        Wybierz
                                    </button>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Witaj, {user.firstName}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Moje Wizyty</h2>
                    {myReservations.length === 0 ? <p className="text-gray-500">Brak wizyt.</p> : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {myReservations.map(res => {
                                const doc = doctors.find(d => d.id === res.doctorId);
                                return (
                                    <div key={res.id} className="border p-4 rounded flex justify-between items-center bg-gray-50">
                                        <div>
                                            <p className="font-bold">{doc?.firstName} {doc?.lastName}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(res.startDateTime).toLocaleDateString()} {new Date(res.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(res.endDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{res.notes}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                res.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                res.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {res.status === 'confirmed' ? 'Potwierdzona' : 
                                                 res.status === 'completed' ? 'Zakończona' :
                                                 res.status === 'pending' ? 'Oczekuje na płatność' : 'Anulowana'}
                                            </span>
                                            
                                            {res.status === 'pending' && (
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={async () => {
                                                             if(!confirm('Czy na pewno chcesz opłacić i potwierdzić wizytę?')) return;
                                                             try {
                                                                 await consultationsService.updateReservationStatus(res.id, 'confirmed');
                                                                 removeLocalOnly(res.id);
                                                                 consultationsService.getPatientReservations(user.id).then(setMyReservations);
                                                             } catch(e: any) { alert(e.message); }
                                                        }}
                                                        className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700"
                                                    >
                                                        Opłać
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                             if(!confirm('Anulować wizytę?')) return;
                                                             try {
                                                                 await consultationsService.cancelReservation(res.id);
                                                                 removeLocalOnly(res.id);
                                                                 consultationsService.getPatientReservations(user.id).then(setMyReservations);
                                                             } catch(e: any) { alert(e.message); }
                                                        }}
                                                        className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded hover:bg-red-200"
                                                    >
                                                        Odwołaj
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-6 pt-4 border-t">
                        <button onClick={handleStartBooking} className="w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                             + Umów nową wizytę
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Oceń Lekarza</h2>
                     <p className="text-sm text-gray-500 mb-4">Możesz ocenić tylko lekarzy, u których odbyłeś wizytę.</p>
                    
                    <form onSubmit={handleAddComment}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Wybierz lekarza</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={selectedDoctorId || ''}
                                onChange={e => setSelectedDoctorId(e.target.value)}
                                required
                            >
                                <option value="">-- Wybierz --</option>
                                {doctors.filter(d => visitedDoctorIds.includes(d.id)).map(d => (
                                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Ocena</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                             <textarea 
                                className="w-full border p-2 rounded h-24"
                                placeholder="Twój komentarz..."
                                value={commentContent}
                                onChange={e => setCommentContent(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
                            Wyślij opinię
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const BookingCalendarWrapper = ({ doctorId }: { doctorId: string }) => {
    const [data, setData] = useState<any>({ availabilities: [], absences: [], reservations: [], doctor: null });
    const [refreshTrigger, setRefreshTrigger] = useState(0); 

    useEffect(() => {
        const load = async () => {
             const [doc, av, ab, res] = await Promise.all([
                consultationsService.getDoctor(doctorId),
                consultationsService.getAvailabilities(doctorId),
                consultationsService.getAbsences(doctorId),
                consultationsService.getReservations(doctorId)
             ]);
             setData({ doctor: doc, availabilities: av, absences: ab, reservations: res });
        };
        load();
    }, [doctorId, refreshTrigger]);

    if (!data.doctor) return <div>Ładowanie grafiku...</div>;

    return (
         <CalendarGrid 
            doctor={data.doctor}
            availabilities={data.availabilities}
            absences={data.absences}
            reservations={data.reservations}
            isDoctorView={false} 
            onRefresh={() => setRefreshTrigger(prev => prev + 1)} 
        />
    );
};

export default PatientDashboard;
