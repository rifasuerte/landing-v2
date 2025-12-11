'use client';

import { useState, useEffect, useRef } from 'react';
import ImageWithGoogleDrive from './ImageWithGoogleDrive';

interface Prize {
  name: string;
  imageId: string | null;
}

interface PrizeCarouselProps {
  prizes: Prize[];
}

export default function PrizeCarousel({ prizes }: PrizeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => {
      // Ir hacia adelante (de la última a la primera)
      if (prevIndex === prizes.length - 1) {
        return 0;
      }
      return prevIndex + 1;
    });
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => {
      // Ir hacia atrás (de la primera a la última)
      if (prevIndex === 0) {
        return prizes.length - 1;
      }
      return prevIndex - 1;
    });
  };

  const resetInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        // Ir de la última a la primera (retroceder)
        if (prevIndex === 0) {
          return prizes.length - 1;
        }
        return prevIndex - 1;
      });
    }, 10000); // 10 segundos
  };

  useEffect(() => {
    if (prizes.length === 0) return;
    
    // Iniciar desde la última imagen
    setCurrentIndex(prizes.length - 1);

    // Iniciar el intervalo
    resetInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [prizes.length]);

  const handleManualNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      goToNext();
    } else {
      goToPrevious();
    }
    // Reiniciar el intervalo cuando se navega manualmente
    resetInterval();
  };

  // Funciones para manejar el swipe en móvil
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
      resetInterval();
    }
    if (isRightSwipe) {
      goToPrevious();
      resetInterval();
    }
  };

  if (prizes.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-purple-100 to-pink-100 group flex-1 min-h-0">
      {/* Botón flecha izquierda */}
      <button
        onClick={() => handleManualNavigation('prev')}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Imagen anterior"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Botón flecha derecha */}
      <button
        onClick={() => handleManualNavigation('next')}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Siguiente imagen"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Contenedor con todas las imágenes para el slide */}
      <div 
        ref={carouselRef}
        className="flex h-full transition-transform duration-700 ease-in-out touch-pan-y"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% / ${prizes.length}))`,
          width: `${prizes.length * 100}%`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {prizes.map((prize, index) => (
          <div
            key={index}
            className="h-full flex-shrink-0 relative"
            style={{ width: `${100 / prizes.length}%` }}
          >
            {prize.imageId && (
              <ImageWithGoogleDrive
                src={prize.imageId}
                alt={prize.name}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Nombre del premio */}
            {prize.name && (
              <div className="absolute top-4 left-4 right-4">
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
                  <p className="font-semibold">{prize.name}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-[1]">
        {prizes.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              resetInterval();
            }}
            className={`rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8 h-2'
                : 'bg-white/50 hover:bg-white/75 w-2 h-2'
            }`}
            aria-label={`Ir al premio ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

