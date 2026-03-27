import React, { useState, useEffect } from 'react';
import { CalendarGrid } from '../components/Calendar/CalendarGrid';
import { consultationsService } from '../services/consultationsServices';
import { useCart } from '../context/CartContext';
import type { Doctor, Availability, Absence, Reservation } from '../types/types';

const CalendarPage: React.FC = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const { cart } = useCart();
    
    const [doctor, setDoctor] = useState<Doctor | undefined>(undefined);
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [dbReservations, setDbReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        consultationsService.getDoctors().then(docs => {
            setDoctors(docs);
            if (docs.length > 0) setSelectedDoctorId(docs[0].id);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedDoctorId) return;

        setLoading(true);
        const fetchData = async () => {
            try {
                const doc = doctors.find(d => d.id === selectedDoctorId); 
                setDoctor(doc);

                const [avs, abs, res] = await Promise.all([
                    consultationsService.getAvailabilities(selectedDoctorId),
                    consultationsService.getAbsences(selectedDoctorId),
                    consultationsService.getReservations(selectedDoctorId)
                ]);

                setAvailabilities(avs);
                setAbsences(abs);
                setDbReservations(res);
            } catch (error) {
                console.error("Failed to load calendar data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDoctorId, doctors]);

    if (!selectedDoctorId && loading) return <div>Loading...</div>;
    
    const cartReservations = cart.filter(r => r.doctorId === selectedDoctorId);
    const allReservations = [...dbReservations, ...cartReservations];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kalendarz Wizyt</h1>
                    <p className="text-gray-500">Wybierz lekarza i zarezerwuj termin</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz specjalistę</label>
                    <select 
                        value={selectedDoctorId} 
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.firstName} {d.lastName} ({d.specialization})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            {loading || !doctor ? (
                 <div className="h-96 flex items-center justify-center bg-white text-gray-400">Loading Calendar...</div>
            ) : (
                <CalendarGrid 
                    doctor={doctor}
                    availabilities={availabilities}
                    absences={absences}
                    reservations={allReservations}
                    isDoctorView={false}
                />
            )}
        </div>
    );
};

export default CalendarPage;
