import React from 'react';
import { useCart } from '../context/CartContext';
import { format, parseISO } from 'date-fns';
import { Trash2, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
    const { cart, removeFromCart, checkout } = useCart();
    const navigate = useNavigate();

    const handleCheckout = async () => {
        const success = await checkout();
        if (success) {
            navigate('/');
        }
    };

    if (cart.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-400 mb-4">Twój koszyk jest pusty</h2>
                <Link to="/" className="text-blue-600 hover:underline">Wróć do kalendarza</Link>
            </div>
        );
    }

    const totalCost = cart.length * 150; 

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Podsumowanie rezerwacji</h1>
            
            <div className="bg-white rounded shadow-sm border overflow-hidden mb-6">
                {cart.map((item) => (
                    <div key={item.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50">
                        <div>
                            <div className="font-bold text-lg">{format(parseISO(item.startDateTime), 'dd.MM.yyyy HH:mm')}</div>
                            <div className="text-gray-600">Pacjent: {item.patientDetails?.firstName} {item.patientDetails?.lastName} ({item.patientDetails?.age} lat)</div>
                            <div className="text-sm text-gray-500">Typ: {item.type}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-700">150 PLN</span>
                            <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                                title="Usuń"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                
                <div className="bg-gray-50 p-4 flex justify-between items-center border-t">
                    <span className="font-bold text-lg">Łącznie do zapłaty:</span>
                    <span className="font-bold text-2xl text-blue-600">{totalCost} PLN</span>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Link to="/" className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded font-medium">
                    Domów coś jeszcze
                </Link>
                <button 
                    onClick={handleCheckout}
                    className="px-8 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg transition transform hover:-translate-y-1"
                >
                    <CreditCard size={20} />
                    Potwierdź i Zapłać
                </button>
            </div>
        </div>
    );
};

export default CartPage;
