import { describe, expect, it } from 'vitest';
import { createNewPet, sanitizePetName } from '../../src/domain/pet/pet-model';
import { applyPetAction } from '../../src/domain/pet/pet-rules';
import { applyOfflineSettlement } from '../../src/domain/time/offline-settlement';
import { evaluateCondition } from '../../src/domain/death/death-rules';

describe('pet domain', () => {
  it('creates a valid new pet with fallback name support', () => {
    const pet = createNewPet('', 'girl', 'cat', 1_700_000_000_000);

    expect(pet.identity.name.length).toBeGreaterThan(0);
    expect(pet.identity.gender).toBe('girl');
    expect(pet.identity.species).toBe('cat');
    expect(pet.stats.health).toBe(90);
    expect(pet.isAlive).toBe(true);
  });

  it('sanitizes pet names', () => {
    expect(sanitizePetName('   Hello   Pet   ')).toBe('Hello Pet');
  });

  it('applies play action with reward and cost', () => {
    const pet = createNewPet('Mochi', 'unknown', 'dog', 1_700_000_000_000);
    const result = applyPetAction(pet, 'play', pet.lastUpdatedAt + 1_000);

    expect(result.pet.stats.mood).toBeGreaterThan(pet.stats.mood);
    expect(result.pet.stats.energy).toBeLessThan(pet.stats.energy);
    expect(result.pet.stats.hunger).toBeLessThan(pet.stats.hunger);
  });

  it('starts rest as a timed sleep instead of instant energy refill', () => {
    const pet = createNewPet('Nori', 'unknown', 'cat', 1_700_000_000_000);
    const tiredPet = {
      ...pet,
      stats: {
        ...pet.stats,
        energy: 24
      }
    };
    const result = applyPetAction(tiredPet, 'rest', tiredPet.lastUpdatedAt + 1_000);

    expect(result.pet.isSleeping).toBe(true);
    expect(result.pet.sleepEndsAt).not.toBeNull();
    expect(result.pet.stats.energy).toBe(tiredPet.stats.energy);
  });

  it('settles offline time more gently than full depletion', () => {
    const pet = createNewPet('Pico', 'boy', 'cat', 1_700_000_000_000);
    const twentyFourHoursLater = pet.lastUpdatedAt + 24 * 60 * 60 * 1000;
    const result = applyOfflineSettlement(pet, twentyFourHoursLater);

    expect(result.pet.stats.hunger).toBeGreaterThan(0);
    expect(result.pet.stats.health).toBeGreaterThan(0);
    expect(result.summary?.elapsedMinutes).toBe(24 * 60);
  });

  it('moves into danger when multiple stats are critically low', () => {
    const pet = createNewPet('Bobo', 'unknown', 'dog', 1_700_000_000_000);
    const riskyPet = {
      ...pet,
      stats: {
        hunger: 10,
        mood: 12,
        cleanliness: 8,
        energy: 65,
        health: 22
      }
    };

    const evaluated = evaluateCondition(riskyPet, riskyPet.lastUpdatedAt + 1000);
    expect(evaluated.condition).toBe('danger');
    expect(evaluated.enteredDangerAt).not.toBeNull();
  });
});
