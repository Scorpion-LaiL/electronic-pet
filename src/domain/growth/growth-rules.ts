import { getCareQuality } from '../pet/pet-model';
import type { PetRuntimeState, PetStage } from '../../types/pet';

function getStageByAgeAndCare(ageHours: number, careScore: number): PetStage {
  if (ageHours >= 24 && careScore >= 140) {
    return 'adult';
  }

  if (ageHours >= 6 && careScore >= 35) {
    return 'child';
  }

  return 'baby';
}

export function applyGrowthProgression(
  pet: PetRuntimeState,
  now: number
): PetRuntimeState {
  const ageHours = (now - pet.identity.createdAt) / (1000 * 60 * 60);
  const nextStage = getStageByAgeAndCare(ageHours, pet.careScore);

  return {
    ...pet,
    stage: nextStage,
    careQuality: getCareQuality(pet.careScore)
  };
}
