import type { PetStats } from '../../types/pet';

export const DEFAULT_PET_NAMES = ['Mochi', 'Pico', 'Nori', 'Mimi', 'Bobo'];

export const INITIAL_STATS: PetStats = {
  hunger: 80,
  mood: 75,
  cleanliness: 80,
  energy: 75,
  health: 90
};

export const MAX_STAT = 100;
export const MIN_STAT = 0;

export const ONLINE_TICK_MS = 30_000;
export const OFFLINE_CAP_MINUTES = 24 * 60;
export const CRITICAL_AFTER_MINUTES = 90;
export const DEATH_AFTER_MINUTES = 180;
export const SLEEP_AUTO_WAKE_MINUTES = 90;

export const STORAGE_KEY = 'ai-coding-pet-save';
export const SAVE_VERSION = 1;
