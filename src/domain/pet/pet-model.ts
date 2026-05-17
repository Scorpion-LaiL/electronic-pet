import { DEFAULT_PET_NAMES, INITIAL_STATS } from './pet-constants';
import type {
  CareQuality,
  PetGender,
  PetSpecies,
  PetRuntimeState,
  PetStats
} from '../../types/pet';

export function clampStat(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

export function clampStats(stats: PetStats): PetStats {
  return {
    hunger: clampStat(stats.hunger),
    mood: clampStat(stats.mood),
    cleanliness: clampStat(stats.cleanliness),
    energy: clampStat(stats.energy),
    health: clampStat(stats.health)
  };
}

export function sanitizePetName(input: string, seed = Date.now()): string {
  const trimmed = input.trim().replace(/\s+/g, ' ').slice(0, 14);

  if (trimmed.length > 0) {
    return trimmed;
  }

  return DEFAULT_PET_NAMES[seed % DEFAULT_PET_NAMES.length];
}

export function getCareQuality(careScore: number): CareQuality {
  if (careScore >= 220) {
    return 'excellent';
  }

  if (careScore >= 140) {
    return 'good';
  }

  if (careScore >= 60) {
    return 'normal';
  }

  return 'poor';
}

export function createNewPet(
  name: string,
  gender: PetGender,
  species: PetSpecies,
  now = Date.now()
): PetRuntimeState {
  return {
    identity: {
      id: `pet-${now}`,
      name: sanitizePetName(name, now),
      gender,
      species,
      createdAt: now
    },
    stage: 'baby',
    stats: INITIAL_STATS,
    condition: 'normal',
    isSleeping: false,
    sleepStartedAt: null,
    sleepEndsAt: null,
    lastUpdatedAt: now,
    lastInteractedAt: now,
    enteredDangerAt: null,
    enteredCriticalAt: null,
    careScore: 0,
    careQuality: 'normal',
    careActionHistory: [],
    isAlive: true
  };
}
