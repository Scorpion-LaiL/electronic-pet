import { useEffect, useMemo, useState } from 'react';
import { getPetSpeciesMeta } from '../../domain/pet/pet-species';
import type { PetRuntimeState, PetSpecies } from '../../types/pet';
import type { RecentAction } from '../../types/ui';

type SceneMode = 'sleep' | 'critical' | 'playful' | 'tired' | 'idle';
type ScenePeriod = 'dawn' | 'day' | 'sunset' | 'night';
type AmbientBehavior = 'tail-wag' | 'ear-twitch' | 'snout-bob' | 'head-peek' | null;
type MotionFrame = {
  x: number;
  y: number;
  facing: 'left' | 'right';
};

const BASE_MOTION_PATHS: Record<SceneMode, MotionFrame[]> = {
  idle: [
    { x: 26, y: 58, facing: 'right' },
    { x: 40, y: 56, facing: 'right' },
    { x: 56, y: 58, facing: 'left' },
    { x: 42, y: 60, facing: 'left' }
  ],
  playful: [
    { x: 18, y: 60, facing: 'right' },
    { x: 36, y: 49, facing: 'right' },
    { x: 57, y: 58, facing: 'right' },
    { x: 78, y: 46, facing: 'left' },
    { x: 61, y: 60, facing: 'left' },
    { x: 34, y: 52, facing: 'left' }
  ],
  tired: [
    { x: 34, y: 63, facing: 'right' },
    { x: 42, y: 64, facing: 'right' },
    { x: 50, y: 63, facing: 'left' }
  ],
  sleep: [{ x: 50, y: 68, facing: 'right' }],
  critical: [
    { x: 47, y: 58, facing: 'right' },
    { x: 50, y: 58, facing: 'left' },
    { x: 53, y: 58, facing: 'right' },
    { x: 50, y: 58, facing: 'left' }
  ]
};

const SPECIES_MOTION_PATHS: Record<
  PetSpecies,
  Partial<Record<SceneMode, MotionFrame[]>>
> = {
  cat: {
    idle: [
      { x: 36, y: 58, facing: 'right' },
      { x: 48, y: 56, facing: 'right' },
      { x: 62, y: 58, facing: 'left' }
    ],
    playful: [
      { x: 28, y: 60, facing: 'right' },
      { x: 42, y: 48, facing: 'right' },
      { x: 60, y: 58, facing: 'left' },
      { x: 44, y: 50, facing: 'left' }
    ]
  },
  dog: {
    idle: [
      { x: 32, y: 60, facing: 'right' },
      { x: 46, y: 58, facing: 'right' },
      { x: 58, y: 60, facing: 'left' }
    ],
    playful: [
      { x: 22, y: 60, facing: 'right' },
      { x: 40, y: 50, facing: 'right' },
      { x: 64, y: 58, facing: 'left' },
      { x: 48, y: 48, facing: 'left' }
    ]
  },
  pig: {
    idle: [
      { x: 40, y: 61, facing: 'right' },
      { x: 50, y: 59, facing: 'right' },
      { x: 58, y: 61, facing: 'left' }
    ],
    playful: [
      { x: 34, y: 60, facing: 'right' },
      { x: 48, y: 52, facing: 'right' },
      { x: 62, y: 60, facing: 'left' }
    ],
    tired: [
      { x: 44, y: 64, facing: 'right' },
      { x: 52, y: 65, facing: 'left' }
    ]
  },
  fox: {
    idle: [
      { x: 34, y: 58, facing: 'right' },
      { x: 48, y: 56, facing: 'right' },
      { x: 64, y: 58, facing: 'left' }
    ],
    playful: [
      { x: 20, y: 58, facing: 'right' },
      { x: 38, y: 46, facing: 'right' },
      { x: 68, y: 56, facing: 'left' },
      { x: 46, y: 45, facing: 'left' }
    ]
  },
  turtle: {
    idle: [
      { x: 42, y: 66, facing: 'right' },
      { x: 50, y: 65, facing: 'right' },
      { x: 58, y: 66, facing: 'left' }
    ],
    playful: [
      { x: 38, y: 65, facing: 'right' },
      { x: 52, y: 62, facing: 'right' },
      { x: 62, y: 65, facing: 'left' }
    ],
    tired: [
      { x: 46, y: 67, facing: 'right' },
      { x: 52, y: 67, facing: 'left' }
    ],
    sleep: [{ x: 50, y: 69, facing: 'right' }]
  }
};

const ACTION_MOTION_PATHS: Record<'feed' | 'play' | 'clean' | 'rest', MotionFrame[]> = {
  feed: [
    { x: 58, y: 62, facing: 'left' },
    { x: 60, y: 62, facing: 'left' },
    { x: 58, y: 61, facing: 'left' }
  ],
  play: [
    { x: 25, y: 60, facing: 'right' },
    { x: 45, y: 48, facing: 'right' },
    { x: 68, y: 56, facing: 'left' },
    { x: 50, y: 45, facing: 'left' }
  ],
  clean: [
    { x: 48, y: 60, facing: 'right' },
    { x: 51, y: 59, facing: 'right' },
    { x: 48, y: 60, facing: 'left' }
  ],
  rest: [{ x: 48, y: 68, facing: 'right' }]
};

const SCENE_INTERVAL_MS: Record<SceneMode, number> = {
  idle: 2200,
  playful: 1200,
  tired: 2600,
  sleep: 3000,
  critical: 480
};

const ACTION_INTERVAL_MS: Record<'feed' | 'play' | 'clean' | 'rest', number> = {
  feed: 680,
  play: 760,
  clean: 680,
  rest: 1300
};

function getMoodBubble(pet: PetRuntimeState): string {
  if (!pet.isAlive) {
    return '它安静地离开了。';
  }

  if (pet.condition === 'critical') {
    return '快来救救我...';
  }

  if (pet.condition === 'danger') {
    return '我有点难受，别走开。';
  }

  if (pet.isSleeping) {
    switch (pet.identity.species) {
      case 'cat':
        return '呼噜呼噜，猫咪正缩成一团补觉。';
      case 'dog':
        return '它睡得很沉，耳朵都软趴下来了。';
      case 'pig':
        return '小猪打着呼噜，今天的睡姿也很圆。';
      case 'fox':
        return '小狐狸把尾巴裹在身边，睡得很轻。';
      case 'turtle':
        return '小乌龟缩进舒服角落，慢慢恢复体力。';
    }
  }

  if (pet.stats.mood >= 75 && pet.stats.energy >= 55) {
    switch (pet.identity.species) {
      case 'cat':
        return '今天很想追着光点扑来扑去。';
      case 'dog':
        return '尾巴摇得很厉害，想立刻陪你玩。';
      case 'pig':
        return '今天心情超好，想哼哼着转两圈。';
      case 'fox':
        return '它眼睛亮亮的，像准备偷偷撒欢。';
      case 'turtle':
        return '虽然步子慢，但它今天特别有精神。';
    }
  }

  if (pet.stats.hunger <= 30) {
    return pet.identity.species === 'turtle' ? '小肚子空了，想啃点嫩叶。' : '肚子在咕咕叫，我想吃东西。';
  }

  if (pet.stats.cleanliness <= 30) {
    return pet.identity.species === 'fox' ? '尾巴有点乱了，想先梳顺再继续玩。' : '想洗个舒服的澡，再继续玩。';
  }

  if (pet.stats.energy <= 30) {
    return pet.identity.species === 'pig' ? '我先慢慢挪一会儿，等下就想趴着睡。' : '我先慢慢走，等会儿可能要睡了。';
  }

  switch (pet.identity.species) {
    case 'cat':
      return '陪陪我吧，我会假装漫不经心地蹭过来。';
    case 'dog':
      return '你在旁边就好，我会自己晃着尾巴待着。';
    case 'pig':
      return '我会在这里哼哼两声，等你回来看看我。';
    case 'fox':
      return '我先安静守着这块地，偶尔偷偷看你一眼。';
    case 'turtle':
      return '我会慢慢待在这里，别急，我一直都在。';
  }
}

function getScenePeriod(hour: number): ScenePeriod {
  if (hour >= 5 && hour < 10) {
    return 'dawn';
  }

  if (hour >= 10 && hour < 17) {
    return 'day';
  }

  if (hour >= 17 && hour < 21) {
    return 'sunset';
  }

  return 'night';
}

function getSceneMode(pet: PetRuntimeState): SceneMode {
  if (pet.isSleeping) {
    return 'sleep';
  }

  if (pet.condition === 'critical' || pet.condition === 'danger') {
    return 'critical';
  }

  if (pet.stats.energy <= 30 || pet.condition === 'tired' || pet.condition === 'weak') {
    return 'tired';
  }

  if (pet.stats.mood >= 72 && pet.stats.energy >= 45) {
    return 'playful';
  }

  return 'idle';
}

function getSceneLabel(scene: SceneMode, period: ScenePeriod): string {
  const periodLabelMap: Record<ScenePeriod, string> = {
    dawn: '晨光',
    day: '白天',
    sunset: '傍晚',
    night: '夜晚'
  };

  const sceneLabelMap: Record<SceneMode, string> = {
    sleep: '打盹中',
    critical: '危急警报',
    playful: '快乐散步',
    tired: '慢悠悠巡逻',
    idle: '轻松待机'
  };

  return `${periodLabelMap[period]} · ${sceneLabelMap[scene]}`;
}

function getMotionFrames(species: PetSpecies, scene: SceneMode, activeAction: 'feed' | 'play' | 'clean' | 'rest' | null) {
  if (activeAction) {
    return ACTION_MOTION_PATHS[activeAction];
  }

  return SPECIES_MOTION_PATHS[species][scene] ?? BASE_MOTION_PATHS[scene];
}

function getSceneInterval(species: PetSpecies, scene: SceneMode, activeAction: 'feed' | 'play' | 'clean' | 'rest' | null) {
  if (activeAction) {
    if (species === 'turtle') {
      return ACTION_INTERVAL_MS[activeAction] + 220;
    }

    if (species === 'fox' && activeAction === 'play') {
      return 620;
    }

    return ACTION_INTERVAL_MS[activeAction];
  }

  if (species === 'turtle') {
    return scene === 'critical' ? 620 : SCENE_INTERVAL_MS[scene] + 700;
  }

  if (species === 'fox' && scene === 'playful') {
    return 920;
  }

  if (species === 'pig' && scene === 'tired') {
    return 3000;
  }

  return SCENE_INTERVAL_MS[scene];
}

function getAmbientBehavior(species: PetSpecies): Exclude<AmbientBehavior, null> {
  switch (species) {
    case 'cat':
    case 'dog':
    case 'fox':
      return 'tail-wag';
    case 'pig':
      return 'ear-twitch';
    case 'turtle':
      return 'head-peek';
  }
}

function getAmbientDelayMs(species: PetSpecies): number {
  switch (species) {
    case 'cat':
      return 5600;
    case 'dog':
      return 4300;
    case 'pig':
      return 6200;
    case 'fox':
      return 5000;
    case 'turtle':
      return 7200;
  }
}

function getActionLabel(action: 'feed' | 'play' | 'clean' | 'rest') {
  switch (action) {
    case 'feed':
      return '喂食中';
    case 'play':
      return '玩耍中';
    case 'clean':
      return '清洁中';
    case 'rest':
      return '准备休息';
  }
}

function getStageSpriteLabel(stage: PetRuntimeState['stage']): string {
  switch (stage) {
    case 'baby':
      return '幼崽体型';
    case 'child':
      return '成长期';
    case 'adult':
      return '成熟体';
  }
}

function getSceneProp(
  pet: PetRuntimeState,
  scene: SceneMode,
  activeAction: 'feed' | 'play' | 'clean' | 'rest' | null
) {
  const speciesMeta = getPetSpeciesMeta(pet.identity.species);

  if (activeAction === 'feed') {
    return { className: speciesMeta.feedPropClass, label: speciesMeta.feedPropLabel };
  }

  if (activeAction === 'play') {
    return { className: speciesMeta.playPropClass, label: speciesMeta.playPropLabel };
  }

  if (activeAction === 'clean') {
    return { className: speciesMeta.cleanPropClass, label: speciesMeta.cleanPropLabel };
  }

  if (activeAction === 'rest' || scene === 'sleep') {
    return { className: speciesMeta.restPropClass, label: speciesMeta.restPropLabel };
  }

  if (scene === 'critical') {
    return { className: 'scene-prop--alert', label: '警报灯' };
  }

  if (scene === 'tired') {
    return { className: 'scene-prop--lamp', label: '夜灯' };
  }

  return { className: 'scene-prop--plant', label: '像素盆栽' };
}

type PetAvatarProps = {
  pet: PetRuntimeState;
  recentAction: RecentAction | null;
};

export function PetAvatar({ pet, recentAction }: PetAvatarProps) {
  const currentHour = new Date().getHours();
  const period = getScenePeriod(currentHour);
  const scene = getSceneMode(pet);
  const speciesMeta = getPetSpeciesMeta(pet.identity.species);
  const [frameIndex, setFrameIndex] = useState(0);
  const [activeAction, setActiveAction] = useState<'feed' | 'play' | 'clean' | 'rest' | null>(null);
  const [ambientBehavior, setAmbientBehavior] = useState<AmbientBehavior>(null);

  useEffect(() => {
    if (
      recentAction?.action === 'feed' ||
      recentAction?.action === 'play' ||
      recentAction?.action === 'clean' ||
      recentAction?.action === 'rest'
    ) {
      setActiveAction(recentAction.action);

      const timer = window.setTimeout(() => {
        setActiveAction((current) => (current === recentAction.action ? null : current));
      }, recentAction.action === 'rest' ? 2400 : 1800);

      return () => {
        window.clearTimeout(timer);
      };
    }

    return undefined;
  }, [recentAction]);

  useEffect(() => {
    if (activeAction || scene === 'critical' || scene === 'sleep') {
      setAmbientBehavior(null);
      return undefined;
    }

    const ambient = getAmbientBehavior(pet.identity.species);
    const delay = getAmbientDelayMs(pet.identity.species);
    let timeoutId = 0;
    let clearId = 0;

    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        setAmbientBehavior(ambient);
        clearId = window.setTimeout(() => {
          setAmbientBehavior(null);
          schedule();
        }, pet.identity.species === 'turtle' ? 1600 : 1300);
      }, delay);
    };

    schedule();

    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(clearId);
    };
  }, [activeAction, pet.identity.species, scene]);

  const motionFrames = useMemo(
    () => getMotionFrames(pet.identity.species, scene, activeAction),
    [activeAction, pet.identity.species, scene]
  );

  const currentInterval = useMemo(
    () => getSceneInterval(pet.identity.species, scene, activeAction),
    [activeAction, pet.identity.species, scene]
  );

  useEffect(() => {
    setFrameIndex(0);

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % motionFrames.length);
    }, currentInterval);

    return () => {
      window.clearInterval(timer);
    };
  }, [currentInterval, motionFrames.length]);

  const currentFrame = motionFrames[frameIndex] ?? motionFrames[0];
  const sceneProp = getSceneProp(pet, scene, activeAction);

  return (
    <section
      className={`pet-display pet-display--${period} pet-display--${scene} ${
        activeAction ? `pet-display--action-${activeAction}` : ''
      }`}
    >
      <div className="scene-chip">
        {getSceneLabel(scene, period)}
        {activeAction ? ` · ${getActionLabel(activeAction)}` : ''}
      </div>
      <div className={`growth-chip growth-chip--${pet.stage}`}>{getStageSpriteLabel(pet.stage)}</div>

      <div className={`pet-scene pet-scene--${pet.identity.species}`} aria-label="宠物像素场景">
        <div className={`scene-celestial scene-celestial--${period}`} aria-hidden="true" />
        <div className="scene-cloud scene-cloud--1" aria-hidden="true" />
        <div className="scene-cloud scene-cloud--2" aria-hidden="true" />
        <div className="scene-star scene-star--1" aria-hidden="true" />
        <div className="scene-star scene-star--2" aria-hidden="true" />
        <div className="scene-star scene-star--3" aria-hidden="true" />

        <div className={`scene-prop ${sceneProp.className}`} aria-label={sceneProp.label} />

        {activeAction === 'feed' ? (
          <div className={`action-effect action-effect--feed action-effect--${pet.identity.species}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {activeAction === 'play' ? (
          <div className={`action-effect action-effect--play action-effect--${pet.identity.species}`} aria-hidden="true">
            <span />
          </div>
        ) : null}

        {activeAction === 'clean' ? (
          <div className={`action-effect action-effect--clean action-effect--${pet.identity.species}`} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {activeAction === 'rest' || scene === 'sleep' ? (
          <div className={`action-effect action-effect--rest action-effect--${pet.identity.species}`} aria-hidden="true">
            <span>Z</span>
            <span>Z</span>
            <span>Z</span>
          </div>
        ) : null}

        <div
          className="pet-motion"
          style={{
            left: `${currentFrame.x}%`,
            top: `${currentFrame.y}%`
          }}
        >
          <div
            className={`pet-motion-inner ${
              activeAction ? `pet-motion-inner--action-${activeAction}` : `pet-motion-inner--${scene}`
            }`}
          >
            <div
              className={`pet-sprite pet-sprite--${pet.stage} pet-sprite--${pet.identity.species} ${
                ambientBehavior ? `pet-sprite--ambient-${ambientBehavior}` : ''
              }`}
            >
              <span className="pet-sprite__shadow" aria-hidden="true" />
              <span className={currentFrame.facing === 'left' ? 'pet-sprite__art is-flipped' : 'pet-sprite__art'}>
                <img
                  className="pet-sprite__image"
                  src={speciesMeta.spritePath}
                  alt={`${speciesMeta.label}桌面形象`}
                  draggable={false}
                />
                <span className="pet-sprite__stage-accent" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        <div className={`scene-ground scene-ground--${pet.identity.species}`} aria-hidden="true" />
      </div>

      <div className="pet-bubble">{getMoodBubble(pet)}</div>
    </section>
  );
}
