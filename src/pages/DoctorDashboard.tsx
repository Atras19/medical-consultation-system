import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalendarGrid } from '../components/Calendar/CalendarGrid';
import { consultationsService } from '../services/consultationsServices';
import { apiClient } from '../services/apiClient';
import type { Availability, Absence, Reservation, Doctor, Comment } from '../types/types';

const DoctorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    
    const [isCyclic, setIsCyclic] = useState(false);
    const [date, setDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([
        { startTime: '08:00', endTime: '16:00' }
    ]);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);

    const [newAbsence, setNewAbsence] = useState({ date: '', reason: '' });

    const refreshData = async () => {
        if (!user) return;
        try {
            const doc = await consultationsService.getDoctor(user.id);
            if(doc) setDoctor(doc);
            
            const [av, ab, res, coms] = await Promise.all([
                consultationsService.getAvailabilities(user.id),
                consultationsService.getAbsences(user.id),
                consultationsService.getReservations(user.id),
                consultationsService.getComments(user.id)
            ]);
            setAvailabilities(av);
            setAbsences(ab);
            setReservations(res);
            setComments(coms || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    const handleReply = async (commentId: string) => {
        try {
            const reply = replyText[commentId];
            if (!reply) return;
            
            await apiClient(`/comments/${commentId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ reply })
            });
            
            alert('Odpowiedź dodana');
            refreshData();
            setReplyText(prev => ({ ...prev, [commentId]: '' }));
        } catch(e: any) { alert(e.message); }
    };

    const handleAddAvailability = async (e: React.FormEvent) => {
        e.preventDefault();

        const invalidSlot = slots.find(slot => 
            slot.startTime < "08:00" || slot.startTime > "20:00" ||
            slot.endTime < "08:00" || slot.endTime > "20:00"
        );

        if (invalidSlot) {
            alert("Godziny przyjęć muszą mieścić się w przedziale 08:00 - 20:00.");
            return;
        }

        try {
            const payload: any = {
                doctorId: user!.id,
                isCyclic,
                slots 
            };

            if (isCyclic) {
                if (selectedDays.length === 0 || !startDate || !endDate) {
                    alert('Wypełnij daty start/koniec i wybierz dni tygodnia');
                    return;
                }
                payload.startDate = startDate;
                payload.endDate = endDate;
                payload.daysOfWeek = selectedDays;
            } else {
                if (!date) {
                    alert('Wybierz datę');
                    return;
                }
                payload.date = date;
                payload.startDate = date; 
                payload.endDate = date;
                payload.daysOfWeek = []; 
            }

            await consultationsService.addAvailability(payload);
            refreshData();
            alert('Dostępność uaktualniona');
        } catch (e: any) { alert(e.message); }
    };

    const toggleDay = (day: number) => {
        setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };
    
    const updateSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setSlots(newSlots);
    };

    const addSlot = () => {
        setSlots([...slots, { startTime: '08:00', endTime: '16:00' }]);
    };

    const removeSlot = (index: number) => {
        if (slots.length > 1) {
             setSlots(slots.filter((_, i) => i !== index));
        }
    };

    const handleAddAbsence = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await consultationsService.addAbsence({
                ...newAbsence,
                doctorId: user!.id,
                id: '' 
            });
            refreshData();
            alert('Nieobecność zgłoszona');
        } catch (e: any) { alert(e.message); }
    };

    if (!user || user.role !== 'doctor') return <div>Access Denied</div>;

    const daysMap = [
        { id: 1, label: 'Pon' }, { id: 2, label: 'Wt' }, { id: 3, label: 'Śr' },
        { id: 4, label: 'Czw' }, { id: 5, label: 'Pt' }, { id: 6, label: 'Sob' }, { id: 0, label: 'Ndz' }
    ];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel Lekarza</h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
                
                <div className="xl:col-span-1 space-y-6 flex flex-col h-[750px]">
                    
                    <div className="bg-white p-5 rounded-xl shadow border flex-1 overflow-auto">
                        <h3 className="font-bold mb-4 text-blue-700 flex items-center gap-2">
                             📅 Zarządzaj Grafikiem
                        </h3>
                        <form onSubmit={handleAddAvailability} className="space-y-4">
                            
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCyclic(false)}
                                    className={`flex-1 py-1 text-sm rounded-md transition ${!isCyclic ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                >
                                    Pojedynczy
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsCyclic(true)}
                                    className={`flex-1 py-1 text-sm rounded-md transition ${isCyclic ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                >
                                    Cykliczny
                                </button>
                            </div>

                            {!isCyclic ? (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">Data</label>
                                    <input 
                                        type="date" 
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                     <div className="grid grid-cols-2 gap-2">
                                         <div>
                                            <label className="text-xs font-semibold text-gray-500">Od</label>
                                            <input type="date" className="w-full border p-1 rounded text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                         </div>
                                         <div>
                                            <label className="text-xs font-semibold text-gray-500">Do</label>
                                            <input type="date" className="w-full border p-1 rounded text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                         </div>
                                     </div>
                                     <div>
                                         <label className="text-xs font-semibold text-gray-500 mb-1 block">Dni tygodnia</label>
                                         <div className="flex flex-wrap gap-1">
                                              {daysMap.map(d => (
                                                  <button
                                                      key={d.id}
                                                      type="button"
                                                      onClick={() => toggleDay(d.id)}
                                                      className={`w-8 h-8 rounded text-xs font-bold transition ${
                                                          selectedDays.includes(d.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                      }`}
                                                  >
                                                      {d.label}
                                                  </button>
                                              ))}
                                         </div>
                                     </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-2 border-t">
                                <label className="text-xs font-semibold text-gray-500 mb-2 block">Godziny przyjęć:</label>
                                {slots.map((slot, index) => (
                                    <div key={index} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-400 block">Start</label>
                                            <input 
                                                type="time" 
                                                min="08:00"
                                                max="20:00"
                                                value={slot.startTime} 
                                                onChange={e => updateSlot(index, 'startTime', e.target.value)} 
                                                className="w-full border p-1 rounded text-sm" 
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-400 block">Koniec</label>
                                            <input 
                                                type="time" 
                                                min="08:00"
                                                max="20:00"
                                                value={slot.endTime} 
                                                onChange={e => updateSlot(index, 'endTime', e.target.value)} 
                                                className="w-full border p-1 rounded text-sm" 
                                            />
                                        </div>
                                        {slots.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeSlot(index)}
                                                className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200 h-8 w-8 flex items-center justify-center font-bold"
                                                title="Usuń przedział"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                <button 
                                    type="button" 
                                    onClick={addSlot}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mt-2"
                                >
                                    + Dodaj przedział czasowy
                                </button>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition shadow-sm mt-4">
                                Zapisz Grafik
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow border border-red-100">
                        <h3 className="font-bold mb-4 text-red-700 flex items-center gap-2">
                             🚫 Zgłoś Nieobecność
                        </h3>
                        <form onSubmit={handleAddAbsence} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Data</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-red-300"
                                    value={newAbsence.date}
                                    onChange={e => setNewAbsence({...newAbsence, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Powód</label>
                                <input 
                                    type="text" 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-red-300"
                                    placeholder="Np. Urlop, Choroba"
                                    value={newAbsence.reason}
                                    onChange={e => setNewAbsence({...newAbsence, reason: e.target.value})}
                                />
                            </div>
                            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold transition shadow-sm">
                                Zgłoś Nieobecność
                            </button>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-3 h-[750px] bg-white p-4 rounded-xl shadow border">
                     {doctor ? (
                         <CalendarGrid 
                            doctor={doctor}
                            availabilities={availabilities}
                            absences={absences}
                            reservations={reservations}
                            isDoctorView={true}
                            onRefresh={refreshData}
                        />
                      ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                              Ładowanie danych kalendarza...
                          </div>
                      )}
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow border border-yellow-100 overflow-y-auto max-h-[400px]">
                <h3 className="font-bold mb-4 text-yellow-700 flex items-center gap-2">
                     💬 Opinie Pacjentów
                </h3>
                {comments.length === 0 ? <p className="text-sm text-gray-500">Brak opinii.</p> : (
                    <div className="space-y-4">
                        {comments.map(c => (
                            <div key={c.id} className="border-b pb-2 last:border-0">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm">{c.authorName}</span>
                                    <span className="text-yellow-500 font-bold">★ {c.rating}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 italic">"{c.content}"</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(c.date).toLocaleDateString()}</p>
                                
                                {c.reply ? (
                                    <div className="bg-gray-100 p-2 mt-2 rounded text-xs">
                                        <span className="font-bold text-blue-600">Ty:</span> {c.reply}
                                    </div>
                                ) : (
                                    <div className="mt-2 flex gap-2">
                                        <input 
                                            className="border text-xs p-1 flex-1 rounded" 
                                            placeholder="Odpowiedz..." 
                                            value={replyText[c.id] || ''}
                                            onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        />
                                        <button 
                                            onClick={() => handleReply(c.id)}
                                            className="bg-blue-600 text-white text-xs px-2 rounded"
                                        >
                                            OK
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorDashboard;