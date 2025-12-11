'use client';

import { useState } from 'react';
import CountrySelector from './CountrySelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

interface Ticket {
  id: number;
  ticketNumber: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
}

interface Payment {
  id: number;
  method: string;
  isValidated: string;
  voucher: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
}

interface Purchase {
  ticket: Ticket;
  payment: Payment;
}

interface VerifyTicketsModalProps {
  raffleId: number;
  onClose: () => void;
}

export default function VerifyTicketsModal({ raffleId, onClose }: VerifyTicketsModalProps) {
  const [searchType, setSearchType] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+58');
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Validar formato de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleConsult = async () => {
    // Validar según el tipo de búsqueda
    if (searchType === 'email') {
      if (!email.trim()) {
        setError('Por favor ingresa tu email');
        return;
      }
      if (!isValidEmail(email.trim())) {
        setError('Por favor ingresa un email válido');
        return;
      }
    } else {
      if (!phone.trim()) {
        setError('Por favor ingresa tu teléfono');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setPurchases([]);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchType === 'email') {
        params.append('email', email.trim());
      } else {
        // Combinar código de país con el teléfono
        const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
        params.append('phone', fullPhone);
      }

      const response = await fetch(`${API_URL}/raffle/${raffleId}/verify-purchases?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('No se pudieron obtener los tickets');
      }

      const data: Purchase[] = await response.json();
      setPurchases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado':
      case 'aprobada':
      case 'validado':
      case 'validada':
        return 'bg-green-500';
      case 'pendiente':
        return 'bg-yellow-500';
      case 'rechazado':
      case 'rechazada':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado':
      case 'aprobada':
        return 'Aprobado';
      case 'validado':
      case 'validada':
        return 'Validado';
      case 'pendiente':
        return 'Pendiente';
      case 'rechazado':
      case 'rechazada':
        return 'Rechazado';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 999999, position: 'fixed' }}>
      <div className="bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden" style={{ zIndex: 999999 }}>
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Verificar tus boletos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {/* Instrucciones */}
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
            Ingresa tu email o teléfono para verificar tus boletos adquiridos
          </p>

          {/* Formulario */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {/* Selector de tipo de búsqueda */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                Buscar por
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('email');
                    setEmail('');
                    setPhone('');
                    setError(null);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    searchType === 'email'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('phone');
                    setEmail('');
                    setPhone('');
                    setError(null);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    searchType === 'phone'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Teléfono
                </button>
              </div>
            </div>

            {/* Campo de entrada según el tipo seleccionado */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                {searchType === 'email' ? 'Email' : 'Teléfono'}
              </label>
              {searchType === 'email' ? (
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-gray-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                  onKeyPress={(e) => e.key === 'Enter' && handleConsult()}
                />
              ) : (
                <div className="flex gap-2 items-stretch">
                  <CountrySelector
                    value={countryCode}
                    onChange={setCountryCode}
                    darkMode={true}
                  />
                  <input
                    type="tel"
                    placeholder="Escribe tu teléfono"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    className="flex-1 bg-gray-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && handleConsult()}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConsult}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2.5 sm:py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Consultando...</span>
                  <span className="sm:hidden">Consultando</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Consultar
                </>
              )}
            </button>
          </div>

          {/* Resultados */}
          {purchases.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                Tus boletos ({purchases.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {purchases.map((purchase, index) => {
                  const formatTicketNumber = (num: number) => {
                    return String(num).padStart(4, '0');
                  };
                  
                  const isValidated = purchase.payment.isValidated === 'Aprobado' || purchase.payment.isValidated === 'Aprobada' || purchase.payment.isValidated === 'Validado' || purchase.payment.isValidated === 'Validada';
                  
                  return (
                    <div
                      key={purchase.ticket.id}
                      className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 hover:border-purple-500 transition-colors"
                    >
                      {/* Header del ticket */}
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isValidated && (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm sm:text-lg">{formatTicketNumber(purchase.ticket.ticketNumber)}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {isValidated ? (
                              <p className="text-white font-semibold text-sm sm:text-base truncate">Ticket #{formatTicketNumber(purchase.ticket.ticketNumber)}</p>
                            ) : (
                              <p className="text-white font-semibold text-sm sm:text-base">Ticket (pendiente)</p>
                            )}
                            <p className="text-gray-400 text-xs">
                              {new Date(purchase.ticket.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                    {/* Estado del pago */}
                    <div className="mb-2 sm:mb-3">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                        <span className="text-gray-400 text-xs sm:text-sm">Estado del pago</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(purchase.payment.isValidated)}`}>
                          {getStatusText(purchase.payment.isValidated)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs truncate">Método: {purchase.payment.method}</p>
                    </div>

                    {/* Información del usuario */}
                    <div className="pt-2 sm:pt-3 border-t border-gray-700">
                      <p className="text-gray-400 text-xs mb-1">Comprador</p>
                      <p className="text-white text-xs sm:text-sm font-semibold truncate">{purchase.ticket.user.name}</p>
                      <p className="text-gray-400 text-xs truncate">{purchase.ticket.user.email}</p>
                      <p className="text-gray-400 text-xs truncate">{purchase.ticket.user.phoneNumber}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-400 text-sm sm:text-base">Ingresa tu email o teléfono para consultar tus boletos</p>
            </div>
          )}

          {hasSearched && purchases.length === 0 && !loading && !error && (
            <div className="text-center py-6 sm:py-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white font-semibold text-lg mb-2">No se encontraron boletos</p>
                <p className="text-gray-400 text-sm">No hay boletos registrados con el {searchType === 'email' ? 'email' : 'teléfono'} ingresado.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

