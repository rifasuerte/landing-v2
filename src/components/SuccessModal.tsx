'use client';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketCount: number;
  paymentId?: number;
  paymentMethod?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  ticketCount,
  paymentId,
  paymentMethod,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 999999, position: 'fixed' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Compra exitosa!
          </h3>
          <p className="text-gray-600 mb-4">
            Has comprado {ticketCount} {ticketCount === 1 ? 'boleto' : 'boletos'} exitosamente.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong className="text-purple-900">Importante:</strong> Tus boletos están <strong>reservados</strong> hasta que validemos tu pago. 
              Pronto nos comunicaremos contigo a tu correo electrónico para confirmar tu compra una vez que hayamos verificado el pago.
              {paymentMethod && paymentId && (
                <span className="block mt-2 text-xs text-gray-600">
                  <strong>{paymentMethod} ({paymentId})</strong>
                </span>
              )}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Si resultas ganador, te notificaremos inmediatamente por correo electrónico y teléfono.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

