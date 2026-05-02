import { useEffect, useMemo, useState } from 'react';
import type { PetRuntimeState } from '../../types/pet';
import type { RecentAction } from '../../types/ui';

type SceneMode = 'sleep' | 'critical' | 'playful' | 'tired' | 'idle';
type ScenePeriod = 'dawn' | 'day' | 'sunset' | 'night';
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
    return '呼...呼...现在正在按时长慢慢恢复体力。';
  }

  if (pet.stats.mood >= 75 && pet.stats.energy >= 55) {
    return '好耶，今天想在房间里跑一圈。';
  }

  if (pet.stats.hunger <= 30) {
    return '肚子在咕咕叫，我想吃东西。';
  }

  if (pet.stats.cleanliness <= 30) {
    return '想洗个舒服的澡，再继续玩。';
  }

  if (pet.stats.energy <= 30) {
    return '我先慢慢走，等会儿可能要睡了。';
  }

  return '陪陪我吧，我会自己在这边转一转。';
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

function getSceneProp(
  scene: SceneMode,
  activeAction: 'feed' | 'play' | 'clean' | 'rest' | null
) {
  if (activeAction === 'feed') {
    return { className: 'scene-prop--bowl', label: '像素食盆' };
  }

  if (activeAction === 'play') {
    return { className: 'scene-prop--ball', label: '像素玩具球' };
  }

  if (activeAction === 'clean') {
    return { className: 'scene-prop--bath', label: '泡泡浴盆' };
  }

  if (activeAction === 'rest' || scene === 'sleep') {
    return { className: 'scene-prop--bed', label: '软绵绵小床' };
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
  const [frameIndex, setFrameIndex] = useState(0);
  const [activeAction, setActiveAction] = useState<'feed' | 'play' | 'clean' | 'rest' | null>(null);

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

  const motionFrames = useMemo(() => {
    if (activeAction) {
      return ACTION_MOTION_PATHS[activeAction];
    }

    return BASE_MOTION_PATHS[scene];
  }, [activeAction, scene]);

  const currentInterval = activeAction
    ? ACTION_INTERVAL_MS[activeAction]
    : SCENE_INTERVAL_MS[scene];

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
  const sceneProp = getSceneProp(scene, activeAction);

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

      <div className="pet-scene" aria-label="宠物像素场景">
        <div className={`scene-celestial scene-celestial--${period}`} aria-hidden="true" />
        <div className="scene-cloud scene-cloud--1" aria-hidden="true" />
        <div className="scene-cloud scene-cloud--2" aria-hidden="true" />
        <div className="scene-star scene-star--1" aria-hidden="true" />
        <div className="scene-star scene-star--2" aria-hidden="true" />
        <div className="scene-star scene-star--3" aria-hidden="true" />

        <div className={`scene-prop ${sceneProp.className}`} aria-label={sceneProp.label} />

        {activeAction === 'feed' ? (
          <div className="action-effect action-effect--feed" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {activeAction === 'play' ? (
          <div className="action-effect action-effect--play" aria-hidden="true">
            <span />
          </div>
        ) : null}

        {activeAction === 'clean' ? (
          <div className="action-effect action-effect--clean" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {activeAction === 'rest' || scene === 'sleep' ? (
          <div className="action-effect action-effect--rest" aria-hidden="true">
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
              className={`pixel-pet pixel-pet--${pet.stage} pixel-pet--${pet.identity.species} ${
                currentFrame.facing === 'left' ? 'is-flipped' : ''
              }`}
            >
              <span className="pixel-pet__part pixel-pet__tail" />
              <span className="pixel-pet__part pixel-pet__body" />
              <span className="pixel-pet__part pixel-pet__chest" />
              <span className="pixel-pet__part pixel-pet__head" />
              <span className="pixel-pet__part pixel-pet__ear pixel-pet__ear--front" />
              <span className="pixel-pet__part pixel-pet__ear pixel-pet__ear--back" />
              <span className="pixel-pet__part pixel-pet__muzzle" />
              <span className="pixel-pet__part pixel-pet__nose" />
              <span className="pixel-pet__part pixel-pet__eye" />
              <span className="pixel-pet__part pixel-pet__leg pixel-pet__leg--front" />
              <span className="pixel-pet__part pixel-pet__leg pixel-pet__leg--back" />
              <span className="pixel-pet__part pixel-pet__paw pixel-pet__paw--front" />
              <span className="pixel-pet__part pixel-pet__paw pixel-pet__paw--back" />
              <span className="pixel-pet__part pixel-pet__whisker pixel-pet__whisker--top" />
              <span className="pixel-pet__part pixel-pet__whisker pixel-pet__whisker--mid" />
              <span className="pixel-pet__part pixel-pet__whisker pixel-pet__whisker--bottom" />
            </div>
          </div>
        </div>

        <div className="scene-ground" aria-hidden="true" />
      </div>

      <div className="pet-bubble">{getMoodBubble(pet)}</div>
    </section>
  );
}
