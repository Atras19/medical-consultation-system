import { format, addMinutes, parseISO, getDay, isAfter, isBefore, isSameDay } from 'date-fns';
import type { Availability, Absence, Reservation } from '../types/types';

export const TIME_SLOT_DURATION = 30;

export const generateTimeSlots = (startHour: number, endHour: number) => {
    const slots = [];
    let current = new Date();
    current.setHours(startHour, 0, 0, 0);
    const end = new Date();
    end.setHours(endHour, 0, 0, 0);

    while (current < end) {
        slots.push(format(current, 'HH:mm'));
        current = addMinutes(current, TIME_SLOT_DURATION);
    }
    return slots;
};

export const isSlotAvailable = (
    date: Date, 
    availabilities: Availability[],
    absences: Absence[],
    reservations: Reservation[]
): { available: boolean; reservation?: Reservation; absence?: Absence; rule?: Availability } => {
    
    const absence = absences.find(a => isSameDay(parseISO(a.date), date));
    if (absence) return { available: false, absence };

    const reservation = reservations.find(r => {
        if (r.status === 'cancelled') return false; 

        const start = parseISO(r.startDateTime);
        const end = parseISO(r.endDateTime);
        return (date >= start && date < end); 
    });
    if (reservation) return { available: false, reservation };

    const dayOfWeek = getDay(date); 

    const timeString = format(date, 'HH:mm');
    const dateString = format(date, 'yyyy-MM-dd');

    const rule = availabilities.find(a => {
        if (a.isCyclic) {
            if (a.startDate && dateString < a.startDate) return false;
            if (a.endDate && dateString > a.endDate) return false;
            
            if (a.daysOfWeek) {
                const days = a.daysOfWeek.map(d => Number(d));
                const normalizedDays = days.map(d => d === 7 ? 0 : d);
                
                if (!normalizedDays.includes(dayOfWeek)) return false;
            }
        } else {
            if (a.date !== dateString) return false;
        }


        return timeString >= a.startTime && timeString < a.endTime; 
    });

    if (rule) return { available: true, rule };

    return { available: false };
};
