import { useEffect, useState } from 'react';
import { SAVE_VERSION } from '../domain/pet/pet-constants';
import { loadSaveData, persistSaveData } from '../services/local-storage';
import {
  createPetSession,
  runGameStartup,
  runGameTick,
  runPetAction
} from '../services/game-engine';
import type {
  PetAction,
  PetGender,
  PetMemorialRecord,
  PetRuntimeState,
  PetSpecies
} from '../types/pet';
import type { Screen, OverlayState, RecentAction } from '../types/ui';

type GameState = {
  screen: Screen;
  pet: PetRuntimeState | null;
  memorials: PetMemorialRecord[];
  overlay: OverlayState;
  messages: string[];
  recentAction: RecentAction | null;
};

const MAX_MESSAGES = 6;

function pushMessage(messages: string[], message: string | null): string[] {
  if (!message) {
    return messages;
  }

  return [message, ...messages].slice(0, MAX_MESSAGES);
}

function initializeState(): GameState {
  const saveData = loadSaveData();

  if (!saveData.currentPet) {
    return {
      screen: 'welcome',
      pet: null,
      memorials: saveData.memorials,
      overlay: {
        growthNotice: null,
        criticalAlert: false,
        offlineSummary: null
      },
      messages: ['欢迎回来，准备领养一只新的 AI Coding Pet。'],
      recentAction: null
    };
  }

  const startup = runGameStartup(saveData.currentPet);
  const memorials = startup.memorial
    ? [startup.memorial, ...saveData.memorials].slice(0, 8)
    : saveData.memorials;

  return {
    screen: startup.pet.isAlive ? 'main' : 'death-recap',
    pet: startup.pet,
    memorials,
    overlay: {
      growthNotice: startup.growthNotice,
      criticalAlert: startup.pet.condition === 'critical',
      offlineSummary: startup.summary
    },
    messages: pushMessage([], startup.message),
    recentAction: null
  };
}

export function useGameStore() {
  const [state, setState] = useState<GameState>(() => initializeState());

  useEffect(() => {
    persistSaveData({
      version: SAVE_VERSION,
      currentPet: state.pet,
      memorials: state.memorials
    });
  }, [state.pet, state.memorials]);

  function beginSetup() {
    setState((current) => ({
      ...current,
      screen: 'identity-setup'
    }));
  }

  function createPet(name: string, gender: PetGender, species: PetSpecies) {
    const created = createPetSession(name, gender, species);

    setState((current) => ({
      ...current,
      screen: 'main',
      pet: created.pet,
      overlay: {
        growthNotice: null,
        criticalAlert: false,
        offlineSummary: null
      },
      messages: pushMessage(current.messages, created.message),
      recentAction: null
    }));
  }

  function performAction(action: PetAction) {
    setState((current) => {
      if (!current.pet) {
        return current;
      }

      const result = runPetAction(current.pet, action);
      const memorials = result.memorial
        ? [result.memorial, ...current.memorials].slice(0, 8)
        : current.memorials;

      return {
        ...current,
        screen: result.pet.isAlive ? 'main' : 'death-recap',
        pet: result.pet,
        memorials,
        overlay: {
          growthNotice: result.growthNotice,
          criticalAlert: result.pet.condition === 'critical',
          offlineSummary: current.overlay.offlineSummary
        },
        messages: pushMessage(current.messages, result.message),
        recentAction: result.recentAction
      };
    });
  }

  function advanceTime() {
    setState((current) => {
      if (!current.pet || current.screen !== 'main') {
        return current;
      }

      const result = runGameTick(current.pet);
      const memorials = result.memorial
        ? [result.memorial, ...current.memorials].slice(0, 8)
        : current.memorials;

      return {
        ...current,
        screen: result.pet.isAlive ? 'main' : 'death-recap',
        pet: result.pet,
        memorials,
        overlay: {
          growthNotice: result.growthNotice ?? current.overlay.growthNotice,
          criticalAlert: result.pet.condition === 'critical',
          offlineSummary: current.overlay.offlineSummary
        },
        messages: pushMessage(current.messages, result.message),
        recentAction: current.recentAction
      };
    });
  }

  function dismissGrowthNotice() {
    setState((current) => ({
      ...current,
      overlay: {
        ...current.overlay,
        growthNotice: null
      }
    }));
  }

  function dismissOfflineSummary() {
    setState((current) => ({
      ...current,
      overlay: {
        ...current.overlay,
        offlineSummary: null
      }
    }));
  }

  function restartAfterDeath() {
    setState((current) => ({
      ...current,
      screen: 'identity-setup',
      pet: null,
      overlay: {
        growthNotice: null,
        criticalAlert: false,
        offlineSummary: null
      },
      messages: pushMessage(current.messages, '新的照顾旅程可以开始了。'),
      recentAction: null
    }));
  }

  function recreatePet() {
    setState((current) => ({
      ...current,
      screen: 'identity-setup',
      pet: null,
      overlay: {
        growthNotice: null,
        criticalAlert: false,
        offlineSummary: null
      },
      messages: pushMessage(current.messages, '当前宠物旅程已结束，准备创建新的伙伴。'),
      recentAction: null
    }));
  }

  return {
    state,
    actions: {
      beginSetup,
      createPet,
      performAction,
      advanceTime,
      dismissGrowthNotice,
      dismissOfflineSummary,
      restartAfterDeath,
      recreatePet
    }
  };
}
