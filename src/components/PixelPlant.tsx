/**
 * PixelPlant - 4-Stage Pixel Art Bonsai/Pine Growth Component
 *
 * Growth Stages (mapped to PlantStage):
 *   0 (sprout)  → Seedling: thin 1px trunk + tiny bud
 *   1 (young)   → Growth: slender pine with triangular needle layers
 *   2 (mature)  → Mature: robust pine with cloud-pruned foliage layers
 *   3 (ancient) → Ancient: gnarled bonsai with sparse foliage + snow
 *
 * Rendering: HTML Canvas fillRect(), 128×192 internal pixels, displayed at 2×
 * Each stage draws trunk/branches directly, returns FoliagePx[] for wind animation
 */

import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../stores/useStore';
import { getPlantStage } from '../utils/plantStage';
import type { PlantStage } from '../types';

// ============================================
// Canvas Constants
// ============================================
const CANVAS_W = 128;
const CANVAS_H = 192;

// ============================================
// Color Palette (per spec §2)
// ============================================
const C = {
  // Trunk – younger / healthy
  TRUNK_L: '#7D5A44',
  TRUNK_M: '#604334',
  TRUNK_D: '#4A2C2A',
  // Trunk – ancient / weathered
  AGED_L: '#A0A0A0',
  AGED_M: '#707070',
  // Foliage – healthy
  GREEN_B: '#4E9A06',
  GREEN_M: '#3C7A04',
  GREEN_D: '#1A3D1A',
  GREEN_DD: '#0F250F',
  // Snow
  SNOW_L: '#E0F0FF',
  SNOW_S: '#C0D0E0',
  // Pot
  POT_B: '#363636',
  POT_T: '#4A4A4A',
  POT_S: '#2C2C2C',
  // Soil
  SOIL_M: '#3D2817',
  SOIL_L: '#523920',
  SOIL_D: '#28190E',
} as const;

// ============================================
// Pot Configuration
// ============================================
const POT = {
  topW: 52,
  botW: 38,
  h: 28,
  rimH: 2,
  get topY() { return CANVAS_H - this.h - 5; },
  get cx() { return CANVAS_W / 2; },
};

/** Fixed trunk base – consistent across ALL stages */
const BASE_X = POT.cx;
const BASE_Y = POT.topY;

// Stage thresholds (mirror plantStage.ts)
const STAGE_THRESHOLDS = [0, 1, 3, 8];
const STAGE_IDX: Record<PlantStage, number> = {
  sprout: 0, young: 1, mature: 2, ancient: 3,
};

// ============================================
// Utility Functions
// ============================================
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

/** Bresenham line rasterisation */
function linePx(x0: number, y0: number, x1: number, y1: number) {
  const pts: { x: number; y: number }[] = [];
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = Math.floor(x0), y = Math.floor(y0);
  const ex = Math.floor(x1), ey = Math.floor(y1);
  while (true) {
    pts.push({ x, y });
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return pts;
}

// ============================================
// Foliage pixel for animated wind rendering
// ============================================
interface FoliagePx {
  x: number;
  y: number;
  color: string;
  /** 0 = base, 1 = top – controls wind intensity */
  hRatio: number;
}

// ============================================
// Pot Drawing
// ============================================
function drawPot(ctx: CanvasRenderingContext2D) {
  const { cx, topY, topW, botW, h, rimH } = POT;

  // Rim (top edge highlight)
  const rimW = topW;
  rect(ctx, Math.floor(cx - rimW / 2), topY, rimW, rimH, C.POT_T);

  // Body – trapezoid
  for (let y = rimH; y < h; y++) {
    const t = y / (h - 1);
    const w = Math.floor(topW + (botW - topW) * t);
    const sx = Math.floor(cx - w / 2);
    rect(ctx, sx, topY + y, w, 1, C.POT_B);
    // Left highlight
    px(ctx, sx, topY + y, C.POT_T);
    // Right shadow
    px(ctx, sx + w - 1, topY + y, C.POT_S);
    // Dither texture
    for (let x = 1; x < w - 1; x++) {
      if ((sx + x + topY + y) % 4 === 0) px(ctx, sx + x, topY + y, C.POT_S);
    }
  }

  // Bottom shadow
  const sW = botW + 4;
  ctx.save();
  ctx.globalAlpha = 0.2;
  rect(ctx, Math.floor(cx - sW / 2), topY + h, sW, 2, '#000000');
  ctx.restore();

  // Soil on top
  const soilW = topW - 6;
  const soilX = Math.floor(cx - soilW / 2);
  rect(ctx, soilX, topY + rimH, soilW, 3, C.SOIL_M);
  const rng = seededRng(777);
  for (let i = 0; i < 10; i++) {
    const gx = soilX + 1 + Math.floor(rng() * (soilW - 2));
    const gy = topY + rimH + Math.floor(rng() * 2);
    px(ctx, gx, gy, rng() > 0.5 ? C.SOIL_L : C.SOIL_D);
  }
}

// ============================================
// Stage 0: Seedling
// ============================================
function renderSeedling(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  prog: number,
): FoliagePx[] {
  const foliage: FoliagePx[] = [];
  const trunkH = 5 + Math.floor(prog * 3); // 5-8 px

  // Single-pixel trunk line
  for (let i = 0; i < trunkH; i++) {
    px(ctx, BASE_X, BASE_Y - i, i < 2 ? C.TRUNK_D : C.TRUNK_M);
  }

  // Small bud at top – cross pattern
  const ty = BASE_Y - trunkH;
  const bud: { dx: number; dy: number; c: string }[] = [
    { dx: 0, dy: 0, c: C.GREEN_B },
    { dx: -1, dy: 0, c: C.GREEN_M },
    { dx: 1, dy: 0, c: C.GREEN_M },
    { dx: 0, dy: -1, c: C.GREEN_B },
  ];
  if (prog > 0.3) bud.push({ dx: 0, dy: 1, c: C.GREEN_D });
  if (prog > 0.6) {
    bud.push({ dx: -1, dy: -1, c: C.GREEN_D });
    bud.push({ dx: 1, dy: -1, c: C.GREEN_D });
  }
  bud.forEach(p => {
    foliage.push({ x: BASE_X + p.dx, y: ty + p.dy, color: p.c, hRatio: 1.0 });
  });
  return foliage;
}

// ============================================
// Stage 1: Growth (Young Pine)
// ============================================
function renderGrowthTree(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  prog: number,
): FoliagePx[] {
  const foliage: FoliagePx[] = [];
  const trunkH = 22 + Math.floor(prog * 6); // 22-28 px

  // Trunk: 2 px wide, tapers to 1 px near top
  for (let i = 0; i < trunkH; i++) {
    const y = BASE_Y - i;
    const hr = i / trunkH;
    const w = hr > 0.85 ? 1 : 2;
    const sx = BASE_X - Math.floor(w / 2);
    const color = hr < 0.3 ? C.TRUNK_D : hr < 0.7 ? C.TRUNK_M : C.TRUNK_L;
    for (let dx = 0; dx < w; dx++) px(ctx, sx + dx, y, color);
  }

  // 2–3 triangular needle layers (narrowest at top, widest at bottom)
  const topY = BASE_Y - trunkH;
  const numLayers = prog > 0.4 ? 3 : 2;
  const layerSpacing = 6;

  for (let li = 0; li < numLayers; li++) {
    const layerTopY = topY + li * layerSpacing;
    const layerW = 8 + li * 4;   // top=8, mid=12, bot=16
    const layerH = 5 + li;       // top=5, mid=6, bot=7
    const layerHR = 1 - (li * layerSpacing) / (trunkH + numLayers * layerSpacing);

    for (let row = 0; row < layerH; row++) {
      const rowRatio = row / Math.max(1, layerH - 1);
      const rowW = Math.max(1, Math.round(layerW * rowRatio));
      const sx = BASE_X - Math.floor(rowW / 2);

      for (let dx = 0; dx < rowW; dx++) {
        if (rng() < 0.08) continue; // sparse edge gaps
        const isEdge = dx === 0 || dx === rowW - 1;
        const isBottom = row >= layerH - 2;
        const color = isEdge || isBottom ? C.GREEN_D
          : row < 2 ? C.GREEN_B
          : C.GREEN_M;

        foliage.push({ x: sx + dx, y: layerTopY + row, color, hRatio: layerHR });
      }
    }
    // Apex pixel
    foliage.push({ x: BASE_X, y: layerTopY - 1, color: C.GREEN_B, hRatio: layerHR + 0.05 });
  }

  return foliage;
}

// ============================================
// Stage 2: Mature Pine
// ============================================
function renderMatureTree(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  prog: number,
): FoliagePx[] {
  const foliage: FoliagePx[] = [];
  const trunkH = 38 + Math.floor(prog * 8); // 38-46 px

  // Trunk: 4-5 px wide at base, bark texture
  for (let i = 0; i < trunkH; i++) {
    const y = BASE_Y - i;
    const hr = i / trunkH;
    const w = hr < 0.2 ? 5 : hr < 0.5 ? 4 : hr < 0.8 ? 3 : 2;
    const sx = BASE_X - Math.floor(w / 2);

    for (let dx = 0; dx < w; dx++) {
      const texMod = (i + dx) % 3;
      let color = texMod === 0 ? C.TRUNK_D : texMod === 1 ? C.TRUNK_M : C.TRUNK_L;
      if (dx === 0) color = C.TRUNK_D;
      if (dx === w - 1 && w > 2) color = C.TRUNK_L;
      px(ctx, sx + dx, y, color);
    }
  }

  // 3-4 cloud-pruned elliptical foliage layers
  const topY = BASE_Y - trunkH;
  const numLayers = prog > 0.5 ? 4 : 3;
  const layerDefs = [
    { offY: 2,  w: 10, h: 5 },  // top (smallest)
    { offY: 11, w: 14, h: 6 },  // mid-high
    { offY: 21, w: 18, h: 7 },  // mid-low
    { offY: 32, w: 22, h: 8 },  // bottom (largest)
  ].slice(0, numLayers);

  // Short branches connecting trunk to cloud centres
  layerDefs.forEach((ld, idx) => {
    const cloudY = topY + ld.offY;
    const dir = idx % 2 === 0 ? -1 : 1;
    const bEnd = BASE_X + dir * Math.floor(ld.w * 0.25);
    linePx(BASE_X, cloudY + 2, bEnd, cloudY).forEach(p => {
      px(ctx, p.x, p.y, C.TRUNK_M);
      if (Math.abs(p.x - BASE_X) > 2) px(ctx, p.x, p.y + 1, C.TRUNK_D);
    });
  });

  // Elliptical cloud fills with volumetric shading
  layerDefs.forEach((ld) => {
    const cloudCY = topY + ld.offY;
    const halfH = Math.floor(ld.h / 2);
    const layerHR = 1 - ld.offY / (trunkH + 10);

    for (let dy = -halfH; dy <= halfH; dy++) {
      const rowFrac = 1 - (dy * dy) / ((halfH + 1) * (halfH + 1));
      const rowW = Math.max(1, Math.round(ld.w * Math.sqrt(Math.max(0, rowFrac))));
      const sx = BASE_X - Math.floor(rowW / 2);

      for (let dx = 0; dx < rowW; dx++) {
        if (rng() < 0.1) continue; // organic gaps
        const distFrac = Math.abs(dx - rowW / 2) / (rowW / 2 + 1);
        let color: string;
        if (dy < -halfH * 0.4) {
          color = distFrac > 0.7 ? C.GREEN_M : C.GREEN_B;
        } else if (dy > halfH * 0.4) {
          color = distFrac > 0.6 ? C.GREEN_DD : C.GREEN_D;
        } else {
          color = distFrac > 0.7 ? C.GREEN_D : C.GREEN_M;
        }
        foliage.push({ x: sx + dx, y: cloudCY + dy, color, hRatio: layerHR });
      }
    }
  });

  // Top spire
  foliage.push({ x: BASE_X, y: topY - 1, color: C.GREEN_B, hRatio: 1 });
  foliage.push({ x: BASE_X, y: topY - 2, color: C.GREEN_M, hRatio: 1 });

  return foliage;
}

// ============================================
// Stage 3: Ancient Tree
// ============================================
interface AncientBranch {
  ex: number; ey: number;
  pixels: { x: number; y: number }[];
}

function renderAncientTree(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  prog: number,
): FoliagePx[] {
  const foliage: FoliagePx[] = [];
  const trunkH = 52 + Math.floor(prog * 10); // 52-62 px

  // S-curve gnarled trunk path
  const trunkPath: { x: number; y: number; w: number }[] = [];
  const sAmp = 9, sFreq = 1.8;
  const phase = rng() * Math.PI * 0.5;

  for (let i = 0; i < trunkH; i++) {
    const hr = i / trunkH;
    const y = BASE_Y - i;
    const sOff = Math.sin(hr * Math.PI * sFreq + phase) * sAmp * hr;
    const jitter = i % 6 === 0 ? (rng() - 0.5) * 2 : 0;
    const x = Math.floor(BASE_X + sOff + jitter);
    const w = hr < 0.12 ? 6 : hr < 0.35 ? 5 : hr < 0.65 ? 4 : 3;
    trunkPath.push({ x, y, w });
  }

  // Draw trunk with aged/weathered colours
  trunkPath.forEach((p, i) => {
    const hr = i / trunkH;
    const sx = p.x - Math.floor(p.w / 2);
    for (let dx = 0; dx < p.w; dx++) {
      const isGrey = ((i + dx) % 5 === 0) || (hr > 0.5 && rng() < 0.35);
      let color: string;
      if (isGrey) {
        color = dx === 0 ? C.AGED_M : C.AGED_L;
      } else {
        color = dx === 0 ? C.TRUNK_D : dx === p.w - 1 ? C.TRUNK_L : C.TRUNK_M;
      }
      if ((i + dx) % 7 === 0 && dx > 0 && dx < p.w - 1) color = C.TRUNK_D;
      px(ctx, sx + dx, p.y, color);
    }
  });

  // Prominent gnarled branches
  const branchCount = 5 + Math.floor(rng() * 3);
  const branches: AncientBranch[] = [];

  for (let bi = 0; bi < branchCount; bi++) {
    const attachRatio = 0.25 + (bi / branchCount) * 0.55;
    const idx = Math.min(Math.floor(attachRatio * trunkH), trunkPath.length - 1);
    const ap = trunkPath[idx];
    if (!ap) continue;

    const dir = bi % 2 === 0 ? -1 : 1;
    const len = 10 + Math.floor(rng() * 14);
    const angDeg = 75 + rng() * 20;
    const droopDeg = 5 + rng() * 12;
    const rad = ((angDeg - droopDeg) * Math.PI) / 180;
    const ex = ap.x + dir * Math.floor(len * Math.cos(rad));
    const ey = ap.y - Math.floor(len * Math.sin(rad)) + Math.floor(rng() * 4);
    const pts = linePx(ap.x, ap.y, ex, ey);
    branches.push({ ex, ey, pixels: pts });

    // Draw branch pixels (thick at base, thin at tip)
    pts.forEach((p, j) => {
      const bRatio = j / pts.length;
      const bw = bRatio < 0.3 ? 2 : 1;
      const color = (j % 4 === 0) ? C.AGED_M : (j % 4 === 1) ? C.TRUNK_M : C.TRUNK_D;
      px(ctx, p.x, p.y, color);
      if (bw === 2) px(ctx, p.x, p.y + 1, C.TRUNK_D);
    });

    // Snow dusting on branch tops
    pts.forEach((p, j) => {
      if (j % 3 === 0 && rng() < 0.45) {
        px(ctx, p.x, p.y - 1, rng() < 0.6 ? C.SNOW_L : C.SNOW_S);
      }
    });
  }

  // Sparse foliage at branch endpoints
  branches.forEach((br) => {
    if (rng() < 0.2) return; // ~20% bare branches
    const cs = 4 + Math.floor(rng() * 5); // cluster 4-9 px
    const halfCS = Math.floor(cs / 2);
    const bhRatio = Math.max(0.3, 1 - Math.abs(br.ey - (BASE_Y - trunkH)) / trunkH);

    for (let dy = -halfCS; dy <= halfCS; dy++) {
      const rowW = Math.max(1, Math.floor(cs * (1 - Math.abs(dy) / (halfCS + 1))));
      for (let dx = -Math.floor(rowW / 2); dx <= Math.floor(rowW / 2); dx++) {
        if (rng() < 0.35) continue; // heavy gaps for sparse look
        const color = rng() < 0.4 ? C.GREEN_D : C.GREEN_M;
        foliage.push({ x: br.ex + dx, y: br.ey + dy, color, hRatio: bhRatio });
      }
    }
  });

  // Small crown at tree top
  const top = trunkPath[trunkPath.length - 1];
  if (top) {
    const cw = 7 + Math.floor(rng() * 3);
    const ch = 5 + Math.floor(rng() * 2);
    for (let dy = -ch; dy <= 0; dy++) {
      const rowW = Math.max(1, Math.floor(cw * (1 - (dy * dy) / (ch * ch + 1))));
      for (let dx = -Math.floor(rowW / 2); dx <= Math.floor(rowW / 2); dx++) {
        if (rng() < 0.3) continue;
        foliage.push({
          x: top.x + dx, y: top.y + dy,
          color: rng() < 0.5 ? C.GREEN_D : C.GREEN_M,
          hRatio: 1,
        });
      }
    }
    // Snow on crown
    for (let dx = -3; dx <= 3; dx++) {
      if (rng() < 0.35) continue;
      px(ctx, top.x + dx, top.y - ch - 1, C.SNOW_L);
    }
  }

  return foliage;
}

// ============================================
// Wind Animation
// ============================================
const WIND = { amp: 1.5, freq: 0.002, threshold: 0.7, branchMul: 1.2 };

function windOffset(hRatio: number, time: number, isRunning: boolean): number {
  if (!isRunning || hRatio < WIND.threshold) return 0;
  const above = (hRatio - WIND.threshold) / (1 - WIND.threshold);
  return Math.round(Math.sin(time * WIND.freq) * WIND.amp * above * above);
}

// ============================================
// Particle System
// ============================================
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; opacity: number;
}

const PART_CFG = {
  max: 12, spawnProb: 0.03, baseOp: 0.5,
  riseSpeed: 0.25, lifeMin: 60, lifeMax: 120,
};
const PART_COLORS = ['#C8E6C9', '#E8F5E9', '#A5D6A7'];

function spawnParticle(cx: number, topY: number, botY: number): Particle {
  const life = PART_CFG.lifeMin + Math.random() * (PART_CFG.lifeMax - PART_CFG.lifeMin);
  return {
    x: cx + (Math.random() - 0.5) * 40,
    y: botY - Math.random() * (botY - topY) * 0.8,
    vx: (Math.random() - 0.5) * 0.15,
    vy: -PART_CFG.riseSpeed * (0.8 + Math.random() * 0.4),
    life, maxLife: life, opacity: PART_CFG.baseOp,
  };
}

function tickParticle(p: Particle, frame: number) {
  p.x += p.vx + Math.sin(frame * 0.05 + p.x) * 0.05;
  p.y += p.vy;
  p.life--;
  p.opacity = PART_CFG.baseOp * (p.life / p.maxLife);
}

function drawParticles(ctx: CanvasRenderingContext2D, parts: Particle[]) {
  parts.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    px(ctx, Math.round(p.x), Math.round(p.y), PART_COLORS[Math.floor(Math.random() * 3)]);
    ctx.restore();
  });
}

// ============================================
// Pulse (growth-spurt) Animation
// ============================================
const PULSE = { interval: 5000, duration: 600, scaleMax: 1.03, scaleMin: 0.98 };

interface PulseState { active: boolean; start: number; lastTrigger: number }

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function calcPulseScale(ps: PulseState, now: number): number {
  if (!ps.active) return 1;
  const progress = Math.min(1, (now - ps.start) / PULSE.duration);
  if (progress >= 1) { ps.active = false; return 1; }
  const e = easeInOutQuad(progress);
  if (progress < 0.5) return 1 + (PULSE.scaleMax - 1) * e * 2;
  const sh = (progress - 0.5) * 2;
  return sh < 0.5
    ? PULSE.scaleMax - (PULSE.scaleMax - PULSE.scaleMin) * sh * 2
    : PULSE.scaleMin + (1 - PULSE.scaleMin) * (sh - 0.5) * 2;
}

// ============================================
// Sign Board (pixel-digit session counter)
// ============================================
const DIGITS: Record<string, number[][]> = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
  '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
};

function drawSignBoard(ctx: CanvasRenderingContext2D, sx: number, sy: number, count: number) {
  const bW = 12, bH = 8;
  // Board face
  rect(ctx, sx, sy, bW, bH, '#8B7355');
  // Border
  for (let x = 0; x < bW; x++) { px(ctx, sx + x, sy, '#6B5344'); px(ctx, sx + x, sy + bH - 1, '#6B5344'); }
  for (let y = 0; y < bH; y++) { px(ctx, sx, sy + y, '#6B5344'); px(ctx, sx + bW - 1, sy + y, '#6B5344'); }
  // Post
  rect(ctx, sx + Math.floor(bW / 2) - 1, sy + bH, 2, 8, '#6B5344');

  // Pixel number
  const digits = count.toString();
  const totalW = digits.length * 4 - 1;
  const numX = sx + Math.floor((bW - totalW) / 2);
  const numY = sy + Math.floor((bH - 5) / 2);
  for (let di = 0; di < digits.length; di++) {
    const pattern = DIGITS[digits[di]];
    if (!pattern) continue;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (pattern[row][col]) px(ctx, numX + di * 4 + col, numY + row, '#3D2914');
      }
    }
  }
}

// ============================================
// Stage dispatch helper
// ============================================
function renderStage(
  ctx: CanvasRenderingContext2D,
  stageIdx: number,
  rng: () => number,
  prog: number,
): FoliagePx[] {
  switch (stageIdx) {
    case 0: return renderSeedling(ctx, rng, prog);
    case 1: return renderGrowthTree(ctx, rng, prog);
    case 2: return renderMatureTree(ctx, rng, prog);
    case 3: return renderAncientTree(ctx, rng, prog);
    default: return renderSeedling(ctx, rng, prog);
  }
}

/** Approximate plant top Y for particle spawn region */
function plantTopY(stageIdx: number): number {
  return BASE_Y - [10, 35, 55, 70][stageIdx];
}

// ============================================
// Props & Component
// ============================================
interface PixelPlantProps { className?: string }

export function PixelPlant({ className }: PixelPlantProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animFrameRef = useRef(0);
  const potCacheRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const animTimeRef = useRef(0);
  const pulseRef = useRef<PulseState>({ active: false, start: 0, lastTrigger: 0 });
  const prevStageRef = useRef<PlantStage | null>(null);

  // Store subscriptions
  const timer = useStore(s => s.timer);
  const plant = useStore(s => s.plant);
  const currentSession = timer.currentSession;
  const totalGrowth = plant.totalGrowth;
  const sessionProgress = timer.isWorkSession ? plant.currentProgress : 0;

  // Derive stage & within-stage progress
  const stage = getPlantStage(totalGrowth);
  const sIdx = STAGE_IDX[stage];
  const curThreshold = STAGE_THRESHOLDS[sIdx];
  const nxtThreshold = sIdx < 3 ? STAGE_THRESHOLDS[sIdx + 1] : curThreshold + 8;
  const stageProg = Math.min(1,
    (totalGrowth + sessionProgress - curThreshold) / (nxtThreshold - curThreshold));

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // --------------------------------------------------
  // Core render callback (all varying data via params)
  // --------------------------------------------------
  const render = useCallback((
    ctx: CanvasRenderingContext2D,
    isRunning: boolean,
    reduced: boolean,
    session: number,
    stageIndex: number,
    progress: number,
    totalG: number,
  ) => {
    const now = Date.now();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Pot (cached)
    if (potCacheRef.current) {
      ctx.drawImage(potCacheRef.current, 0, 0);
    } else {
      drawPot(ctx);
    }

    // Sign board (left of pot)
    const signX = Math.max(2, Math.floor(BASE_X - POT.topW / 2) - 30);
    drawSignBoard(ctx, signX, BASE_Y - 5, session);

    // Pulse trigger
    if (!reduced && isRunning) {
      const since = now - pulseRef.current.lastTrigger;
      if (!pulseRef.current.active && since >= PULSE.interval) {
        pulseRef.current.active = true;
        pulseRef.current.start = now;
        pulseRef.current.lastTrigger = now;
      }
    }

    const ps = reduced ? 1 : calcPulseScale(pulseRef.current, now);
    if (ps !== 1) {
      ctx.save();
      ctx.translate(BASE_X, BASE_Y);
      ctx.scale(ps, ps);
      ctx.translate(-BASE_X, -BASE_Y);
    }

    // Render tree stage
    const rng = seededRng(12345 + totalG);
    const foliage = renderStage(ctx, stageIndex, rng, progress);

    // Animate foliage with wind
    if (isRunning) animTimeRef.current += 16;
    foliage.forEach(f => {
      const wo = reduced ? 0 : windOffset(f.hRatio, animTimeRef.current, isRunning);
      px(ctx, f.x + wo, f.y, f.color);
    });

    if (ps !== 1) ctx.restore();

    // Particles
    if (!reduced) {
      const topY = plantTopY(stageIndex);
      if (isRunning && particlesRef.current.length < PART_CFG.max && Math.random() < PART_CFG.spawnProb) {
        particlesRef.current.push(spawnParticle(BASE_X, topY, BASE_Y));
      }
      frameRef.current++;
      particlesRef.current.forEach(p => tickParticle(p, frameRef.current));
      particlesRef.current = particlesRef.current.filter(p => p.life > 0 && p.opacity > 0.01);
      drawParticles(ctx, particlesRef.current);
    }
  }, []);

  // --------------------------------------------------
  // Canvas init
  // --------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
  }, []);

  // Pot offscreen cache (stage-independent)
  useEffect(() => {
    const off = document.createElement('canvas');
    off.width = CANVAS_W;
    off.height = CANVAS_H;
    const octx = off.getContext('2d');
    if (octx) {
      octx.imageSmoothingEnabled = false;
      drawPot(octx);
      potCacheRef.current = off;
    }
  }, []);

  // Stage-change transition pulse
  useEffect(() => {
    if (prevStageRef.current !== null && prevStageRef.current !== stage) {
      pulseRef.current.active = true;
      pulseRef.current.start = Date.now();
      pulseRef.current.lastTrigger = Date.now();
    }
    prevStageRef.current = stage;
  }, [stage]);

  // Animation loop / static render
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const isRunning = timer.status === 'running';

    if (prefersReducedMotion) {
      render(ctx, false, true, currentSession, sIdx, stageProg, totalGrowth);
      return;
    }

    if (isRunning) {
      const animate = () => {
        render(ctx, true, false, currentSession, sIdx, stageProg, totalGrowth);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animFrameRef.current);
      render(ctx, false, false, currentSession, sIdx, stageProg, totalGrowth);
    }

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [timer.status, sIdx, stageProg, currentSession, totalGrowth, render, prefersReducedMotion]);

  // Re-render on growth changes when idle
  useEffect(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      render(ctx, timer.status === 'running', prefersReducedMotion, currentSession, sIdx, stageProg, totalGrowth);
    }
  }, [totalGrowth, sIdx, stageProg, currentSession, timer.status, render, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="像素风格的生长盆栽"
      style={{
        width: CANVAS_W * 2,
        height: CANVAS_H * 2,
        imageRendering: 'pixelated',
      }}
    />
  );
}
