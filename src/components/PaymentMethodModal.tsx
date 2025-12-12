'use client';

import { useState } from 'react';
import ImageWithGoogleDrive from './ImageWithGoogleDrive';

interface Bank {
  id: number;
  name: string;
  logoURL: string | null;
  rif?: string;
  phone?: string;
  accountNumber?: string;
  accountType?: string;
  bankName?: string;
}

interface PaymentMethod {
  id: number;
  method: string;
  name: string;
  logoURL: string | null;
  minTickets: number;
  banks?: Bank[];
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod, bank?: Bank) => void;
  paymentMethods: PaymentMethod[];
  selectNumber: boolean;
  ticketQuantity: number;
  onTicketQuantityChange: (quantity: number) => void;
  minTickets: number;
  ticketLimit?: number;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSelect,
  paymentMethods,
  selectNumber,
  ticketQuantity,
  onTicketQuantityChange,
  minTickets,
  ticketLimit,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  if (!isOpen) return null;

  // Agrupar métodos por nombre
  const groupedMethods = paymentMethods.reduce((acc, method) => {
    const key = method.method;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(method);
    return acc;
  }, {} as Record<string, PaymentMethod[]>);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setSelectedBank(null);
    
    // Si el método tiene múltiples bancos, no seleccionar aún
    if (method.banks && method.banks.length > 1) {
      return;
    }
    
    // Si tiene un solo banco o ninguno, seleccionar directamente
    if (method.banks && method.banks.length === 1) {
      setSelectedBank(method.banks[0]);
    }
  };

  const handleContinue = () => {
    if (!selectedMethod) return;
    
    // Si tiene múltiples bancos y no se ha seleccionado uno, no continuar
    if (selectedMethod.banks && selectedMethod.banks.length > 1 && !selectedBank) {
      return;
    }
    
    onSelect(selectedMethod, selectedBank || undefined);
  };

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = ticketQuantity + delta;
    const min = minTickets || 1;
    const max = ticketLimit || 999;
    if (newQuantity >= min && newQuantity <= max) {
      onTicketQuantityChange(newQuantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 999999, position: 'fixed' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Elige tu método de pago</h3>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona el método y la cantidad de boletos para continuar
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Métodos de pago agrupados */}
          <div className="space-y-4">
            {Object.entries(groupedMethods).map(([methodName, methods]) => (
              <div key={methodName}>
                {methods.map((method) => {
                  const isSelected = selectedMethod?.id === method.id;
                  const hasMultipleBanks = method.banks && method.banks.length > 1;
                  
                  return (
                    <div
                      key={method.id}
                      onClick={() => handleMethodSelect(method)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all mb-3
                        ${isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {method.logoURL && (
                            <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                              <ImageWithGoogleDrive
                                src={method.logoURL}
                                alt={method.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{method.name}</p>
                            <p className="text-sm text-gray-600">
                              Mínimo {method.minTickets} {method.minTickets === 1 ? 'boleto' : 'boletos'}
                            </p>
                          </div>
                        </div>
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {isSelected && (
                            <div className="w-3 h-3 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      
                      {/* Mostrar bancos si hay múltiples */}
                      {isSelected && hasMultipleBanks && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-3">
                            Selecciona el banco al que harás el pago móvil
                          </p>
                          <div className="space-y-2">
                            {method.banks!.map((bank) => (
                              <div
                                key={bank.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBankSelect(bank);
                                }}
                                className={`
                                  p-3 rounded-lg border-2 cursor-pointer transition-all
                                  ${selectedBank?.id === bank.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                  }
                                `}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                      {bank.logoURL && (
                                        <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                                          <ImageWithGoogleDrive
                                            src={bank.logoURL}
                                            alt={bank.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      {bank.name && (
                                        <p className="font-medium text-gray-900 truncate">{bank.name}</p>
                                      )}
                                    </div>
                                  <div className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                    ${selectedBank?.id === bank.id
                                      ? 'border-purple-500 bg-purple-500'
                                      : 'border-gray-300'
                                    }
                                  `}>
                                    {selectedBank?.id === bank.id && (
                                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Cantidad de boletos - solo si no es seleccionable */}
          {!selectNumber && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Cantidad de boletos
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={ticketQuantity <= (minTickets || 1)}
                  className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-gray-700"
                >
                  -
                </button>
                <input
                  type="number"
                  value={ticketQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || minTickets || 1;
                    const min = minTickets || 1;
                    const max = ticketLimit || 999;
                    if (value >= min && value <= max) {
                      onTicketQuantityChange(value);
                    }
                  }}
                  min={minTickets || 1}
                  max={ticketLimit || 999}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center font-semibold text-gray-900"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={ticketQuantity >= (ticketLimit || 999)}
                  className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-gray-700"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedMethod || (selectedMethod.banks && selectedMethod.banks.length > 1 && !selectedBank)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

