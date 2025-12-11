/**
 * Utilidades para cachear imágenes en localStorage
 */

const CACHE_PREFIX = 'rifasuerte_image_cache_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 días

interface CachedImage {
  data: string; // base64 data URL
  timestamp: number;
}

/**
 * Guarda una imagen en el caché
 */
export function cacheImage(fileId: string, dataUrl: string): void {
  try {
    const cached: CachedImage = {
      data: dataUrl,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${fileId}`, JSON.stringify(cached));
  } catch (error) {
    // Si localStorage está lleno o no disponible, ignorar
    console.warn('No se pudo guardar en caché:', error);
  }
}

/**
 * Obtiene una imagen del caché si existe y no ha expirado
 */
export function getCachedImage(fileId: string): string | null {
  try {
    const cachedStr = localStorage.getItem(`${CACHE_PREFIX}${fileId}`);
    if (!cachedStr) return null;

    const cached: CachedImage = JSON.parse(cachedStr);
    
    // Verificar si ha expirado
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`${CACHE_PREFIX}${fileId}`);
      return null;
    }

    return cached.data;
  } catch (error) {
    return null;
  }
}

/**
 * Precarga una imagen en el navegador esperando a que se cargue completamente
 */
function preloadImageInBrowser(dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Error al cargar imagen en navegador'));
    img.src = dataUrl;
  });
}

/**
 * Precarga múltiples imágenes y las guarda en caché
 * También espera a que se carguen completamente en el navegador
 */
export async function preloadImages(
  fileIds: string[],
  downloadFn: (fileId: string) => Promise<string>,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const validFileIds = fileIds.filter(id => id && !id.startsWith('http') && !id.startsWith('data:'));
  
  if (validFileIds.length === 0) {
    onProgress?.(0, 0);
    return;
  }

  let loaded = 0;
  const total = validFileIds.length;

  // Cargar todas las imágenes en paralelo, pero con límite de concurrencia
  const batchSize = 5; // Cargar 5 imágenes a la vez
  const batches: string[][] = [];
  
  for (let i = 0; i < validFileIds.length; i += batchSize) {
    batches.push(validFileIds.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await Promise.allSettled(
      batch.map(async (fileId) => {
        try {
          // Verificar si ya está en caché
          let dataUrl = getCachedImage(fileId);
          
          if (!dataUrl) {
            // Si no está en caché, descargarla
            dataUrl = await downloadFn(fileId);
            cacheImage(fileId, dataUrl);
          }

          // Esperar a que la imagen se cargue completamente en el navegador
          await preloadImageInBrowser(dataUrl);
          
          loaded++;
          onProgress?.(loaded, total);
        } catch (error) {
          console.warn(`Error precargando imagen ${fileId}:`, error);
          loaded++;
          onProgress?.(loaded, total);
        }
      })
    );
  }
}

