import type { DesktopMetrics, DesktopPetState, DesktopWindowBounds } from '../../types/desktop';
import type { PetRuntimeState, PetSpecies } from '../../types/pet';

export const COLLAPSED_WINDOW_SIZE = {
  width: 236,
  height: 188
} as const;

export const EXPANDED_WINDOW_SIZE = {
  width: 640,
  height: 468
} as const;

export const OVERLAY_WINDOW_SIZE = {
  width: 500,
  height: 560
} as const;

export const PET_STAGE_WIDTH = COLLAPSED_WINDOW_SIZE.width;
export const SCREEN_EDGE_PADDING = 18;
export const FLOOR_OFFSET = 10;
export type DesktopWindowMode = 'pet' | 'panel' | 'overlay';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getDesktopMovementMode(pet: PetRuntimeState) {
  if (pet.isSleeping) {
    return 'sleep' as const;
  }

  if (pet.condition === 'critical' || pet.condition === 'danger') {
    return 'alert' as const;
  }

  if (pet.stats.energy <= 32 || pet.condition === 'tired' || pet.condition === 'weak') {
    return 'idle' as const;
  }

  return 'wander' as const;
}

function getSpeciesSpeedFactor(species: PetSpecies): number {
  switch (species) {
    case 'cat':
      return 1.14;
    case 'dog':
      return 1.08;
    case 'fox':
      return 1.22;
    case 'pig':
      return 0.92;
    case 'turtle':
      return 0.58;
  }
}

function getBaseTravelSpeed(pet: PetRuntimeState, movementMode: DesktopPetState['movementMode']): number {
  const speciesFactor = getSpeciesSpeedFactor(pet.identity.species);
  const energyFactor = clamp(pet.stats.energy / 100, 0.3, 1);
  const moodFactor = clamp(pet.stats.mood / 100, 0.35, 1);

  switch (movementMode) {
    case 'alert':
      return 212 * speciesFactor;
    case 'sleep':
      return 84 * speciesFactor;
    case 'idle':
      return 64 * speciesFactor * energyFactor;
    case 'wander':
      return 106 * speciesFactor * Math.max(energyFactor, moodFactor * 0.88);
  }
}

function getPauseDuration(movementMode: DesktopPetState['movementMode']): number {
  switch (movementMode) {
    case 'alert':
      return 140;
    case 'sleep':
      return 0;
    case 'idle':
      return 950;
    case 'wander':
      return 380;
  }
}

export function createInitialDesktopPetState(
  metrics: DesktopMetrics,
  panelOpen: boolean,
  preferredX: number | null
): DesktopPetState {
  const petCenterX = clamp(
    Math.round(preferredX ?? SCREEN_EDGE_PADDING + COLLAPSED_WINDOW_SIZE.width / 2 + 12),
    SCREEN_EDGE_PADDING + COLLAPSED_WINDOW_SIZE.width / 2,
    metrics.screenWidth - SCREEN_EDGE_PADDING - COLLAPSED_WINDOW_SIZE.width / 2
  );

  return {
    position: {
      x: petCenterX,
      y: metrics.screenHeight - COLLAPSED_WINDOW_SIZE.height - FLOOR_OFFSET
    },
    velocity: { x: 0, y: 0 },
    facing: 'right',
    anchor: petCenterX > metrics.screenWidth * 0.5 ? 'bottom-right' : 'bottom-left',
    movementMode: 'wander',
    panelOpen,
    clickThrough: false,
    lastMovedAt: Date.now(),
    pauseUntil: 0,
    isDragging: false
  };
}

function getSleepTargetX(state: DesktopPetState, metrics: DesktopMetrics): number {
  const cozyOffset = 76;
  const targetAnchor =
    state.anchor === 'free'
      ? state.position.x > metrics.screenWidth / 2
        ? 'bottom-right'
        : 'bottom-left'
      : state.anchor;

  return targetAnchor === 'bottom-right'
    ? metrics.screenWidth - cozyOffset
    : cozyOffset;
}

export function stepDesktopPetState(params: {
  current: DesktopPetState;
  pet: PetRuntimeState;
  metrics: DesktopMetrics;
  windowMode: DesktopWindowMode;
  now: number;
}): DesktopPetState {
  const { current, pet, metrics, windowMode, now } = params;
  const movementMode = getDesktopMovementMode(pet);
  const elapsedMs = Math.max(16, Math.min(140, now - current.lastMovedAt));
  const deltaSeconds = elapsedMs / 1000;
  const minX = SCREEN_EDGE_PADDING + COLLAPSED_WINDOW_SIZE.width / 2;
  const maxX = metrics.screenWidth - SCREEN_EDGE_PADDING - COLLAPSED_WINDOW_SIZE.width / 2;
  const size =
    windowMode === 'overlay'
      ? OVERLAY_WINDOW_SIZE
      : windowMode === 'panel'
        ? EXPANDED_WINDOW_SIZE
        : COLLAPSED_WINDOW_SIZE;
  const baseState: DesktopPetState = {
    ...current,
    panelOpen: windowMode !== 'pet',
    movementMode,
    anchor: current.position.x > metrics.screenWidth * 0.58 ? 'bottom-right' : 'bottom-left',
    position: {
      ...current.position,
      y: windowMode === 'overlay'
        ? Math.round((metrics.screenHeight - size.height) / 2)
        : metrics.screenHeight - size.height - FLOOR_OFFSET
    },
    lastMovedAt: now
  };

  if (windowMode !== 'pet' || current.isDragging) {
    return {
      ...baseState,
      velocity: { x: 0, y: 0 }
    };
  }

  if (movementMode === 'sleep') {
    const targetX = clamp(getSleepTargetX(baseState, metrics), minX, maxX);
    const direction = targetX >= current.position.x ? 1 : -1;
    const speed = getBaseTravelSpeed(pet, movementMode);
    const travel = Math.min(Math.abs(targetX - current.position.x), speed * deltaSeconds);
    const nextX = current.position.x + travel * direction;

    return {
      ...baseState,
      facing: direction >= 0 ? 'right' : 'left',
      velocity: { x: direction * speed, y: 0 },
      position: {
        ...baseState.position,
        x: Math.abs(targetX - nextX) < 2 ? targetX : nextX
      }
    };
  }

  if (current.pauseUntil > now) {
    return {
      ...baseState,
      velocity: { x: 0, y: 0 }
    };
  }

  const direction = current.facing === 'right' ? 1 : -1;
  const speed = getBaseTravelSpeed(pet, movementMode);
  const drift = direction * speed * deltaSeconds;
  const nextX = current.position.x + drift;

  if (nextX >= maxX || nextX <= minX) {
    return {
      ...baseState,
      facing: current.facing === 'right' ? 'left' : 'right',
      velocity: { x: 0, y: 0 },
      pauseUntil: now + getPauseDuration(movementMode),
      position: {
        ...baseState.position,
        x: clamp(nextX, minX, maxX)
      }
    };
  }

  const shouldPause =
    movementMode !== 'alert' &&
    Math.random() < (movementMode === 'idle' ? 0.1 : 0.05) * deltaSeconds;

  return {
    ...baseState,
    velocity: { x: direction * speed, y: 0 },
    pauseUntil: shouldPause ? now + getPauseDuration(movementMode) : current.pauseUntil,
    position: {
      ...baseState.position,
      x: nextX
    }
  };
}

export function getDesktopWindowBounds(
  runtime: DesktopPetState,
  metrics: DesktopMetrics,
  windowMode: DesktopWindowMode
): DesktopWindowBounds {
  const size =
    windowMode === 'overlay'
      ? OVERLAY_WINDOW_SIZE
      : windowMode === 'panel'
        ? EXPANDED_WINDOW_SIZE
        : COLLAPSED_WINDOW_SIZE;

  if (windowMode === 'overlay') {
    return {
      x: Math.round((metrics.screenWidth - size.width) / 2),
      y: Math.round((metrics.screenHeight - size.height) / 2),
      width: size.width,
      height: size.height
    };
  }

  const panelOnLeft = windowMode === 'panel' && runtime.anchor === 'bottom-right';
  const petStageLeft = runtime.position.x - PET_STAGE_WIDTH / 2;
  const desiredLeft = panelOnLeft ? petStageLeft - (size.width - PET_STAGE_WIDTH) : petStageLeft;
  const x = clamp(desiredLeft, 0, metrics.screenWidth - size.width);
  const y = clamp(runtime.position.y, 0, metrics.screenHeight - size.height);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: size.width,
    height: size.height
  };
}

export function getPetCenterXFromWindowBounds(
  windowBounds: DesktopWindowBounds,
  anchor: DesktopPetState['anchor']
) {
  const panelOnLeft = anchor === 'bottom-right';

  return panelOnLeft
    ? windowBounds.x + windowBounds.width - PET_STAGE_WIDTH / 2
    : windowBounds.x + PET_STAGE_WIDTH / 2;
}
