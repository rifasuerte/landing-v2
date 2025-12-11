'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PurchasedTicket {
  number: number;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  isPaid: boolean;
}

interface TicketSelectorProps {
  raffleId: string;
  ticketLimit: number;
  purchasedTickets: PurchasedTicket[];
  selectedTickets: number[];
  onTicketsChange: (tickets: number[]) => void;
  ticketPrice: string;
  ticketCurrency: string;
}

export default function TicketSelector({
  raffleId,
  ticketLimit,
  purchasedTickets,
  selectedTickets,
  onTicketsChange,
  ticketPrice,
  ticketCurrency,
}: TicketSelectorProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [localSelected, setLocalSelected] = useState<number[]>(selectedTickets);

  useEffect(() => {
    setLocalSelected(selectedTickets);
  }, [selectedTickets]);

  const purchasedNumbers = new Set(purchasedTickets.map(t => t.number));
  const allTickets = Array.from({ length: ticketLimit }, (_, i) => i); // Comienza desde 0

  const handleTicketClick = (number: number) => {
    if (purchasedNumbers.has(number)) {
      return; // No seleccionar tickets comprados
    }

    setLocalSelected((prev) => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      }
      return [...prev, number];
    });
  };

  const handleConfirm = () => {
    onTicketsChange(localSelected);
    setShowPopup(false);
  };

  const handleCancel = () => {
    setLocalSelected(selectedTickets);
    setShowPopup(false);
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency,
      }).format(numPrice);
    } catch {
      return `${numPrice.toLocaleString('es-CL')} ${currency}`;
    }
  };

  const formatTicketNumber = (num: number) => {
    return String(num).padStart(4, '0');
  };

  const totalPrice = parseFloat(ticketPrice) * localSelected.length;

  const modalContent = showPopup ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative" style={{ zIndex: 999999, position: 'relative' }}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Selecciona tus números</h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid de tickets */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))' }}>
                {allTickets.map((number) => {
                  const isPurchased = purchasedNumbers.has(number);
                  const isSelected = localSelected.includes(number);

                  return (
                    <button
                      key={number}
                      onClick={() => handleTicketClick(number)}
                      disabled={isPurchased}
                      className={`
                        aspect-square rounded-lg font-semibold text-sm transition-all
                        ${isPurchased
                          ? 'bg-red-500 text-white cursor-not-allowed opacity-75'
                          : isSelected
                          ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        }
                      `}
                    >
                      {formatTicketNumber(number)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer con seleccionados y botones */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {localSelected.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Números seleccionados ({localSelected.length}):
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {localSelected.sort((a, b) => a - b).map((num) => (
                      <span
                        key={num}
                        className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-semibold"
                      >
                        {formatTicketNumber(num)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-lg font-bold text-gray-900">
                    Total: {formatPrice(totalPrice.toString(), ticketCurrency)}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={localSelected.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null;

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors mb-4"
      >
        Seleccionar números
      </button>

      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
}

