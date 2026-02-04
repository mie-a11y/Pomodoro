# Zen-Station 设计文档

> 创建时间: 2026-02-04
> 状态: 已确认，待实施

## 1. 项目概述

**Zen-Station** 是一个禅意风格的 3D 番茄钟 PWA 应用。用户在专注工作时，屏幕中央的 3D 盆栽会随时间缓慢生长，完成的番茄钟会累积到植物的总生长值，形成长期养成体验。

### 核心特性
- 禅意花园视觉风格（后期可切换其他风格）
- 3D 盆栽实时生长动画（后期可切换其他植物）
- 可自定义番茄钟时长
- 累积养成系统（跨会话保留）
- PWA 支持（可安装、离线使用）
- 响应式设计（移动端优先）

## 2. 技术架构

### 技术栈
```
框架层：React 18 + TypeScript + Vite
3D 层：Three.js + React Three Fiber + @react-three/drei
样式层：Tailwind CSS 4 + CSS 变量（主题切换）
状态层：Zustand（轻量状态管理）
存储层：localStorage（用户数据持久化）
PWA 层：vite-plugin-pwa（离线 + 可安装）
```

### 目录结构
```
zen-station/
├── public/
│   ├── sounds/          # 音效文件
│   └── icons/           # PWA 图标
├── src/
│   ├── components/      # UI 组件
│   │   ├── Timer/       # 时间显示
│   │   ├── Controls/    # 控制面板
│   │   └── Settings/    # 设置弹窗
│   ├── three/           # 3D 场景
│   │   ├── Scene.tsx    # 场景容器
│   │   ├── Plant.tsx    # 植物组件
│   │   ├── Pot.tsx      # 花盆组件
│   │   └── Environment.tsx
│   ├── hooks/           # 自定义 hooks
│   │   ├── useTimer.ts  # 计时器逻辑
│   │   ├── useAudio.ts  # 音效控制
│   │   └── useStorage.ts
│   ├── stores/          # Zustand 状态
│   │   └── useStore.ts
│   ├── themes/          # 主题配置
│   │   └── zen-garden.ts
│   ├── plants/          # 植物配置
│   │   └── bonsai.ts
│   ├── types/           # TypeScript 类型
│   └── App.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## 3. 核心功能模块

### 3.1 计时器模块 (`hooks/useTimer.ts`)
```typescript
interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'break';
  timeRemaining: number;      // 剩余秒数
  currentSession: number;     // 当前第几个番茄钟
  settings: {
    workDuration: number;     // 默认 25 分钟
    shortBreak: number;       // 默认 5 分钟
    longBreak: number;        // 默认 15 分钟
    longBreakInterval: number; // 默认 4 轮
  };
}

// 核心逻辑
- 倒计时每秒更新
- 完成一个番茄钟 → 记录到累积数据 → 切换到休息
- 每 4 个番茄钟触发长休息
- 支持暂停/继续/重置
```

### 3.2 植物生长模块 (`three/Plant.tsx`)
```typescript
interface PlantState {
  growthProgress: number;     // 当前番茄钟进度 0-100%
  totalGrowth: number;        // 累积生长值（总番茄钟数）
  stage: 'sprout' | 'young' | 'mature' | 'ancient';
}

// 生长阶段映射
- 幼苗 (0-10 番茄钟)：单根细茎，1-2片叶子
- 小树 (11-50)：主干变粗，分出枝干
- 成树 (51-200)：枝叶丰满，树冠成型
- 古树 (200+)：细节增加，可能开花

// 实时生长
- useFrame 每帧更新
- 根据剩余时间计算生长进度
- 生长表现：树干高度、枝干延展、叶子密度
```

### 3.3 数据存储模块 (`stores/useStore.ts`)
```typescript
interface Store {
  // 设置
  settings: TimerSettings;

  // 统计
  stats: {
    totalPomodoros: number;   // 总番茄钟数
    todayPomodoros: number;   // 今日完成数
    streakDays: number;       // 连续天数
    lastActiveDate: string;   // 最后活跃日期
  };

  // 植物
  plant: {
    type: string;             // 植物类型 ID
    totalGrowth: number;      // 累积生长值
  };

  // 主题
  theme: string;              // 主题 ID
}
```

## 4. UI 界面设计

### 4.1 布局结构（移动端优先）
```
┌─────────────────────────┐
│                         │
│      3D 场景区域         │
│    （盆栽 + 禅意背景）    │
│                         │
│         60%             │
├─────────────────────────┤
│      时间显示            │
│      25:00              │
│         15%             │
├─────────────────────────┤
│    底部控制面板          │
│  [开始] [暂停] [设置]    │
│         25%             │
└─────────────────────────┘
```

### 4.2 禅意花园视觉风格
```css
/* 配色 */
--bg-gradient-start: #FAF8F5;  /* 米白 */
--bg-gradient-end: #F0EBE3;
--color-primary: #2D4A3E;       /* 墨绿 */
--color-accent: #C9B99A;        /* 枯山水砂色 */
--color-text: #333333;          /* 深灰 */

/* 字体 */
--font-timer: 'Roboto Mono', monospace;
--font-ui: 'Inter', sans-serif;

/* 氛围 */
- 柔和阴影、圆角元素
- 植物下方淡淡倒影
- 可选：轻微光斑粒子
```

### 4.3 响应式断点
```
移动端 (<640px)：单列布局，底部面板固定
平板 (640-1024px)：植物稍大，控制面板居中
桌面 (>1024px)：植物居中放大，两侧留白
```

## 5. 3D 场景实现

### 5.1 场景组成
```jsx
<Canvas>
  <Environment />           // 环境光照（柔和 HDRI）
  <PerspectiveCamera />     // 固定视角，略微俯视
  <Plant />                 // 核心：生长的盆栽
  <Pot />                   // 花盆（陶土质感）
  <Ground />                // 地面（可选：枯山水纹理）
  <Effects />               // 后期（柔和辉光、景深）
</Canvas>
```

### 5.2 性能优化
- 低多边形风格（Low Poly）契合禅意美学且性能好
- 移动端限制：最大 5000 三角面
- 使用 InstancedMesh 处理重复叶片
- requestAnimationFrame 自动降频（后台标签页暂停）

## 6. 音效系统

### 6.1 MVP 阶段
```
音效列表：
- 开始专注：轻微的钵声 (singing bowl)
- 番茄钟完成：清脆风铃声
- 休息结束：柔和钵声回响

技术实现：
- Web Audio API 或 Howler.js
- 音频格式：MP3 + OGG
- 文件大小：每个 < 50KB
- 用户可调节音量或静音
```

### 6.2 后期扩展
```
第二阶段 - 视觉提醒：
- 植物发光脉动
- 背景颜色柔和渐变

第三阶段 - 系统通知：
- Web Notification API
- 请求权限后推送

设置面板：
├── 音效开关 + 音量滑块
├── 视觉提醒开关
└── 系统通知开关
```

## 7. PWA 与兼容性

### 7.1 PWA 配置
```javascript
// vite.config.ts - VitePWA 配置
{
  name: 'Zen Station',
  short_name: 'Zen',
  theme_color: '#2D4A3E',
  background_color: '#FAF8F5',
  display: 'standalone',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192' },
    { src: '/icons/icon-512.png', sizes: '512x512' }
  ]
}

// 离线策略
- 核心资源：CacheFirst
- 字体/图片：StaleWhileRevalidate
```

### 7.2 浏览器兼容性
```
必须支持：
✓ Chrome 90+ (桌面 + Android)
✓ Safari 15+ (iOS + macOS)
✓ Firefox 90+
✓ Edge 90+

降级方案：
- WebGL 不支持 → 静态插画 + 基础计时器
- 通知不支持 → 仅音效 + 视觉提醒
```

### 7.3 移动端适配
- 触摸优化：按钮最小 44x44px
- 安全区域：适配 iPhone 刘海/底部横条
- 横屏锁定：建议竖屏使用

## 8. 可扩展架构

### 8.1 主题系统
```typescript
// themes/zen-garden.ts
export const zenGarden: Theme = {
  id: 'zen-garden',
  name: '禅意花园',
  colors: {
    background: ['#FAF8F5', '#F0EBE3'],
    primary: '#2D4A3E',
    accent: '#C9B99A',
    text: '#333333',
  },
  lighting: 'soft',
  particles: 'dust',
  sounds: 'bowl',
}

// 后期可添加主题
- sci-fi: 科幻控制台
- forest: 森林氛围
- ocean: 海洋深蓝
```

### 8.2 植物系统
```typescript
// plants/bonsai.ts
export const bonsai: PlantConfig = {
  id: 'bonsai',
  name: '盆栽小树',
  stages: ['sprout', 'young', 'mature', 'ancient'],
  growthCurve: 'logarithmic',
  model: () => import('./models/Bonsai'),
}

// 后期可添加植物
- bamboo: 竹子
- lotus: 莲花
- succulent: 多肉
```

## 9. 实施路线图

### Phase 1: MVP（核心功能）
- [ ] 项目初始化（Vite + React + TS）
- [ ] 基础计时器逻辑
- [ ] 简单 3D 植物（几何体原型）
- [ ] 底部控制面板 UI
- [ ] localStorage 数据持久化
- [ ] 禅意音效

### Phase 2: 完善体验
- [ ] 精细植物模型与生长动画
- [ ] 累积养成系统
- [ ] 设置面板
- [ ] PWA 支持
- [ ] 响应式优化

### Phase 3: 扩展功能
- [ ] 主题切换系统
- [ ] 更多植物类型
- [ ] 视觉提醒
- [ ] 系统通知
- [ ] 统计数据可视化

---

## 附录：依赖清单

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@react-three/fiber": "^8.x",
    "@react-three/drei": "^9.x",
    "three": "^0.160.x",
    "zustand": "^4.x",
    "howler": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "vite-plugin-pwa": "^0.17.x",
    "tailwindcss": "^4.x",
    "@types/react": "^18.x",
    "@types/three": "^0.160.x"
  }
}
```
