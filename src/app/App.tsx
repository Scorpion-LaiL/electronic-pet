import { useMemo, useState } from 'react';
import { ActionControls } from '../components/controls/ActionControls';
import { MessagePanel } from '../components/layout/MessagePanel';
import { OverlayCard } from '../components/overlays/OverlayCard';
import { IdentitySetupForm } from '../components/pet/IdentitySetupForm';
import { PetAvatar } from '../components/pet/PetAvatar';
import { StatusBar } from '../components/status/StatusBar';
import { useGameLoop } from '../hooks/use-game-loop';
import { useGameStore } from '../store/game-store';
import type { PetRuntimeState } from '../types/pet';

function getSpeciesLabel(species: PetRuntimeState['identity']['species']): string {
  return species === 'dog' ? '小狗' : '小猫';
}

function getGenderLabel(gender: PetRuntimeState['identity']['gender']): string {
  switch (gender) {
    case 'boy':
      return '男孩';
    case 'girl':
      return '女孩';
    default:
      return '未说明';
  }
}

function getStageLabel(stage: PetRuntimeState['stage']): string {
  switch (stage) {
    case 'baby':
      return '幼年期';
    case 'child':
      return '成长期';
    case 'adult':
      return '成熟期';
  }
}

function getConditionLabel(condition: PetRuntimeState['condition']): string {
  switch (condition) {
    case 'tired':
      return '有点疲劳';
    case 'depressed':
      return '情绪低落';
    case 'sick':
      return '不太舒服';
    case 'weak':
      return '状态虚弱';
    case 'danger':
      return '危险';
    case 'critical':
      return '危急';
    case 'dead':
      return '已经离开';
    default:
      return '状态稳定';
  }
}

function getStatusHint(type: keyof PetRuntimeState['stats'], value: number): string {
  if (value >= 80) {
    return '状态很好';
  }

  if (value >= 60) {
    return '目前正常';
  }

  if (value >= 30) {
    return type === 'energy' ? '要注意休息' : '需要照顾一下';
  }

  return type === 'health' ? '已经很危险了' : '请优先处理';
}

function getLivingDays(pet: PetRuntimeState): number {
  return Math.max(1, Math.ceil((Date.now() - pet.identity.createdAt) / (1000 * 60 * 60 * 24)));
}

function getSleepRemainingLabel(pet: PetRuntimeState): string | null {
  if (!pet.isSleeping || pet.sleepEndsAt === null) {
    return null;
  }

  const remainingMinutes = Math.max(0, Math.ceil((pet.sleepEndsAt - Date.now()) / (1000 * 60)));
  return remainingMinutes > 0 ? `还需 ${remainingMinutes} 分钟` : '快睡醒了';
}

export function App() {
  const { state, actions } = useGameStore();
  const [showRecreateConfirm, setShowRecreateConfirm] = useState(false);

  useGameLoop(state.screen === 'main' && Boolean(state.pet?.isAlive), actions.advanceTime);

  const stats = useMemo(() => {
    if (!state.pet) {
      return [];
    }

    return [
      { key: 'hunger', label: '饥饿', value: state.pet.stats.hunger },
      { key: 'mood', label: '心情', value: state.pet.stats.mood },
      { key: 'cleanliness', label: '清洁', value: state.pet.stats.cleanliness },
      { key: 'energy', label: '体力', value: state.pet.stats.energy },
      { key: 'health', label: '健康', value: state.pet.stats.health }
    ] as const;
  }, [state.pet]);

  if (state.screen === 'welcome') {
    return (
      <main className="app-shell">
        <section className="welcome-card">
          <p className="eyebrow">AI CODING PET</p>
          <h1>一只会被你惦记的小宠物，准备住进浏览器里。</h1>
          <p>
            这一步已经从文档阶段切到了真正的可运行原型。现在可以先领养一只宠物，
            然后体验喂食、玩耍、清洁、休息、时间流逝和本地存档。
          </p>
          <button className="toy-button toy-button--accent" onClick={actions.beginSetup}>
            领养第一只宠物
          </button>
          {state.memorials.length > 0 ? (
            <div className="welcome-memorials">
              <h2>最近的纪念记录</h2>
              {state.memorials.slice(0, 3).map((record) => (
                <div className="mini-memorial" key={`${record.petId}-${record.diedAt}`}>
                  {record.name} 在 {record.finalStage === 'adult' ? '成熟期' : record.finalStage === 'child' ? '成长期' : '幼年期'}
                  {' '}停留了 {record.livedDays} 天
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  if (state.screen === 'identity-setup') {
    return (
      <main className="app-shell">
        <IdentitySetupForm onSubmit={actions.createPet} />
      </main>
    );
  }

  if (!state.pet) {
    return null;
  }

  if (state.screen === 'death-recap') {
    return (
      <main className="app-shell">
        <section className="death-card">
          <p className="eyebrow">GOODBYE NOTE</p>
          <h1>{state.pet.identity.name} 已经离开了</h1>
          <p>
            这一轮它以 {getStageLabel(state.pet.stage)} 的样子陪了你 {getLivingDays(state.pet)} 天。
            这不是失败页面，而是一段被记录下来的陪伴。
          </p>
          <div className="death-stats">
            <span>性别：{getGenderLabel(state.pet.identity.gender)}</span>
            <span>照顾评价：{state.pet.careQuality}</span>
            <span>最终状态：{getConditionLabel(state.pet.condition)}</span>
          </div>
          <MessagePanel title="最后发生了什么" messages={state.messages} />
          <button className="toy-button toy-button--accent" onClick={actions.restartAfterDeath}>
            重新开始新一轮养成
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className={`device ${state.overlay.criticalAlert ? 'device--critical' : ''}`}>
        <header className="device-header">
          <div>
            <p className="eyebrow">POCKET LIFE SIM</p>
            <h1>{state.pet.identity.name}</h1>
          </div>
          <div className="header-meta">
            <span>{getSpeciesLabel(state.pet.identity.species)}</span>
            <span>{getGenderLabel(state.pet.identity.gender)}</span>
            <span>{getStageLabel(state.pet.stage)}</span>
            <span>
              {state.pet.isSleeping
                ? `睡眠中${getSleepRemainingLabel(state.pet) ? ` · ${getSleepRemainingLabel(state.pet)}` : ''}`
                : getConditionLabel(state.pet.condition)}
            </span>
          </div>
        </header>

        <div className="device-grid">
          <div className="hero-column">
            <PetAvatar pet={state.pet} recentAction={state.recentAction} />
          </div>

          <div className="info-column">
            <section className="panel panel--status">
              <div className="panel-heading">
                <h3>状态面板</h3>
                <p>颜色、进度和文案一起提示你现在最该做什么。</p>
              </div>
              <div className="status-grid">
                {stats.map((item) => (
                  <StatusBar
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    hint={getStatusHint(item.key, item.value)}
                  />
                ))}
              </div>
            </section>

            <section className="panel panel--compact">
              <div className="panel-heading">
                <h3>成长记录</h3>
                <p>把长期目标压缩在首屏里，不打断照顾节奏。</p>
              </div>
              <div className="stats-meta">
                <div className="meta-pill">
                  <span>类型</span>
                  <strong>{getSpeciesLabel(state.pet.identity.species)}</strong>
                </div>
                <div className="meta-pill">
                  <span>阶段</span>
                  <strong>{getStageLabel(state.pet.stage)}</strong>
                </div>
                <div className="meta-pill">
                  <span>存活</span>
                  <strong>{getLivingDays(state.pet)} 天</strong>
                </div>
                <div className="meta-pill">
                  <span>评价</span>
                  <strong>{state.pet.careQuality}</strong>
                </div>
              </div>
              <div className="panel-actions">
                <button
                  className="toy-button toy-button--danger"
                  onClick={() => setShowRecreateConfirm(true)}
                >
                  重新创建宠物
                </button>
              </div>
            </section>
          </div>

          <div className="side-column">
            <ActionControls pet={state.pet} onAction={actions.performAction} />
            <MessagePanel title="提示与日志" messages={state.messages} />
          </div>
        </div>
      </section>

      {state.overlay.offlineSummary ? (
        <OverlayCard
          title="离线结算"
          actionLabel="继续照顾它"
          onClose={actions.dismissOfflineSummary}
          description={
            <div>
              {state.overlay.offlineSummary.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          }
        />
      ) : null}

      {state.overlay.growthNotice ? (
        <OverlayCard
          title="成长啦"
          actionLabel="太好了"
          onClose={actions.dismissGrowthNotice}
          description={
            <p>
              {state.pet.identity.name} 从 {getStageLabel(state.overlay.growthNotice.from)}
              成长到了 {getStageLabel(state.overlay.growthNotice.to)}。
            </p>
          }
        />
      ) : null}

      {showRecreateConfirm ? (
        <OverlayCard
          title="重新创建宠物"
          actionLabel="确认重新创建"
          secondaryActionLabel="先继续照顾"
          onSecondaryAction={() => setShowRecreateConfirm(false)}
          onClose={() => {
            setShowRecreateConfirm(false);
            actions.recreatePet();
          }}
          description={
            <div>
              <p>这会结束当前这只宠物的进行中旅程，并回到创建新宠物的页面。</p>
              <p>当前养成进度会被替换，但不会被记为死亡纪念记录。</p>
            </div>
          }
        />
      ) : null}
    </main>
  );
}
