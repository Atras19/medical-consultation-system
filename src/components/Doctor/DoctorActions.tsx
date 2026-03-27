import React, { useState } from 'react';
import { consultationsService } from '../../services/consultationsServices';
import type { Availability, Absence } from '../../types/types';
import { v4 as uuidv4 } from 'uuid';

interface DoctorActionsProps {
    doctorId: string;
    onUpdate: () => void;
}

export const DoctorActions: React.FC<DoctorActionsProps> = ({ doctorId, onUpdate }) => {
    const [tab, setTab] = useState<'availability' | 'absence'>('availability');

    const [isCyclic, setIsCyclic] = useState(true);
    const [date, setDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [daysMask, setDaysMask] = useState<number[]>([]); 
    
    const [intervals, setIntervals] = useState<{start: string, end: string}[]>([{start: '08:00', end: '16:00'}]);

    const [absenceDate, setAbsenceDate] = useState('');

    const toggleDay = (day: number) => {
        setDaysMask(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const addInterval = () => setIntervals([...intervals, {start: '08:00', end: '16:00'}]);
    const removeInterval = (index: number) => setIntervals(intervals.filter((_, i) => i !== index));
    const updateInterval = (index: number, field: 'start' | 'end', value: string) => {
        const newIntervals = [...intervals];
        newIntervals[index] = { ...newIntervals[index], [field]: value };
        setIntervals(newIntervals);
    };

    const handleAddAvailability = async (e: React.FormEvent) => {
        e.preventDefault();
        
        await Promise.all(intervals.map(interval => {
             const newAv: Availability = {
                id: uuidv4(),
                doctorId,
                isCyclic,
                startTime: interval.start,
                endTime: interval.end,
                ...(isCyclic ? { startDate, endDate, daysOfWeek: daysMask } : { date })
            };
            return consultationsService.addAvailability(newAv);
        }));
        
        alert('Dostępność (wszystkie przedziały) została dodana');
        onUpdate();
    };

    const handleAddAbsence = async (e: React.FormEvent) => {
        e.preventDefault();
        const newAbsence: Absence = {
            id: uuidv4(),
            doctorId,
            date: absenceDate,
            reason: 'Urlop/Inne'
        };

        await consultationsService.addAbsence(newAbsence);
        alert('Nieobecność dodana. Konfliktowe wizyty zostały anulowane (zobacz konsolę).');
        onUpdate();
    };

    return (
        <div className="bg-white p-4 rounded shadow-sm border">
            <h2 className="text-lg font-bold mb-4">Zarządzanie terminami</h2>
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setTab('availability')} 
                    className={`px-3 py-1 rounded ${tab === 'availability' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                    Definiuj Dostępność
                </button>
                <button 
                    onClick={() => setTab('absence')} 
                    className={`px-3 py-1 rounded ${tab === 'absence' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                >
                    Dodaj Nieobecność
                </button>
            </div>

            {tab === 'availability' && (
                <form onSubmit={handleAddAvailability} className="space-y-3">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={isCyclic} onChange={() => setIsCyclic(true)} />
                            Cykliczna
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={!isCyclic} onChange={() => setIsCyclic(false)} />
                            Jednorazowa
                        </label>
                    </div>

                    {isCyclic ? (
                        <>
                             <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold">Od</label>
                                    <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold">Do</label>
                                    <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-1" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Dni tygodnia</label>
                                <div className="flex gap-2">
                                    {[
                                        { val: 1, label: 'Pn' },
                                        { val: 2, label: 'Wt' },
                                        { val: 3, label: 'Śr' },
                                        { val: 4, label: 'Cz' },
                                        { val: 5, label: 'Pt' },
                                        { val: 6, label: 'So' },
                                        { val: 0, label: 'Nd' } 
                                    ].map((dayObj) => (
                                        <button
                                            key={dayObj.val}
                                            type="button"
                                            onClick={() => toggleDay(dayObj.val)}
                                            className={`w-8 h-8 rounded-full text-xs font-bold ${
                                                daysMask.includes(dayObj.val) 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-200'
                                            }`}
                                        >
                                            {dayObj.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold">Data</label>
                            <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-1" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-xs font-bold">Godziny przyjęć (możesz dodać kilka przerw)</label>
                        {intervals.map((interval, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input 
                                    required 
                                    type="time" 
                                    value={interval.start} 
                                    onChange={e => updateInterval(idx, 'start', e.target.value)} 
                                    className="border p-1 w-24" 
                                />
                                <span>-</span>
                                <input 
                                    required 
                                    type="time" 
                                    value={interval.end} 
                                    onChange={e => updateInterval(idx, 'end', e.target.value)} 
                                    className="border p-1 w-24" 
                                />
                                {intervals.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeInterval(idx)}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        Usuń
                                    </button>
                                )}
                            </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={addInterval}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            + Dodaj kolejny przedział
                        </button>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Zapisz dostępność</button>
                </form>
            )}

            {tab === 'absence' && (
                <form onSubmit={handleAddAbsence} className="space-y-4">
                    <p className="text-sm text-gray-600">Dodanie nieobecności spowoduje automatyczne anulowanie wizyt w danym dniu.</p>
                     <div>
                        <label className="block text-xs font-bold">Data nieobecności (cały dzień)</label>
                        <input required type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} className="w-full border p-1" />
                    </div>
                    <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">Dodaj nieobecność</button>
                </form>
            )}
        </div>
    );
};
