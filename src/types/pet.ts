export type PetGender = 'boy' | 'girl' | 'unknown';
export type PetSpecies = 'cat' | 'dog' | 'pig' | 'fox' | 'turtle';

export type PetStage = 'baby' | 'child' | 'adult';

export type PetCondition =
  | 'normal'
  | 'tired'
  | 'depressed'
  | 'sick'
  | 'weak'
  | 'danger'
  | 'critical'
  | 'dead';

export type CareQuality = 'excellent' | 'good' | 'normal' | 'poor';

export type PetIdentity = {
  id: string;
  name: string;
  gender: PetGender;
  species: PetSpecies;
  createdAt: number;
};

export type PetStats = {
  hunger: number;
  mood: number;
  cleanliness: number;
  energy: number;
  health: number;
};

export type CareAction = 'feed' | 'play' | 'clean' | 'rest';

export type CareActionRecord = {
  action: CareAction;
  at: number;
};

export type PetRuntimeState = {
  identity: PetIdentity;
  stage: PetStage;
  stats: PetStats;
  condition: PetCondition;
  isSleeping: boolean;
  sleepStartedAt: number | null;
  sleepEndsAt: number | null;
  lastUpdatedAt: number;
  lastInteractedAt: number;
  enteredDangerAt: number | null;
  enteredCriticalAt: number | null;
  careScore: number;
  careQuality: CareQuality;
  careActionHistory: CareActionRecord[];
  isAlive: boolean;
};

export type PetMemorialRecord = {
  petId: string;
  name: string;
  gender: PetGender;
  livedDays: number;
  finalStage: PetStage;
  careQuality: CareQuality;
  diedAt: number;
};

export type PetAction =
  | CareAction
  | 'wake'
  | 'revive';

export type StatKey = keyof PetStats;
