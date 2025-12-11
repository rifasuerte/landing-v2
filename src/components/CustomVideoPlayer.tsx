'use client';

import { useState, useRef, useEffect } from 'react';
import { downloadGoogleDriveFileAsBase64 } from '@/lib/utils/google-drive';
import { getCachedImage, cacheImage } from '@/lib/utils/image-cache';

interface CustomVideoPlayerProps {
  src?: string | null;
  className?: string;
}

export default function CustomVideoPlayer({ src, className = '' }: CustomVideoPlayerProps) {
  // Inicializar estado: si está en caché o es base64, no mostrar loading
  const getInitialState = () => {
    if (!src) {
      return { videoSrc: null, loading: false, error: false };
    }
    if (src.startsWith('http') || src.startsWith('data:video')) {
      return { videoSrc: src, loading: false, error: false };
    }
    const cached = getCachedImage(src);
    if (cached) {
      return { videoSrc: cached, loading: false, error: false };
    }
    return { videoSrc: null, loading: true, error: false };
  };

  const initialState = getInitialState();
  const [videoSrc, setVideoSrc] = useState<string | null>(initialState.videoSrc);
  const [loading, setLoading] = useState(initialState.loading);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState(initialState.error);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    // Si es una URL directa, usar directamente
    if (src.startsWith('http') || src.startsWith('data:video')) {
      setVideoSrc(src);
      setLoading(false);
      return;
    }

    // Si es un ID de Google Drive, verificar caché primero
    let cancelled = false;
    
    // Primero verificar el caché
    const cached = getCachedImage(src);
    if (cached) {
      setVideoSrc(cached);
      setLoading(false);
      setError(false);
      return;
    }
    
    // Si no está en caché, mostrar loading y descargar
    setLoading(true);
    setError(false);
    
    downloadGoogleDriveFileAsBase64(src)
      .then((blobUrl) => {
        if (!cancelled) {
          // Guardar en caché
          cacheImage(src, blobUrl);
          setVideoSrc(blobUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (videoRef.current && videoSrc && !loading) {
      videoRef.current.muted = isMuted;
      // Reproducir automáticamente al cargar
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Si falla el autoplay, no hacer nada
      });
    }
  }, [videoSrc, loading, isMuted]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!src || error) {
    return null;
  }

  if (loading || !videoSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`relative group w-full ${className}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-auto"
        loop
        playsInline
        autoPlay
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={togglePlay}
          className="bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-colors"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <button
          onClick={toggleMute}
          className="bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-colors"
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

