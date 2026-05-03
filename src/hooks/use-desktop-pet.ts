import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInitialDesktopPetState,
  type DesktopWindowMode,
  getDesktopMovementMode,
  getPetCenterXFromWindowBounds,
  getDesktopWindowBounds,
  PET_STAGE_WIDTH,
  SCREEN_EDGE_PADDING,
  stepDesktopPetState
} from '../desktop/motion/pet-motion-engine';
import { getDesktopBridge } from '../desktop/window/window-bridge';
import {
  loadDesktopPreferences,
  persistDesktopPreferences
} from '../services/desktop-storage';
import type {
  DesktopInteractiveRegion,
  DesktopMetrics,
  DesktopPetState,
  DesktopQuickAction
} from '../types/desktop';
import type { PetAction, PetRuntimeState } from '../types/pet';

type UseDesktopPetOptions = {
  enabled: boolean;
  windowMode: DesktopWindowMode;
  pet: PetRuntimeState | null;
  onAction: (action: PetAction) => void;
  onTogglePanel: () => void;
};

export function useDesktopPet({
  enabled,
  windowMode,
  pet,
  onAction,
  onTogglePanel
}: UseDesktopPetOptions) {
  const bridge = useMemo(() => getDesktopBridge(), []);
  const preferences = useMemo(() => loadDesktopPreferences(), []);
  const dragWindowOffsetRef = useRef(0);
  const [metrics, setMetrics] = useState<DesktopMetrics | null>(null);
  const [runtime, setRuntime] = useState<DesktopPetState | null>(null);

  useEffect(() => {
    if (!enabled || !bridge) {
      return undefined;
    }

    let cancelled = false;

    void bridge.getMetrics().then((nextMetrics) => {
      if (!cancelled) {
        setMetrics(nextMetrics);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bridge, enabled]);

  useEffect(() => {
    if (!enabled || !metrics) {
      return;
    }

    setRuntime((current) => current ?? createInitialDesktopPetState(metrics, windowMode !== 'pet', preferences.preferredX));
  }, [enabled, metrics, preferences.preferredX, windowMode]);

  useEffect(() => {
    if (!enabled || !bridge) {
      return undefined;
    }

    const dispose = bridge.onQuickAction((action: DesktopQuickAction) => {
      if (action === 'toggle-panel') {
        onTogglePanel();
        return;
      }

      if (action === 'show-window') {
        void bridge.showWindow();
        return;
      }

      onAction(action);
    });

    return dispose;
  }, [bridge, enabled, onAction, onTogglePanel]);

  useEffect(() => {
    if (!bridge) {
      return undefined;
    }

    if (!enabled) {
      void bridge.setInteractiveRegions([]);
      void bridge.setIgnoreMouseEvents(false);
      return undefined;
    }

    return () => {
      void bridge.setInteractiveRegions([]);
      void bridge.setDragging(false);
      void bridge.setIgnoreMouseEvents(false);
    };
  }, [bridge, enabled]);

  useEffect(() => {
    if (!enabled || !pet || !metrics || !runtime) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRuntime((current) => {
        if (!current) {
          return current;
        }

        return stepDesktopPetState({
          current,
          pet,
          metrics,
          windowMode,
          now: Date.now()
        });
      });
    }, 80);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, metrics, pet, windowMode]);

  const windowBounds = useMemo(() => {
    if (!metrics || !runtime) {
      return null;
    }

    return getDesktopWindowBounds(runtime, metrics, windowMode);
  }, [metrics, runtime, windowMode]);

  useEffect(() => {
    if (!enabled || !bridge || !windowBounds) {
      return;
    }

    void bridge.updateWindow(windowBounds);
  }, [bridge, enabled, windowBounds]);

  useEffect(() => {
    if (!enabled || !runtime?.isDragging || !metrics) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setRuntime((current) => {
        if (!current) {
          return current;
        }

        const minWindowX = 0;
        const maxWindowX = metrics.screenWidth - windowBounds!.width;
        const nextWindowX = Math.min(
          Math.max(event.screenX - dragWindowOffsetRef.current, minWindowX),
          maxWindowX
        );
        const nextX = nextWindowX + PET_STAGE_WIDTH / 2;

        return {
          ...current,
          isDragging: true,
          velocity: { x: 0, y: 0 },
          pauseUntil: Date.now() + 280,
          anchor: nextX > metrics.screenWidth * 0.58 ? 'bottom-right' : 'bottom-left',
          position: {
            ...current.position,
            x: nextX
          }
        };
      });
    };

    const handleMouseUp = () => {
      setRuntime((current) => {
        if (!current) {
          return current;
        }

        persistDesktopPreferences({
          preferredX: Math.round(current.position.x)
        });

        return {
          ...current,
          isDragging: false,
          lastMovedAt: Date.now(),
          pauseUntil: Date.now() + 420
        };
      });

      void bridge?.setDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [bridge, enabled, metrics, runtime?.isDragging, windowBounds]);

  const setInteractiveRegions = useCallback((regions: DesktopInteractiveRegion[]) => {
    if (!bridge || !enabled) {
      return;
    }

    void bridge.setInteractiveRegions(regions);
  }, [bridge, enabled]);

  const startDragging = useCallback((screenX: number) => {
    if (!enabled || !runtime || !windowBounds || windowMode !== 'pet') {
      return;
    }

    dragWindowOffsetRef.current =
      screenX - (getPetCenterXFromWindowBounds(windowBounds, runtime.anchor) - PET_STAGE_WIDTH / 2);

    setRuntime((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        isDragging: true,
        velocity: { x: 0, y: 0 }
      };
    });

    void bridge?.setDragging(true);
  }, [bridge, enabled, runtime, windowBounds, windowMode]);

  return {
    isDesktopMode: Boolean(enabled && bridge),
    metrics,
    runtime,
    sceneMode: pet ? getDesktopMovementMode(pet) : null,
    windowBounds,
    setInteractiveRegions,
    startDragging
  };
}
