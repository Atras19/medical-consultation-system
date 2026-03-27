import React, { useState, useEffect } from 'react';
import type { Doctor, Reservation } from '../../types/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reservation: Reservation) => void;
    doctor: Doctor;
    startTime: Date;
    validateReservation: (start: Date, end: Date) => { valid: boolean; error?: string };
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSubmit, doctor, startTime, validateReservation }) => {
    const { user, isAuthenticated } = useAuth();
    
    const [durationSlots, setDurationSlots] = useState(1); 
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState<string>('male');
    const [age, setAge] = useState<number>(0);
    const [type, setType] = useState<Reservation['type']>('pierwsza_wizyta');
    const [notes, setNotes] = useState('');
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.firstName) setFirstName(user.firstName);
            if (user.lastName) setLastName(user.lastName);
            
            if ((user as any).gender) setGender((user as any).gender);
            
            if (user.dateOfBirth) {
                const dob = new Date(user.dateOfBirth);
                const today = new Date();
                let calculatedAge = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    calculatedAge--;
                }
                setAge(calculatedAge);
            }
        }
    }, [isAuthenticated, user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + durationSlots * 30);

        const validation = validateReservation(startTime, endTime);
        if (!validation.valid) {
            alert(validation.error || 'Wybrany termin jest niedostępny (kolizja lub brak godzin pracy lekarza).');
            return;
        }

        const newReservation: Reservation = {
            id: uuidv4(),
            doctorId: doctor.id,
            patientId: user?.id, 
            startDateTime: startTime.toISOString(),
            endDateTime: endTime.toISOString(),
            patientDetails: {
                firstName,
                lastName,
                gender: gender as 'male' | 'female' | 'other',
                age
            },
            type,
            notes,
            status: 'pending',
            documents: fileName ? [fileName] : [] 
        };

        onSubmit(newReservation);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Rezerwacja wizyty: {doctor.firstName} {doctor.lastName}</h2>
                <div className="mb-4">
                    <p className="font-semibold">Start: {startTime.toLocaleString()}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Czas trwania (sloty 30min)</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="4" 
                            value={durationSlots} 
                            onChange={e => setDurationSlots(Number(e.target.value))}
                            className="w-full border rounded p-2"
                        />
                        <p className="text-xs text-gray-500">Wolne sloty muszą być dostępne.</p>
                    </div>

                    <div>
                         <label className="block text-sm font-medium">Przewidywany koszt</label>
                         <div className="bg-blue-50 p-2 rounded text-blue-800 font-bold text-center border border-blue-200">
                             {durationSlots * 150} PLN
                             <span className="block text-xs font-normal text-blue-600">(150 PLN / 30 min)</span>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium">Imię</label>
                            <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Nazwisko</label>
                            <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border rounded p-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className="block text-sm font-medium">Płeć</label>
                            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border rounded p-2">
                                <option value="male">Mężczyzna</option>
                                <option value="female">Kobieta</option>
                                <option value="other">Inna</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Wiek</label>
                            <input required type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="w-full border rounded p-2" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Typ wizyty</label>
                        <select value={type} onChange={e => setType(e.target.value as Reservation['type'])} className="w-full border rounded p-2">
                            <option value="pierwsza_wizyta">Pierwsza wizyta</option>
                            <option value="kontrolna">Wizyta kontrolna</option>
                            <option value="choroba_przewlekla">Choroba przewlekła</option>
                            <option value="recepta">Recepta</option>
                            <option value="inne">Inne</option>
                        </select>
                    </div>

                    <div>
                         <label className="block text-sm font-medium">Informacje dla lekarza</label>
                         <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Dokumenty (symulacja)</label>
                        <input 
                            type="file" 
                            className="w-full text-sm text-gray-500" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setFileName(e.target.files[0].name);
                                }
                            }}
                        /> 
                        {fileName && <p className="text-xs text-green-600 mt-1">Wybrano: {fileName}</p>}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Anuluj</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Dodaj do koszyka</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
