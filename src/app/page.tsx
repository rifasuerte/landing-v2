'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import ImageWithGoogleDrive from '@/components/ImageWithGoogleDrive';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import RaffleCard from '@/components/RaffleCard';
import { preloadImages } from '@/lib/utils/image-cache';
import { downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

interface Client {
  id: number;
  name: string;
  fantasyName: string;
  logoURL: string | null;
  bannerURL: string | null;
  banner2URL: string | null;
  videoURL: string | null;
  whatsapp: string;
}

interface Raffle {
  id: number;
  innerCode: string;
  name: string;
  extra?: string;
  ticketPrice: string;
  ticketCurrency: string;
  prizes: string[];
  ticketsCount?: number;
  ticketLimit?: number;
  date?: string;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener el dominio/subdominio
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const domain = hostname === 'localhost' ? 'localhost' : hostname.split('.')[0];

        // Obtener información del cliente
        const clientResponse = await fetch(`${API_URL}/client/${domain}/search`);
        if (!clientResponse.ok) {
          throw new Error('No se pudo obtener la información del cliente');
        }
        const clientData: Client = await clientResponse.json();
        setClient(clientData);

        // Obtener rifas activas
        const rafflesResponse = await fetch(`${API_URL}/raffle/active/client/${clientData.id}`);
        if (!rafflesResponse.ok) {
          throw new Error('No se pudieron obtener las rifas activas');
        }
        const rafflesData: Raffle[] = await rafflesResponse.json();
        setRaffles(rafflesData);

        // Recopilar todos los IDs de imágenes y videos para precargar
        const imageIds: string[] = [];
        
        // Logo del cliente
        if (clientData.logoURL) imageIds.push(clientData.logoURL);
        // Banner principal
        if (clientData.bannerURL) imageIds.push(clientData.bannerURL);
        // Banner 2
        if (clientData.banner2URL) imageIds.push(clientData.banner2URL);
        // Video
        if (clientData.videoURL) imageIds.push(clientData.videoURL);
        
        // Imágenes de premios de todas las rifas
        rafflesData.forEach((raffle) => {
          raffle.prizes.forEach((prize) => {
            if (prize.includes('@')) {
              const [, imageId] = prize.split('@');
              if (imageId && imageId.trim()) {
                imageIds.push(imageId.trim());
              }
            }
          });
        });

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

    fetchData();
  }, []);

  const handleBuyClick = (raffle: Raffle) => {
    router.push(`/rifa/${raffle.innerCode}`);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500">
        <div className="text-center text-white p-8">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-xl">{error || 'No se pudo cargar la información'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header con logo y nombre */}
      <header className="bg-slate-900/95 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b border-slate-800">
        <div className="container mx-auto px-4 py-2 flex items-center justify-start gap-3">
          {client.logoURL && (
            <button
              onClick={() => router.push('/')}
              className="w-12 h-12 md:w-12 md:h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ImageWithGoogleDrive
                src={client.logoURL}
                alt={client.fantasyName}
                className="w-full h-full object-contain"
              />
            </button>
          )}
          <h1 className="text-base md:text-lg font-bold text-white">
            {client.fantasyName}
          </h1>
        </div>
      </header>

      {/* Banner principal */}
      {client.bannerURL && (
        <div className="w-full h-64 md:h-96 relative overflow-hidden">
          <ImageWithGoogleDrive
            src={client.bannerURL}
            alt="Banner principal"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Video (si existe) */}
      {client.videoURL && (
        <div className="container mx-auto px-4 py-8">
          <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <CustomVideoPlayer
              src={client.videoURL}
              className=""
            />
          </div>
        </div>
      )}

      {/* Banner 2 */}
      {client.banner2URL && (
        <div className="container mx-auto px-4 py-8">
          <div className="w-full rounded-2xl overflow-hidden shadow-xl">
            <ImageWithGoogleDrive
              src={client.banner2URL}
              alt="Banner secundario"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      )}

      {/* Sección de rifas */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Rifas Activas
          </h2>
          <p className="text-xl md:text-2xl text-gray-600">
            Participa y gana increíbles premios
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {raffles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-500">No hay rifas activas en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {raffles.map((raffle) => (
              <RaffleCard
                key={raffle.id}
                raffle={raffle}
                onBuyClick={handleBuyClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sección de Preguntas Frecuentes */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            🌟 ¿Cómo Comprar Tus Tickets? 🌟
          </h2>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <span>1. 🎫 Elige cuántos tickets quieres</span>
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Entra a la rifa que te gusta.</li>
                  <li>Toca "Comprar Tickets".</li>
                  <li>Elige cuántos tickets deseas.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <span>2. ✅ Acepta los Términos y Condiciones</span>
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Lee los términos si quieres.</li>
                  <li>Marca "Acepto".</li>
                  <li>Sigue al próximo paso.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <span>3. 💳 Paga tus tickets</span>
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Paga con transferencia, tarjeta u otro método.</li>
                  <li>Completa el pago.</li>
                  <li>Guarda la foto del comprobante.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <span>4. 📤 Sube tu comprobante</span>
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>La página te lo pedirá.</li>
                  <li>Toca "Subir archivo".</li>
                  <li>Elige y sube la foto del pago.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <span>5. 📧 Revisa tu email de reserva</span>
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Te llegará un email confirmando tu reserva.</li>
                  <li>Si no lo ves, busca en "spam".</li>
                  <li>Si no llegó, usa el Validador de Compras con tu email o tu teléfono.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <span>6. 🕒 Espera la confirmación final</span>
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Revisamos tu comprobante.</li>
                  <li>A veces demora unas horas.</li>
                  <li>Luego te enviaremos un email confirmando tu compra.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <span>7. 🏆 Si ganas, te avisamos</span>
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Si tu ticket gana, te escribimos.</li>
                  <li>Puede ser por email o WhatsApp.</li>
                  <li>Coordinamos cómo entregarte tu premio.</li>
                </ul>
              </div>
            </div>

            {/* Botón de WhatsApp */}
            {client.whatsapp && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <a
                  href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>¿Necesitas ayuda? Comunícate con nosotros</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            {/* Logo y nombre en círculo */}
            <div className="flex items-center gap-3">
              {client.logoURL && (
                <div className="w-16 h-16 rounded-full bg-white p-2 flex-shrink-0">
                  <ImageWithGoogleDrive
                    src={client.logoURL}
                    alt={client.fantasyName}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <p className="text-lg font-semibold">{client.fantasyName}</p>
            </div>
            
            {/* Copyright */}
            <div className="text-center text-gray-400 text-sm">
              <p>
                Desarrollado por{' '}
                <a
                  href="https://rifasuerte.com"
            target="_blank"
            rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors underline"
          >
                  rifasuerte.com
          </a>
                {' '}© {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
