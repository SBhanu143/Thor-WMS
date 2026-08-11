/**
 * Thor WMS — Chrome Storage Utility
 * Uses chrome.storage.local when available, falls back to localStorage.
 */

export interface HistoryItem {
  id: string;
  type: 'qr' | 'barcode' | 'bin' | 'bb' | 'empty_bin';
  value: string;
  timestamp: number;
}

export interface ExtensionSettings {
  soundEnabled: boolean;
  autoStopScanner: boolean;
  reducedMotion: 'auto' | 'on' | 'off';
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  soundEnabled: true,
  autoStopScanner: true,
  reducedMotion: 'auto',
};

const HISTORY_KEY = 'thor_wms_ext_history';
const SETTINGS_KEY = 'thor_wms_ext_settings';
const MAX_HISTORY = 50;

const isExtension = typeof chrome !== 'undefined' && chrome.storage?.local;

async function getFromStorage<T>(key: string, fallback: T): Promise<T> {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] ?? fallback);
      });
    });
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setToStorage<T>(key: string, value: T): Promise<void> {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export async function addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
  const history = await getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  // Deduplicate: skip if same type+value in last 3 entries
  const isDupe = history.slice(0, 3).some(h => h.type === item.type && h.value === item.value);
  if (isDupe) return;
  const updated = [newItem, ...history].slice(0, MAX_HISTORY);
  await setToStorage(HISTORY_KEY, updated);
}

export async function getHistory(): Promise<HistoryItem[]> {
  return getFromStorage<HistoryItem[]>(HISTORY_KEY, []);
}

export async function clearHistory(): Promise<void> {
  await setToStorage(HISTORY_KEY, []);
}

export async function getSettings(): Promise<ExtensionSettings> {
  return getFromStorage<ExtensionSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await setToStorage(SETTINGS_KEY, settings);
}
