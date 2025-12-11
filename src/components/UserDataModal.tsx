'use client';

import { useState } from 'react';
import CountrySelector from './CountrySelector';

interface UserDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (data: { name: string; email: string; phone: string }) => void;
  onShowTerms?: () => void;
  ticketQuantity: number;
  ticketPrice: string;
  ticketCurrency: string;
  totalPrice: number;
}

export default function UserDataModal({
  isOpen,
  onClose,
  onContinue,
  onShowTerms,
  ticketQuantity,
  ticketPrice,
  ticketCurrency,
  totalPrice,
}: UserDataModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+58');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Validar formato de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (!isOpen) return null;

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    const currencyCode = currency.trim().toUpperCase();
    const invalidCodes = ['BS.', 'BS', 'BOLIVARES', 'BOLIVAR'];
    
    if (invalidCodes.includes(currencyCode) || currencyCode.length > 3) {
      return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numPrice) + ` ${currency}`;
    }
    
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currencyCode,
      }).format(numPrice);
    } catch (error) {
      return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numPrice) + ` ${currency}`;
    }
  };

  const handleSubmit = () => {
    // Validar campos vacíos
    if (!name.trim() || !email.trim() || !phone.trim()) {
      return;
    }

    // Validar formato de email
    if (!isValidEmail(email.trim())) {
      setEmailError('Por favor ingresa un email válido');
      return;
    }

    setEmailError(null);
    onContinue({ name, email, phone: `${countryCode}${phone}` });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 999999, position: 'fixed' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900">Completa tus datos para continuar con la compra</h3>
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
          {/* Resumen de compra */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Cantidad de boletos:</span>
              <span className="font-semibold text-gray-900">{ticketQuantity}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Precio por boleto:</span>
              <span className="font-semibold text-gray-900">{formatPrice(ticketPrice, ticketCurrency)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-base font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{formatPrice(totalPrice.toString(), ticketCurrency)}</span>
            </div>
          </div>

          {/* Campos del formulario */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Escribe tu nombre completo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="flex gap-2 items-stretch">
                <CountrySelector
                  value={countryCode}
                  onChange={setCountryCode}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Escribe tu teléfono"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                onBlur={() => {
                  if (email.trim() && !isValidEmail(email.trim())) {
                    setEmailError('Por favor ingresa un email válido');
                  } else {
                    setEmailError(null);
                  }
                }}
                placeholder="Escribe tu correo electrónico"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 text-gray-900 ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-gray-700">
              Al continuar, aceptas nuestros{' '}
              <button
                type="button"
                onClick={() => {
                  if (onShowTerms) {
                    onShowTerms();
                  }
                }}
                className="text-purple-600 font-semibold underline hover:text-purple-700"
              >
                Términos y Condiciones
              </button>.
              Los números de tickets se asignarán automáticamente y serán enviados a tu correo electrónico.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !email.trim() || !phone.trim() || !!(email.trim() && !isValidEmail(email.trim()))}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pagar
          </button>
        </div>
      </div>
    </div>
  );
}

