'use client';

import { useState, useEffect } from 'react';
import { downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';
import { getCachedImage, cacheImage } from '@/lib/utils/image-cache';

interface ImageWithGoogleDriveProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
}

/**
 * Componente que detecta si la imagen es un ID de Google Drive o base64
 * y la carga apropiadamente
 */
export default function ImageWithGoogleDrive({ 
  src, 
  alt, 
  className = '', 
  fallback,
  width,
  height
}: ImageWithGoogleDriveProps) {
  // Inicializar estado: si está en caché o es base64, no mostrar loading
  const getInitialState = () => {
    if (!src) {
      return { imageSrc: null, loading: false, error: false };
    }
    if (src.startsWith('data:image') || src.startsWith('data:video') || src.startsWith('http')) {
      return { imageSrc: src, loading: false, error: false };
    }
    const cached = getCachedImage(src);
    if (cached) {
      return { imageSrc: cached, loading: false, error: false };
    }
    return { imageSrc: null, loading: true, error: false };
  };

  const initialState = getInitialState();
  const [imageSrc, setImageSrc] = useState<string | null>(initialState.imageSrc);
  const [loading, setLoading] = useState(initialState.loading);
  const [error, setError] = useState(initialState.error);

  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setLoading(false);
      setError(false);
      return;
    }

    // Si es base64 (data:image), usar directamente
    if (src.startsWith('data:image') || src.startsWith('data:video') || src.startsWith('http')) {
      setImageSrc(src);
      setLoading(false);
      setError(false);
      return;
    }

    // Si no es base64, asumimos que es un ID de Google Drive
    let cancelled = false;
    
    // Primero verificar el caché - si está, usar inmediatamente SIN loading
    const cached = getCachedImage(src);
    if (cached) {
      setImageSrc(cached);
      setLoading(false);
      setError(false);
      return;
    }
    
    // Si no está en caché, mostrar loading y descargar
    setImageSrc(null);
    setLoading(true);
    setError(false);
    
    downloadGoogleDriveFileAsBase64(src)
      .then((blobUrl) => {
        if (!cancelled) {
          // Guardar en caché
          cacheImage(src, blobUrl);
          setImageSrc(blobUrl);
          setLoading(false);
          setError(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
          setImageSrc(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) {
    return fallback || null;
  }

  if (error) {
    return fallback || (
      <div className={`flex items-center justify-center rounded bg-gray-200 text-gray-400 ${className}`}>
        <span className="text-xs">Sin imagen</span>
      </div>
    );
  }

  if (loading || !imageSrc) {
    return (
      <div className={`flex items-center justify-center rounded bg-gray-200 text-gray-400 ${className}`}>
        <span className="text-xs">Cargando...</span>
      </div>
    );
  }

  if (imageSrc.startsWith('data:video')) {
    return (
      <video
        src={imageSrc}
        title={alt}
        className={className}
        width={width}
        height={height}
        controls
        style={{ display: 'block' }}
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={{ display: 'block' }}
      crossOrigin="anonymous"
      onError={() => {
        setError(true);
        setImageSrc(null);
      }}
    />
  );
}

