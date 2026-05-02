import { SAVE_VERSION } from '../pet/pet-constants';
import { createNewPet } from '../pet/pet-model';
import type { SaveData } from '../../types/save';
import type { PetGender, PetRuntimeState } from '../../types/pet';

function normalizeCurrentPet(raw: unknown): PetRuntimeState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const pet = raw as Partial<PetRuntimeState>;

  if (!pet.identity || typeof pet.identity !== 'object') {
    return null;
  }

  const identity = pet.identity as PetRuntimeState['identity'];

  return {
    identity: {
      id: typeof identity.id === 'string' ? identity.id : `pet-${Date.now()}`,
      name: typeof identity.name === 'string' ? identity.name : 'Mochi',
      gender:
        identity.gender === 'boy' || identity.gender === 'girl' || identity.gender === 'unknown'
          ? identity.gender
          : 'unknown',
      species: identity.species === 'dog' ? 'dog' : 'cat',
      createdAt: typeof identity.createdAt === 'number' ? identity.createdAt : Date.now()
    },
    stage: pet.stage === 'child' || pet.stage === 'adult' ? pet.stage : 'baby',
    stats: {
      hunger: typeof pet.stats?.hunger === 'number' ? pet.stats.hunger : 80,
      mood: typeof pet.stats?.mood === 'number' ? pet.stats.mood : 75,
      cleanliness: typeof pet.stats?.cleanliness === 'number' ? pet.stats.cleanliness : 80,
      energy: typeof pet.stats?.energy === 'number' ? pet.stats.energy : 75,
      health: typeof pet.stats?.health === 'number' ? pet.stats.health : 90
    },
    condition:
      pet.condition &&
      ['normal', 'tired', 'depressed', 'sick', 'weak', 'danger', 'critical', 'dead'].includes(
        pet.condition
      )
        ? pet.condition
        : 'normal',
    isSleeping: Boolean(pet.isSleeping),
    sleepStartedAt: typeof pet.sleepStartedAt === 'number' ? pet.sleepStartedAt : null,
    sleepEndsAt: typeof pet.sleepEndsAt === 'number' ? pet.sleepEndsAt : null,
    lastUpdatedAt: typeof pet.lastUpdatedAt === 'number' ? pet.lastUpdatedAt : Date.now(),
    lastInteractedAt:
      typeof pet.lastInteractedAt === 'number' ? pet.lastInteractedAt : Date.now(),
    enteredDangerAt: typeof pet.enteredDangerAt === 'number' ? pet.enteredDangerAt : null,
    enteredCriticalAt:
      typeof pet.enteredCriticalAt === 'number' ? pet.enteredCriticalAt : null,
    careScore: typeof pet.careScore === 'number' ? pet.careScore : 0,
    careQuality:
      pet.careQuality === 'excellent' ||
      pet.careQuality === 'good' ||
      pet.careQuality === 'poor'
        ? pet.careQuality
        : 'normal',
    isAlive: pet.isAlive !== false
  };
}

export function createEmptySave(): SaveData {
  return {
    version: SAVE_VERSION,
    currentPet: null,
    memorials: []
  };
}

export function normalizeSaveData(input: unknown): SaveData | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const raw = input as Partial<SaveData>;
  const memorials = Array.isArray(raw.memorials) ? raw.memorials : [];

  return {
    version: typeof raw.version === 'number' ? raw.version : SAVE_VERSION,
    currentPet: normalizeCurrentPet(raw.currentPet),
    memorials
  };
}

export function createReplacementPet(now = Date.now()) {
  return createNewPet('', 'unknown' as PetGender, 'cat', now);
}
