import { getDesktopBridge } from '../desktop/window/window-bridge';
import type { DesktopPreferences } from '../types/desktop';

const DESKTOP_STORAGE_KEY = 'ai-coding-pet-desktop-preferences';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function loadDesktopPreferences(): DesktopPreferences {
  const desktopBridge = getDesktopBridge();

  if (desktopBridge) {
    const desktopPreferences = desktopBridge.readDesktopPreferences();

    if (desktopPreferences) {
      return {
        preferredX:
          typeof desktopPreferences.preferredX === 'number'
            ? desktopPreferences.preferredX
            : null
      };
    }
  }

  const storage = getStorage();

  if (!storage) {
    return { preferredX: null };
  }

  try {
    const raw = storage.getItem(DESKTOP_STORAGE_KEY);

    if (!raw) {
      return { preferredX: null };
    }

    const parsed = JSON.parse(raw) as Partial<DesktopPreferences>;

    return {
      preferredX: typeof parsed.preferredX === 'number' ? parsed.preferredX : null
    };
  } catch {
    return { preferredX: null };
  }
}

export function persistDesktopPreferences(preferences: DesktopPreferences): void {
  const desktopBridge = getDesktopBridge();

  if (desktopBridge) {
    desktopBridge.writeDesktopPreferences(preferences);
  }

  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(DESKTOP_STORAGE_KEY, JSON.stringify(preferences));
}
