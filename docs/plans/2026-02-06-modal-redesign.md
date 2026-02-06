# 弹窗重构设计规范

> 日期: 2026-02-06 | 状态: 待审批

## 设计决策摘要

| 决策项 | 选择 |
|--------|------|
| 弹窗底层 | 手写 Modal (framer-motion + createPortal) |
| 布局形态 | 居中浮窗 |
| 视觉风格 | 层叠玻璃卡片 (和纸质感) |
| 控件风格 | 内嵌融合式 (隐于界面) |
| Stats 布局 | 垂直数据流 + 植物焦点区块 |

## 重构范围

### 删除的文件 (彻底清除)
```
src/components/ui/Modal.tsx          # 旧弹窗容器
src/components/ui/Slider.tsx         # 旧滑块
src/components/ui/Toggle.tsx         # 旧开关
src/components/ui/Stepper.tsx        # 旧步进器
src/components/ui/SectionGroup.tsx   # 旧分组容器
src/components/ui/StatCard.tsx       # 旧统计卡片
src/components/ui/PixelDecoration.tsx # 像素装饰 (不再使用)
src/components/settings/             # 整个文件夹
src/components/stats/                # 整个文件夹
```

### 新建的文件结构
```
src/components/ui/
├── Modal.tsx              # 新弹窗容器 (Overlay + Panel + Header + 动画)
├── Stepper.tsx            # 新步进器 (融合式)
├── Slider.tsx             # 新滑块 (极简)
├── Toggle.tsx             # 新开关 (小巧)
├── index.ts               # UI 组件统一导出

src/components/settings/
├── SettingsModal.tsx       # Store 连接层
├── SettingsContent.tsx     # 状态逻辑层
├── TimerSection.tsx        # 时间设置区
├── AudioSection.tsx        # 音频控制区
├── ActionButtons.tsx       # 底部按钮
├── index.ts               # 公开导出

src/components/stats/
├── StatsModal.tsx          # Store 连接层
├── StatsContent.tsx        # 状态逻辑层
├── StatsFlow.tsx           # 数据流列表
├── PlantProgress.tsx       # 植物成长焦点
├── index.ts               # 公开导出
```

---

## 一、Modal 容器规范

### 1.1 Overlay (遮罩层)

```
定位:        fixed inset-0 z-50
背景:        bg-black/20
模糊:        backdrop-blur-[2px]
布局:        flex items-center justify-center
内边距:      p-4 (移动端安全边距)
动画:        opacity 0→1, duration 200ms
```

### 1.2 Panel (弹窗面板)

```
宽度:        w-full max-w-[420px]
最大高度:    max-h-[80vh]
溢出:        overflow-y-auto overflow-x-hidden
背景:        bg-white/55 backdrop-blur-xl
边框:        border border-white/40
圆角:        rounded-3xl (24px)
阴影:        shadow-[0_8px_40px_-4px_rgba(0,0,0,0.08),0_4px_16px_-2px_rgba(0,0,0,0.05)]
内发光:      内层伪元素或 ring — ring-1 ring-inset ring-white/30
内边距:      px-7 pt-7 pb-6 (28px 水平, 28px 顶部, 24px 底部)
```

### 1.3 弹入动画 (framer-motion spring)

```typescript
const SPRING = { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 };

initial:  { opacity: 0, scale: 0.96, y: 8 }
animate:  { opacity: 1, scale: 1, y: 0 }
exit:     { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.15 } }
```

### 1.4 关闭按钮

```
定位:        absolute top-5 right-5
尺寸:        w-8 h-8
圆角:        rounded-xl
背景:        bg-transparent hover:bg-black/[0.04]
图标:        X 图标, 16px, stroke-width 1.5, color text-[var(--color-text-muted)]
过渡:        transition-colors duration-150
触摸目标:    44x44 (通过 padding 或 after 伪元素扩展)
```

### 1.5 Header

```
布局:        flex flex-col gap-1
标题:        text-lg font-semibold text-[var(--color-text)] tracking-[-0.01em]
副标题:      text-[13px] text-[var(--color-text-subtle)] font-normal
底部间距:    mb-6 (与内容区间距 24px)
无图标:      纯文字标题, 干净利落
```

### 1.6 交互行为

- ESC 键关闭
- 点击 Overlay 关闭
- `prefers-reduced-motion`: 关闭 spring 动画, 仅保留 opacity 过渡
- 打开时 body overflow hidden
- createPortal 渲染到 document.body

---

## 二、Settings 弹窗布局

### 2.1 整体结构

```
SettingsModal
├─ Modal
│  ├─ Header ("设置", "调整您的专注体验")
│  ├─ TimerSection                    ← mb-5
│  │  ├─ SectionLabel "时间"
│  │  └─ GlassCard
│  │     ├─ Stepper: 工作时长
│  │     ├─ Divider
│  │     ├─ Stepper: 短休息
│  │     ├─ Divider
│  │     ├─ Stepper: 长休息
│  │     ├─ Divider
│  │     └─ Stepper: 长休息间隔
│  ├─ AudioSection                    ← mb-6
│  │  ├─ SectionLabel "音频"
│  │  └─ GlassCard
│  │     ├─ VolumeRow (标签 + 百分比 + Slider)
│  │     ├─ Divider
│  │     └─ MuteRow (标签 + Toggle)
│  └─ ActionButtons
│     ├─ 取消 (secondary)
│     └─ 保存 (primary)
```

### 2.2 SectionLabel (区块标题)

```
布局:        flex items-center gap-1.5
文字:        text-xs font-medium uppercase tracking-widest
颜色:        text-[var(--color-text-subtle)]
底部间距:    mb-2.5
无图标:      纯文字, 极简
```

### 2.3 GlassCard (子卡片 — 比面板浅一层)

```
背景:        bg-white/30 backdrop-blur-sm
边框:        border border-white/30
圆角:        rounded-2xl (16px)
内边距:      无整体 padding, 由内部行自行控制
分割线:      内部行之间 — 1px solid rgba(0,0,0,0.04)
```

### 2.4 Divider (卡片内分割线)

```
样式:        h-px bg-black/[0.04]
水平边距:    mx-4 (左右缩进, 不贯穿全宽)
```

---

## 三、原子控件规范

### 3.1 Stepper (步进器 — 融合式)

```
行布局:      flex items-center justify-between
行内边距:    px-4 py-3.5

左侧标签:
  字号:      text-sm (14px)
  字重:      font-normal
  颜色:      text-[var(--color-text)]

右侧控制区:
  布局:      flex items-center gap-2

  按钮 (- / +):
    尺寸:    w-7 h-7
    圆角:    rounded-lg
    背景:    bg-transparent
    hover:   bg-black/[0.04]
    active:  bg-black/[0.06] scale-95
    disabled: opacity-25 cursor-not-allowed
    过渡:    transition-all duration-150
    图标:    Minus/Plus, 14px, stroke-width 1.5
    颜色:    text-[var(--color-text-muted)]

  数值显示:
    宽度:    min-w-[40px] text-center
    字体:    font-mono text-[15px] font-semibold
    颜色:    text-[var(--color-text)]
    无背景框: 纯数字, 融入界面

  单位:
    字号:    text-xs
    颜色:    text-[var(--color-text-subtle)]
    宽度:    w-6

交互:
  - 点击: 步进 ±1
  - 长按: 500ms 延迟后每 80ms 连续步进
  - mouseLeave/touchEnd: 清除定时器
```

### 3.2 Slider (滑块 — 极简)

```
容器:        relative h-10 flex items-center (触摸目标高度)

轨道:
  高度:      h-[3px]
  背景:      bg-black/[0.06]
  圆角:      rounded-full

已填充轨道:
  高度:      h-[3px]
  背景:      bg-[var(--color-primary)]
  圆角:      rounded-full
  过渡:      transition-[width] duration-75

滑块 (thumb):
  尺寸:      w-4 h-4 (16px)
  形状:      rounded-full
  背景:      bg-[var(--color-primary)]
  阴影:      shadow-[0_1px_4px_rgba(45,74,62,0.25)]
  无边框:    纯实心圆

  hover:     scale-110
  dragging:  scale-[1.2] shadow-[0_2px_8px_rgba(45,74,62,0.3)]
  disabled:  opacity-40

  过渡:      transition-transform duration-100

交互:
  - 拖拽, 触摸拖拽, 点击跳转
  - step: 0.05 (5%)
```

### 3.3 Toggle (开关 — 小巧)

```
容器 (按钮):
  尺寸:      w-10 h-[22px] (40x22)
  圆角:      rounded-full
  背景:
    off:     bg-black/[0.06]
    on:      bg-[var(--color-primary)]
  过渡:      transition-colors duration-200
  disabled:  opacity-40 cursor-not-allowed

拇指 (thumb):
  尺寸:      w-[18px] h-[18px]
  形状:      rounded-full
  背景:      bg-white
  阴影:      shadow-sm
  定位:      absolute top-[2px]

  动画 (framer-motion):
    off:     x: 2px
    on:      x: 20px
    spring:  { stiffness: 500, damping: 30 }

ARIA:
  role:      switch
  aria-checked: boolean
```

---

## 四、Settings 弹窗 — 各区域细节

### 4.1 TimerSection

| 行项 | 标签 | min | max | step | 单位 | 默认 |
|------|------|-----|-----|------|------|------|
| 工作时长 | 工作时长 | 1 | 60 | 1 | 分钟 | 25 |
| 短休息 | 短休息 | 1 | 30 | 1 | 分钟 | 5 |
| 长休息 | 长休息 | 5 | 60 | 5 | 分钟 | 15 |
| 长休息间隔 | 长休息间隔 | 2 | 10 | 1 | 轮 | 4 |

### 4.2 AudioSection

**音量行:**
```
布局:        flex flex-col gap-2.5
行内边距:    px-4 py-3.5

顶部:
  布局:      flex items-center justify-between
  左侧:      text-sm text-[var(--color-text)] "音量"
  右侧:      font-mono text-[13px] text-[var(--color-text-muted)] 百分比值

底部:
  Slider 组件 (全宽)
  disabled: 静音时
```

**静音行:**
```
布局:        flex items-center justify-between
行内边距:    px-4 py-3.5
左侧:        text-sm text-[var(--color-text)] "静音"
右侧:        Toggle 组件
```

### 4.3 ActionButtons

```
布局:        flex gap-3
顶部间距:    pt-6

取消按钮:
  flex:      flex-1
  高度:      py-2.5
  圆角:      rounded-xl
  背景:      bg-black/[0.03]
  hover:     bg-black/[0.06]
  文字:      text-sm font-medium text-[var(--color-text-muted)]
  过渡:      transition-colors duration-150

保存按钮:
  flex:      flex-1
  高度:      py-2.5
  圆角:      rounded-xl
  背景:      bg-[var(--color-primary)]
  hover:     bg-[var(--color-primary-dark)]
  文字:      text-sm font-medium text-white
  阴影:      shadow-[0_2px_8px_-2px_rgba(45,74,62,0.3)]
  hover阴影: shadow-[0_4px_12px_-2px_rgba(45,74,62,0.4)]
  active:    scale-[0.97]
  过渡:      transition-all duration-150
  focus:     focus-visible:ring-2 ring-[var(--color-primary)]/30 ring-offset-1
```

---

## 五、Stats 弹窗布局

### 5.1 整体结构

```
StatsModal
├─ Modal
│  ├─ Header ("统计", "您的专注成就")
│  ├─ StatsFlow                       ← mb-5
│  │  └─ GlassCard
│  │     ├─ DataRow: 总番茄钟
│  │     ├─ Divider
│  │     ├─ DataRow: 今日完成
│  │     ├─ Divider
│  │     └─ DataRow: 连续天数
│  └─ PlantProgress
│     ├─ SectionLabel "植物成长"
│     └─ GlassCard
│        ├─ StageHeader (阶段名 + 徽章)
│        ├─ ProgressBar (进度条 + 里程碑)
│        └─ StageLabels (阶段标签行)
```

### 5.2 DataRow (数据行 — 流式)

```
布局:        flex items-center justify-between
行内边距:    px-4 py-3.5

左侧:
  布局:      flex items-center gap-3
  图标容器:
    尺寸:    w-8 h-8
    圆角:    rounded-lg
    背景:    bg-[var(--color-primary)]/[0.07]
    图标:    16px, stroke-width 1.5
    颜色:    text-[var(--color-primary)]
  标签:
    字号:    text-sm
    颜色:    text-[var(--color-text)]

右侧:
  数值:
    字体:    font-mono text-xl font-bold
    颜色:    text-[var(--color-text)]
```

**数据行列表:**

| 行 | 图标 | 标签 | 数据源 |
|---|------|------|--------|
| 1 | 圆圈打勾 | 总番茄钟 | stats.totalPomodoros |
| 2 | 太阳/日出 | 今日完成 | stats.todayPomodoros |
| 3 | 火焰 | 连续天数 | stats.streakDays |

### 5.3 PlantProgress (植物成长焦点)

**StageHeader:**
```
布局:        flex items-center justify-between
内边距:      px-4 pt-4 pb-3

左侧:
  布局:      flex items-center gap-2.5
  植物图标:
    尺寸:    w-9 h-9
    圆角:    rounded-xl
    背景:    bg-[var(--color-primary)]/[0.07]
    图标:    20px
    颜色:    text-[var(--color-primary)]
  阶段名:
    字号:    text-base font-semibold
    颜色:    text-[var(--color-text)]

右侧 (非 ancient 时):
  徽章:
    字号:    text-[11px] font-medium
    颜色:    text-[var(--color-accent)]
    背景:    bg-[var(--color-accent)]/10
    圆角:    rounded-full
    内边距:  px-2.5 py-0.5
    内容:    "还需 X 番茄"
```

**ProgressBar:**
```
容器:
  外边距:    px-4 pb-2

轨道:
  高度:      h-1.5 (6px)
  圆角:      rounded-full
  背景:      bg-black/[0.04]

已填充:
  高度:      h-full
  圆角:      rounded-full
  背景:      bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)]
  宽度:      (totalGrowth / maxGrowth) * 100%, 上限 100%
  过渡:      transition-all duration-700 ease-out

里程碑圆点 (在阈值 1, 3, 8 处):
  尺寸:      w-1.5 h-1.5
  形状:      rounded-full
  已达到:    bg-white ring-1 ring-[var(--color-primary)]/40
  未达到:    bg-black/[0.08]
  定位:      absolute, 按比例计算 left 值
```

**StageLabels:**
```
布局:        flex justify-between
内边距:      px-4 pb-4 pt-1.5

每个标签:
  字号:      text-[11px] tracking-wide

  当前阶段:  text-[var(--color-primary)] font-medium
  已过阶段:  text-[var(--color-primary)]/40
  未达阶段:  text-[var(--color-text-subtle)]/50
```

---

## 六、响应式策略

```
默认 (移动端):
  弹窗:      max-w-[420px] w-full
  Overlay:   p-4

≥640px (sm):
  无变化, 420px 已足够

整体策略: 移动优先, 弹窗本身宽度上限 420px, 在所有设备上表现一致
```

## 七、无障碍要求

- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 指向标题
- Toggle: `role="switch"`, `aria-checked`
- Slider: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Stepper 按钮: `aria-label="增加"` / `aria-label="减少"`
- ESC 关闭弹窗
- Focus trap: Tab 键循环在弹窗内
- `prefers-reduced-motion` 降级动画

## 八、Store 接口契约 (不变)

Settings 弹窗读写:
- `isSettingsOpen` / `closeSettings()`
- `settings` / `updateSettings()`
- `volume` / `setVolume()`
- `isMuted` / `toggleMute()`

Stats 弹窗只读:
- `isStatsOpen` / `closeStats()`
- `stats` (totalPomodoros, todayPomodoros, streakDays)
- `plant` (totalGrowth, currentProgress)
