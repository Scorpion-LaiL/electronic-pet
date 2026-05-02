import { clampStats } from './pet-model';
import type { PetAction, PetRuntimeState } from '../../types/pet';

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

  const next = {
    ...pet,
    stats: { ...pet.stats },
    lastInteractedAt: now,
    lastUpdatedAt: now
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
          stats: clampStats(next.stats)
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
          stats: clampStats(next.stats)
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
          stats: clampStats(next.stats)
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
          stats: clampStats(next.stats)
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
