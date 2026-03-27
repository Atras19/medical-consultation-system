import React, { useEffect, useState } from 'react';
import { CalendarGrid } from '../components/Calendar/CalendarGrid';
import { consultationsService } from '../services/consultationsServices';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import type { Doctor, Availability, Absence, Reservation, Comment } from '../types/types';
import { apiClient } from '../services/apiClient';

const DoctorPublicPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    
    const [doctor, setDoctor] = useState<Doctor | undefined>(undefined);
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    
    const [refreshVer, setRefreshVer] = useState(0);

    const refresh = () => setRefreshVer(v => v + 1);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
             const [d, av, ab, res] = await Promise.all([
                 consultationsService.getDoctor(id),
                 consultationsService.getAvailabilities(id),
                 consultationsService.getAbsences(id),
                 consultationsService.getReservations(id)
             ]);
             setDoctor(d);
             setAvailabilities(av);
             setAbsences(ab);
             setReservations(res);
             
             apiClient(`/comments/${id}`).then(setComments).catch(console.error);
        };
        fetchData();
    }, [id, refreshVer]);

    if (!doctor) return <div>Loading...</div>;

    const averageRating = comments.length > 0
        ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
        : '-';

    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded shadow mb-6 flex justify-between items-start">
               <div>
                   <h1 className="text-3xl font-bold">{doctor.firstName} {doctor.lastName}</h1>
                   <p className="text-xl text-blue-600">{doctor.specialization}</p>
                   <div className="flex items-center text-yellow-500 mt-2">
                       <span className="font-bold text-xl mr-2">{averageRating} ★</span>
                       <span className="text-gray-500">({comments.length} opinii)</span>
                   </div>
               </div>
               
               <div className="w-1/3">
                   <h3 className="font-bold mb-2">Ostatnie opinie:</h3>
                   <div className="space-y-2 max-h-32 overflow-y-auto">
                       {comments.slice(0, 3).map(c => (
                           <div key={c.id} className="text-sm border-b pb-1">
                               <div className="flex justify-between">
                                   <span className="font-bold">{c.authorName}</span>
                                   <span className="text-yellow-500">{c.rating}★</span>
                               </div>
                               <p className="text-gray-600 italic">{c.content}</p>
                           </div>
                       ))}
                   </div>
               </div>
            </div>

            <CalendarGrid 
                doctor={doctor}
                availabilities={availabilities}
                absences={absences}
                reservations={reservations}
                isDoctorView={false} 
                onRefresh={refresh}
            />
        </div>
    );
};

export default DoctorPublicPage;
