'use client';

import { useState, useEffect } from 'react';

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportPayment: () => void;
  paymentData: {
    method?: string;
    name?: string;
    accountNumber?: string;
    rif?: string;
    phone?: string;
    bank?: string;
    accountType?: string;
    amount: string;
    currency: string;
  };
}

export default function PaymentInstructionsModal({
  isOpen,
  onClose,
  onReportPayment,
  paymentData,
}: PaymentInstructionsModalProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos en segundos

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllData = () => {
    const allData = [
      paymentData.method ? `Método: ${paymentData.method}` : '',
      paymentData.name ? `Nombre y apellido: ${paymentData.name}` : '',
      paymentData.accountNumber ? `Número de cuenta: ${paymentData.accountNumber}` : '',
      paymentData.rif ? `Cédula de identidad: ${paymentData.rif}` : '',
      paymentData.phone ? `Teléfono: ${paymentData.phone}` : '',
      paymentData.bank ? `Banco: ${paymentData.bank}` : '',
      paymentData.accountType ? `Tipo de cuenta: ${paymentData.accountType}` : '',
      `Monto: ${paymentData.amount} ${paymentData.currency}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(allData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 999999, position: 'fixed' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-yellow-100 px-2.5 py-1 rounded-lg">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-yellow-600 font-bold text-sm">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">Realiza tu Pago</h3>
          <p className="text-xs text-gray-600 mb-3 sm:mb-4">
            Tienes 15 minutos para completar el proceso o la operación se cancelará automáticamente.
          </p>

          {/* Botón copiar todos los datos */}
          <button
            onClick={copyAllData}
            className="w-full mb-3 sm:mb-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar todos los datos
          </button>

          {/* Datos del pago */}
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
            {paymentData.method && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs text-gray-500 mb-0.5">Método</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.method}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentData.method!)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            {paymentData.name && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs text-gray-500 mb-0.5">Nombre y apellido</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.name}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentData.name!)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            {paymentData.accountNumber && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs text-gray-500 mb-0.5">Número de cuenta</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.accountNumber}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentData.accountNumber!)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            {paymentData.rif && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs text-gray-500 mb-0.5">Cédula de identidad</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.rif}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentData.rif!)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            {paymentData.phone && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs text-gray-500 mb-0.5">Teléfono</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.phone}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentData.phone!)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            {paymentData.bank && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs text-gray-500 mb-0.5">Banco</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.bank}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentData.bank!)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            {paymentData.accountType && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs text-gray-500 mb-0.5">Tipo de cuenta</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.accountType}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentData.accountType!)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs text-gray-500 mb-0.5">Monto</p>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{paymentData.amount} {paymentData.currency}</p>
              </div>
              <button
                onClick={() => copyToClipboard(`${paymentData.amount} ${paymentData.currency}`)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Advertencia */}
          <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-red-800 leading-relaxed">
              Asegúrate de pagar el monto exacto, de lo contrario no podremos validar tu pago automáticamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onReportPayment}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg text-xs sm:text-sm"
          >
            Reportar pago
          </button>
        </div>
      </div>
    </div>
  );
}

