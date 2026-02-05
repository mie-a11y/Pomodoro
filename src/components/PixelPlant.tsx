/**
 * PixelPlant - 2D 像素艺术植物组件
 *
 * 设计原则：
 * 1. 花盆：倒梯形、对称
 * 2. 主干：禁止垂直，必须有随机偏移
 * 3. 分支：timerProgress > 0.5 后出现，非对称
 * 4. 叶片：1px 或 2x2 方块，禁止圆形，禁止对称
 * 5. 颜色：仅 4-5 种 Zen Palette 颜色
 */

import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../stores/useStore';

// ============================================
// A1: 多色阶类型定义 (#249, #323-325)
// ============================================
interface ColorTier {
  main: string;   // 主色
  light: string;  // 高光色 (+15% 亮度)
  dark: string;   // 阴影色 (-15% 亮度)
}

interface ExtendedColorTier extends ColorTier {
  accent?: string;  // 强调色（可选）
}

// ============================================
// A2-A8: Zen Palette V2 多色阶调色板 (#250-256, #326-333, #483-489)
// ============================================
const ZEN_PALETTE_V2 = {
  // A2: 花盆色阶 - 基于 #2D2D2D (hsl 0, 0%, 17.6%)
  POT: {
    main: '#2D2D2D',
    light: '#3D3D3D',   // +8% L (高光)
    dark: '#1F1F1F',    // -8% L (阴影)
  } as ColorTier,

  // A3: 主干色阶 - 基于 #4A3728 (hsl 26, 30%, 22%)
  TRUNK: {
    main: '#4A3728',
    light: '#5D4A3A',   // +7% L
    dark: '#362818',    // -7% L
  } as ColorTier,

  // A4: 叶片色阶 (#330-331)
  OLD_LEAF: {
    main: '#507D2A',    // hsl 93, 50%, 33%
    light: '#6AA33D',   // +10% L
    dark: '#3A5A1E',    // -10% L
  } as ColorTier,

  NEW_SPROUT: {
    main: '#90EE90',    // hsl 120, 73%, 75%
    light: '#B8F4B8',   // +10% L
    dark: '#6BE96B',    // -10% L
  } as ColorTier,

  // A5: 泥土色阶 (#332-333)
  SOIL: {
    main: '#3D2817',    // hsl 27, 45%, 16%
    light: '#523920',   // +6% L
    dark: '#28190E',    // -6% L
    accent: '#4A3020',  // 颗粒强调色
  } as ExtendedColorTier,

  // A7: 生命粒子颜色 (#255)
  LIFE_PARTICLE: {
    main: '#C8E6C9',    // 淡绿
    light: '#E8F5E9',   // 更亮
    dark: '#A5D6A7',    // 略深
  } as ColorTier,

  // A8: 落叶/小石子颜色 (#256)
  FALLEN_LEAF: '#8B7355',   // 枯叶棕
  PEBBLE: {
    main: '#6B6B6B',    // 灰色石子
    light: '#8B8B8B',   // 亮色石子
    dark: '#4B4B4B',    // 深色石子
  } as ColorTier,
} as const;

// 保留旧版常量以兼容现有代码（逐步迁移）
const ZEN_PALETTE = {
  POT: ZEN_PALETTE_V2.POT.main,
  TRUNK: ZEN_PALETTE_V2.TRUNK.main,
  OLD_LEAF: ZEN_PALETTE_V2.OLD_LEAF.main,
  NEW_SPROUT: ZEN_PALETTE_V2.NEW_SPROUT.main,
  SOIL: ZEN_PALETTE_V2.SOIL.main,
  POT_HIGHLIGHT: ZEN_PALETTE_V2.POT.light,
} as const;

// ============================================
// B5: 固定种子伪随机数生成器
// ============================================
function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// ============================================
// E4: RGB 颜色线性插值 (#286, #388-391, #519-530)
// ============================================
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // E4.1: 移除 # 前缀并提取分量
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  // E4.2: 分量转 Hex 并拼接
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(color1: string, color2: string, t: number): string {
  // E4.3: RGB 分量线性插值
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = c1.r + (c2.r - c1.r) * t;
  const g = c1.g + (c2.g - c1.g) * t;
  const b = c1.b + (c2.b - c1.b) * t;
  return rgbToHex(r, g, b);
}

// ============================================
// E3: 叶片颜色高度区间 (#285, #385-387, #531-537)
// ============================================
const LEAF_COLOR_ZONES = {
  bottomRatio: 0.4,   // 底部区间 (0 - 0.4)
  middleRatio: 0.7,   // 中间区间 (0.4 - 0.7)
  transitionWidth: 0.1, // 过渡带宽度
};

function getLeafColorByHeight(heightRatio: number, isNewSprout: boolean): string {
  const palette = isNewSprout ? ZEN_PALETTE_V2.NEW_SPROUT : ZEN_PALETTE_V2.OLD_LEAF;
  const { bottomRatio, middleRatio, transitionWidth } = LEAF_COLOR_ZONES;

  // E3.2: 区间内颜色选择
  if (heightRatio < bottomRatio - transitionWidth) {
    return palette.dark;  // 底部：深色
  } else if (heightRatio < bottomRatio + transitionWidth) {
    // E3.3: 底部到中间的过渡
    const t = (heightRatio - (bottomRatio - transitionWidth)) / (transitionWidth * 2);
    return lerpColor(palette.dark, palette.main, t);
  } else if (heightRatio < middleRatio - transitionWidth) {
    return palette.main;  // 中间：主色
  } else if (heightRatio < middleRatio + transitionWidth) {
    // 中间到顶部的过渡
    const t = (heightRatio - (middleRatio - transitionWidth)) / (transitionWidth * 2);
    return lerpColor(palette.main, palette.light, t);
  } else {
    return palette.light; // 顶部：亮色
  }
}

// ============================================
// B7-B9: TypeScript 接口定义
// ============================================
interface PixelPoint {
  x: number;
  y: number;
}

// E1: 扩展 LeafData 接口 (#283, #379-381)
interface LeafData {
  x: number;
  y: number;
  size: 1 | 2;
  color: string;
  heightRatio: number;  // E1.1: 高度比例
  shadowDir: -1 | 1;    // E1.2: 阴影方向 (-1 左, 1 右)
  isNewSprout: boolean; // E1.3: 是否为新芽
}

interface BranchData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  pixels: PixelPoint[];
  droopAngle?: number;  // L2.4: 下垂角度（松柏风格）
}

// ============================================
// J2: 侧枝数据接口 (#650-653, #616)
// ============================================
interface SideBranchData {
  triggerProgress: number;    // J2.1: 触发时的 timerProgress
  growthFactor: number;       // J2.2: 生长速度系数
  direction: 'left' | 'right'; // J2.3: 伸展方向
  attachHeightRatio: number;  // J2.4: 附着高度比例
}

// ============================================
// M2.2: 苔藓数据接口 (#713)
// ============================================
interface MossData {
  x: number;
  y: number;
  size: 1 | 2;
  color: string;
}

// ============================================
// A3.1: Canvas 内部像素尺寸常量
// ============================================
const CANVAS_WIDTH = 128;
const CANVAS_HEIGHT = 192;

// ============================================
// D1: S 型曲线参数常量 (#277, #365-367)
// ============================================
const S_CURVE_CONFIG = {
  amplitude: 3,         // D1.1: 振幅（像素）
  frequency: 1.5,       // D1.2: 频率（周期数）
  phaseRange: Math.PI,  // D1.3: 相位偏移范围
  jitterInterval: 6,    // 微小抖动间隔
  jitterAmount: 1,      // 微小抖动量
};

// ============================================
// D5: 主干粗细分段常量 (#281, #374, #584-589)
// ============================================
const TRUNK_WIDTH_CONFIG = {
  bottomWidth: 2,   // 底部宽度
  middleWidth: 2,   // 中间宽度
  topWidth: 1,      // 顶部宽度
  bottomRatio: 0.33,
  middleRatio: 0.66,
};

// ============================================
// F3.1: 叶片偏移范围常量
// ============================================
const LEAF_OFFSET_MAX = 3;

// ============================================
// J1: 侧枝触发机制常量 (#647-649, #739-748)
// ============================================
/** J1.1: 侧枝触发阈值 - timerProgress 达到这些值时触发侧枝生成 */
const SIDE_BRANCH_THRESHOLDS = [0.3, 0.6, 0.85] as const;

/** J1.2: 侧枝生长速度系数 - 相对主干的 0.6 倍 */
const SIDE_BRANCH_GROWTH_FACTOR = 0.6;

/** J1.3: 侧枝附着区域 - 在主干中部区域生成 */
const SIDE_BRANCH_ATTACH_ZONE = {
  minRatio: 0.3,  // 最低附着点（主干高度 30%）
  maxRatio: 0.7,  // 最高附着点（主干高度 70%）
};

// ============================================
// K1: 底部增粗配置常量 (#665-667, #749-754)
// ============================================
/** K1.1: 底部增粗区域比例 - 底部 20% */
const THICKENING_ZONE_RATIO = 0.2;

/** K1.2: 底部增粗像素量 */
const THICKENING_AMOUNT = 1;

/** K1.3: 触发增粗的最小植物高度 */
const MIN_HEIGHT_FOR_THICKENING = 15;

// ============================================
// K3: 主干颜色渐变配置 (#672-675, #755-764)
// ============================================
/** K3.1: 主干底部颜色（深褐色/木质化）*/
const TRUNK_BOTTOM_COLOR: ColorTier = {
  main: '#4A3728',
  light: '#5D4A3A',
  dark: '#362818',
};

/** K3.2: 主干顶部颜色（翠绿色/新芽）*/
const TRUNK_TOP_COLOR: ColorTier = {
  main: '#4A7C59',
  light: '#5D9A6E',
  dark: '#3A6147',
};

/** K3.3: 颜色渐变开始位置 */
const GRADIENT_TRANSITION_START = 0.2;

/** K3.4: 颜色渐变结束位置 */
const GRADIENT_TRANSITION_END = 0.85;

// ============================================
// L1: 松柏风格常量 (#684-687, #765-770)
// ============================================
/** L1.1: 松柏枝条角度（接近水平）*/
const PINE_BRANCH_ANGLE = {
  min: 75,  // 最小角度（度）
  max: 95,  // 最大角度（度）
};

/** L1.3: 松柏枝条下垂角度（度）*/
const PINE_BRANCH_DROOP = {
  min: 5,
  max: 15,
};

/** L1.4: 主干扭曲增强配置（覆盖 S_CURVE_CONFIG）*/
const TRUNK_TWIST_CONFIG = {
  amplitude: 5,      // 原 3，增强扭曲
  frequency: 2.0,    // 原 1.5，更多波动
  jitterAmount: 2,   // 原 1，增强自然感
};

// ============================================
// M1: 苔藓配置常量 (#708-711, #785-794)
// ============================================
/** M1.1: 苔藓颜色 */
const MOSS_COLOR: ColorTier = {
  main: '#5D8A4A',
  light: '#7CB561',
  dark: '#4A6E3B',
};

/** M1.2: 苔藓数量范围 */
const MOSS_COUNT = {
  min: 3,
  max: 7,
};

/** M1.4: 苔藓生成区域 */
const MOSS_ZONE = {
  edgeOffset: { min: 2, max: 4 },
  topOffset: { min: 0, max: 2 },
};

// ============================================
// N1: 小木牌配置常量 (#719-723, #795-799)
// ============================================
/** N1.1: 小木牌尺寸 */
const SIGN_BOARD_SIZE = {
  width: 12,
  height: 8,
};

/** N1.2: 小木牌颜色 */
const SIGN_BOARD_COLOR = {
  board: '#8B7355',
  post: '#6B5344',
  text: '#3D2914',
};

/** N1.3: 小木牌位置（相对花盆）*/
const SIGN_BOARD_POSITION = {
  offsetX: -25,  // 花盆左侧
  offsetY: -5,   // 泥土上方
};

/** N1.4: 木柱像素图案 (2x8) */
const SIGN_POST_PATTERN = [
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
];

/** N1.5: 木板像素图案 (12x8) */
const SIGN_BOARD_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// ============================================
// N2: 像素数字配置 (#724-727, #800-809)
// ============================================
/** N2.1: 像素数字宽度 */
const PIXEL_DIGIT_WIDTH = 3;

/** N2.2: 像素数字高度 */
const PIXEL_DIGIT_HEIGHT = 5;

/** N2.3-N2.4: 像素数字图案 (3x5) */
const PIXEL_DIGITS: Record<string, number[][]> = {
  '0': [
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  '1': [
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  '2': [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
  ],
  '3': [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  '4': [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  '5': [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  '6': [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  '7': [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  '8': [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  '9': [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
};

// ============================================
// B2: 单像素绘制函数
// ============================================
function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

// ============================================
// B3: 2x2 像素块绘制函数
// ============================================
function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
}

// ============================================
// B4.1-B4.3: Bresenham 直线算法
// ============================================
function drawPixelLine(x0: number, y0: number, x1: number, y1: number): PixelPoint[] {
  const pixels: PixelPoint[] = [];

  // B4.1: 初始化
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = Math.floor(x0);
  let y = Math.floor(y0);
  const endX = Math.floor(x1);
  const endY = Math.floor(y1);

  // B4.2: 迭代循环
  while (true) {
    pixels.push({ x, y });

    if (x === endX && y === endY) break;

    // B4.3: 误差校正
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return pixels;
}

// ============================================
// C2.1-C2.3: 倒梯形填充算法
// ============================================
function drawTrapezoid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  topWidth: number,
  bottomWidth: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color;

  for (let y = 0; y < height; y++) {
    // C2.1: 计算每行宽度
    const progress = y / (height - 1);
    const width = Math.floor(topWidth + (bottomWidth - topWidth) * progress);

    // C2.2: 计算起始 X
    const startX = Math.floor(centerX - width / 2);

    // C2.3: 填充该行
    ctx.fillRect(startX, topY + y, width, 1);
  }
}

// ============================================
// C1: 花盆尺寸参数
// ============================================
const POT_CONFIG = {
  topWidth: 50,
  bottomWidth: 35,
  height: 28,
  get topY() { return CANVAS_HEIGHT - this.height - 5; },
  get centerX() { return CANVAS_WIDTH / 2; },
};

// ============================================
// B5: Dithering 抖动算法 (#261, #338-341, #490-494)
// ============================================
type DitheringMode = 'checkerboard' | 'random' | 'ordered';

// B5.4.1: Bayer 2x2 矩阵
const BAYER_2X2 = [
  [0, 2],
  [3, 1],
];

function shouldDither(x: number, y: number, threshold: number, mode: DitheringMode): boolean {
  switch (mode) {
    case 'checkerboard':
      // B5.2.1-2: 棋盘格判断
      return (x + y) % 2 === 0;
    case 'random':
      // B5.3: 随机 Dithering
      return Math.random() < threshold;
    case 'ordered': {
      // B5.4.2-3: Ordered Dithering
      const matrixValue = BAYER_2X2[y % 2][x % 2];
      return matrixValue / 4 < threshold;
    }
    default:
      return false;
  }
}

// ============================================
// B7: 花盆装饰线常量 (#263)
// ============================================
const POT_DECORATION = {
  lineY1: 8,      // 第一条装饰线位置（从顶部算起）
  lineY2: 16,     // 第二条装饰线位置
  symbolY: 11,    // 禅符号垂直中心位置
};

// ============================================
// C2: 泥土区域常量 (#270)
// ============================================
const SOIL_CONFIG = {
  depth: 3,           // 泥土深度（像素）
  grainCount: 12,     // 颗粒数量
  pebbleCount: 2,     // 小石子数量 (0-3)
  fallenLeafProb: 0.3, // 落叶生成概率 (#274)
};

// ============================================
// B9: 禅符号像素图案 (#265, #344-347, #495-498)
// ============================================
// B9.1: 圆相（Ensō）简化 5x5 - 不完整的圆
const ENSO_PATTERN = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0],  // 右侧故意留空，体现不完整
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];

// B9.2: 波浪纹 7x3
const WAVE_PATTERN = [
  [0, 1, 1, 0, 1, 1, 0],
  [1, 0, 0, 1, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0],
];

// B9.3: 山形 5x4
const MOUNTAIN_PATTERN = [
  [0, 0, 1, 0, 0],
  [0, 1, 0, 1, 0],
  [1, 0, 0, 0, 1],
  [0, 0, 0, 0, 0],
];

// B9.4: 符号选择（基于种子）
const ZEN_SYMBOLS = [ENSO_PATTERN, WAVE_PATTERN, MOUNTAIN_PATTERN];

// ============================================
// B10: 绘制禅符号函数 (#266, #348-349, #499-501)
// ============================================
function drawZenSymbol(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  symbolIndex: number,
  color: string
) {
  const pattern = ZEN_SYMBOLS[symbolIndex % ZEN_SYMBOLS.length];
  const height = pattern.length;
  const width = pattern[0].length;

  // B10.1: 计算绘制起始位置
  const startX = Math.floor(centerX - width / 2);
  const startY = Math.floor(centerY - height / 2);

  ctx.fillStyle = color;

  // B10.2: 遍历并绘制
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (pattern[row][col] === 1) {
        ctx.fillRect(startX + col, startY + row, 1, 1);
      }
    }
  }
}

// ============================================
// C1-C8: 泥土绘制函数 (#269-276, #352-364, #502-510, #593-596)
// ============================================
function drawSoil(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  centerX: number,
  topY: number,
  width: number
) {
  const soil = ZEN_PALETTE_V2.SOIL;
  const pebble = ZEN_PALETTE_V2.PEBBLE;
  const startX = Math.floor(centerX - width / 2);

  // C3: 泥土基底层 (#271)
  ctx.fillStyle = soil.main;
  ctx.fillRect(startX, topY, width, SOIL_CONFIG.depth);

  // C8: 泥土边缘阴影 (#276, #363-364)
  ctx.fillStyle = soil.dark;
  ctx.fillRect(startX, topY + SOIL_CONFIG.depth - 1, width, 1);

  // C4: 泥土颗粒随机分布 (#272, #352-355, #502-510)
  for (let i = 0; i < SOIL_CONFIG.grainCount; i++) {
    // C4.2: 生成颗粒位置
    const px = startX + 1 + Math.floor(random() * (width - 2));
    const py = topY + Math.floor(random() * (SOIL_CONFIG.depth - 1));

    // C4.3: 分配颗粒颜色
    const colorRand = random();
    let color: string;
    if (colorRand < 0.3) {
      color = soil.light;
    } else if (colorRand < 0.6) {
      color = soil.dark;
    } else {
      continue; // 保持主色，跳过绘制
    }

    // C4.4: 绘制颗粒
    drawPixel(ctx, px, py, color);
  }

  // C5: 小石子生成 (#273, #356-358, #593-596)
  const pebbleCount = Math.floor(random() * (SOIL_CONFIG.pebbleCount + 1));
  for (let i = 0; i < pebbleCount; i++) {
    // C5.2: 生成小石子位置（避开中心主干区域）
    let px: number;
    const trunkZone = 4; // 主干附近区域
    do {
      px = startX + 2 + Math.floor(random() * (width - 4));
    } while (Math.abs(px - centerX) < trunkZone && random() > 0.3);

    const py = topY + Math.floor(random() * 2);

    // C5.3: 绘制小石子（2x1 或 1x1）
    const pebbleColor = random() > 0.5 ? pebble.light : pebble.main;
    drawPixel(ctx, px, py, pebbleColor);
    if (random() > 0.5) {
      drawPixel(ctx, px + 1, py, pebble.dark);
    }
  }

  // C7: 落叶绘制 (#275, #359-362)
  if (random() < SOIL_CONFIG.fallenLeafProb) {
    const leafCount = 1 + Math.floor(random() * 2); // 1-2 片
    for (let i = 0; i < leafCount; i++) {
      const lx = startX + 3 + Math.floor(random() * (width - 6));
      const ly = topY;
      drawPixel(ctx, lx, ly, ZEN_PALETTE_V2.FALLEN_LEAF);
    }
  }

  // M3.1-M3.3: 集成苔藓到泥土 (#716-718, #792-794, #633)
  const mossData = generateMoss(random, startX, topY, width);
  drawMoss(ctx, mossData);
}

// ============================================
// M2: 苔藓生成函数 (#712-718, #785-794, #632)
// ============================================
function generateMoss(
  random: () => number,
  startX: number,
  topY: number,
  width: number
): MossData[] {
  const mossData: MossData[] = [];

  // M2.3.1-M2.3.2: 计算左右边缘有效区域
  const leftEdgeX = startX + MOSS_ZONE.edgeOffset.min +
    Math.floor(random() * (MOSS_ZONE.edgeOffset.max - MOSS_ZONE.edgeOffset.min));
  const rightEdgeX = startX + width - MOSS_ZONE.edgeOffset.min -
    Math.floor(random() * (MOSS_ZONE.edgeOffset.max - MOSS_ZONE.edgeOffset.min));

  // M2.3.3: 随机分配苔藓数量
  const totalCount = MOSS_COUNT.min + Math.floor(random() * (MOSS_COUNT.max - MOSS_COUNT.min + 1));

  for (let i = 0; i < totalCount; i++) {
    // M2.3.4: 随机分配到左右两侧
    const isLeft = random() < 0.6;
    const baseX = isLeft ? leftEdgeX : rightEdgeX;
    const x = baseX + Math.floor(random() * 3) - 1;

    const yOffset = MOSS_ZONE.topOffset.min +
      Math.floor(random() * (MOSS_ZONE.topOffset.max - MOSS_ZONE.topOffset.min + 1));
    const y = topY + yOffset;

    // M2.4.1-M2.4.2: 随机选择颜色
    const colorRandom = random();
    let color: string;
    if (colorRandom < 0.7) {
      color = MOSS_COLOR.main;
    } else if (colorRandom < 0.9) {
      color = MOSS_COLOR.light;
    } else {
      color = MOSS_COLOR.dark;
    }

    // M2.4.3: 随机决定大小
    const size: 1 | 2 = random() < 0.8 ? 1 : 2;

    mossData.push({ x, y, size, color });
  }

  return mossData;
}

// M3.2: 绘制苔藓 (#717, #792-794)
function drawMoss(ctx: CanvasRenderingContext2D, mossData: MossData[]) {
  mossData.forEach(moss => {
    ctx.fillStyle = moss.color;
    ctx.fillRect(moss.x, moss.y, moss.size, moss.size);
  });
}

// ============================================
// K4: 主干颜色渐变函数 (#676-679, #755-764, #623)
// ============================================
const trunkColorCache = new Map<number, ColorTier>();

function getTrunkColorByHeight(heightRatio: number): ColorTier {
  // K4.4.2: 量化 heightRatio 作为缓存 key
  const quantizedKey = Math.round(heightRatio * 100);

  // K4.4.3: 缓存查询
  if (trunkColorCache.has(quantizedKey)) {
    return trunkColorCache.get(quantizedKey)!;
  }

  // K4.2.1-K4.2.3: 判断渐变区间
  let normalizedPos: number;
  if (heightRatio < GRADIENT_TRANSITION_START) {
    normalizedPos = 0;
  } else if (heightRatio > GRADIENT_TRANSITION_END) {
    normalizedPos = 1;
  } else {
    // K4.2.2: 区间内归一化
    normalizedPos = (heightRatio - GRADIENT_TRANSITION_START) /
      (GRADIENT_TRANSITION_END - GRADIENT_TRANSITION_START);
  }

  // K4.3.1-K4.3.4: 三通道颜色插值
  const result: ColorTier = {
    main: lerpColor(TRUNK_BOTTOM_COLOR.main, TRUNK_TOP_COLOR.main, normalizedPos),
    light: lerpColor(TRUNK_BOTTOM_COLOR.light, TRUNK_TOP_COLOR.light, normalizedPos),
    dark: lerpColor(TRUNK_BOTTOM_COLOR.dark, TRUNK_TOP_COLOR.dark, normalizedPos),
  };

  // K4.4.3: 缓存写入
  trunkColorCache.set(quantizedKey, result);

  return result;
}

// ============================================
// N3: 像素数字绘制函数 (#728-730, #810-815, #636)
// ============================================
function drawPixelDigit(
  ctx: CanvasRenderingContext2D,
  digit: number,
  x: number,
  y: number,
  color: string
) {
  // N3.2.1: 获取数字对应的图案数组
  const pattern = PIXEL_DIGITS[digit.toString()];
  if (!pattern) return;

  ctx.fillStyle = color;

  // N3.2.2-N3.2.3: 双层循环遍历图案数组
  for (let row = 0; row < PIXEL_DIGIT_HEIGHT; row++) {
    for (let col = 0; col < PIXEL_DIGIT_WIDTH; col++) {
      if (pattern[row][col] === 1) {
        ctx.fillRect(x + col, y + row, 1, 1);
      }
    }
  }
}

// N3.3: 多位数字绘制 (#730, #813-815)
function drawPixelNumber(
  ctx: CanvasRenderingContext2D,
  num: number,
  x: number,
  y: number,
  color: string
) {
  // N3.3.1: 数字转字符串
  const digits = num.toString();
  const digitSpacing = PIXEL_DIGIT_WIDTH + 1;

  // N3.3.3: 遍历并绘制每位数字
  for (let i = 0; i < digits.length; i++) {
    const offsetX = i * digitSpacing;
    drawPixelDigit(ctx, parseInt(digits[i]), x + offsetX, y, color);
  }
}

// ============================================
// N4: 小木牌绘制函数 (#731-734, #816-821, #637)
// ============================================
function drawSignBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  roundCount: number
) {
  const { width, height } = SIGN_BOARD_SIZE;

  // N4.3.1-N4.3.2: 绘制木板
  ctx.fillStyle = SIGN_BOARD_COLOR.board;
  for (let row = 0; row < SIGN_BOARD_PATTERN.length; row++) {
    for (let col = 0; col < SIGN_BOARD_PATTERN[row].length; col++) {
      if (SIGN_BOARD_PATTERN[row][col] === 1) {
        ctx.fillRect(x + col, y + row, 1, 1);
      }
    }
  }

  // N4.2.1-N4.2.2: 绘制木柱
  const postX = x + Math.floor(width / 2) - 1;
  const postY = y + height;
  ctx.fillStyle = SIGN_BOARD_COLOR.post;
  for (let row = 0; row < SIGN_POST_PATTERN.length; row++) {
    for (let col = 0; col < SIGN_POST_PATTERN[row].length; col++) {
      if (SIGN_POST_PATTERN[row][col] === 1) {
        ctx.fillRect(postX + col, postY + row, 1, 1);
      }
    }
  }

  // N4.4.1-N4.4.2: 计算数字居中位置并绘制
  const digits = roundCount.toString();
  const numberWidth = digits.length * (PIXEL_DIGIT_WIDTH + 1) - 1;
  const textX = x + Math.floor((width - numberWidth) / 2);
  const textY = y + Math.floor((height - PIXEL_DIGIT_HEIGHT) / 2);

  drawPixelNumber(ctx, roundCount, textX, textY, SIGN_BOARD_COLOR.text);
}

// ============================================
// J3: 侧枝触发检测函数 (#654-657, #739-741, #617)
// ============================================
function checkSideBranchTrigger(
  prevProgress: number,
  currentProgress: number,
  triggeredSet: Set<number>,
  random: () => number
): SideBranchData[] {
  const newBranches: SideBranchData[] = [];

  // J3.2.3: 遍历所有阈值检测跨越
  for (const threshold of SIDE_BRANCH_THRESHOLDS) {
    // J3.2.2: 单阈值跨越判断
    if (prevProgress < threshold && currentProgress >= threshold && !triggeredSet.has(threshold)) {
      triggeredSet.add(threshold);

      // J3.3: 计算侧枝附着位置
      const attachHeightRatio = SIDE_BRANCH_ATTACH_ZONE.minRatio +
        random() * (SIDE_BRANCH_ATTACH_ZONE.maxRatio - SIDE_BRANCH_ATTACH_ZONE.minRatio);

      // J5.2: 方向选择（交替+随机）
      const direction: 'left' | 'right' = random() > 0.5 ? 'left' : 'right';

      // J3.4: 创建返回值
      newBranches.push({
        triggerProgress: threshold,
        growthFactor: SIDE_BRANCH_GROWTH_FACTOR,
        direction,
        attachHeightRatio,
      });
    }
  }

  return newBranches;
}

// ============================================
// C3-C5 + B1-B12: 绘制花盆（多色阶版）
// ============================================
function drawPot(ctx: CanvasRenderingContext2D, seed: number = 12345) {
  const { centerX, topY, topWidth, bottomWidth, height } = POT_CONFIG;
  const pot = ZEN_PALETTE_V2.POT;

  // B1: 花盆主体（使用主色）
  drawTrapezoid(ctx, centerX, topY, topWidth, bottomWidth, height, pot.main);

  // B6: 应用 Dithering 磨砂效果 (#262, #342-343)
  for (let y = 3; y < height - 2; y++) {
    const progress = y / (height - 1);
    const rowWidth = Math.floor(topWidth + (bottomWidth - topWidth) * progress);
    const startX = Math.floor(centerX - rowWidth / 2);

    for (let x = 0; x < rowWidth; x++) {
      const px = startX + x;
      const py = topY + y;
      // 使用 ordered dithering 混合主色和暗色
      if (shouldDither(px, py, 0.3, 'ordered')) {
        drawPixel(ctx, px, py, pot.dark);
      }
    }
  }

  // B2: 花盆左边缘高光 (#258, #334-335, #597-602)
  for (let y = 1; y < height - 1; y++) {
    const progress = y / (height - 1);
    const rowWidth = Math.floor(topWidth + (bottomWidth - topWidth) * progress);
    const leftX = Math.floor(centerX - rowWidth / 2);
    // 绘制左边缘 1-2 像素高光
    drawPixel(ctx, leftX, topY + y, pot.light);
    if (y < height / 2) {
      drawPixel(ctx, leftX + 1, topY + y, pot.light);
    }
  }

  // B3: 花盆右下投影 (#259, #336-337)
  for (let y = Math.floor(height / 2); y < height - 1; y++) {
    const progress = y / (height - 1);
    const rowWidth = Math.floor(topWidth + (bottomWidth - topWidth) * progress);
    const rightX = Math.floor(centerX + rowWidth / 2) - 1;
    drawPixel(ctx, rightX, topY + y, pot.dark);
  }

  // B4: 花盆顶部边缘高光 (#260)
  const highlightWidth = topWidth - 2;
  const highlightStartX = Math.floor(centerX - highlightWidth / 2);
  ctx.fillStyle = pot.light;
  ctx.fillRect(highlightStartX, topY, highlightWidth, 1);

  // B8: 花盆横向装饰线 (#264)
  const line1Y = topY + POT_DECORATION.lineY1;
  const line2Y = topY + POT_DECORATION.lineY2;
  ctx.fillStyle = pot.light;

  // 计算装饰线所在行的宽度
  const progress1 = POT_DECORATION.lineY1 / (height - 1);
  const lineWidth1 = Math.floor(topWidth + (bottomWidth - topWidth) * progress1) - 8;
  const lineStartX1 = Math.floor(centerX - lineWidth1 / 2);
  ctx.fillRect(lineStartX1, line1Y, lineWidth1, 1);

  const progress2 = POT_DECORATION.lineY2 / (height - 1);
  const lineWidth2 = Math.floor(topWidth + (bottomWidth - topWidth) * progress2) - 8;
  const lineStartX2 = Math.floor(centerX - lineWidth2 / 2);
  ctx.fillRect(lineStartX2, line2Y, lineWidth2, 1);

  // B10: 绘制禅符号 (#266)
  const symbolY = topY + POT_DECORATION.symbolY;
  const symbolIndex = seed % 3; // 基于种子选择符号
  drawZenSymbol(ctx, centerX, symbolY, symbolIndex, pot.light);

  // B11: 花盆底部投影 (#267, #350-351, #590-592)
  const shadowY = topY + height;
  const shadowWidth = bottomWidth + 4;
  const shadowStartX = Math.floor(centerX - shadowWidth / 2);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000000';
  ctx.fillRect(shadowStartX, shadowY, shadowWidth, 2);
  ctx.restore();

  // C5: 盆口泥土（使用独立函数）
  const soilWidth = topWidth - 6;
  const random = createSeededRandom(seed + 999); // 独立种子用于泥土
  drawSoil(ctx, random, centerX, topY + 1, soilWidth);
}

// ============================================
// D2: S 曲线偏移计算 (#278, #368-369, #511-515)
// ============================================
function calculateSCurveOffset(
  heightRatio: number,  // 0-1，从底部到顶部
  phase: number,        // 相位偏移
  amplitude: number     // 振幅
): number {
  // D2.1: 计算正弦角度
  const angle = heightRatio * Math.PI * S_CURVE_CONFIG.frequency * 2 + phase;
  // D2.1.3: 计算正弦值
  const sinValue = Math.sin(angle);
  // D2.2: 应用振幅缩放并四舍五入
  return Math.round(sinValue * amplitude);
}

// ============================================
// D5.2 + K2: 主干宽度计算（含底部增粗）(#375, #584-586, #668-671, #749-754, #621)
// ============================================
function getTrunkWidth(heightRatio: number, totalHeight: number = 0): number {
  const { bottomWidth, middleWidth, topWidth, bottomRatio, middleRatio } = TRUNK_WIDTH_CONFIG;

  // K2.3.1-K2.3.3: 基础宽度计算
  let baseWidth: number;
  if (heightRatio < bottomRatio) {
    baseWidth = bottomWidth;
  } else if (heightRatio < middleRatio) {
    baseWidth = middleWidth;
  } else {
    baseWidth = topWidth;
  }

  // K2.3.1: 判断是否在底部区域
  const isInBottomZone = heightRatio < THICKENING_ZONE_RATIO;

  // K2.3.2: 检查植物高度是否达到阈值
  const isHeightSufficient = totalHeight >= MIN_HEIGHT_FOR_THICKENING;

  // K2.3.3: 组合条件
  if (isInBottomZone && isHeightSufficient) {
    // K2.4.2: 计算边界平滑因子
    const smoothFactor = heightRatio / THICKENING_ZONE_RATIO;
    // K2.4.3: 应用增粗量
    return Math.round(baseWidth + THICKENING_AMOUNT * (1 - smoothFactor));
  }

  return baseWidth;
}

// ============================================
// D1-D6: 主干绘制（S 曲线版）
// ============================================
interface TrunkPixelData extends PixelPoint {
  width: number;
  heightRatio: number;
}

function generateTrunkPixels(
  random: () => number,
  progress: number,
  totalGrowth: number
): TrunkPixelData[] {
  const pixels: TrunkPixelData[] = [];

  // D1: 主干起点
  const startX = POT_CONFIG.centerX;
  const startY = POT_CONFIG.topY;

  // D2 & D6: 主干高度
  const baseHeight = 20;
  const maxHeight = 80;
  const growthBonus = Math.min(totalGrowth * 2, 20);
  const currentHeight = Math.floor(baseHeight + (maxHeight - baseHeight) * progress + growthBonus);

  // D4: 基于 totalGrowth 的随机相位 (#280, #373)
  const phase = (totalGrowth % 10) * (S_CURVE_CONFIG.phaseRange / 10);

  // L6.1-L6.3: 使用增强的扭曲配置 (#704-707)
  const amplitude = TRUNK_TWIST_CONFIG.amplitude;
  const jitterAmount = TRUNK_TWIST_CONFIG.jitterAmount;

  for (let i = 0; i < currentHeight; i++) {
    const y = startY - i;
    const heightRatio = i / currentHeight;

    // D3.2: S 曲线偏移（使用增强振幅）(#279, #371)
    let offsetX = calculateSCurveOffset(heightRatio, phase, amplitude);

    // D3.3: 叠加微小随机抖动（使用增强抖动量）(#372, #516-518)
    if (i > 0 && i % S_CURVE_CONFIG.jitterInterval === 0) {
      const jitter = Math.floor(random() * 3) - 1; // -1, 0, 1
      offsetX += jitter * jitterAmount;
    }

    // L6.4: 验证扭曲不超出边界
    const x = Math.max(10, Math.min(CANVAS_WIDTH - 10, Math.floor(startX + offsetX)));

    // K5.4: 传入 totalHeight 到宽度计算
    const width = getTrunkWidth(heightRatio, currentHeight);

    pixels.push({ x, y, width, heightRatio });
  }

  return pixels;
}

// D5.3 + D6 + K5: 绘制主干（含粗细渐变、颜色渐变和阴影）(#376-378, #587-589, #680-683, #624)
function drawTrunk(ctx: CanvasRenderingContext2D, pixels: TrunkPixelData[]) {
  pixels.forEach(p => {
    // K5.1-K5.2: 获取当前高度的颜色
    const trunkColor = getTrunkColorByHeight(p.heightRatio);

    // D5.3.1 + K5.3: 绘制主干主像素（使用动态颜色）
    drawPixel(ctx, p.x, p.y, trunkColor.main);

    // D5.3.2-3: 绘制第二像素（如果宽度 >= 2）
    if (p.width >= 2) {
      drawPixel(ctx, p.x + 1, p.y, trunkColor.main);

      // D6: 阴影面（右侧）(#282, #377-378)
      if (p.heightRatio < 0.5) {
        drawPixel(ctx, p.x + 1, p.y, trunkColor.dark);
      }
    }

    // 底部额外宽度
    if (p.heightRatio < 0.1 && p.width >= 2) {
      drawPixel(ctx, p.x - 1, p.y, trunkColor.dark);
    }
  });
}

// ============================================
// E1-E6 + J4 + J5 + L2: 分支绘制（松柏风格 + 阈值触发）
// ============================================
function generateBranches(
  random: () => number,
  trunkPixels: TrunkPixelData[],
  progress: number,
  triggeredBranches: SideBranchData[] = []
): BranchData[] {
  const branches: BranchData[] = [];

  // J4.1: 移除 progress > 0.5 条件，改用阈值触发 (#658)
  if (trunkPixels.length < 10) {
    return branches;
  }

  // J4.2-J4.3: 遍历已触发的侧枝生成分支 (#659-660, #742-745)
  let lastDirection: 'left' | 'right' | null = null;

  for (const sideBranch of triggeredBranches) {
    // J4.3.1: 计算侧枝起始点坐标（基于附着高度比例）
    const attachIndex = Math.floor(trunkPixels.length * sideBranch.attachHeightRatio);
    const attachPoint = trunkPixels[Math.min(attachIndex, trunkPixels.length - 1)];

    if (!attachPoint) continue;

    // J5.1-J5.3: 非对称方向选择（交替+随机）(#662-664, #746-748)
    let direction: 'left' | 'right';
    if (lastDirection === null) {
      // J5.2.1: 首条分支使用触发数据的方向
      direction = sideBranch.direction;
    } else {
      // J5.2.2: 后续分支尽量与上一条方向不同
      const oppositeDir: 'left' | 'right' = lastDirection === 'left' ? 'right' : 'left';
      // J5.3: 0.3 概率允许同向
      direction = random() < 0.3 ? lastDirection : oppositeDir;
    }
    // J5.2.3: 更新 lastDirection 记录
    lastDirection = direction;

    const directionSign = direction === 'left' ? -1 : 1;

    // L2.1-L2.2.1: 松柏风格角度计算（接近水平 75-95°）(#688, #765)
    const baseAngleDeg = PINE_BRANCH_ANGLE.min +
      random() * (PINE_BRANCH_ANGLE.max - PINE_BRANCH_ANGLE.min);

    // L2.2.2-L2.2.3: 添加下垂效果 (#689, #766-767)
    const droopDeg = PINE_BRANCH_DROOP.min +
      random() * (PINE_BRANCH_DROOP.max - PINE_BRANCH_DROOP.min);
    const finalAngleDeg = baseAngleDeg - droopDeg; // 下垂减小角度

    const angleRad = (finalAngleDeg * Math.PI) / 180;

    // J4.4: 应用 0.6 倍生长速度系数到分支长度 (#661)
    const baseLength = 5 + Math.floor(random() * 8); // 5-12 像素基础长度
    const length = Math.floor(baseLength * sideBranch.growthFactor);

    // L2.3.1-L2.3.3: 水平枝条像素生成 (#690, #768-770)
    // 由于角度接近水平，使用标准 Bresenham 算法即可保证连续
    const endX = attachPoint.x + directionSign * Math.floor(length * Math.cos(angleRad));
    const endY = attachPoint.y - Math.floor(length * Math.sin(angleRad));

    // E5: 存储分支像素
    const pixels = drawPixelLine(attachPoint.x, attachPoint.y, endX, endY);

    // L2.4: 更新 BranchData 记录下垂信息 (#691)
    branches.push({
      startX: attachPoint.x,
      startY: attachPoint.y,
      endX,
      endY,
      pixels,
      droopAngle: droopDeg,
    });
  }

  // 保留原有逻辑：progress > 0.5 时也生成传统分支（向后兼容）
  if (progress > 0.5 && triggeredBranches.length === 0) {
    const branchCount = Math.floor((progress - 0.5) * 4);
    const actualCount = Math.min(branchCount, 2);

    const minIndex = Math.floor(trunkPixels.length * 0.4);
    const maxIndex = Math.floor(trunkPixels.length * 0.7);

    for (let i = 0; i < actualCount; i++) {
      const attachIndex = minIndex + Math.floor(random() * (maxIndex - minIndex));
      const attachPoint = trunkPixels[attachIndex];

      if (!attachPoint) continue;

      // 使用松柏风格角度
      const baseAngleDeg = PINE_BRANCH_ANGLE.min +
        random() * (PINE_BRANCH_ANGLE.max - PINE_BRANCH_ANGLE.min);
      const droopDeg = PINE_BRANCH_DROOP.min +
        random() * (PINE_BRANCH_DROOP.max - PINE_BRANCH_DROOP.min);
      const finalAngleDeg = baseAngleDeg - droopDeg;
      const angleRad = (finalAngleDeg * Math.PI) / 180;

      const direction = i === 0 ? (random() > 0.5 ? 1 : -1) : (random() > 0.7 ? 1 : -1);
      const length = 4 + Math.floor(random() * 7);

      const endX = attachPoint.x + direction * Math.floor(length * Math.cos(angleRad));
      const endY = attachPoint.y - Math.floor(length * Math.sin(angleRad));

      const pixels = drawPixelLine(attachPoint.x, attachPoint.y, endX, endY);

      branches.push({
        startX: attachPoint.x,
        startY: attachPoint.y,
        endX,
        endY,
        pixels,
        droopAngle: droopDeg,
      });
    }
  }

  return branches;
}

function drawBranches(ctx: CanvasRenderingContext2D, branches: BranchData[]) {
  branches.forEach(branch => {
    branch.pixels.forEach(p => drawPixel(ctx, p.x, p.y, ZEN_PALETTE.TRUNK));
  });
}

// ============================================
// F1-F6 + E1-E10: 叶片绘制（多色阶版）
// ============================================

// E2: 计算叶片高度比例 (#284, #382-384)
function calculateLeafHeightRatio(
  leafY: number,
  plantTopY: number,
  plantBottomY: number
): number {
  const totalHeight = plantBottomY - plantTopY;
  if (totalHeight <= 0) return 0.5;
  return Math.max(0, Math.min(1, (plantBottomY - leafY) / totalHeight));
}

// E9: 叶片大小高度权重 (#291, #403-405)
function getLeafSizeByHeight(heightRatio: number, random: () => number): 1 | 2 {
  // 顶部叶片偏小，底部叶片偏大
  const largeProbability = 0.3 + (1 - heightRatio) * 0.4; // 0.3-0.7
  return random() < largeProbability ? 2 : 1;
}

interface GenerateLeavesResult {
  leaves: LeafData[];
  isBranchLeaf: boolean[];
}

function generateLeaves(
  random: () => number,
  trunkPixels: TrunkPixelData[],
  branches: BranchData[],
  progress: number
): GenerateLeavesResult {
  const leaves: LeafData[] = [];
  const isBranchLeaf: boolean[] = [];

  if (trunkPixels.length === 0) return { leaves, isBranchLeaf };

  // E2: 计算植物高度范围
  const plantBottomY = POT_CONFIG.topY;
  const trunkTop = trunkPixels[trunkPixels.length - 1];
  const plantTopY = trunkTop ? trunkTop.y - 5 : plantBottomY - 20;

  // F2: 叶片数量
  const baseLeafCount = 2 + Math.floor(progress * 6);

  // 主干顶端叶片
  if (trunkTop) {
    for (let i = 0; i < baseLeafCount; i++) {
      // E8: 使用极坐标增加随机性 (#290, #400-402, #607-610)
      const angle = random() * Math.PI * 2;
      const radius = 1 + random() * (LEAF_OFFSET_MAX - 1);
      const offsetX = Math.round(Math.cos(angle) * radius);
      const offsetY = Math.round(Math.sin(angle) * radius);

      const leafY = trunkTop.y + offsetY;
      const heightRatio = calculateLeafHeightRatio(leafY, plantTopY, plantBottomY);

      // E9: 基于高度的大小
      const size = getLeafSizeByHeight(heightRatio, random);

      // E3: 基于高度的颜色
      const isNewSprout = progress > 0.7 && random() > 0.5;
      const color = getLeafColorByHeight(heightRatio, isNewSprout);

      // E1.2: 阴影方向（基于位置）
      const shadowDir: -1 | 1 = offsetX >= 0 ? 1 : -1;

      leaves.push({
        x: trunkTop.x + offsetX,
        y: leafY,
        size,
        color,
        heightRatio,
        shadowDir,
        isNewSprout,
      });
      isBranchLeaf.push(false); // 主干叶片
    }
  }

  // 分支末端叶片
  branches.forEach(branch => {
    const leafCount = 1 + Math.floor(random() * 2);
    for (let i = 0; i < leafCount; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 1 + random() * 2;
      const offsetX = Math.round(Math.cos(angle) * radius);
      const offsetY = Math.round(Math.sin(angle) * radius);

      const leafY = branch.endY + offsetY;
      const heightRatio = calculateLeafHeightRatio(leafY, plantTopY, plantBottomY);

      const size = getLeafSizeByHeight(heightRatio, random);
      const isNewSprout = random() > 0.4;
      const color = getLeafColorByHeight(heightRatio, isNewSprout);
      const shadowDir: -1 | 1 = branch.endX > POT_CONFIG.centerX ? 1 : -1;

      leaves.push({
        x: branch.endX + offsetX,
        y: leafY,
        size,
        color,
        heightRatio,
        shadowDir,
        isNewSprout,
      });
      isBranchLeaf.push(true); // 分支叶片
    }
  });

  // F3.3: 验证非对称性
  if (leaves.length > 1 && leaves.length % 2 === 0) {
    const leftCount = leaves.filter(l => l.x < CANVAS_WIDTH / 2).length;
    const rightCount = leaves.length - leftCount;
    if (leftCount === rightCount) {
      leaves.pop();
      isBranchLeaf.pop();
    }
  }

  return { leaves, isBranchLeaf };
}

// E5-E7 + G4: 绘制叶片（多层渲染 + 微风摆动）(#287-289, #306, #392-399, #439-441, #577-583)
function drawLeaves(
  ctx: CanvasRenderingContext2D,
  leaves: LeafData[],
  animTime: number = 0,
  isRunning: boolean = false,
  isBranchLeaf: boolean[] = []
) {
  // E7.1: 分层渲染 - 背光层 → 主体层 → 高光层

  // E7.2.2: 绘制背光层（阴影）
  leaves.forEach((leaf, i) => {
    // G4: 获取风偏移
    const windOffset = calculateWindOffset(leaf.heightRatio, animTime, isRunning, isBranchLeaf[i]);
    const palette = leaf.isNewSprout ? ZEN_PALETTE_V2.NEW_SPROUT : ZEN_PALETTE_V2.OLD_LEAF;
    const shadowX = leaf.x + leaf.shadowDir + windOffset;
    const shadowY = leaf.y + 1;

    if (leaf.size === 1) {
      drawPixel(ctx, shadowX, shadowY, palette.dark);
    } else {
      drawPixel(ctx, shadowX + 1, shadowY + 1, palette.dark);
      drawPixel(ctx, leaf.x + leaf.shadowDir + windOffset, shadowY + 1, palette.dark);
    }
  });

  // E7.2.3: 绘制主体层
  leaves.forEach((leaf, i) => {
    const windOffset = calculateWindOffset(leaf.heightRatio, animTime, isRunning, isBranchLeaf[i]);
    const x = leaf.x + windOffset;

    if (leaf.size === 1) {
      drawPixel(ctx, x, leaf.y, leaf.color);
    } else {
      drawBlock(ctx, x, leaf.y, leaf.color);
    }
  });

  // E7.2.4: 绘制高光层
  leaves.forEach((leaf, i) => {
    if (leaf.size === 2 && leaf.heightRatio > 0.5) {
      const windOffset = calculateWindOffset(leaf.heightRatio, animTime, isRunning, isBranchLeaf[i]);
      const palette = leaf.isNewSprout ? ZEN_PALETTE_V2.NEW_SPROUT : ZEN_PALETTE_V2.OLD_LEAF;
      drawPixel(ctx, leaf.x + windOffset, leaf.y, palette.light);
    }
  });
}

// ============================================
// G1: 微风摆动参数常量 (#303, #431-433)
// ============================================
const WIND_CONFIG = {
  amplitude: 1.5,           // G1.1: 摆动振幅（像素）
  frequency: 0.002,         // G1.2: 摆动频率
  affectedHeightRatio: 0.3, // G1.3: 受影响的高度比例（顶部 30%）
  branchMultiplier: 1.2,    // G6: 分支末端摆动系数
};

// ============================================
// G3: 叶片摆动偏移计算 (#305, #436-438, #549-556)
// ============================================
function calculateWindOffset(
  heightRatio: number,
  animTime: number,
  isRunning: boolean,
  isBranchEnd: boolean = false
): number {
  // G5: 仅在 timer 运行时启用摆动 (#307, #442-443)
  if (!isRunning) return 0;

  // G3.2: 判断是否超过受影响阈值
  if (heightRatio < (1 - WIND_CONFIG.affectedHeightRatio)) return 0;

  // G3.2.2-3: 计算超出阈值的比例（平方曲线增强）
  const aboveThreshold = (heightRatio - (1 - WIND_CONFIG.affectedHeightRatio)) / WIND_CONFIG.affectedHeightRatio;
  const weight = aboveThreshold * aboveThreshold; // 平方曲线

  // G3.1: 计算基础正弦偏移
  const sinValue = Math.sin(animTime * WIND_CONFIG.frequency);

  // G3.3: 计算最终风偏移
  let offset = sinValue * WIND_CONFIG.amplitude * weight;

  // G6: 分支末端应用 1.2 倍系数 (#308, #444-445)
  if (isBranchEnd) {
    offset *= WIND_CONFIG.branchMultiplier;
  }

  return Math.round(offset);
}

// ============================================
// H1: 生长顿挫动画参数 (#309, #446-449)
// ============================================
const PULSE_CONFIG = {
  interval: 5000,       // H1.1: 脉冲间隔（毫秒）
  duration: 600,        // H1.2: 脉冲持续时间
  scaleMax: 1.03,       // H1.3: 缩放上限
  scaleMin: 0.98,       // H1.4: 缩放下限
};

// H2: 脉冲状态接口 (#310, #450)
interface PulseState {
  isActive: boolean;
  startTime: number;
  lastTriggerTime: number;
}

// H4.1: easeInOutQuad 缓动函数 (#312, #455, #557-559)
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// H4: 计算脉冲缩放值 (#312, #456-459, #560-571)
function calculatePulseScale(pulseState: PulseState, currentTime: number): number {
  if (!pulseState.isActive) return 1;

  // H4.2: 计算进度
  const elapsed = currentTime - pulseState.startTime;
  const rawProgress = elapsed / PULSE_CONFIG.duration;
  const progress = Math.max(0, Math.min(1, rawProgress));

  // H4.5: 检测脉冲结束
  if (progress >= 1) {
    pulseState.isActive = false;
    return 1;
  }

  // H4.3-4.4: 分段缩放计算
  const easedProgress = easeInOutQuad(progress);

  if (progress < 0.5) {
    // H4.3: 前半段放大
    return 1 + (PULSE_CONFIG.scaleMax - 1) * easedProgress * 2;
  } else {
    // H4.4: 后半段缩小再恢复
    const secondHalfProgress = (progress - 0.5) * 2;
    if (secondHalfProgress < 0.5) {
      // 缩小到 scaleMin
      return PULSE_CONFIG.scaleMax - (PULSE_CONFIG.scaleMax - PULSE_CONFIG.scaleMin) * secondHalfProgress * 2;
    } else {
      // 恢复到 1
      const recoveryProgress = (secondHalfProgress - 0.5) * 2;
      return PULSE_CONFIG.scaleMin + (1 - PULSE_CONFIG.scaleMin) * recoveryProgress;
    }
  }
}

// ============================================
// F1: 粒子数据接口 (#293, #406-409)
// ============================================
interface ParticleData {
  x: number;           // F1.1: X 坐标
  y: number;           // Y 坐标
  vx: number;          // F1.2: X 速度
  vy: number;          // Y 速度
  life: number;        // F1.3: 剩余生命
  maxLife: number;     // 最大生命
  opacity: number;     // F1.4: 透明度
}

// ============================================
// F3: 粒子生成参数常量 (#295, #410-414)
// ============================================
const PARTICLE_CONFIG = {
  maxCount: 15,           // F3.1: 最大粒子数量
  spawnProbability: 0.03, // F3.2: 每帧生成概率
  baseOpacity: 0.6,       // F3.3: 基础透明度
  riseSpeed: 0.3,         // F3.4: 上升速度
  lifeMin: 60,            // F3.5: 最小生命（帧数）
  lifeMax: 120,           // 最大生命
  driftAmplitude: 0.5,    // F9: 水平漂移振幅
  driftFrequency: 0.05,   // 漂移频率
};

// ============================================
// F4-F7: 粒子系统函数 (#296-299, #415-426, #538-548)
// ============================================
function createParticle(centerX: number, plantTopY: number, plantBottomY: number): ParticleData {
  // F4.2: 生成粒子初始位置（植物周围区域）
  const x = centerX + (Math.random() - 0.5) * 40;
  const y = plantBottomY - Math.random() * (plantBottomY - plantTopY) * 0.8;

  // F4.3-4.4: 初始化速度和生命
  const life = PARTICLE_CONFIG.lifeMin +
    Math.random() * (PARTICLE_CONFIG.lifeMax - PARTICLE_CONFIG.lifeMin);

  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -PARTICLE_CONFIG.riseSpeed * (0.8 + Math.random() * 0.4),
    life,
    maxLife: life,
    opacity: PARTICLE_CONFIG.baseOpacity,
  };
}

function updateParticle(particle: ParticleData, frameCount: number): void {
  // F5.1: 更新位置
  particle.x += particle.vx;
  particle.y += particle.vy;

  // F9.2: 添加正弦波漂移 (#301, #545-548)
  const driftOffset = Math.sin(frameCount * PARTICLE_CONFIG.driftFrequency + particle.x) *
    PARTICLE_CONFIG.driftAmplitude * 0.1;
  particle.x += driftOffset;

  // F5.2: 递减生命
  particle.life -= 1;

  // F5.3: 更新透明度（基于生命比例）(#421, #543-544)
  const lifeRatio = particle.life / particle.maxLife;
  particle.opacity = PARTICLE_CONFIG.baseOpacity * lifeRatio;
}

function isParticleAlive(particle: ParticleData): boolean {
  // F6.1: 检测粒子死亡条件
  return particle.life > 0 && particle.opacity > 0.01;
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleData[]): void {
  const particleColor = ZEN_PALETTE_V2.LIFE_PARTICLE;

  particles.forEach(p => {
    // F7.1: 保存当前 globalAlpha
    ctx.save();
    ctx.globalAlpha = p.opacity;

    // F7.2: 绘制粒子（1px 点）
    const colorChoice = Math.random();
    const color = colorChoice < 0.3 ? particleColor.light :
      colorChoice < 0.7 ? particleColor.main : particleColor.dark;
    drawPixel(ctx, Math.round(p.x), Math.round(p.y), color);

    // F7.3: 恢复 globalAlpha
    ctx.restore();
  });
}

// ============================================
// A8: 组件 Props 接口
// ============================================
interface PixelPlantProps {
  className?: string;
}

// ============================================
// 主组件
// ============================================
export function PixelPlant({ className }: PixelPlantProps) {
  // A2.1-A2.2: Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // F2: 粒子系统状态 ref (#294)
  const particlesRef = useRef<ParticleData[]>([]);
  const frameCountRef = useRef<number>(0);

  // G2: 动画时间 ref (#304, #434-435, #603-606)
  const animTimeRef = useRef<number>(0);

  // H2: 脉冲状态 ref (#310, #451)
  const pulseStateRef = useRef<PulseState>({
    isActive: false,
    startTime: 0,
    lastTriggerTime: 0,
  });

  // J3.1: 侧枝触发状态 refs (#654, #739)
  const triggeredThresholdsRef = useRef<Set<number>>(new Set());
  const prevProgressRef = useRef<number>(0);
  const triggeredBranchesRef = useRef<SideBranchData[]>([]);

  // G1.1-G1.2: Store 订阅
  const timer = useStore((state) => state.timer);
  const plant = useStore((state) => state.plant);

  // N5.1: 获取当前轮数 (#735)
  const currentSession = timer.currentSession;

  // G2: 计算 timerProgress
  const progress = timer.isWorkSession ? plant.currentProgress : 0;
  const totalGrowth = plant.totalGrowth;

  // G7.1: 检测 reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // G4.2-G4.5 + F8 + H3-H6 + N5: 渲染函数（含粒子系统、脉冲动画和小木牌）
  const renderPlant = useCallback((
    ctx: CanvasRenderingContext2D,
    currentProgress: number,
    isRunning: boolean,
    reducedMotion: boolean,
    roundCount: number = 1
  ) => {
    const currentTime = Date.now();

    // G3: 清除画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 创建固定种子的随机数生成器（确保同一 totalGrowth 产生相同形态）
    const random = createSeededRandom(12345 + totalGrowth);

    // G6.3: 从缓存绘制花盆
    if (offscreenCanvasRef.current) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    } else {
      drawPot(ctx, 12345 + totalGrowth);
    }

    // N5.2-N5.4: 绘制小木牌显示轮数 (#736-738, #822-824, #638)
    const signBoardX = Math.floor(POT_CONFIG.centerX - POT_CONFIG.topWidth / 2) + SIGN_BOARD_POSITION.offsetX;
    const signBoardY = POT_CONFIG.topY + SIGN_BOARD_POSITION.offsetY;
    // N5.3: 确保木牌在 canvas 可见范围内
    const clampedSignX = Math.max(2, Math.min(CANVAS_WIDTH - SIGN_BOARD_SIZE.width - 2, signBoardX));
    drawSignBoard(ctx, clampedSignX, signBoardY, roundCount);

    // H3: 脉冲触发逻辑 (#311, #452-454)
    // H6: 仅在 timer 运行时触发新脉冲 (#314, #464-466)
    if (!reducedMotion && isRunning) {
      const timeSinceLastPulse = currentTime - pulseStateRef.current.lastTriggerTime;
      if (!pulseStateRef.current.isActive && timeSinceLastPulse >= PULSE_CONFIG.interval) {
        pulseStateRef.current.isActive = true;
        pulseStateRef.current.startTime = currentTime;
        pulseStateRef.current.lastTriggerTime = currentTime;
      }
    }

    // H5: 计算并应用脉冲缩放 (#313, #460-463, #572-576)
    const pulseScale = reducedMotion ? 1 : calculatePulseScale(pulseStateRef.current, currentTime);

    // H5.1: 计算缩放中心点（植物底部中心）
    const scaleCenterX = POT_CONFIG.centerX;
    const scaleCenterY = POT_CONFIG.topY;

    // H5.2: 应用 Canvas 变换
    if (pulseScale !== 1) {
      ctx.save();
      ctx.translate(scaleCenterX, scaleCenterY);
      ctx.scale(pulseScale, pulseScale);
      ctx.translate(-scaleCenterX, -scaleCenterY);
    }

    // G4.3: 渲染主干
    const trunkPixels = generateTrunkPixels(random, currentProgress, totalGrowth);
    drawTrunk(ctx, trunkPixels);

    // J3: 检测侧枝触发阈值 (#617, #654-657)
    const newBranches = checkSideBranchTrigger(
      prevProgressRef.current,
      currentProgress,
      triggeredThresholdsRef.current,
      random
    );

    // 累积新触发的分支
    if (newBranches.length > 0) {
      triggeredBranchesRef.current = [...triggeredBranchesRef.current, ...newBranches];
    }

    // 更新上一帧进度
    prevProgressRef.current = currentProgress;

    // G4.4: 渲染分支（使用阈值触发的侧枝）
    const branches = generateBranches(random, trunkPixels, currentProgress, triggeredBranchesRef.current);
    drawBranches(ctx, branches);

    // G4.5 + G4: 渲染叶片（含微风摆动）
    const { leaves, isBranchLeaf } = generateLeaves(random, trunkPixels, branches, currentProgress);

    // G2.2: 累加动画时间
    if (isRunning) {
      animTimeRef.current += 16; // 约 60fps
    }

    drawLeaves(ctx, leaves, animTimeRef.current, isRunning, isBranchLeaf);

    // H5.4: 重置 Canvas 变换
    if (pulseScale !== 1) {
      ctx.restore();
    }

    // F8: 粒子系统集成 (#300, #611-614)
    if (!reducedMotion) {
      const plantTopY = trunkPixels.length > 0 ? trunkPixels[trunkPixels.length - 1].y : POT_CONFIG.topY - 20;
      const plantBottomY = POT_CONFIG.topY;

      // F10: 仅在 timer 运行时生成新粒子 (#302, #429-430)
      if (isRunning &&
          particlesRef.current.length < PARTICLE_CONFIG.maxCount &&
          Math.random() < PARTICLE_CONFIG.spawnProbability) {
        particlesRef.current.push(createParticle(POT_CONFIG.centerX, plantTopY, plantBottomY));
      }

      // F8.3: 更新粒子
      frameCountRef.current += 1;
      particlesRef.current.forEach(p => updateParticle(p, frameCountRef.current));

      // F6.2: 过滤死亡粒子 (#298, #422-423)
      particlesRef.current = particlesRef.current.filter(isParticleAlive);

      // F8.4: 绘制粒子
      drawParticles(ctx, particlesRef.current);
    }
  }, [totalGrowth]);

  // A2.3 & A3.2: Canvas 初始化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 获取 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }
    ctxRef.current = ctx;

    // A3.2: devicePixelRatio 处理
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    // A4: 禁用图像平滑（保持像素锐利）
    ctx.imageSmoothingEnabled = false;
  }, []);

  // B12: 离屏缓存创建（totalGrowth 变化时重新生成）
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_WIDTH;
    offscreen.height = CANVAS_HEIGHT;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.imageSmoothingEnabled = false;
      drawPot(offCtx, 12345 + totalGrowth);
      offscreenCanvasRef.current = offscreen;
    }
  }, [totalGrowth]);

  // J3: 当 progress 重置为 0 时（新 session 开始），清空已触发的阈值
  useEffect(() => {
    if (progress === 0) {
      triggeredThresholdsRef.current.clear();
      triggeredBranchesRef.current = [];
      prevProgressRef.current = 0;
    }
  }, [progress]);

  // G5.1-G5.3: 动画控制
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const isRunning = timer.status === 'running';

    // G7.2: 如果用户偏好减少动画，直接渲染最终状态
    if (prefersReducedMotion) {
      renderPlant(ctx, progress, false, true, currentSession);
      return;
    }

    // G5.2: 动画启动
    if (isRunning) {
      const animate = () => {
        renderPlant(ctx, progress, true, false, currentSession);
        animationFrameIdRef.current = requestAnimationFrame(animate);
      };
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      // G5.3: 动画停止，渲染一帧静态画面
      cancelAnimationFrame(animationFrameIdRef.current);
      renderPlant(ctx, progress, false, false, currentSession);
    }

    // A6: 清理
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [timer.status, progress, renderPlant, prefersReducedMotion, currentSession]);

  // 当 totalGrowth 或 currentSession 变化时重新渲染
  useEffect(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      renderPlant(ctx, progress, timer.status === 'running', prefersReducedMotion, currentSession);
    }
  }, [totalGrowth, progress, renderPlant, timer.status, prefersReducedMotion, currentSession]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="像素风格的生长植物"
      style={{
        width: CANVAS_WIDTH * 2,
        height: CANVAS_HEIGHT * 2,
        imageRendering: 'pixelated',
      }}
    />
  );
}
