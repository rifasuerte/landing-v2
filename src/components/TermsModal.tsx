'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface TermsModalProps {
  onAccept?: () => void;
  onReject?: () => void;
  readOnly?: boolean;
  onClose?: () => void;
}

export default function TermsModal({ onAccept, onReject, readOnly = false, onClose }: TermsModalProps) {
  const router = useRouter();
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (isAtBottom) {
      setHasScrolled(true);
    }
  };

  const handleClose = () => {
    if (readOnly && onClose) {
      onClose();
    } else if (onReject) {
      onReject();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 9999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" style={{ zIndex: 9999999, position: 'relative' }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h2>
          {readOnly && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Contenido */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-gray-700 space-y-4"
        >
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              TÉRMINOS Y CONDICIONES
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de Términos</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Al usar Rifasuerte, aceptas cumplir estos Términos y Condiciones.</li>
                  <li>Si no estás de acuerdo, no debes participar ni comprar tickets.</li>
                  <li>Debes aceptar estos términos antes de finalizar tu compra.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Rol de Rifasuerte</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rifasuerte es únicamente una plataforma tecnológica.</li>
                  <li>No organiza rifas, no realiza sorteos y no entrega premios.</li>
                  <li>Toda responsabilidad del sorteo, cumplimiento y entrega recae exclusivamente en el organizador de la rifa y el comprador.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Requisitos para Participar</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Debes ser mayor de 18 años para comprar tickets.</li>
                  <li>Debes tener capacidad legal para contratar.</li>
                  <li>No puedes usar la plataforma para actividades ilegales o fraudulentas.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Veracidad de los Datos (Declaración Jurada)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los datos que ingresas deben ser reales y correctos.</li>
                  <li>Al enviarlos, declaras bajo juramento que son verdaderos.</li>
                  <li>Información falsa puede invalidar tu participación o tu compra.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Proceso de Compra</h3>
                <ul className="list-disc pl-6 space-y-2 mb-3">
                  <li>Seleccionas la cantidad de tickets o números disponibles.</li>
                  <li>Realizas el pago con el método indicado por el organizador (transferencia, efectivo, pasarela externa, etc.).</li>
                  <li>Subes el comprobante a la plataforma.</li>
                  <li>Recibes un email de reserva confirmando la carga del comprobante.</li>
                  <li>Una vez validado el pago por el organizador, recibes un email final con tus tickets.</li>
                </ul>
                <p className="mb-2 font-semibold">Importante:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rifasuerte no cobra, no procesa ni intermedia pagos.</li>
                  <li>Los pagos se realizan directamente al organizador, usando los datos que él provee.</li>
                  <li>Rifasuerte no almacena datos de tarjetas, cuentas bancarias ni medios de pago, no verifica la autenticidad de los pagos y no interviene en disputas económicas entre comprador y organizador.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Confirmaciones y Comunicaciones</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los correos de reserva y confirmación dependen de servicios externos.</li>
                  <li>Si no recibes el email, puedes validar tus tickets en el Validador de Compras usando tu correo o teléfono.</li>
                  <li>Rifasuerte no se responsabiliza por correos no recibidos debido a datos incorrectos o fallas externas.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Selección de Ganadores</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>El sorteo lo realiza exclusivamente el organizador.</li>
                  <li>Debe hacerse en la fecha anunciada y de manera transparente.</li>
                  <li>Rifasuerte no participa, supervisa ni garantiza la realización del sorteo.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Notificación a Ganadores</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>El organizador contactará a los ganadores mediante el correo o teléfono registrado.</li>
                  <li>Es responsabilidad del participante mantener sus datos actualizados.</li>
                  <li>Rifasuerte no envía notificaciones de ganadores ni garantiza que el organizador lo haga.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Entrega de Premios</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>La entrega del premio depende totalmente del organizador.</li>
                  <li>Rifasuerte no es responsable por premios no entregados, entregados tarde o diferentes a los anunciados.</li>
                  <li>Cualquier reclamo debe dirigirse al organizador.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Reembolsos</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Una vez confirmado el pago por el organizador, no se realizarán reembolsos.</li>
                  <li>Cualquier excepción es decisión exclusiva del organizador, no de Rifasuerte.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">11. Fallas Técnicas y Disponibilidad</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>La plataforma puede presentar errores, caídas o fallas de conexión.</li>
                  <li>Rifasuerte no se responsabiliza por problemas técnicos, pérdidas de información o fallas de proveedores externos.</li>
                  <li>Rifasuerte puede suspender rifas o cuentas si detecta actividad sospechosa o violaciones a estos términos.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">12. Modificaciones</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rifasuerte puede modificar estos Términos y Condiciones en cualquier momento.</li>
                  <li>Los cambios entran en vigencia al publicarse en la plataforma.</li>
                  <li>Continuar usando el servicio implica aceptar las modificaciones.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">13. Limitación de Responsabilidad</h3>
                <p className="mb-2">Rifasuerte no es responsable por:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Sorteos no realizados.</li>
                  <li>Premios no entregados.</li>
                  <li>Estafas o incumplimientos del organizador.</li>
                  <li>Disputas o problemas de pago entre comprador y organizador.</li>
                  <li>Daños o pérdidas económicas derivadas del uso de la plataforma.</li>
                </ul>
                <p className="mt-2">Rifasuerte solo facilita un sistema para gestionar rifas, sin intervenir en su ejecución.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">14. Uso de Nombre e Imagen del Ganador</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Al participar aceptas que el organizador puede usar tu nombre, foto o video para anunciar al ganador en redes sociales o medios que utilice.</li>
                  <li>Este uso es únicamente para comunicar los resultados de la rifa.</li>
                  <li>Rifasuerte no crea ni publica este contenido; el organizador es totalmente responsable.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        {!readOnly && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={onReject}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
              >
                No acepto
              </button>
              <button
                onClick={onAccept}
                disabled={!hasScrolled}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Acepto los términos
              </button>
            </div>
            {!hasScrolled && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Por favor, lee todos los términos antes de aceptar
              </p>
            )}
          </div>
        )}
        {readOnly && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

