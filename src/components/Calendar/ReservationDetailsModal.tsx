import React from 'react';
import type { Reservation } from '../../types/types';
import { useAuth } from '../../context/AuthContext';

interface ReservationDetailsModalProps {
    reservation: Reservation;
    isDoctorView: boolean;
    onClose: () => void;
    onCancel: (id: string) => void;
}

export const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({ reservation, isDoctorView, onClose, onCancel }) => {
    const { user } = useAuth();
    
    const isOwner = user?.id === reservation.patientId;
    const canCancel = isDoctorView 
        ? true 
        : (isOwner && reservation.status !== 'confirmed' && reservation.status !== 'cancelled');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm">
                <h3 className="font-bold text-lg mb-4">Szczegóły wizyty</h3>
                
                <div className="space-y-2 mb-6">
                    <p><span className="font-semibold">Data:</span> {new Date(reservation.startDateTime).toLocaleString()}</p>
                    <p><span className="font-semibold">Pacjent:</span> {reservation.patientDetails?.firstName} {reservation.patientDetails?.lastName}</p>
                    <p><span className="font-semibold">Typ:</span> {reservation.type}</p>
                    {reservation.notes && <p><span className="font-semibold">Notatka:</span> {reservation.notes}</p>}
                    <p><span className="font-semibold">Status:</span> 
                        <span className={`ml-2 px-2 py-0.5 rounded text-sm ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100'
                        }`}>
                            {reservation.status}
                        </span>
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Zamknij</button>
                    {canCancel && (
                        <button onClick={() => onCancel(reservation.id)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                             Odwołaj wizytę
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
