import type { IDataService } from '../dataService';
import type { Doctor, Availability, Absence, Reservation, Comment } from '../../types/types';

const API_URL = 'http://localhost:3000/api';

export class RestApiService implements IDataService {
    
    // Doctors
    async getDoctors(): Promise<Doctor[]> {
        const response = await fetch(`${API_URL}/doctors`);
        if (!response.ok) throw new Error('Failed to fetch doctors');
        return response.json();
    }

    async getDoctor(id: string): Promise<Doctor | undefined> {
        const response = await fetch(`${API_URL}/doctors/${id}`);
        if (response.status === 404) return undefined;
        if (!response.ok) throw new Error('Failed to fetch doctor');
        return response.json();
    }

    // Availabilities
    async getAvailabilities(doctorId: string): Promise<Availability[]> {
        const response = await fetch(`${API_URL}/availabilities?doctorId=${doctorId}`);
        if (!response.ok) throw new Error('Failed to fetch availabilities');
        return response.json();
    }

    async addAvailability(availability: Availability): Promise<void> {
        const response = await fetch(`${API_URL}/availabilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(availability)
        });
        if (!response.ok) throw new Error('Failed to add availability');
    }

    // Absences
    async getAbsences(doctorId: string): Promise<Absence[]> {
        const response = await fetch(`${API_URL}/absences?doctorId=${doctorId}`);
        if (!response.ok) throw new Error('Failed to fetch absences');
        return response.json();
    }

    async addAbsence(absence: Absence): Promise<void> {
        const response = await fetch(`${API_URL}/absences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(absence)
        });
        if (!response.ok) throw new Error('Failed to add absence');
    }

    // Reservations
    async getReservations(doctorId: string): Promise<Reservation[]> {
        const response = await fetch(`${API_URL}/reservations?doctorId=${doctorId}`);
        if (!response.ok) throw new Error('Failed to fetch reservations');
        return response.json();
    }

    async getPatientReservations(patientId: string): Promise<Reservation[]> {
        const response = await fetch(`${API_URL}/reservations?patientId=${patientId}`);
        if (!response.ok) throw new Error('Failed to fetch patient reservations');
        return response.json();
    }

    async getAllReservations(): Promise<Reservation[]> {
        const response = await fetch(`${API_URL}/reservations`);
        if (!response.ok) throw new Error('Failed to fetch all reservations');
        return response.json();
    }

    async addReservation(reservation: Reservation): Promise<void> {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservation)
        });
        if (!response.ok) throw new Error('Failed to add reservation');
    }

    async updateReservationStatus(id: string, status: Reservation['status']): Promise<void> {
        const response = await fetch(`${API_URL}/reservations/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to update reservation status');
    }

    async cancelReservation(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/reservations/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to cancel reservation');
    }

    // Comments
    async getComments(doctorId: string): Promise<Comment[]> {
        const response = await fetch(`${API_URL}/comments/${doctorId}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        return response.json();
    }
}
