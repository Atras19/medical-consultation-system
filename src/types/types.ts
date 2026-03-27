export type UserRole = 'patient' | 'doctor' | 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  isBanned?: boolean;
  dateOfBirth?: string;
}

export interface Comment {
    id: string;
    doctorId: string;
    authorId: string;
    authorName: string;
    content: string;
    rating: number;
    date: string;
    reply?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization: string;
  averageRating?: number; 
}

export interface Patient extends User {
  role: 'patient';
  gender?: 'male' | 'female' | 'other';
  age?: number;
}

export interface Availability {
  id: string;
  doctorId: string;
  isCyclic: boolean;
  date?: string; 
  
  startDate?: string; 
  endDate?: string; 
  daysOfWeek?: number[]; 
  
  startTime: string; 
  endTime: string; 
}

export interface Absence {
  id: string;
  doctorId: string;
  date: string;
  reason?: string;
}

export type ConsultationType = 'pierwsza_wizyta' | 'kontrolna' | 'choroba_przewlekla' | 'recepta' | 'inne';

export interface Reservation {
  id: string;
  doctorId: string;
  

  patientId?: string; 
  patientDetails?: { 
    firstName: string;
    lastName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
  };

  startDateTime: string; 
  endDateTime: string; 
  type: ConsultationType;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'pending' | 'completed';
  documents?: string[];
}

export interface AppData {
    doctors: Doctor[];
    availabilities: Availability[];
    absences: Absence[];
    reservations: Reservation[];
}
