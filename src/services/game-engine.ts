import { createNewPet } from '../domain/pet/pet-model';
import { applyPetAction } from '../domain/pet/pet-rules';
import { applyOnlineDecay } from '../domain/time/decay-rules';
import { applyOfflineSettlement } from '../domain/time/offline-settlement';
import { applyGrowthProgression } from '../domain/growth/growth-rules';
import {
  createMemorialRecord,
  evaluateCondition
} from '../domain/death/death-rules';
import type {
  PetAction,
  PetGender,
  PetMemorialRecord,
  PetRuntimeState,
  PetSpecies
} from '../types/pet';
import type { GrowthNotice, OfflineSummary, RecentAction } from '../types/ui';

export type EngineResult = {
  pet: PetRuntimeState;
  growthNotice: GrowthNotice | null;
  summary: OfflineSummary | null;
  message: string | null;
  memorial: PetMemorialRecord | null;
  recentAction: RecentAction | null;
};

function finalizePetUpdate(
  previousPet: PetRuntimeState,
  nextPet: PetRuntimeState,
  now: number,
  message: string | null,
  summary: OfflineSummary | null,
  recentAction: RecentAction | null
): EngineResult {
  const progressedPet = applyGrowthProgression(nextPet, now);
  const evaluatedPet = evaluateCondition(progressedPet, now);
  const growthNotice =
    previousPet.stage !== evaluatedPet.stage
      ? { from: previousPet.stage, to: evaluatedPet.stage }
      : null;
  const memorial =
    previousPet.isAlive && !evaluatedPet.isAlive
      ? createMemorialRecord(evaluatedPet, now)
      : null;

  return {
    pet: evaluatedPet,
    growthNotice,
    summary,
    message,
    memorial,
    recentAction
  };
}

export function createPetSession(
  name: string,
  gender: PetGender,
  species: PetSpecies,
  now = Date.now()
): EngineResult {
  const pet = createNewPet(name, gender, species, now);

  return {
    pet,
    growthNotice: null,
    summary: null,
    message: `${pet.identity.name} 已经来到你身边了。`,
    memorial: null,
    recentAction: null
  };
}

export function runGameStartup(
  pet: PetRuntimeState,
  now = Date.now()
): EngineResult {
  const offline = applyOfflineSettlement(pet, now);
  return finalizePetUpdate(
    pet,
    offline.pet,
    now,
    offline.summary ? '它一直在等你回来。' : null,
    offline.summary,
    null
  );
}

export function runGameTick(
  pet: PetRuntimeState,
  now = Date.now()
): EngineResult {
  const decayedPet = applyOnlineDecay(pet, now);
  return finalizePetUpdate(pet, decayedPet, now, null, null, null);
}

export function runPetAction(
  pet: PetRuntimeState,
  action: PetAction,
  now = Date.now()
): EngineResult {
  const syncedPet = applyOnlineDecay(pet, now);
  const actionResult = applyPetAction(syncedPet, action, now);

  return finalizePetUpdate(
    pet,
    actionResult.pet,
    now,
    actionResult.message,
    null,
    actionResult.appliedAction ? { action: actionResult.appliedAction, at: now } : null
  );
}
