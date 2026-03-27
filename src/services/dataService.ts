import type { Doctor, Availability, Absence, Reservation, AppData, Comment } from '../types/types';

export interface IDataService {
    // Doctors
    getDoctors(): Promise<Doctor[]>;
    getDoctor(id: string): Promise<Doctor | undefined>;
    
    // Availabilities
    getAvailabilities(doctorId: string): Promise<Availability[]>;
    addAvailability(availability: Availability): Promise<void>;
    
    // Absences
    getAbsences(doctorId: string): Promise<Absence[]>;
    addAbsence(absence: Absence): Promise<void>;
    
    // Reservations
    getReservations(doctorId: string): Promise<Reservation[]>; // For doctor view
    getPatientReservations(patientId: string): Promise<Reservation[]>; // For patient view
    getAllReservations(): Promise<Reservation[]>; // For conflict checking
    addReservation(reservation: Reservation): Promise<void>;
    updateReservationStatus(id: string, status: Reservation['status']): Promise<void>;
    cancelReservation(id: string): Promise<void>;

    // Comments
    getComments(doctorId: string): Promise<Comment[]>;
}
