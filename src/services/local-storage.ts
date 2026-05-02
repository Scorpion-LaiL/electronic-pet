import { STORAGE_KEY } from '../domain/pet/pet-constants';
import { createEmptySave, normalizeSaveData } from '../domain/save/save-schema';
import type { SaveData } from '../types/save';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function loadSaveData(): SaveData {
  const storage = getStorage();

  if (!storage) {
    return createEmptySave();
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptySave();
    }

    const parsed = JSON.parse(raw);
    return normalizeSaveData(parsed) ?? createEmptySave();
  } catch {
    return createEmptySave();
  }
}

export function persistSaveData(saveData: SaveData): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}

export function clearSaveData(): void {
  const storage = getStorage();

  storage?.removeItem(STORAGE_KEY);
}
