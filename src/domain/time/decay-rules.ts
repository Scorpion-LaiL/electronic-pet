import {
  ONLINE_TICK_MS,
  SLEEP_AUTO_WAKE_MINUTES
} from '../pet/pet-constants';
import { clampStats } from '../pet/pet-model';
import type { PetRuntimeState, PetStats } from '../../types/pet';

export const ONLINE_TICK_INTERVAL_MS = ONLINE_TICK_MS;

const ONLINE_DECAY_PER_MINUTE = {
  hunger: 0.24,
  mood: 0.12,
  cleanliness: 0.09,
  energy: 0.07
};

function applyHealthShift(stats: PetStats, minutes: number): number {
  const warningStats = Object.values(stats).filter((value) => value <= 30).length;
  const dangerStats = Object.values(stats).filter((value) => value <= 15).length;
  const healthLoss = warningStats * 0.08 * minutes + dangerStats * 0.04 * minutes;
  const healthRecovery =
    warningStats === 0 &&
    stats.hunger >= 60 &&
    stats.mood >= 60 &&
    stats.cleanliness >= 60 &&
    stats.energy >= 55
      ? 0.06 * minutes
      : 0;

  return healthRecovery - healthLoss;
}

export function applyOnlineDecay(
  pet: PetRuntimeState,
  now: number
): PetRuntimeState {
  const elapsedMinutes = (now - pet.lastUpdatedAt) / (1000 * 60);

  if (elapsedMinutes <= 0 || !pet.isAlive) {
    return pet;
  }

  const nextStats = { ...pet.stats };

  if (pet.isSleeping) {
    nextStats.hunger -= 0.16 * elapsedMinutes;
    nextStats.cleanliness -= 0.08 * elapsedMinutes;
    nextStats.mood += 0.08 * elapsedMinutes;
    nextStats.energy += 0.62 * elapsedMinutes;
  } else {
    nextStats.hunger -= ONLINE_DECAY_PER_MINUTE.hunger * elapsedMinutes;
    nextStats.mood -= ONLINE_DECAY_PER_MINUTE.mood * elapsedMinutes;
    nextStats.cleanliness -= ONLINE_DECAY_PER_MINUTE.cleanliness * elapsedMinutes;
    nextStats.energy -= ONLINE_DECAY_PER_MINUTE.energy * elapsedMinutes;
  }

  nextStats.health += applyHealthShift(nextStats, elapsedMinutes);

  const sleepElapsedMinutes =
    pet.sleepStartedAt === null ? 0 : (now - pet.sleepStartedAt) / (1000 * 60);
  const shouldWake =
    pet.isSleeping &&
    (nextStats.energy >= 95 ||
      (pet.sleepEndsAt !== null && now >= pet.sleepEndsAt) ||
      sleepElapsedMinutes >= SLEEP_AUTO_WAKE_MINUTES);

  return {
    ...pet,
    stats: clampStats(nextStats),
    isSleeping: shouldWake ? false : pet.isSleeping,
    sleepStartedAt: shouldWake ? null : pet.sleepStartedAt,
    sleepEndsAt: shouldWake ? null : pet.sleepEndsAt,
    lastUpdatedAt: now,
    careScore: Math.max(0, pet.careScore - elapsedMinutes * 0.025)
  };
}
