import { OFFLINE_CAP_MINUTES } from '../pet/pet-constants';
import { clampStats } from '../pet/pet-model';
import type { OfflineSummary } from '../../types/ui';
import type { PetRuntimeState, PetStats } from '../../types/pet';

const OFFLINE_DECAY_PER_MINUTE = {
  hunger: 8 / 240,
  mood: 5 / 360,
  cleanliness: 5 / 480,
  energy: 4 / 360
};

function getSegmentWeight(minuteIndex: number): number {
  if (minuteIndex <= 120) {
    return 0.6;
  }

  if (minuteIndex <= 480) {
    return 1;
  }

  return 1.15;
}

function applyOfflineHealthShift(stats: PetStats, weightedMinutes: number): number {
  const warningStats = Object.values(stats).filter((value) => value <= 30).length;
  const dangerStats = Object.values(stats).filter((value) => value <= 15).length;

  return -(warningStats * 0.035 * weightedMinutes + dangerStats * 0.02 * weightedMinutes);
}

function getSleepRemainingMinutes(pet: PetRuntimeState, now: number): number {
  if (!pet.isSleeping || pet.sleepEndsAt === null) {
    return 0;
  }

  return Math.max(0, (pet.sleepEndsAt - now) / (1000 * 60));
}

export function applyOfflineSettlement(
  pet: PetRuntimeState,
  now: number
): { pet: PetRuntimeState; summary: OfflineSummary | null } {
  const elapsedMinutes = Math.floor((now - pet.lastUpdatedAt) / (1000 * 60));

  if (elapsedMinutes <= 0 || !pet.isAlive) {
    return { pet, summary: null };
  }

  const appliedMinutes = Math.min(elapsedMinutes, OFFLINE_CAP_MINUTES);
  const initialSleepMinutes = getSleepRemainingMinutes(pet, pet.lastUpdatedAt);
  const sleepingMinutes = Math.min(appliedMinutes, initialSleepMinutes);
  const awakeMinutes = Math.max(0, appliedMinutes - sleepingMinutes);
  let weightedMinutes = 0;

  for (let minute = 1; minute <= awakeMinutes; minute += 1) {
    weightedMinutes += getSegmentWeight(minute);
  }

  const postSleepStats = {
    hunger: pet.stats.hunger - 0.16 * sleepingMinutes,
    mood: pet.stats.mood + 0.08 * sleepingMinutes,
    cleanliness: pet.stats.cleanliness - 0.08 * sleepingMinutes,
    energy: pet.stats.energy + 0.62 * sleepingMinutes,
    health: pet.stats.health
  };

  const nextStats = {
    hunger: postSleepStats.hunger - OFFLINE_DECAY_PER_MINUTE.hunger * weightedMinutes,
    mood: postSleepStats.mood - OFFLINE_DECAY_PER_MINUTE.mood * weightedMinutes,
    cleanliness:
      postSleepStats.cleanliness - OFFLINE_DECAY_PER_MINUTE.cleanliness * weightedMinutes,
    energy: postSleepStats.energy - OFFLINE_DECAY_PER_MINUTE.energy * weightedMinutes,
    health: postSleepStats.health + applyOfflineHealthShift(postSleepStats, weightedMinutes)
  };

  const remainsSleeping =
    pet.isSleeping && pet.sleepEndsAt !== null && now < pet.sleepEndsAt && nextStats.energy < 95;

  const settledPet: PetRuntimeState = {
    ...pet,
    stats: clampStats(nextStats),
    lastUpdatedAt: now,
    isSleeping: remainsSleeping,
    sleepStartedAt: remainsSleeping ? pet.sleepStartedAt : null,
    sleepEndsAt: remainsSleeping ? pet.sleepEndsAt : null,
    careScore: Math.max(0, pet.careScore - appliedMinutes * 0.03)
  };

  const lines: string[] = [];

  if (elapsedMinutes >= 60) {
    lines.push(`离开了约 ${Math.floor(elapsedMinutes / 60)} 小时 ${elapsedMinutes % 60} 分钟。`);
  } else {
    lines.push(`离开了 ${elapsedMinutes} 分钟。`);
  }

  if (elapsedMinutes > OFFLINE_CAP_MINUTES) {
    lines.push('超出 24 小时的部分已启用温和结算保护。');
  }

  if (sleepingMinutes > 0) {
    lines.push(`它在你离开时睡了约 ${Math.round(sleepingMinutes)} 分钟，体力慢慢恢复了一些。`);
  }

  if (settledPet.stats.hunger < pet.stats.hunger) {
    lines.push('它醒来后有点饿，也更需要你的照顾了。');
  }

  return {
    pet: settledPet,
    summary: {
      elapsedMinutes,
      lines
    }
  };
}
