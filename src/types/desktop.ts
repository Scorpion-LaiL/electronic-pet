import type { PetAction, PetRuntimeState } from './pet';
import type { SaveData } from './save';

export type DesktopFacing = 'left' | 'right';
export type DesktopMovementMode = 'idle' | 'wander' | 'sleep' | 'alert';
export type DesktopAnchor = 'bottom-left' | 'bottom-right' | 'free';
export type DesktopQuickAction = PetAction | 'toggle-panel' | 'show-window';

export type DesktopMetrics = {
  screenWidth: number;
  screenHeight: number;
  scaleFactor: number;
};

export type DesktopWindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DesktopInteractiveRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DesktopPetState = {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  facing: DesktopFacing;
  anchor: DesktopAnchor;
  movementMode: DesktopMovementMode;
  panelOpen: boolean;
  clickThrough: boolean;
  lastMovedAt: number;
  pauseUntil: number;
  isDragging: boolean;
};

export type DesktopBridge = {
  isDesktopMode: () => boolean;
  getMetrics: () => Promise<DesktopMetrics>;
  updateWindow: (bounds: DesktopWindowBounds) => Promise<void>;
  showWindow: () => Promise<void>;
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward?: boolean }) => Promise<void>;
  setInteractiveRegions: (regions: DesktopInteractiveRegion[]) => Promise<void>;
  setDragging: (dragging: boolean) => Promise<void>;
  readSaveData: () => SaveData | null;
  writeSaveData: (saveData: SaveData) => void;
  readDesktopPreferences: () => DesktopPreferences | null;
  writeDesktopPreferences: (preferences: DesktopPreferences) => void;
  onQuickAction: (listener: (action: DesktopQuickAction) => void) => () => void;
};

export type DesktopSceneState = {
  metrics: DesktopMetrics;
  runtime: DesktopPetState;
  pet: PetRuntimeState;
};

export type DesktopPreferences = {
  preferredX: number | null;
};
