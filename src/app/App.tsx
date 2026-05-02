import { useMemo, useState } from 'react';
import { getPetSpeciesMeta } from '../domain/pet/pet-species';
import { ActionControls } from '../components/controls/ActionControls';
import { MessagePanel } from '../components/layout/MessagePanel';
import { OverlayCard } from '../components/overlays/OverlayCard';
import { IdentitySetupForm } from '../components/pet/IdentitySetupForm';
import { PetAvatar } from '../components/pet/PetAvatar';
import { StatusBar } from '../components/status/StatusBar';
import { useGameLoop } from '../hooks/use-game-loop';
import { useGameStore } from '../store/game-store';
import type { PetRuntimeState } from '../types/pet';

type DesktopPanelTab = 'care' | 'log';

function getSpeciesLabel(species: PetRuntimeState['identity']['species']): string {
  return getPetSpeciesMeta(species).label;
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

function getPrimaryNeedLabel(pet: PetRuntimeState): string {
  if (pet.isSleeping) {
    return '先让它安心睡一会儿';
  }

  if (pet.condition === 'critical' || pet.condition === 'danger') {
    return '先把健康和体力救回来';
  }

  if (pet.stats.hunger <= 35) {
    return '优先喂食，别让它继续饿着';
  }

  if (pet.stats.cleanliness <= 35) {
    return '先做清洁，它已经有点难受了';
  }

  if (pet.stats.energy <= 35) {
    return '该安排休息了，体力快见底';
  }

  if (pet.stats.mood <= 35) {
    return '陪它玩一会儿，先把情绪拉起来';
  }

  return '状态平稳，可以自由陪它活动';
}

function getDesktopCompanionLine(pet: PetRuntimeState): string {
  if (pet.isSleeping) {
    return getSleepRemainingLabel(pet)
      ? `它在桌面角落打盹，${getSleepRemainingLabel(pet)}。`
      : '它在桌面角落打盹，马上就会醒来。';
  }

  if (pet.condition === 'critical') {
    return '它已经进入危急状态，这一轮桌面陪伴需要你马上接手。';
  }

  if (pet.stats.mood >= 75 && pet.stats.energy >= 55) {
    return '它今天很活跃，适合做成会在桌面上到处溜达的感觉。';
  }

  if (pet.stats.energy <= 30) {
    return '它还会慢慢动，但明显已经走不太快了。';
  }

  return '它会一直挂在你的桌面边缘，等你顺手照顾一下。';
}

function getPrimaryNeedTag(pet: PetRuntimeState): string {
  if (pet.isSleeping) {
    return '休息中';
  }

  if (pet.condition === 'critical' || pet.condition === 'danger') {
    return '先急救';
  }

  if (pet.stats.hunger <= 35) {
    return '先喂食';
  }

  if (pet.stats.cleanliness <= 35) {
    return '先清洁';
  }

  if (pet.stats.energy <= 35) {
    return '先休息';
  }

  if (pet.stats.mood <= 35) {
    return '先陪玩';
  }

  return '很稳定';
}

export function App() {
  const { state, actions } = useGameStore();
  const [showRecreateConfirm, setShowRecreateConfirm] = useState(false);
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(true);
  const [desktopPanelTab, setDesktopPanelTab] = useState<DesktopPanelTab>('care');

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

  const primaryNeedLabel = useMemo(() => {
    if (!state.pet) {
      return '';
    }

    return getPrimaryNeedLabel(state.pet);
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
    <main
      className={`app-shell app-shell--desktop ${
        state.overlay.criticalAlert ? 'app-shell--desktop-critical' : ''
      }`}
    >
      <section className="desktop-world">
        <header className="desktop-hud">
          <div className="desktop-hud__intro">
            <p className="eyebrow">DESKTOP PET PROTOTYPE</p>
            <h1>{state.pet.identity.name}</h1>
            <p className="desktop-hud__copy">{getDesktopCompanionLine(state.pet)}</p>
          </div>

          <div className="desktop-hud__chips">
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

        <div className="desktop-stage">
          <div className="desktop-stage__pet">
            <section className="desktop-callout">
              <span className="desktop-callout__label">当前桌面状态</span>
              <strong>{primaryNeedLabel}</strong>
              <p>{`这只${getPetSpeciesMeta(state.pet.identity.species).companionNoun}现在是 ${getConditionLabel(state.pet.condition)}，你可以把照顾动作收进侧边面板，不打断它在桌面上的存在感。`}</p>
            </section>

            <PetAvatar pet={state.pet} recentAction={state.recentAction} />

            <div className="desktop-dock">
              <span>喂食</span>
              <span>玩耍</span>
              <span>清洁</span>
              <span>{state.pet.isSleeping ? '叫醒' : '休息'}</span>
            </div>
          </div>

          <aside className={`desktop-sidecar ${desktopPanelOpen ? 'is-open' : ''}`}>
            <div className="desktop-sidecar__header">
              <div>
                <p className="eyebrow">CARE PANEL</p>
                <h2>照顾面板</h2>
              </div>
              <button
                className="toy-button toy-button--muted"
                onClick={() => setDesktopPanelOpen(false)}
              >
                收起
              </button>
            </div>

            <div className="desktop-sidecar__tabs">
              <button
                className={`segment ${desktopPanelTab === 'care' ? 'is-active' : ''}`}
                onClick={() => setDesktopPanelTab('care')}
                type="button"
              >
                照顾台
              </button>
              <button
                className={`segment ${desktopPanelTab === 'log' ? 'is-active' : ''}`}
                onClick={() => setDesktopPanelTab('log')}
                type="button"
              >
                日志台
              </button>
            </div>

            {desktopPanelTab === 'care' ? (
              <div className="desktop-sidecar__content">
                <section className="panel panel--compact">
                  <div className="panel-heading">
                    <h3>本轮陪伴概览</h3>
                    <p>把长期成长信息压缩成一个侧边抽屉，主视线只留给宠物本体。</p>
                  </div>
                  <div className="stats-meta">
                    <div className="meta-pill">
                      <span>存活</span>
                      <strong>{getLivingDays(state.pet)} 天</strong>
                    </div>
                    <div className="meta-pill">
                      <span>评价</span>
                      <strong>{state.pet.careQuality}</strong>
                    </div>
                    <div className="meta-pill">
                      <span>优先</span>
                      <strong>{getPrimaryNeedTag(state.pet)}</strong>
                    </div>
                  </div>
                </section>

                <section className="panel panel--status">
                  <div className="panel-heading">
                    <h3>状态面板</h3>
                    <p>颜色、进度和提示语告诉你最该先处理什么。</p>
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

                <ActionControls pet={state.pet} onAction={actions.performAction} />
              </div>
            ) : (
              <div className="desktop-sidecar__content">
                <MessagePanel title="提示与日志" messages={state.messages} />

                <section className="panel panel--compact">
                  <div className="panel-heading">
                    <h3>成长记录</h3>
                    <p>这一块保留管理动作，避免把“重建宠物”直接放到主桌面中心。</p>
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
                      <span>状态</span>
                      <strong>{getConditionLabel(state.pet.condition)}</strong>
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
            )}
          </aside>
        </div>

        <button
          className="desktop-panel-handle"
          onClick={() => setDesktopPanelOpen((current) => !current)}
          type="button"
        >
          {desktopPanelOpen ? '隐藏照顾面板' : '展开照顾面板'}
        </button>
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
