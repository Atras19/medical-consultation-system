import type { IDataService } from '../dataService';
import type { Doctor, Availability, Absence, Reservation, AppData, Comment } from '../../types/types';
import initialDb from '../../data/db.json';

const STORAGE_KEY = 'consultation_app_data';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class LocalJsonService implements IDataService {
    
    private loadData(): AppData {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as AppData;
            }
        } catch (e) {
            console.error("Failed to parse local storage", e);
        }
        
        const data = initialDb as unknown as AppData; 
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
    }

    private saveData(data: AppData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('storage')); 
    }

    async getDoctors(): Promise<Doctor[]> {
        await delay(300);
        return this.loadData().doctors;
    }

    async getDoctor(id: string): Promise<Doctor | undefined> {
        await delay(200);
        return this.loadData().doctors.find(d => d.id === id);
    }

    async getAvailabilities(doctorId: string): Promise<Availability[]> {
        await delay(300);
        return this.loadData().availabilities.filter(a => a.doctorId === doctorId);
    }

    async addAvailability(availability: Availability): Promise<void> {
        await delay(300);
        const data = this.loadData();
        data.availabilities.push(availability);
        this.saveData(data);
    }

    async getAbsences(doctorId: string): Promise<Absence[]> {
        await delay(200);
        return this.loadData().absences.filter(a => a.doctorId === doctorId);
    }

    async addAbsence(absence: Absence): Promise<void> {
        await delay(300);
        const data = this.loadData();
        data.absences.push(absence);
        
        const conflictingInfo = data.reservations.filter(r => {
             const resDate = r.startDateTime.split('T')[0];
             return r.doctorId === absence.doctorId && resDate === absence.date && r.status === 'confirmed';
        });

        conflictingInfo.forEach(r => {
            r.status = 'cancelled';
        });

        this.saveData(data);
    }

    async getReservations(doctorId: string): Promise<Reservation[]> {
        await delay(300);
        return this.loadData().reservations.filter(r => r.doctorId === doctorId);
    }

    async getAllReservations(): Promise<Reservation[]> {
        await delay(300);
        return this.loadData().reservations;
    }

    async addReservation(reservation: Reservation): Promise<void> {
        await delay(400); // Payment simulation
        const data = this.loadData();
        data.reservations.push(reservation);
        this.saveData(data);
    }

    async updateReservationStatus(id: string, status: Reservation['status']): Promise<void> {
        await delay(200);
        const data = this.loadData();
        const res = data.reservations.find(r => r.id === id);
        if (res) {
            res.status = status;
            this.saveData(data);
        }
    }

    async cancelReservation(id: string): Promise<void> {
        await delay(200);
        const data = this.loadData();
        const index = data.reservations.findIndex(r => r.id === id);
        if (index !== -1) {
             data.reservations[index].status = 'cancelled';
             this.saveData(data);
        }
    }

    async getComments(doctorId: string): Promise<Comment[]> {
        return [];
    }

    async getPatientReservations(patientId: string): Promise<Reservation[]> {
        await delay(300);
        return this.loadData().reservations.filter(r => r.patientId === patientId);
    }

}
