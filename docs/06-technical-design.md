# 技术设计文档（Technical Design）

## 文档信息

| 项目 | 内容 |
| --- | --- |
| 项目名称 | AI Coding Pet |
| 文档名称 | 技术设计文档（Technical Design） |
| 文档版本 | v0.1 |
| 创建日期 | 2026-05-02 |
| 当前状态 | 草案 |
| 上游文档 | `docs/01-project-charter.md`、`docs/02-requirements-analysis.md`、`docs/03-prd.md`、`docs/04-gameplay-design.md`、`docs/05-ui-ux-design.md` |

## 1. 文档目标

本文档用于将前期产品、玩法和交互设计转化为可实施的工程方案，重点回答以下问题：

- 首版采用什么技术栈
- 代码结构如何组织
- 核心模块如何拆分
- 宠物状态、时间推进、死亡机制和存档如何实现
- UI 层和规则层如何解耦
- 测试应该覆盖哪些核心逻辑

本文档聚焦 `首版 MVP 可实现方案`，以保证结构清晰、实现可控、后续可扩展。

## 2. 技术目标

首版技术方案需要满足以下目标：

- 快速构建一个可运行、可测试、可迭代的网页游戏
- 让核心规则逻辑独立于 UI
- 支持在线衰减、离线结算、死亡流程和重新开始机制
- 支持本地持久化与恢复
- 支持后续增加更多状态、事件、成长分支和视觉表现

## 3. 技术选型

## 3.1 首版技术栈建议

建议首版采用以下技术栈：

- `React`
- `Vite`
- `TypeScript`
- `CSS Modules` 或 `普通 CSS`
- `Vitest`
- `Testing Library`

## 3.2 选择理由

### React

- 适合组件化构建主界面、弹层和状态展示
- 适合用声明式方式处理宠物状态变化和页面状态切换

### Vite

- 启动快，适合从 0 到 1 快速迭代
- 配置成本低，适合 AI coding 协作

### TypeScript

- 能约束宠物状态、成长阶段、死亡状态、存档结构等核心模型
- 有助于降低后续功能扩展时的结构风险

### CSS Modules 或普通 CSS

- 首版 UI 复杂度有限，不需要引入过重样式体系
- 方便快速控制怀旧风格和响应式细节

### Vitest + Testing Library

- 可覆盖纯逻辑测试和核心交互流程测试
- 与 Vite 集成顺滑

## 3.3 首版不建议引入的技术

首版不建议过早引入：

- 后端服务
- 数据库
- Redux 级别的重型状态方案
- Electron 或原生容器
- 复杂动画框架

原因：

- 当前 MVP 更重视玩法闭环验证，不需要为未来过度设计

## 4. 架构设计原则

## 4.1 核心原则

首版架构采用以下原则：

- `规则逻辑与 UI 分离`
- `时间结算集中处理`
- `存档模型独立定义`
- `页面状态与宠物状态分层`
- `先模块清晰，再做视觉表现`

## 4.2 分层思路

建议将项目逻辑分成 4 层：

1. `Domain 层`
2. `Application 层`
3. `Persistence 层`
4. `UI 层`

### Domain 层

负责纯规则逻辑，例如：

- 状态更新
- 在线衰减
- 离线结算
- 成长判断
- 危险/危急/死亡判断

### Application 层

负责组织流程，例如：

- 首次初始化流程
- 命名和性别选择后的宠物创建
- 游戏启动时的恢复和结算
- 用户点击操作后的状态变更与保存

### Persistence 层

负责：

- 本地存档读写
- 数据校验
- 默认值补全

### UI 层

负责：

- 主页面展示
- 状态条
- 操作按钮
- 危急提示
- 成长提示
- 死亡回顾页

## 5. 目录结构建议

建议目录结构如下：

```text
project-root/
  docs/
  public/
  src/
    app/
      App.tsx
      routes.ts
    components/
      pet/
      status/
      controls/
      overlays/
      layout/
    features/
      pet-identity/
      pet-care/
      pet-growth/
      pet-death/
      pet-save/
    domain/
      pet/
        pet-model.ts
        pet-rules.ts
        pet-status.ts
      time/
        decay-rules.ts
        offline-settlement.ts
      growth/
        growth-rules.ts
      death/
        death-rules.ts
      save/
        save-schema.ts
        save-serializer.ts
    store/
      game-store.ts
      game-selectors.ts
    hooks/
      use-game-loop.ts
      use-offline-sync.ts
    services/
      local-storage.ts
      game-engine.ts
    types/
      game.ts
      pet.ts
      save.ts
      ui.ts
    styles/
      globals.css
      tokens.css
  tests/
    unit/
    integration/
```

## 6. 核心数据模型设计

## 6.1 宠物身份模型

建议定义：

```ts
type PetGender = 'boy' | 'girl' | 'unknown';

type PetIdentity = {
  id: string;
  name: string;
  gender: PetGender;
  createdAt: number;
};
```

说明：

- `id` 用于唯一标识一轮宠物生命周期
- `name` 用于展示、成长提示、死亡回顾
- `gender` 首版仅用于身份表达，不参与数值逻辑
- `createdAt` 用于计算存活时长

## 6.2 宠物数值状态模型

建议定义：

```ts
type PetStats = {
  hunger: number;
  mood: number;
  cleanliness: number;
  energy: number;
  health: number;
};
```

所有数值统一为 `0 - 100`。

## 6.3 宠物阶段与异常状态模型

建议定义：

```ts
type PetStage = 'baby' | 'child' | 'adult';

type PetCondition =
  | 'normal'
  | 'tired'
  | 'depressed'
  | 'sick'
  | 'weak'
  | 'danger'
  | 'critical'
  | 'dead';
```

说明：

- `danger` 对应危险状态
- `critical` 对应危急状态
- `dead` 对应死亡后不可继续照顾状态

## 6.4 宠物完整运行态模型

建议定义：

```ts
type CareQuality = 'excellent' | 'good' | 'normal' | 'poor';

type PetRuntimeState = {
  identity: PetIdentity;
  stage: PetStage;
  stats: PetStats;
  condition: PetCondition;
  isSleeping: boolean;
  lastUpdatedAt: number;
  lastInteractedAt: number;
  enteredDangerAt: number | null;
  enteredCriticalAt: number | null;
  careScore: number;
  careQuality: CareQuality;
  isAlive: boolean;
};
```

说明：

- `lastUpdatedAt` 用于在线与离线结算
- `enteredDangerAt` 和 `enteredCriticalAt` 用于死亡缓冲阶段判断
- `careScore` 用于成长质量和历史记录
- `isAlive` 用于区分是否进入死亡回顾流程

## 6.5 历史记录模型

建议定义：

```ts
type PetMemorialRecord = {
  petId: string;
  name: string;
  gender: PetGender;
  livedDays: number;
  finalStage: PetStage;
  careQuality: CareQuality;
  diedAt: number;
};
```

说明：

- 首版可以只保存最近一次或最近几次记录
- 该结构用于死亡回顾页和后续纪念系统扩展

## 7. 页面与 UI 状态模型

## 7.1 页面状态建议

建议用简单页面模式控制主流程：

```ts
type Screen =
  | 'welcome'
  | 'identity-setup'
  | 'main'
  | 'death-recap';
```

## 7.2 弹层状态建议

建议将弹层作为独立 UI 状态：

```ts
type OverlayState = {
  growthNotice: boolean;
  criticalAlert: boolean;
  offlineSummary: boolean;
};
```

说明：

- 页面承载大流程
- 弹层承载临时状态反馈
- 不要把所有状态都做成单独页面

## 8. 状态管理方案

## 8.1 首版建议

首版建议使用 `轻量自定义 store` 或 `Zustand`。

如果希望最少依赖，可直接采用：

- `useState + useReducer + Context`

如果希望后期更易扩展，建议使用：

- `Zustand`

## 8.2 当前推荐

建议首版采用 `Zustand`，原因：

- API 轻
- 学习成本低
- 更适合将游戏逻辑和 UI 组件解耦
- 后面加入更多状态和弹层会更顺

## 8.3 Store 职责边界

Store 主要负责：

- 当前宠物状态
- 当前页面状态
- 当前弹层状态
- 用户操作入口
- 自动存档触发

Store 不应直接写复杂规则。复杂结算应委托给 `domain` 或 `service` 层函数。

## 9. 核心模块设计

## 9.1 宠物初始化模块

职责：

- 检测是否存在存档
- 首次创建宠物
- 处理命名与性别选择
- 初始化默认状态

建议输出函数：

```ts
createNewPet(input: {
  name?: string;
  gender: PetGender;
  now: number;
}): PetRuntimeState
```

## 9.2 在线衰减模块

职责：

- 根据在线经过时间更新状态
- 适配不同状态的在线衰减频率

建议输出函数：

```ts
applyOnlineDecay(
  state: PetRuntimeState,
  elapsedMs: number
): PetRuntimeState
```

说明：

- 尽量基于“经过时间”计算，而不是简单每秒 setInterval 直接减值
- 这样更利于测试，也更稳定

## 9.3 离线结算模块

职责：

- 根据离线时长进行温和衰减
- 执行离线分段策略和上限保护
- 触发危险/危急判断
- 但不直接让离线结算跨过补救窗口进入死亡

建议输出函数：

```ts
settleOfflineProgress(
  state: PetRuntimeState,
  now: number
): {
  nextState: PetRuntimeState;
  summary: OfflineSummary;
}
```

建议的离线摘要模型：

```ts
type OfflineSummary = {
  elapsedMs: number;
  statChanges: Partial<PetStats>;
  enteredDanger: boolean;
  enteredCritical: boolean;
};
```

## 9.4 玩家交互模块

职责：

- 处理喂食、玩耍、清洁、休息
- 更新数值
- 校验可交互条件
- 返回反馈消息

建议输出函数：

```ts
performAction(
  state: PetRuntimeState,
  action: 'feed' | 'play' | 'clean' | 'rest',
  now: number
): {
  nextState: PetRuntimeState;
  message: string;
}
```

## 9.5 成长模块

职责：

- 检查成长条件
- 根据存活时长和照顾质量切换阶段
- 生成成长提示事件

建议输出函数：

```ts
checkGrowthTransition(
  state: PetRuntimeState,
  now: number
): {
  nextState: PetRuntimeState;
  grew: boolean;
}
```

## 9.6 危险、危急与死亡模块

职责：

- 判断是否进入危险状态
- 判断是否升级到危急状态
- 判断是否触发死亡
- 生成死亡记录

建议输出函数：

```ts
evaluateLifeCycle(
  state: PetRuntimeState,
  now: number
): {
  nextState: PetRuntimeState;
  memorialRecord?: PetMemorialRecord;
}
```

## 9.7 存档模块

职责：

- 保存宠物状态
- 恢复宠物状态
- 保存死亡记录
- 做数据版本兼容

## 10. 时间系统实现策略

## 10.1 为什么不直接靠定时器扣值

如果完全依赖固定定时器直接扣值，容易出现以下问题：

- 浏览器标签页切换后计时不准确
- 设备性能波动会影响状态结算
- 很难稳定测试

因此建议采用：

- `时间戳 + 纯函数结算`

即：

- 每次循环或恢复时读取当前时间
- 计算距离上次更新经过了多久
- 用规则函数统一结算状态变化

## 10.2 在线循环建议

建议前端使用一个轻量循环，例如每 `5 - 10 秒` 刷新一次：

- 不是每次刷新都直接固定扣值
- 而是读取真实经过时间进行结算

这样既保留在线变化感，又避免误差累积。

## 10.3 离线恢复策略

游戏启动时建议执行：

1. 读取存档
2. 计算 `now - lastUpdatedAt`
3. 使用离线结算函数更新状态
4. 展示离线摘要
5. 写回新状态

## 11. 存档方案设计

## 11.1 首版存储方式

首版建议使用：

- `localStorage`

原因：

- 实现快
- 不依赖后端
- 足够支撑单机 MVP

## 11.2 存档内容

建议保存：

- 当前宠物完整运行态
- 历史死亡记录
- UI 必要状态
- 存档版本号

建议结构：

```ts
type SaveData = {
  version: 1;
  currentPet: PetRuntimeState | null;
  memorials: PetMemorialRecord[];
  updatedAt: number;
};
```

## 11.3 存档时机

建议在以下时机保存：

- 初始化宠物后
- 每次玩家交互后
- 每次重要状态变化后
- 成长发生后
- 危急状态变化后
- 死亡发生后

## 11.4 存档校验

恢复时需要做：

- JSON 解析保护
- 字段缺失补默认值
- 非法数值裁剪到合法范围
- 未知版本兜底处理

## 12. 组件设计建议

## 12.1 主界面组件

建议拆分：

- `AppShell`
- `HeaderPanel`
- `PetDisplay`
- `StatusPanel`
- `ActionPanel`
- `HintPanel`
- `StageInfoPanel`

## 12.2 弹层组件

建议拆分：

- `GrowthModal`
- `CriticalAlertModal`
- `OfflineSummaryModal`

## 12.3 死亡页面组件

建议拆分：

- `DeathRecapScreen`
- `MemorialCard`
- `RestartButton`

## 12.4 身份设定组件

建议拆分：

- `IdentitySetupScreen`
- `PetNameInput`
- `PetGenderSelector`

## 13. 服务与 Hook 设计建议

## 13.1 game-engine service

建议集中封装：

- 启动恢复逻辑
- 在线 tick 逻辑
- 玩家操作执行逻辑
- 成长/死亡联动流程

## 13.2 use-game-loop

负责：

- 驱动在线时间更新
- 周期性触发结算

## 13.3 use-offline-sync

负责：

- 首次挂载时进行离线恢复
- 控制离线摘要是否显示

## 14. 测试设计

## 14.1 单元测试重点

建议覆盖：

- 创建宠物默认值是否正确
- 名字和性别是否正确进入状态模型
- 在线衰减是否按规则变化
- 离线衰减是否比在线更温和
- 离线 24 小时是否仍保留恢复空间
- 喂食、玩耍、清洁、休息的数值影响是否正确
- 成长判断是否正确
- 危险、危急、死亡升级链是否正确
- 离线状态下不会直接跨过补救阶段进入死亡

## 14.2 集成测试重点

建议覆盖：

- 首次进入 -> 命名 -> 选择性别 -> 进入主界面
- 操作一次 -> 状态更新 -> 自动存档
- 刷新页面 -> 恢复状态成功
- 危急状态出现 -> 用户补救 -> 状态恢复
- 死亡触发 -> 生成回顾页 -> 可以重新开始

## 14.3 手工测试重点

建议重点体验：

- 页面是否能在 1 分钟内理解
- 怀旧感是否成立
- 离线一天后的状态是否合理
- 死亡时是否有情绪重量而不是单纯挫败

## 15. 风险与技术对策

## 15.1 逻辑过度耦合

风险：

- UI 组件里直接写规则，后期难维护

对策：

- 强制核心规则进入 `domain` 层

## 15.2 时间结算不稳定

风险：

- 在线和离线结果不一致

对策：

- 所有状态变化统一走时间戳计算

## 15.3 存档损坏

风险：

- 旧数据或非法数据导致界面崩溃

对策：

- 增加存档校验和默认值补全

## 15.4 死亡流程打断体验

风险：

- 状态切换不清晰，玩家不明白发生了什么

对策：

- 将 `critical` 和 `dead` 分成明确 UI 状态，并配套提示流程

## 16. 实施顺序建议

建议按以下顺序实现：

1. 初始化项目脚手架
2. 定义类型与核心数据模型
3. 实现创建宠物与存档恢复
4. 实现基础主界面
5. 实现 4 个核心操作
6. 实现在线衰减
7. 实现离线结算
8. 实现成长判断
9. 实现危险/危急/死亡流程
10. 实现死亡回顾与重新开始
11. 补测试
12. 做体验调优

## 17. 结论

首版技术设计已经形成一套可执行方案：以前端单机架构为基础，以 `TypeScript + React + Vite` 为实现栈，以 `规则纯函数 + 轻量状态管理 + localStorage 持久化` 为核心策略，支持宠物身份设定、双频率状态衰减、成长、死亡、回顾与重开等完整闭环。接下来可以进入任务拆解阶段，把本文档直接转成 coding 任务列表。
