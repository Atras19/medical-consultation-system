import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types/types';
import { apiClient, authApi } from '../services/apiClient';

type PersistenceMode = 'LOCAL' | 'SESSION' | 'NONE';

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    isAuthenticated: boolean;
    persistenceMode: PersistenceMode;
    setPersistenceMode: (mode: PersistenceMode) => void;
    login: (credentials: any) => Promise<void>;
    registerUser: (data: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [persistenceMode, setPersistenceModeState] = useState<PersistenceMode>(() => {
        return (localStorage.getItem('persistenceMode') as PersistenceMode) || 'SESSION';
    });

    const setPersistenceMode = (mode: PersistenceMode) => {
        setPersistenceModeState(mode);
        localStorage.setItem('persistenceMode', mode);
        
        if (mode === 'NONE') {    
        } else if (mode === 'LOCAL') {
            sessionStorage.setItem('client_session_active', 'true');
        } 
    };

    const role: UserRole = user ? user.role : 'guest';

    useEffect(() => {
        const initAuth = async () => {

            if (persistenceMode === 'NONE') {
                console.log("Persistence: NONE -> Logging out");
                await logout(); 
                setLoading(false);
                return;
            }

            if (persistenceMode === 'LOCAL') {
                 const marker = sessionStorage.getItem('client_session_active');
                 if (!marker) {
                     console.log("Persistence: LOCAL (Session-based) -> Marker missing (Browser restarted) -> Logout");
                     await logout();
                     setLoading(false);
                     return;
                 }
            }
            

            try {
                const session = await apiClient('/auth/session', { method: 'GET' });
                
                if (session.isAuthenticated && session.accessToken) {
                    authApi.setToken(session.accessToken);
                    if (session.user) {
                        setUser(session.user);
                    } else {
                        const userData = await apiClient('/auth/me');
                        setUser(userData);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []); 

    const login = async (credentials: any) => {
        try {
            const result = await apiClient('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
                skipAuth: true
            });
            
            sessionStorage.setItem('client_session_active', 'true');

            if (result.accessToken) {
                authApi.setToken(result.accessToken);
            }

            if (result.user) {
                setUser(result.user);
            } else {
                const userData = await apiClient('/auth/me');
                setUser(userData); 
            }
        } catch (e) {
             console.error("Login caught error", e);
             throw e;
        }
    };

    const registerUser = async (data: any) => {
        await apiClient('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    };

    const logout = async () => {
        try {
            await apiClient('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error("Logout failed", e);
        }
        authApi.setToken(null);
        setUser(null);
        sessionStorage.removeItem('client_session_active');
    };

    return (
        <AuthContext.Provider value={{
            user,
            role,
            loading,
            isAuthenticated: !!user,
            persistenceMode,
            setPersistenceMode,
            login,
            registerUser,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
