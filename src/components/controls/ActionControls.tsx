import { useEffect, useMemo, useState } from 'react';
import { getCareActionCooldownRemainingMs } from '../../domain/pet/pet-rules';
import type { CareAction, PetRuntimeState } from '../../types/pet';

type ActionControlsProps = {
  pet: PetRuntimeState;
  onAction: (action: 'feed' | 'play' | 'clean' | 'rest' | 'wake') => void;
};

function getCooldownLabel(action: CareAction, remainingMs: number): string {
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (1000 * 60)));

  switch (action) {
    case 'feed':
      return `喂食 · ${remainingMinutes}分`;
    case 'play':
      return `玩耍 · ${remainingMinutes}分`;
    case 'clean':
      return `清洁 · ${remainingMinutes}分`;
    case 'rest':
      return `休息 · ${remainingMinutes}分`;
  }
}

export function ActionControls({ pet, onAction }: ActionControlsProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 15_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const actionStates = useMemo(() => {
    const actions: CareAction[] = ['feed', 'play', 'clean', 'rest'];

    return actions.map((action) => {
      const cooldownRemainingMs = getCareActionCooldownRemainingMs(pet, action, now);

      return {
        action,
        cooldownRemainingMs,
        isCoolingDown: cooldownRemainingMs > 0
      };
    });
  }, [now, pet]);

  const firstCoolingAction = actionStates.find((item) => item.isCoolingDown);

  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>照顾动作</h3>
        <p>每次只要花几十秒，它就会记住你的照顾。</p>
      </div>
      <div className="actions-grid">
        <button
          className="toy-button"
          onClick={() => onAction('feed')}
          disabled={!pet.isAlive || actionStates[0]?.isCoolingDown}
        >
          {actionStates[0]?.isCoolingDown
            ? getCooldownLabel('feed', actionStates[0].cooldownRemainingMs)
            : '喂食'}
        </button>
        <button
          className="toy-button"
          onClick={() => onAction('play')}
          disabled={!pet.isAlive || actionStates[1]?.isCoolingDown}
        >
          {actionStates[1]?.isCoolingDown
            ? getCooldownLabel('play', actionStates[1].cooldownRemainingMs)
            : '玩耍'}
        </button>
        <button
          className="toy-button"
          onClick={() => onAction('clean')}
          disabled={!pet.isAlive || actionStates[2]?.isCoolingDown}
        >
          {actionStates[2]?.isCoolingDown
            ? getCooldownLabel('clean', actionStates[2].cooldownRemainingMs)
            : '清洁'}
        </button>
        <button
          className="toy-button toy-button--accent"
          onClick={() => onAction(pet.isSleeping ? 'wake' : 'rest')}
          disabled={!pet.isAlive || (!pet.isSleeping && actionStates[3]?.isCoolingDown)}
        >
          {pet.isSleeping
            ? '叫醒'
            : actionStates[3]?.isCoolingDown
              ? getCooldownLabel('rest', actionStates[3].cooldownRemainingMs)
              : '休息'}
        </button>
      </div>
      <div className="action-hint">
        {pet.isSleeping
          ? '它正在睡觉，其他动作会先被拦下。'
          : firstCoolingAction
            ? `${getCooldownLabel(firstCoolingAction.action, firstCoolingAction.cooldownRemainingMs)} 冷却中。`
            : '同类动作最多连续成功两次，第三次开始需要等 30 分钟。'}
      </div>
    </section>
  );
}
