'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import ImageWithGoogleDrive from '@/components/ImageWithGoogleDrive';
import PrizeCarousel from '@/components/PrizeCarousel';
import TicketSelector from '@/components/TicketSelector';
import TermsModal from '@/components/TermsModal';
import VerifyTicketsModal from '@/components/VerifyTicketsModal';
import PaymentMethodModal from '@/components/PaymentMethodModal';
import UserDataModal from '@/components/UserDataModal';
import PaymentInstructionsModal from '@/components/PaymentInstructionsModal';
import UploadVoucherModal from '@/components/UploadVoucherModal';
import SuccessModal from '@/components/SuccessModal';
import { preloadImages } from '@/lib/utils/image-cache';
import { downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

interface ParsedPrize {
  name: string;
  imageId: string | null;
}

interface Client {
  id: number;
  name: string;
  fantasyName: string;
  logoURL: string | null;
  videoURL?: string | null;
  whatsapp?: string;
  instagram?: string;
}

interface PaymentData {
  id: number;
  method: string;
  name: string;
  identification: string;
  accountNumber: string;
  phoneNumber: string;
  bank: string;
  accountType: string;
  logo: string;
  visible?: boolean;
}

interface Raffle {
  id: number;
  innerCode: string;
  name: string;
  extra?: string;
  ticketPrice: string;
  ticketCurrency: string;
  prizes: string[];
  selectNumber: boolean;
  ticketLimit?: number;
  minTickets?: number;
  date?: string;
  numberOfWinners?: number;
  client?: Client;
  paymentData?: PaymentData[];
}

interface PurchasedTicket {
  number: number;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  isPaid: boolean;
}

export default function RaffleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const raffleCode = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const prizesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Inicializar con el mínimo de tickets si existe
  useEffect(() => {
    if (raffle && raffle.minTickets && raffle.minTickets > 0) {
      setTicketQuantity(raffle.minTickets);
    }
  }, [raffle?.minTickets]);
  const [showTerms, setShowTerms] = useState(false);
  const [showTermsReadOnly, setShowTermsReadOnly] = useState(false);
  const [pendingPaymentModal, setPendingPaymentModal] = useState(false); // Para abrir el modal de pago después de aceptar términos
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUserDataModal, setShowUserDataModal] = useState(false);
  const [showPaymentInstructionsModal, setShowPaymentInstructionsModal] = useState(false);
  const [showUploadVoucherModal, setShowUploadVoucherModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [userData, setUserData] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });

  // Verificar si se puede hacer scroll en el carrusel de premios
  const checkScroll = () => {
    if (prizesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = prizesScrollRef.current;
      const hasScroll = scrollWidth > clientWidth;
      setCanScrollLeft(hasScroll && scrollLeft > 0);
      setCanScrollRight(hasScroll && scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Función para actualizar los datos de la rifa sin mostrar loading
  const refreshRaffleData = useCallback(async () => {
    if (!raffleCode) return;
    
    try {
      // Obtener detalles de la rifa por código
      const raffleResponse = await fetch(`${API_URL}/raffle/by-code/${raffleCode}`);
      if (!raffleResponse.ok) {
        return; // Silenciosamente fallar si hay error
      }
      const raffleData: Raffle = await raffleResponse.json();
      setRaffle(raffleData);

      // Si selectNumber es true, obtener tickets comprados
      if (raffleData.selectNumber) {
        const ticketsResponse = await fetch(`${API_URL}/raffle/${raffleData.id}/purchased-tickets`);
        if (ticketsResponse.ok) {
          const ticketsData: PurchasedTicket[] = await ticketsResponse.json();
          setPurchasedTickets(ticketsData);
        }
      }
    } catch (err) {
      // Silenciosamente fallar, no mostrar error en actualizaciones automáticas
      console.error('Error al actualizar datos de la rifa:', err);
    }
  }, [raffleCode]);

  // Cargar datos iniciales con loading
  useEffect(() => {
    const loadRaffleData = async () => {
      try {
        // Obtener detalles de la rifa por código
        const raffleResponse = await fetch(`${API_URL}/raffle/by-code/${raffleCode}`);
        if (!raffleResponse.ok) {
          throw new Error('No se pudo obtener la información de la rifa');
        }
        const raffleData: Raffle = await raffleResponse.json();
        setRaffle(raffleData);

        // Si selectNumber es true, obtener tickets comprados
        if (raffleData.selectNumber) {
          const ticketsResponse = await fetch(`${API_URL}/raffle/${raffleData.id}/purchased-tickets`);
          if (ticketsResponse.ok) {
            const ticketsData: PurchasedTicket[] = await ticketsResponse.json();
            setPurchasedTickets(ticketsData);
          }
        }

        // Recopilar todos los IDs de imágenes y videos para precargar
        const imageIds: string[] = [];
        
        // Logo del cliente
        if (raffleData.client?.logoURL) {
          imageIds.push(raffleData.client.logoURL);
        }
        
        // Video del cliente (si existe)
        if (raffleData.client?.videoURL) {
          imageIds.push(raffleData.client.videoURL);
        }
        
        // Imágenes de premios (formato "nombre@imageId")
        raffleData.prizes.forEach((prize) => {
          if (prize.includes('@')) {
            const [, imageId] = prize.split('@');
            if (imageId && imageId.trim()) {
              imageIds.push(imageId.trim());
            }
          }
        });
        
        // Logos de métodos de pago
        if (raffleData.paymentData && raffleData.paymentData.length > 0) {
          raffleData.paymentData.forEach((payment) => {
            if (payment.logo && payment.logo.trim()) {
              imageIds.push(payment.logo.trim());
            }
          });
        }

        // Precargar todas las imágenes
        if (imageIds.length > 0) {
          setLoadingProgress({ loaded: 0, total: imageIds.length });
          await preloadImages(
            imageIds,
            downloadGoogleDriveFileAsBase64,
            (loaded, total) => {
              setLoadingProgress({ loaded, total });
            }
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (raffleCode) {
      loadRaffleData();
    }
  }, [raffleCode]);

  // Actualizar datos cada 3 minutos sin mostrar loading
  useEffect(() => {
    if (!raffle) return; // Solo actualizar si ya hay datos cargados

    const interval = setInterval(() => {
      refreshRaffleData();
    }, 3 * 60 * 1000); // 3 minutos

    return () => clearInterval(interval);
  }, [raffle, refreshRaffleData]);

  const handleAcceptTerms = () => {
    setShowTerms(false);
    // Si había un modal de pago pendiente, abrirlo ahora
    if (pendingPaymentModal) {
      setPendingPaymentModal(false);
      setShowPaymentModal(true);
    }
  };

  const handleRejectTerms = () => {
    setShowTerms(false);
    setPendingPaymentModal(false);
    // No redirigir, solo cerrar el modal
  };

  const handleParticipateClick = () => {
    // Primero mostrar términos y condiciones
    setShowTerms(true);
    setPendingPaymentModal(true); // Marcar que después de aceptar debe abrir el modal de pago
  };

  // Verificar scroll del carrusel de premios
  useEffect(() => {
    const scrollContainer = prizesScrollRef.current;
    if (scrollContainer && raffle && raffle.prizes.length > 0) {
      // Pequeño delay para asegurar que el DOM esté renderizado
      const timeoutId = setTimeout(() => {
        checkScroll();
      }, 100);
      scrollContainer.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timeoutId);
        scrollContainer.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [raffle?.prizes.length]);

  const parsePrizes = (prizes: string[]): ParsedPrize[] => {
    return prizes.map((prize) => {
      if (prize.includes('@')) {
        const [name, imageId] = prize.split('@');
        return { name: name.trim(), imageId: imageId.trim() };
      }
      return { name: prize.trim(), imageId: null };
    });
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    
    // Manejar códigos de moneda no estándar
    const currencyCode = currency.trim().toUpperCase();
    const invalidCodes = ['BS.', 'BS', 'BOLIVARES', 'BOLIVAR'];
    
    if (invalidCodes.includes(currencyCode) || currencyCode.length > 3) {
      // Formato personalizado para monedas no estándar
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
      // Si falla, usar formato numérico con el símbolo
      return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numPrice) + ` ${currency}`;
    }
  };

  const formatTicketNumber = (num: number) => {
    return String(num).padStart(4, '0');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500">
        <div className="text-center text-white p-8">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-xl">{error || 'No se pudo cargar la información'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-white text-red-500 rounded-lg font-semibold hover:bg-gray-100"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const parsedPrizes = parsePrizes(raffle.prizes);
  const prizeImages = parsedPrizes.filter(p => p.imageId !== null);
  const totalPrice = parseFloat(raffle.ticketPrice) * (raffle.selectNumber ? selectedTickets.length : ticketQuantity);

  // Verificar si la fecha es futura
  const isFutureDate = raffle.date && new Date(raffle.date) > new Date();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950">
      {/* Términos y condiciones modal */}
      {showTerms && (
        <TermsModal
          onAccept={handleAcceptTerms}
          onReject={handleRejectTerms}
        />
      )}

      {/* Términos y condiciones modal (solo lectura) */}
      {showTermsReadOnly && (
        <TermsModal
          readOnly={true}
          onClose={() => setShowTermsReadOnly(false)}
        />
      )}

      {/* Modal de verificación de tickets */}
      {showVerifyModal && raffle && (
        <VerifyTicketsModal
          raffleId={raffle.id}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      {/* Modal de método de pago */}
      {showPaymentModal && raffle && (() => {
        // Mapear paymentData al formato del modal, agrupando por método
        const paymentMethodsMap = new Map<string, {
          method: string;
          name: string;
          logoURL: string | null;
          minTickets: number;
          banks: Array<{
            id: number;
            name: string;
            logoURL: string | null;
            rif?: string;
            phone?: string;
            accountNumber?: string;
          }>;
        }>();

        if (raffle.paymentData && raffle.paymentData.length > 0) {
          // Filtrar solo los métodos de pago visibles
          const visiblePayments = raffle.paymentData.filter(payment => payment.visible !== false);
          
          visiblePayments.forEach((payment) => {
            const methodKey = payment.method;
            
            if (!paymentMethodsMap.has(methodKey)) {
              // Obtener el mínimo de tickets del método (usar el minTickets del raffle por defecto)
              const minTickets = raffle.minTickets || 1;
              
              // Usar el logo del primer método encontrado
              paymentMethodsMap.set(methodKey, {
                method: payment.method,
                name: payment.method,
                logoURL: payment.logo || null,
                minTickets: minTickets,
                banks: [],
              });
            }

            const methodData = paymentMethodsMap.get(methodKey)!;
            
            // Si tiene banco, agregarlo a la lista de bancos
            if (payment.bank) {
              methodData.banks.push({
                id: payment.id,
                name: payment.bank,
                logoURL: payment.logo || null,
                rif: payment.identification || undefined,
                phone: payment.phoneNumber || undefined,
                accountNumber: payment.accountNumber || undefined,
              });
            } else {
              // Si no tiene banco pero tiene datos, crear un "banco" único para este método
              methodData.banks.push({
                id: payment.id,
                name: payment.method,
                logoURL: payment.logo || null,
                rif: payment.identification || undefined,
                phone: payment.phoneNumber || undefined,
                accountNumber: payment.accountNumber || undefined,
              });
            }
          });
        }

        const paymentMethods = Array.from(paymentMethodsMap.values()).map((method, index) => ({
          id: index + 1,
          ...method,
        }));

        return (
          <PaymentMethodModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSelect={(method, bank) => {
              setSelectedPaymentMethod(method);
              setSelectedBank(bank);
              setShowPaymentModal(false);
              setShowUserDataModal(true);
            }}
            paymentMethods={paymentMethods}
            selectNumber={raffle.selectNumber}
            ticketQuantity={ticketQuantity}
            onTicketQuantityChange={setTicketQuantity}
            minTickets={raffle.minTickets || 1}
            ticketLimit={raffle.ticketLimit}
          />
        );
      })()}

      {/* Modal de datos del usuario */}
      {showUserDataModal && raffle && (
        <UserDataModal
          isOpen={showUserDataModal}
          onClose={() => setShowUserDataModal(false)}
          onShowTerms={() => setShowTermsReadOnly(true)}
          onContinue={(data) => {
            setUserData(data);
            setShowUserDataModal(false);
            setShowPaymentInstructionsModal(true);
          }}
          ticketQuantity={raffle.selectNumber ? selectedTickets.length : ticketQuantity}
          ticketPrice={raffle.ticketPrice}
          ticketCurrency={raffle.ticketCurrency}
          totalPrice={parseFloat(raffle.ticketPrice) * (raffle.selectNumber ? selectedTickets.length : ticketQuantity)}
        />
      )}

      {/* Modal de instrucciones de pago */}
      {showPaymentInstructionsModal && raffle && selectedPaymentMethod && (
        <PaymentInstructionsModal
          isOpen={showPaymentInstructionsModal}
          onClose={() => setShowPaymentInstructionsModal(false)}
          onReportPayment={() => {
            setShowPaymentInstructionsModal(false);
            setShowUploadVoucherModal(true);
          }}
          paymentData={{
            rif: selectedBank?.rif || selectedPaymentMethod.banks?.[0]?.rif,
            bank: selectedBank?.name || selectedPaymentMethod.name,
            phone: selectedBank?.phone || selectedPaymentMethod.banks?.[0]?.phone,
            amount: (parseFloat(raffle.ticketPrice) * (raffle.selectNumber ? selectedTickets.length : ticketQuantity)).toFixed(2),
            currency: raffle.ticketCurrency,
          }}
        />
      )}

      {/* Modal de subir comprobante */}
      {showUploadVoucherModal && raffle && userData && (
        <UploadVoucherModal
          isOpen={showUploadVoucherModal}
          onClose={() => setShowUploadVoucherModal(false)}
          onUpload={async (base64) => {
            setIsProcessing(true);
            try {
              // 1. Registrar usuario primero
              const userResponse = await fetch(`${API_URL}/user/register`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: userData.email,
                  name: userData.name,
                  password: '', // No se requiere contraseña
                  phoneNumber: userData.phone,
                  client: raffle.client?.id || 0,
                }),
              });

              if (!userResponse.ok) {
                const errorData = await userResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al registrar el usuario');
              }

              const userDataResponse = await userResponse.json();
              setUserId(userDataResponse.id);

              // 2. Crear payment con el userId
              const paymentResponse = await fetch(`${API_URL}/payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  voucher: base64,
                  method: selectedPaymentMethod.method,
                  raffle: raffle.id,
                  user: userDataResponse.id,
                }),
              });

              if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al crear el pago');
              }

              const paymentData = await paymentResponse.json();
              setPaymentId(paymentData.id);

              // 3. Comprar tickets
              const ticketBody: any = {
                userId: userDataResponse.id,
                numberOfTicketsToBuy: raffle.selectNumber ? selectedTickets.length : ticketQuantity,
                raffleId: raffle.id,
                paymentId: paymentData.id,
                isCash: false,
              };

              if (raffle.selectNumber && selectedTickets.length > 0) {
                ticketBody.ticketNumbers = selectedTickets;
              }

              const ticketResponse = await fetch(`${API_URL}/ticket`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(ticketBody),
              });

              if (!ticketResponse.ok) {
                const errorData = await ticketResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al comprar los tickets');
              }

              // Éxito
              setShowUploadVoucherModal(false);
              setShowSuccessModal(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error al procesar la compra');
              alert(err instanceof Error ? err.message : 'Error al procesar la compra');
            } finally {
              setIsProcessing(false);
            }
          }}
          loading={isProcessing}
        />
      )}

      {/* Modal de éxito */}
      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            // Recargar la página para actualizar la lista de números
            window.location.reload();
          }}
          ticketCount={raffle ? (raffle.selectNumber ? selectedTickets.length : ticketQuantity) : 0}
          paymentId={paymentId || undefined}
          paymentMethod={selectedPaymentMethod?.method || undefined}
        />
      )}

      {/* Header con logo y nombre */}
      {raffle.client && (
        <header className="bg-slate-950/95 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b border-slate-900">
          <div className="container mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity cursor-pointer"
            >
              {raffle.client.logoURL && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <ImageWithGoogleDrive
                    src={raffle.client.logoURL}
                    alt={raffle.client.fantasyName}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                {raffle.client.fantasyName}
              </h1>
            </button>
            
            {/* Botones de redes sociales */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Botón de Instagram */}
              {raffle.client.instagram && (
                <a
                  href={`https://instagram.com/${raffle.client.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-gray-50 text-gray-900 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200"
                  aria-label="Seguir en Instagram"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#833AB4" />
                        <stop offset="50%" stopColor="#FD1D1D" />
                        <stop offset="100%" stopColor="#FCB045" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient)"/>
                  </svg>
                  <span className="hidden lg:inline font-semibold text-sm">Instagram</span>
                </a>
              )}
              
              {/* Botón de WhatsApp */}
              {raffle.client.whatsapp && (
                <a
                  href={`https://wa.me/${raffle.client.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-gray-50 text-gray-900 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200"
                  aria-label="Contactar por WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25D366"/>
                  </svg>
                  <span className="hidden lg:inline font-semibold text-sm">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="container mx-auto px-3 sm:px-4 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-3 sm:gap-4">
          {/* Columna izquierda - Carousel */}
          <div className="lg:col-span-7 flex flex-col lg:h-[calc(100vh-80px)] order-1">
            {/* Carousel de premios */}
            {prizeImages.length > 0 && (
              <div className="mb-3 flex-1 min-h-0 flex flex-col w-full">
                <PrizeCarousel prizes={prizeImages} />
              </div>
            )}
            
            {/* Sección de premios - Carrusel horizontal (solo en desktop) */}
            {parsedPrizes.length > 0 && (
              <div className="hidden lg:block flex-shrink-0 lg:mt-auto">
                {/* Título con total */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-white">Premios</h2>
                  <span className="text-sm text-white font-semibold">Total: {parsedPrizes.length}</span>
                </div>
                
                <div className="relative group">
                  <div 
                    ref={prizesScrollRef}
                    className="overflow-x-auto scrollbar-hide scroll-smooth touch-pan-x" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                    onScroll={checkScroll}
                  >
                    <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                      {parsedPrizes.map((prize, index) => {
                        const position = index + 1;
                        const medalColors = {
                          1: { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', text: 'text-yellow-900' },
                          2: { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', text: 'text-gray-900' },
                          3: { bg: 'bg-gradient-to-br from-orange-400 to-orange-600', text: 'text-orange-900' },
                        };
                        const medalColor = medalColors[position as keyof typeof medalColors] || { bg: 'bg-gray-400', text: 'text-gray-900' };
                        
                        return (
                          <div key={index} className="bg-slate-950 rounded-lg overflow-hidden shadow-md flex items-center gap-3 p-3 min-w-[250px] sm:min-w-[280px] flex-shrink-0">
                            {/* Imagen del premio encapsulada */}
                            {prize.imageId && (
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-300">
                                <ImageWithGoogleDrive
                                  src={prize.imageId}
                                  alt={prize.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            {/* Contenido del premio */}
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              {/* Medalla */}
                              <div className={`w-8 h-8 rounded-full ${medalColor.bg} flex items-center justify-center flex-shrink-0`}>
                                <span className={`font-bold text-sm ${medalColor.text}`}>{position}°</span>
                              </div>
                              {/* Nombre del premio */}
                              <p className="text-sm font-semibold text-white truncate">{prize.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Flecha izquierda - solo si hay más contenido a la izquierda */}
                  {canScrollLeft && (
                    <button
                      onClick={() => {
                        if (prizesScrollRef.current) {
                          prizesScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                        }
                      }}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all z-10 shadow-lg"
                      aria-label="Anterior"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Flecha derecha - solo si hay más contenido a la derecha */}
                  {canScrollRight && (
                    <button
                      onClick={() => {
                        if (prizesScrollRef.current) {
                          prizesScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                        }
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all z-10 shadow-lg"
                      aria-label="Siguiente"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha - Selector de tickets */}
          <div className="lg:col-span-3 order-2">
            <div className="bg-slate-950 rounded-lg shadow-lg p-3 sm:p-4 lg:sticky lg:top-4">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 whitespace-pre-line">{raffle.name}</h1>
              {raffle.extra && (
                <p className="text-xs sm:text-sm text-white mb-3 sm:mb-4 whitespace-pre-line">{raffle.extra}</p>
              )}
              
              {/* Fecha del sorteo si es futura */}
              {isFutureDate && raffle.date && (
                <div className="mb-4 pb-4 border-b border-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-white">Fecha del sorteo</p>
                      <p className="text-sm font-bold text-white">{formatDate(raffle.date)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Participar</h2>
              
              <div className="mb-3 sm:mb-4 bg-gray-100 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-gray-600 mb-1">Precio por ticket</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {formatPrice(raffle.ticketPrice, raffle.ticketCurrency)}
                </p>
              </div>

              {raffle.selectNumber ? (
                <>
                  {raffle.minTickets && raffle.minTickets > 0 && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <span className="font-semibold">Mínimo de tickets a comprar:</span> {raffle.minTickets}
                      </p>
                    </div>
                  )}
                  <TicketSelector
                    raffleId={raffle.id.toString()}
                    ticketLimit={raffle.ticketLimit || 0}
                    purchasedTickets={purchasedTickets}
                    selectedTickets={selectedTickets}
                    onTicketsChange={setSelectedTickets}
                    ticketPrice={raffle.ticketPrice}
                    ticketCurrency={raffle.ticketCurrency}
                  />
                </>
              ) : (
                <div className="mb-4">
                  {/* Título con mínimo */}
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-white">Cantidad</h3>
                    <span className="text-xs text-white">
                      Mínimo {raffle.minTickets || 1}
                    </span>
                  </div>

                  {/* Grid de botones de cantidad */}
                  {(() => {
                    const minTickets = raffle.minTickets || 1;
                    const ticketLimit = raffle.ticketLimit || 999;
                    const validQuantities = [1, 2, 5, 10, 25, 50].filter(qty => qty >= minTickets && qty <= ticketLimit);
                    
                    // Determinar columnas según cantidad de botones válidos
                    let gridCols = 'grid-cols-3';
                    
                    if (validQuantities.length === 1) {
                      gridCols = 'grid-cols-1';
                    } else if (validQuantities.length === 2) {
                      gridCols = 'grid-cols-2';
                    } else if (validQuantities.length === 3) {
                      gridCols = 'grid-cols-3';
                    } else if (validQuantities.length === 4) {
                      gridCols = 'grid-cols-2';
                    } else if (validQuantities.length === 5) {
                      // 5 botones: usar grid de 3 columnas
                      gridCols = 'grid-cols-3';
                    } else {
                      gridCols = 'grid-cols-3';
                    }
                    
                    // Si hay 5 botones, separar los primeros 3 de los últimos 2
                    if (validQuantities.length === 5) {
                      const firstThree = validQuantities.slice(0, 3);
                      const lastTwo = validQuantities.slice(3);
                      
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2">
                            {firstThree.map((qty) => {
                              const isSelected = ticketQuantity === qty;
                              const isPopular = qty === (minTickets === 1 ? 2 : minTickets);
                              
                              return (
                                <button
                                  key={qty}
                                  onClick={() => setTicketQuantity(qty)}
                                  className={`
                                    relative px-2 sm:px-3 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base transition-all
                                    ${isSelected
                                      ? 'bg-yellow-400 text-gray-900 shadow-lg'
                                      : 'bg-gray-800 text-white hover:bg-gray-700'
                                    }
                                  `}
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    {isPopular && !isSelected && (
                                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.47-.3 2.98-.93 4.03-1.92 1.16-1.11 1.67-2.5 1.67-4.07 0-1.75-.81-3.29-2.04-4.24-.12-.09-.26-.18-.4-.26.64-.73 1.4-1.36 2.28-1.87C17.01 4.24 18 6.89 18 10c0 3.31-2.69 6-6 6z"/>
                                      </svg>
                                    )}
                                    <span>{qty}</span>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute bottom-0.5 left-0 right-0 text-[10px] font-normal">
                                      Seleccionado
                                    </div>
                                  )}
                                  {isPopular && !isSelected && (
                                    <div className="absolute bottom-0.5 left-0 right-0 text-[10px] font-normal text-yellow-400">
                                      Más popular
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            {lastTwo.map((qty) => {
                              const isSelected = ticketQuantity === qty;
                              const isPopular = qty === (minTickets === 1 ? 2 : minTickets);
                              
                              return (
                                <button
                                  key={qty}
                                  onClick={() => setTicketQuantity(qty)}
                                  className={`
                                    relative px-2 sm:px-3 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base transition-all flex-1 max-w-[calc(33.333%-0.5rem)]
                                    ${isSelected
                                      ? 'bg-yellow-400 text-gray-900 shadow-lg'
                                      : 'bg-gray-800 text-white hover:bg-gray-700'
                                    }
                                  `}
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    {isPopular && !isSelected && (
                                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.47-.3 2.98-.93 4.03-1.92 1.16-1.11 1.67-2.5 1.67-4.07 0-1.75-.81-3.29-2.04-4.24-.12-.09-.26-.18-.4-.26.64-.73 1.4-1.36 2.28-1.87C17.01 4.24 18 6.89 18 10c0 3.31-2.69 6-6 6z"/>
                                      </svg>
                                    )}
                                    <span>{qty}</span>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute bottom-0.5 left-0 right-0 text-[10px] font-normal">
                                      Seleccionado
                                    </div>
                                  )}
                                  {isPopular && !isSelected && (
                                    <div className="absolute bottom-0.5 left-0 right-0 text-[10px] font-normal text-yellow-400">
                                      Más popular
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      );
                    }
                    
                    return (
                      <div className={`grid ${gridCols} gap-1.5 sm:gap-2 mb-2 sm:mb-3`} style={validQuantities.length <= 2 ? { maxWidth: '200px', margin: '0 auto' } : {}}>
                        {validQuantities.map((qty, idx) => {
                          const isSelected = ticketQuantity === qty;
                          // El más popular es el mínimo o el mínimo + 1 si el mínimo es 1
                          const isPopular = qty === (minTickets === 1 ? 2 : minTickets);
                          
                          return (
                            <button
                              key={qty}
                              onClick={() => setTicketQuantity(qty)}
                              className={`
                                relative px-2 sm:px-3 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base transition-all
                                ${isSelected
                                  ? 'bg-yellow-400 text-gray-900 shadow-lg'
                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                                }
                              `}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                {isPopular && !isSelected && (
                                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.47-.3 2.98-.93 4.03-1.92 1.16-1.11 1.67-2.5 1.67-4.07 0-1.75-.81-3.29-2.04-4.24-.12-.09-.26-.18-.4-.26.64-.73 1.4-1.36 2.28-1.87C17.01 4.24 18 6.89 18 10c0 3.31-2.69 6-6 6z"/>
                                  </svg>
                                )}
                                <span>{qty}</span>
                              </div>
                              {isSelected && (
                                <div className="absolute bottom-0.5 left-0 right-0 text-[10px] font-normal">
                                  Seleccionado
                                </div>
                              )}
                              {isPopular && !isSelected && (
                                <div className="absolute bottom-0.5 left-0 right-0 text-[10px] font-normal text-yellow-400">
                                  Más popular
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Input con botones - y + */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <button
                      onClick={() => setTicketQuantity(Math.max(raffle.minTickets || 1, ticketQuantity - 1))}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-base sm:text-lg transition-colors"
                    >
                      -
                    </button>
                    <div className="flex-1 bg-gray-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                      <span className="text-white text-lg sm:text-xl font-bold">{ticketQuantity}</span>
                    </div>
                    <button
                      onClick={() => setTicketQuantity(Math.min(raffle.ticketLimit || 999, ticketQuantity + 1))}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-base sm:text-lg transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Botón de participar */}
                  <button
                    onClick={handleParticipateClick}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Participar — {formatPrice(totalPrice.toString(), raffle.ticketCurrency)}
                  </button>
                </div>
              )}

              {/* Resumen de selección solo para selectNumber */}
              {raffle.selectNumber && selectedTickets.length > 0 && (
                <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-purple-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm text-gray-900">
                      {selectedTickets.length} ticket{selectedTickets.length > 1 ? 's' : ''} seleccionado{selectedTickets.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-purple-600">
                      {formatPrice(totalPrice.toString(), raffle.ticketCurrency)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-700 mb-1">Números seleccionados:</p>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {selectedTickets.map((num) => (
                        <span
                          key={num}
                          className="px-1.5 sm:px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold"
                        >
                          {formatTicketNumber(num)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {raffle.selectNumber && (
                <button
                  onClick={handleParticipateClick}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 sm:py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl text-xs sm:text-sm mb-3 sm:mb-4"
                  disabled={selectedTickets.length === 0}
                >
                  Participar — {formatPrice(totalPrice.toString(), raffle.ticketCurrency)}
                </button>
              )}

              {/* Card de verificación */}
              <div className="mt-3 sm:mt-4 bg-gray-900 rounded-lg p-3 sm:p-4 shadow-lg">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">Verificar pago o boletos</h3>
                <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">Consulta tus números y el estado de tu compra.</p>
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 sm:py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                >
                  Verificar ahora
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Sección de premios - Carrusel horizontal (solo en responsive, debajo de la card) */}
          {parsedPrizes.length > 0 && (
            <div className="lg:hidden order-3 mt-4">
              {/* Título con total */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-white">Premios</h2>
                <span className="text-sm text-white font-semibold">Total: {parsedPrizes.length}</span>
              </div>
              
              <div className="relative group">
                <div 
                  ref={prizesScrollRef}
                  className="overflow-x-auto scrollbar-hide scroll-smooth touch-pan-x" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                  onScroll={checkScroll}
                >
                  <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                    {parsedPrizes.map((prize, index) => {
                      const position = index + 1;
                      const medalColors = {
                        1: { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', text: 'text-yellow-900' },
                        2: { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', text: 'text-gray-900' },
                        3: { bg: 'bg-gradient-to-br from-orange-400 to-orange-600', text: 'text-orange-900' },
                      };
                      const medalColor = medalColors[position as keyof typeof medalColors] || { bg: 'bg-gray-400', text: 'text-gray-900' };
                      
                      return (
                        <div key={index} className="bg-gray-300 rounded-lg overflow-hidden shadow-md flex items-center gap-3 p-3 min-w-[250px] sm:min-w-[280px] flex-shrink-0">
                          {/* Imagen del premio encapsulada */}
                          {prize.imageId && (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-300">
                              <ImageWithGoogleDrive
                                src={prize.imageId}
                                alt={prize.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Contenido del premio */}
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            {/* Medalla */}
                            <div className={`w-8 h-8 rounded-full ${medalColor.bg} flex items-center justify-center flex-shrink-0`}>
                              <span className={`font-bold text-sm ${medalColor.text}`}>{position}°</span>
                            </div>
                            {/* Nombre del premio */}
                            <p className="text-sm font-semibold text-gray-900 truncate">{prize.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Flecha izquierda - solo si hay más contenido a la izquierda */}
                {canScrollLeft && (
                  <button
                    onClick={() => {
                      if (prizesScrollRef.current) {
                        prizesScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all z-10 shadow-lg"
                    aria-label="Anterior"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                {/* Flecha derecha - solo si hay más contenido a la derecha */}
                {canScrollRight && (
                  <button
                    onClick={() => {
                      if (prizesScrollRef.current) {
                        prizesScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all z-10 shadow-lg"
                    aria-label="Siguiente"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-8 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-white">
            Desarrollado por{' '}
            <a
              href="https://rifasuerte.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-semibold underline"
            >
              rifasuerte.com
            </a>
            {' '}© {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

