import {
  CRITICAL_AFTER_MINUTES,
  DEATH_AFTER_MINUTES
} from '../pet/pet-constants';
import { getCareQuality } from '../pet/pet-model';
import type {
  PetCondition,
  PetMemorialRecord,
  PetRuntimeState
} from '../../types/pet';

function countStatsAtOrBelow(
  pet: PetRuntimeState,
  threshold: number
): number {
  return Object.values(pet.stats).filter((value) => value <= threshold).length;
}

export function evaluateCondition(
  pet: PetRuntimeState,
  now: number
): PetRuntimeState {
  if (!pet.isAlive) {
    return {
      ...pet,
      condition: 'dead',
      isSleeping: false,
      sleepStartedAt: null
    };
  }

  const lowCount = countStatsAtOrBelow(pet, 15);
  const warningCount = countStatsAtOrBelow(pet, 25);
  const dangerActive = pet.stats.health <= 20 || lowCount >= 3;
  const canEscalateToCritical =
    dangerActive &&
    pet.enteredDangerAt !== null &&
    now - pet.enteredDangerAt >= CRITICAL_AFTER_MINUTES * 60 * 1000;
  const criticalActive =
    pet.stats.health <= 8 ||
    (canEscalateToCritical && (pet.stats.health <= 15 || warningCount >= 3));

  let enteredDangerAt = pet.enteredDangerAt;
  let enteredCriticalAt = pet.enteredCriticalAt;

  if (dangerActive) {
    enteredDangerAt ??= now;
  } else {
    enteredDangerAt = null;
    enteredCriticalAt = null;
  }

  if (criticalActive) {
    enteredCriticalAt ??= now;
  } else if (!dangerActive) {
    enteredCriticalAt = null;
  }

  const shouldDie =
    enteredCriticalAt !== null &&
    now - enteredCriticalAt >= DEATH_AFTER_MINUTES * 60 * 1000 &&
    (pet.stats.health <= 10 || lowCount >= 3);

  if (shouldDie) {
    return {
      ...pet,
      condition: 'dead',
      isAlive: false,
      isSleeping: false,
      sleepStartedAt: null,
      enteredDangerAt,
      enteredCriticalAt
    };
  }

  let condition: PetCondition = 'normal';

  if (criticalActive) {
    condition = 'critical';
  } else if (dangerActive) {
    condition = 'danger';
  } else if (pet.stats.health <= 25) {
    condition = 'weak';
  } else if (pet.stats.cleanliness <= 20 && pet.stats.health <= 60) {
    condition = 'sick';
  } else if (pet.stats.mood <= 25) {
    condition = 'depressed';
  } else if (pet.stats.energy <= 25) {
    condition = 'tired';
  }

  return {
    ...pet,
    condition,
    enteredDangerAt,
    enteredCriticalAt,
    careQuality: getCareQuality(pet.careScore)
  };
}

export function createMemorialRecord(
  pet: PetRuntimeState,
  diedAt: number
): PetMemorialRecord {
  return {
    petId: pet.identity.id,
    name: pet.identity.name,
    gender: pet.identity.gender,
    livedDays: Math.max(
      1,
      Math.ceil((diedAt - pet.identity.createdAt) / (1000 * 60 * 60 * 24))
    ),
    finalStage: pet.stage,
    careQuality: getCareQuality(pet.careScore),
    diedAt
  };
}
