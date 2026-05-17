import {
  CARE_ACTION_COOLDOWN_MINUTES,
  MAX_CONSECUTIVE_CARE_ACTIONS
} from './pet-constants';
import { clampStats } from './pet-model';
import type { CareAction, CareActionRecord, PetAction, PetRuntimeState } from '../../types/pet';

export type ActionResult = {
  pet: PetRuntimeState;
  message: string;
  appliedAction: PetAction | null;
};

function withResult(
  pet: PetRuntimeState,
  message: string,
  appliedAction: PetAction | null
): ActionResult {
  return {
    pet,
    message,
    appliedAction
  };
}

function isCareAction(action: PetAction): action is CareAction {
  return action === 'feed' || action === 'play' || action === 'clean' || action === 'rest';
}

function getCareActionLabel(action: CareAction): string {
  switch (action) {
    case 'feed':
      return '喂食';
    case 'play':
      return '玩耍';
    case 'clean':
      return '清洁';
    case 'rest':
      return '休息';
  }
}

function getConsecutiveCareActionCount(
  history: CareActionRecord[],
  action: CareAction,
  now: number
): number {
  const cooldownMs = CARE_ACTION_COOLDOWN_MINUTES * 60 * 1000;
  let count = 0;
  let anchorTime = now;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const record = history[index];

    if (record.action !== action || anchorTime - record.at >= cooldownMs) {
      break;
    }

    count += 1;
    anchorTime = record.at;
  }

  return count;
}

export function getCareActionCooldownRemainingMs(
  pet: PetRuntimeState,
  action: CareAction,
  now: number
): number {
  const streakCount = getConsecutiveCareActionCount(pet.careActionHistory, action, now);
  const lastRecord = pet.careActionHistory[pet.careActionHistory.length - 1];

  if (
    streakCount < MAX_CONSECUTIVE_CARE_ACTIONS ||
    !lastRecord ||
    lastRecord.action !== action
  ) {
    return 0;
  }

  const cooldownMs = CARE_ACTION_COOLDOWN_MINUTES * 60 * 1000;
  return Math.max(0, cooldownMs - (now - lastRecord.at));
}

function getCooldownMessage(action: CareAction, lastAppliedAt: number, now: number): string {
  const cooldownMs = CARE_ACTION_COOLDOWN_MINUTES * 60 * 1000;
  const remainingMinutes = Math.max(1, Math.ceil((cooldownMs - (now - lastAppliedAt)) / (1000 * 60)));

  return `连续${getCareActionLabel(action)}两次了，先缓一缓，约 ${remainingMinutes} 分钟后再试。`;
}

function appendCareActionHistory(
  history: CareActionRecord[],
  action: CareAction,
  now: number
): CareActionRecord[] {
  return [...history, { action, at: now }].slice(-8);
}

export function getRestDurationMinutes(energy: number): number {
  return Math.max(25, Math.min(90, Math.round((100 - energy) * 1.2)));
}

export function applyPetAction(
  pet: PetRuntimeState,
  action: PetAction,
  now: number
): ActionResult {
  if (!pet.isAlive) {
    return withResult(pet, '它已经离开了，这一轮照顾结束了。', null);
  }

  if (pet.isSleeping && action !== 'wake') {
    return withResult(pet, '它正在休息，先让它睡一会儿吧。', null);
  }

  if (isCareAction(action)) {
    const cooldownRemainingMs = getCareActionCooldownRemainingMs(pet, action, now);
    const lastRecord = pet.careActionHistory[pet.careActionHistory.length - 1];

    if (cooldownRemainingMs > 0 && lastRecord && lastRecord.action === action) {
      return withResult(pet, getCooldownMessage(action, lastRecord.at, now), null);
    }
  }

  const next = {
    ...pet,
    stats: { ...pet.stats },
    lastInteractedAt: now,
    lastUpdatedAt: now,
    careActionHistory: [...pet.careActionHistory]
  };

  switch (action) {
    case 'feed': {
      if (pet.stats.hunger >= 96) {
        return withResult(pet, '它已经吃得很饱了。', null);
      }

      next.stats.hunger += 20;
      next.stats.mood += 4;
      next.careScore += 12;
      return withResult(
        {
          ...next,
          stats: clampStats(next.stats),
          careActionHistory: appendCareActionHistory(next.careActionHistory, 'feed', now)
        },
        '喂食成功，它看起来安心多了。',
        'feed'
      );
    }
    case 'play': {
      if (pet.stats.energy <= 18) {
        return withResult(pet, '它太累了，现在更需要休息。', null);
      }

      next.stats.mood += 18;
      next.stats.energy -= 8;
      next.stats.hunger -= 5;
      next.careScore += 14;
      return withResult(
        {
          ...next,
          stats: clampStats(next.stats),
          careActionHistory: appendCareActionHistory(next.careActionHistory, 'play', now)
        },
        '你陪它玩了一会儿，心情明显变好了。',
        'play'
      );
    }
    case 'clean': {
      if (pet.stats.cleanliness >= 95) {
        return withResult(pet, '它现在已经很干净了。', null);
      }

      next.stats.cleanliness += 25;
      next.stats.mood += 3;
      next.careScore += 10;
      return withResult(
        {
          ...next,
          stats: clampStats(next.stats),
          careActionHistory: appendCareActionHistory(next.careActionHistory, 'clean', now)
        },
        '清洁完成，整只小宠物都清爽起来了。',
        'clean'
      );
    }
    case 'rest': {
      if (pet.stats.energy >= 88) {
        return withResult(pet, '它现在精神还不错，暂时不太困。', null);
      }

      const restDurationMinutes = getRestDurationMinutes(pet.stats.energy);
      next.isSleeping = true;
      next.sleepStartedAt = now;
      next.sleepEndsAt = now + restDurationMinutes * 60 * 1000;
      next.careScore += 8;
      return withResult(
        {
          ...next,
          stats: clampStats(next.stats),
          careActionHistory: appendCareActionHistory(next.careActionHistory, 'rest', now)
        },
        `它蜷起来准备睡觉了，预计会休息 ${restDurationMinutes} 分钟。`,
        'rest'
      );
    }
    case 'wake': {
      if (!pet.isSleeping) {
        return withResult(pet, '它本来就醒着呢。', null);
      }

      return withResult(
        {
          ...next,
          isSleeping: false,
          sleepStartedAt: null,
          sleepEndsAt: null
        },
        '你轻轻把它叫醒了。',
        'wake'
      );
    }
    default:
      return withResult(pet, '这次操作没有生效。', null);
  }
}
