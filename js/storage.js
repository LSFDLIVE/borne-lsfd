/* Stockage commun LSFD : données en localStorage, image de carte en IndexedDB. */
const LSFD_DATA_KEY = 'lsfd-map-data-v4';
const LSFD_LEGACY_DATA_KEY = 'lsfd-map-data-v3';
const LSFD_DB_NAME = 'lsfd-map-assets';
const LSFD_DB_STORE = 'assets';

function openLsfdDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LSFD_DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(LSFD_DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function getCustomMap() {
  try {
    const db = await openLsfdDB();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(LSFD_DB_STORE, 'readonly').objectStore(LSFD_DB_STORE).get('map');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.warn('Carte personnalisée indisponible', e); return null; }
}
async function setCustomMap(dataUrl) {
  const db = await openLsfdDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LSFD_DB_STORE, 'readwrite');
    tx.objectStore(LSFD_DB_STORE).put(dataUrl, 'map');
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function clearCustomMap() {
  const db = await openLsfdDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LSFD_DB_STORE, 'readwrite');
    tx.objectStore(LSFD_DB_STORE).delete('map');
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
function normalizeData(raw) {
  if (Array.isArray(raw)) return { markers: raw, hazmatZones: [] };
  if (!raw || !Array.isArray(raw.markers)) throw new Error('Format de données invalide.');
  return { markers: raw.markers, hazmatZones: Array.isArray(raw.hazmatZones) ? raw.hazmatZones : [] };
}
async function loadLsfdData() {
  const saved = localStorage.getItem(LSFD_DATA_KEY);
  if (saved) {
    try { return normalizeData(JSON.parse(saved)); } catch (e) { console.warn('Données locales invalides, chargement du fichier initial.', e); }
  }

  // Migration unique des anciennes données locales : conserve les zones HAZMAT
  // et applique le même décalage horizontal aux marqueurs et aux polygones.
  const legacy = localStorage.getItem(LSFD_LEGACY_DATA_KEY);
  if (legacy) {
    try {
      const migrated = normalizeData(JSON.parse(legacy));
      migrated.markers.forEach(item => { if (Number.isFinite(item.x)) item.x -= 100; });
      migrated.hazmatZones.forEach(zone => {
        if (Array.isArray(zone.points)) zone.points.forEach(point => { if (Number.isFinite(point.x)) point.x -= 100; });
      });
      localStorage.setItem(LSFD_DATA_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LSFD_LEGACY_DATA_KEY);
      return migrated;
    } catch (e) { console.warn('Migration locale impossible, chargement du fichier initial.', e); }
  }

  const response = await fetch('hydrant.json');
  if (!response.ok) throw new Error('Impossible de charger hydrant.json');
  const data = normalizeData(await response.json());
  localStorage.setItem(LSFD_DATA_KEY, JSON.stringify(data));
  return data;
}
function saveLsfdData(data) {
  localStorage.setItem(LSFD_DATA_KEY, JSON.stringify(data));
}
