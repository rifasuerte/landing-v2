'use client';

import ImageWithGoogleDrive from './ImageWithGoogleDrive';
import { downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';
import { getCachedImage } from '@/lib/utils/image-cache';
import { useState, useEffect } from 'react';

interface ParsedPrize {
  name: string;
  imageId: string | null;
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
}

interface RaffleCardProps {
  raffle: Raffle;
  onBuyClick: (raffle: Raffle) => void;
}

export default function RaffleCard({ raffle, onBuyClick }: RaffleCardProps) {
  const [parsedPrizes, setParsedPrizes] = useState<ParsedPrize[]>([]);
  const [prizeImages, setPrizeImages] = useState<{ [key: number]: string }>({});
  const [loadingPrizes, setLoadingPrizes] = useState(false); // Cambiar a false porque las imágenes ya están precargadas

  useEffect(() => {
    const parseAndLoadPrizes = () => {
      if (!raffle.prizes || raffle.prizes.length === 0) {
        return;
      }

      try {
        // Parsear premios: formato "nombre@imagen" o solo "nombre"
        const parsed: ParsedPrize[] = raffle.prizes.map((prize) => {
          if (prize.includes('@')) {
            const [name, imageId] = prize.split('@');
            return { name: name.trim(), imageId: imageId.trim() };
          }
          return { name: prize.trim(), imageId: null };
        });
        setParsedPrizes(parsed);

        // Cargar imágenes desde caché (ya están precargadas)
        const imagesToLoad = parsed
          .map((prize, index) => ({ prize, index }))
          .filter(({ prize }) => prize.imageId !== null);

        const imageMap: { [key: number]: string } = {};
        imagesToLoad.forEach(({ prize, index }) => {
          if (prize.imageId) {
            // Obtener desde caché (ya están precargadas)
            const cached = getCachedImage(prize.imageId);
            if (cached) {
              imageMap[index] = cached;
            }
          }
        });
        setPrizeImages(imageMap);
      } catch (error) {
        console.error('Error loading prizes:', error);
      }
    };

    parseAndLoadPrizes();
  }, [raffle.prizes]);

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

  // Obtener el primer premio con imagen para mostrar como imagen principal
  const mainPrizeIndex = parsedPrizes.findIndex((prize, index) => prizeImages[index] !== undefined);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      {/* Imagen del premio principal - solo si hay premio con imagen */}
      {mainPrizeIndex >= 0 && prizeImages[mainPrizeIndex] && (
        <div className="relative min-h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <div className="w-full flex items-center justify-center p-4">
            <img
              src={prizeImages[mainPrizeIndex]}
              alt={parsedPrizes[mainPrizeIndex].name}
              className="w-full h-auto max-h-96 object-contain"
              onError={(e) => {
                console.error('Error loading image:', e);
              }}
            />
          </div>
        </div>
      )}

      {/* Contenido de la tarjeta */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">{raffle.name}</h3>
        {raffle.extra && (
          <p className="text-gray-600 mb-4 line-clamp-2">{raffle.extra}</p>
        )}

        {/* Lista de premios */}
        {parsedPrizes.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Premios:</p>
            <div className="space-y-3">
              {parsedPrizes.map((prize, index) => (
                <div key={index} className="flex items-start gap-3">
                  {/* Imagen del premio - solo si tiene @ */}
                  {prize.imageId && prizeImages[index] && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      <img
                        src={prizeImages[index]}
                        alt={prize.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading image:', e);
                        }}
                      />
                    </div>
                  )}
                  {/* Nombre del premio */}
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{prize.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Precio y botón */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-1">Precio por ticket</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatPrice(raffle.ticketPrice, raffle.ticketCurrency)}
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => onBuyClick(raffle)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Comprar Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

