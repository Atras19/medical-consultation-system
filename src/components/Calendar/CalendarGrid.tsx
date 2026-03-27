import React, { useState, useEffect } from 'react';
import { 
  addDays, 
  startOfWeek, 
  startOfDay,
  format, 
  isSameDay, 
  differenceInMinutes,
  isBefore,
  isAfter,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, User, AlertCircle } from 'lucide-react';
import type { Doctor, Reservation, Availability, Absence } from '../../types/types';
import { isSlotAvailable } from '../../utils/calendarUtils';
import { ReservationModal } from './ReservationModal';
import { ReservationDetailsModal } from './ReservationDetailsModal';
import { consultationsService } from '../../services/consultationsServices';
import { pl } from 'date-fns/locale';
import { useCart } from '../../context/CartContext';

interface CalendarGridProps {
    doctor: Doctor;
    availabilities: Availability[];
    absences: Absence[];
    reservations: Reservation[];
    isDoctorView?: boolean;
    onRefresh?: () => void;
}

const START_HOUR = 8;
const END_HOUR = 20; 
const SLOT_DURATION = 30;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * (60 / SLOT_DURATION);

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
    doctor, availabilities, absences, reservations, isDoctorView = false, onRefresh
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const { addToCart } = useCart();

    const startDate = viewMode === 'week' 
        ? startOfWeek(currentDate, { weekStartsOn: 1 }) 
        : startOfDay(currentDate);
        
    const days = viewMode === 'week' 
        ? Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))
        : [startDate];

    const timeSlots = Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
        const totalMinutes = i * SLOT_DURATION;
        const hour = START_HOUR + Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return { 
            timeStr: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            offset: i
        };
    });

    const handlePrev = () => setCurrentDate(prev => addDays(prev, viewMode === 'week' ? -7 : -1));
    const handleNext = () => setCurrentDate(prev => addDays(prev, viewMode === 'week' ? 7 : 1));
    const handleToday = () => setCurrentDate(new Date());

    const handleSlotClick = (date: Date, availability: { available: boolean; rule?: Availability; absence?: Absence }) => {
        if (isDoctorView) return; 
        if (!availability.available) return;

        if (isBefore(date, new Date())) {
            alert("Nie można rezerwować w przeszłości.");
            return;
        }

        setSelectedSlot(date);
    };

    const handleReservationSubmit = async (reservation: Reservation) => {
        if (isDoctorView) {
             try {
                await consultationsService.addReservation(reservation);
                alert('Rezerwacja dodana!');
                if (onRefresh) onRefresh();
                setSelectedSlot(null);
            } catch (e: any) {
                alert('Błąd: ' + e.message);
            }
        } else {
             try {
                 const newRes = { ...reservation, status: 'pending' as const };
                 
                 await consultationsService.addReservation(newRes);
                 
                 addToCart(newRes);
                 
                 alert('Rezerwacja wstępna utworzona. Przejdź do koszyka aby opłacić.');
                 
                 if (onRefresh) onRefresh();
                 setSelectedSlot(null);

             } catch(e: any) {
                 alert('Nie udało się utworzyć rezerwacji: ' + e.message);
             }
        }
    };

    const handleCancelReservation = async (id: string) => {
        await consultationsService.cancelReservation(id);
        if (onRefresh) onRefresh();
        setSelectedReservation(null);
        alert("Wizyta odwołana.");
    };

    const getRowStart = (dateStr: string) => { 
        const [h, m] = dateStr.split(':').map(Number);
        const minutesFromStart = (h - START_HOUR) * 60 + m;
        return Math.floor(minutesFromStart / SLOT_DURATION) + 2; 
    };

    const getColStart = (date: Date) => {
        if (viewMode === 'day') return 2; 
        
        const day = date.getDay(); 
        const headerIndex = day === 0 ? 7 : day;
        return headerIndex + 1;
    };

    const now = new Date();
    const isCurrentBlock = (day: Date, timeStr: string) => {
        if (!isSameDay(day, now)) return false;
        const [h, m] = timeStr.split(':').map(Number);
        const slotStart = new Date(day);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION);
        return now >= slotStart && now < slotEnd;
    };

    const validateReservationRange = (start: Date, end: Date): { valid: boolean; error?: string } => {
        let current = new Date(start);
        while (current < end) {
            const check = isSlotAvailable(current, availabilities, absences, reservations);
            if (check.absence) return { valid: false, error: 'W terminie występuje nieobecność lekarza.' };
            if (!check.available) return { valid: false, error: 'Lekarz nie przyjmuje w jednej z wybranych godzin.' };
            
            const conflict = reservations.some(res => {
                 if (res.status === 'cancelled') return false;
                 const resStart = parseISO(res.startDateTime);
                 const resEnd = parseISO(res.endDateTime);
                 const slotEnd = new Date(current);
                 slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION);
                 return current < resEnd && slotEnd > resStart; 
            });

            if (conflict) return { valid: false, error: 'Jeden z wybranych slotów jest już zajęty.' };
            current.setMinutes(current.getMinutes() + SLOT_DURATION);
        }
        return { valid: true };
    };

    return (
        <div className="flex flex-col h-full bg-white rounded shadow-sm border overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800 capitalize">
                        {viewMode === 'week' 
                            ? `${format(startDate, 'd MMMM', { locale: pl })} - ${format(addDays(startDate, 6), 'd MMMM yyyy', { locale: pl })}` 
                            : format(startDate, 'd MMMM yyyy (EEEE)', { locale: pl })
                        }
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft /></button>
                        <button onClick={handleToday} className="px-3 py-1 text-sm font-medium hover:bg-gray-100 rounded">Dzisiaj</button>
                        <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded"><ChevronRight /></button>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded">
                         <button 
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1 text-xs rounded ${viewMode === 'day' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                        >
                            Dzień
                        </button>
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-xs rounded ${viewMode === 'week' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                        >
                            Tydzień
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>Lek. {doctor.firstName} {doctor.lastName} ({doctor.specialization})</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '600px' }}> 
                <div className="grid" style={{ 
                    gridTemplateColumns: viewMode === 'week' ? '60px repeat(7, 1fr)' : '60px 1fr', 
                    gridTemplateRows: '50px repeat(' + TOTAL_SLOTS + ', 40px)' 
                }}>
                    
                    <div className="sticky top-0 z-20 bg-gray-50 border-b border-r flex items-center justify-center font-semibold text-xs text-gray-500">Time</div>
                    {days.map((day, i) => {
                        const isToday = isSameDay(day, new Date());
                        const dayReservations = reservations.filter(r => isSameDay(parseISO(r.startDateTime), day) && r.status !== 'cancelled');
                        return (
                            <div key={i} className={`sticky top-0 z-20 border-b border-r px-2 py-1 text-center min-w-[100px] ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                <div className={`font-bold capitalize ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{format(day, 'EEEE', { locale: pl })}</div>
                                <div className="text-xs text-gray-500">{format(day, 'dd.MM')}</div>
                                <div className="text-xs text-gray-400 mt-1">{dayReservations.length} wizyt</div>
                            </div>
                        );
                    })}

                    {timeSlots.map((slot, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            <div className="border-r border-b text-xs text-gray-400 flex items-start justify-center pt-1" style={{ gridRow: rowIndex + 2, gridColumn: 1 }}>
                                {slot.timeStr}
                            </div>
                            
                            {days.map((day, colIndex) => {
                                const currentSlotDate = new Date(day);
                                const [h, m] = slot.timeStr.split(':').map(Number);
                                currentSlotDate.setHours(h, m, 0, 0);
                                
                                const check = isSlotAvailable(currentSlotDate, availabilities, absences, reservations);
                                const isPast = isBefore(currentSlotDate, new Date());
                                const isCurrent = isCurrentBlock(day, slot.timeStr);

                                let bgClass = 'bg-white';
                                if (check.absence) bgClass = 'bg-red-200'; 
                                else if (check.available && !isPast) bgClass = 'bg-green-200 hover:bg-green-300 cursor-pointer'; 
                                else if (isPast) bgClass = 'bg-gray-50';

                                if (isDoctorView && check.available) bgClass = 'bg-green-200 hover:bg-green-300';   
                                if (isCurrent) bgClass += ' border-l-4 border-l-red-500 bg-blue-50'; 

                                return (
                                    <div 
                                        key={colIndex} 
                                        className={`border-r border-b relative ${bgClass}`}
                                        style={{ gridRow: rowIndex + 2, gridColumn: colIndex + 2 }}
                                        onClick={() => handleSlotClick(currentSlotDate, check)}
                                    ></div>
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {reservations.map((res) => {
                        const start = parseISO(res.startDateTime);
                        const end = parseISO(res.endDateTime);
                        
                        if (isBefore(end, startDate) || isAfter(start, addDays(startDate, viewMode === 'week' ? 7 : 1))) return null;

                        const durationMins = differenceInMinutes(end, start);
                        const span = durationMins / 30;
                        const rowStart = getRowStart(format(start, 'HH:mm'));
                        const colStart = getColStart(start);
                        
                        let colorClass = 'bg-blue-200 border-blue-400 text-blue-800';
                        if (res.type === 'kontrolna') colorClass = 'bg-purple-200 border-purple-400 text-purple-800';
                        if (res.status === 'cancelled') colorClass = 'opacity-50 bg-gray-300 border-gray-400 text-gray-600 grayscale';
                        if (res.status === 'pending') colorClass = 'bg-yellow-200 border-yellow-400 text-yellow-800 dashed border-2';

                        const hasAbsence = absences.some(a => isSameDay(parseISO(a.date), start));
                        if(hasAbsence) {
                            colorClass = 'bg-red-500 border-red-800 text-white font-bold'; 
                        } else if (isBefore(end, new Date()) && res.status !== 'cancelled') {
                             colorClass = 'bg-gray-200 border-gray-300 text-gray-600';
                        }
                        
                        if (res.status === 'pending') {
                            colorClass = 'bg-yellow-200 border-yellow-500 text-yellow-900 border-2 border-dashed';
                        } 

                        else if (res.status === 'confirmed') {
                             if (isBefore(end, new Date())) {
                                 colorClass = 'bg-gray-200 border-gray-300 text-gray-600';
                             } else {
                                 colorClass = 'bg-green-200 border-green-600 text-green-900'; 
                             }
                        }

                        return (
                            <div 
                                key={res.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReservation(res);
                                }}
                                className={`z-10 m-1 p-1 rounded border overflow-hidden text-xs shadow-sm cursor-pointer hover:shadow-md transition ${colorClass}`}
                                style={{ 
                                    gridRow: `${rowStart} / span ${span}`, 
                                    gridColumn: colStart 
                                }}
                            >
                                <div className="font-bold flex justify-between">
                                    <span>{format(start, 'HH:mm')}</span>
                                    {hasAbsence && <AlertCircle size={12} />}
                                </div>
                                <div className="truncate">{res.patientDetails?.firstName} {res.patientDetails?.lastName}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedSlot && doctor && (
                <ReservationModal 
                    isOpen={!!selectedSlot}
                    onClose={() => setSelectedSlot(null)}
                    onSubmit={handleReservationSubmit}
                    doctor={doctor}
                    startTime={selectedSlot}
                    validateReservation={validateReservationRange}
                />
            )}

            {selectedReservation && (
                <ReservationDetailsModal
                    reservation={selectedReservation}
                    isDoctorView={isDoctorView}
                    onClose={() => setSelectedReservation(null)}
                    onCancel={handleCancelReservation}
                />
            )}
        </div>
    );
};
