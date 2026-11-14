/**
 * IndexedDB storage for custom user wallpapers (supports large files, animated GIFs, and URLs)
 */
const DB_NAME = 'orange_music_custom_theme';
const STORE_NAME = 'wallpapers';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setStoredCustomWallpaper(data) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, 'custom_wallpaper');
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('Failed to save wallpaper to IndexedDB, fallback to localStorage', e);
    try {
      if (typeof data === 'string' && data.length < 2000000) {
        localStorage.setItem('orange_music_custom_wallpaper_data', data);
      }
    } catch (err) {}
    return false;
  }
}

export async function getStoredCustomWallpaper() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('custom_wallpaper');
    return new Promise((resolve) => {
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else {
          // Fallback to localStorage if any
          const lsData = localStorage.getItem('orange_music_custom_wallpaper_data');
          resolve(lsData || null);
        }
      };
      req.onerror = () => {
        const lsData = localStorage.getItem('orange_music_custom_wallpaper_data');
        resolve(lsData || null);
      };
    });
  } catch (e) {
    const lsData = localStorage.getItem('orange_music_custom_wallpaper_data');
    return lsData || null;
  }
}

export async function removeStoredCustomWallpaper() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('custom_wallpaper');
  } catch (e) {}
  try {
    localStorage.removeItem('orange_music_custom_wallpaper_data');
  } catch (e) {}
}
