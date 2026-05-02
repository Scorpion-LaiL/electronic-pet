import type { PetAction, PetRuntimeState } from './pet';

export type Screen = 'welcome' | 'identity-setup' | 'main' | 'death-recap';

export type OfflineSummary = {
  elapsedMinutes: number;
  lines: string[];
};

export type GrowthNotice = {
  from: PetRuntimeState['stage'];
  to: PetRuntimeState['stage'];
};

export type ActionFeedback = {
  action: PetAction;
  message: string;
};

export type RecentAction = {
  action: PetAction;
  at: number;
};

export type OverlayState = {
  growthNotice: GrowthNotice | null;
  criticalAlert: boolean;
  offlineSummary: OfflineSummary | null;
};
