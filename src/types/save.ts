import type { PetMemorialRecord, PetRuntimeState } from './pet';

export type SaveData = {
  version: number;
  currentPet: PetRuntimeState | null;
  memorials: PetMemorialRecord[];
};
