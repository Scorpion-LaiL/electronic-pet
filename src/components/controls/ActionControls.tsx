import type { PetRuntimeState } from '../../types/pet';

type ActionControlsProps = {
  pet: PetRuntimeState;
  onAction: (action: 'feed' | 'play' | 'clean' | 'rest' | 'wake') => void;
};

export function ActionControls({ pet, onAction }: ActionControlsProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>照顾动作</h3>
        <p>每次只要花几十秒，它就会记住你的照顾。</p>
      </div>
      <div className="actions-grid">
        <button className="toy-button" onClick={() => onAction('feed')} disabled={!pet.isAlive}>
          喂食
        </button>
        <button className="toy-button" onClick={() => onAction('play')} disabled={!pet.isAlive}>
          玩耍
        </button>
        <button className="toy-button" onClick={() => onAction('clean')} disabled={!pet.isAlive}>
          清洁
        </button>
        <button
          className="toy-button toy-button--accent"
          onClick={() => onAction(pet.isSleeping ? 'wake' : 'rest')}
          disabled={!pet.isAlive}
        >
          {pet.isSleeping ? '叫醒' : '休息'}
        </button>
      </div>
      <div className="action-hint">
        {pet.isSleeping
          ? '它正在睡觉，其他动作会先被拦下。'
          : '如果某项状态太低，系统会提醒你先做更合适的照顾。'}
      </div>
    </section>
  );
}
