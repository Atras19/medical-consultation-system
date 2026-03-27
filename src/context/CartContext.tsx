import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Reservation } from '../types/types';
import { consultationsService } from '../services/consultationsServices';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Reservation[];
  addToCart: (reservation: Reservation) => void;
  removeFromCart: (id: string) => void;
  removeLocalOnly: (id: string) => void;
  clearCart: () => void;
  checkout: () => Promise<boolean>; 
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Reservation[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
        if (!user) {
            setCart([]);
            return;
        }

        const fetchCart = async () => {
             try {
                 const reservations = await consultationsService.getPatientReservations(user.id);
                 const pending = reservations.filter(r => r.status === 'pending');
                 setCart(pending);
                 console.log('Cart reloaded from server:', pending.length);
             } catch (e) {
                 console.error('Failed to load pending reservations for cart', e);
             }
        };

        fetchCart();
  }, [user]);

  useEffect(() => {
        const onConnect = () => {
             console.log('CartContext connected to socket');
        };

        const onCancel = (data: { id: string }) => {
            setCart(prev => prev.filter(item => item.id !== data.id));
        };

        const onUpdate = (data: Reservation) => {
            if (data.status === 'confirmed') {
                setCart(prev => prev.filter(item => item.id !== data.id));
            }
        };

        socket.on('connect', onConnect);
        socket.on('reservation_cancelled', onCancel);
        socket.on('reservation_update', onUpdate);

        return () => {
             socket.off('connect', onConnect);
             socket.off('reservation_cancelled', onCancel);
             socket.off('reservation_update', onUpdate);
        };
  }, []);

  const addToCart = (reservation: Reservation) => {
    if (cart.some(item => item.id === reservation.id)) return;
    setCart((prev) => [...prev, reservation]);
  };

  const removeFromCart = async (id: string) => {
    try {
        await consultationsService.cancelReservation(id);
        setCart((prev) => prev.filter((item) => item.id !== id));
    } catch(e) {
        console.error("Failed to remove pending reservation", e);
    }
  };

  const removeLocalOnly = (id: string) => {
      setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkout = async () => {
    try {
        await Promise.all(cart.map(item => 
            consultationsService.updateReservationStatus(item.id, 'confirmed')
        ));
        
        clearCart();
        alert('Płatność przyjęta. Rezerwacje potwierdzone.');
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, removeLocalOnly, clearCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
