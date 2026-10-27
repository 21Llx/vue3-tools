<template>
  <canvas ref="canvasRef" class="gray-lines-canvas" />
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

interface LineSegment {
  ax1: number;
  ay1: number;
  ax2: number;
  ay2: number;
  vx1: number;
  vy1: number;
  vx2: number;
  vy2: number;
  phase1: number;
  phase2: number;
  phase3: number;
  phase4: number;
  amplitude: number;
  speed: number;
  gray: number;
  width: number;
}

interface ClickWave {
  x: number;
  y: number;
  born: number;
}

const canvasRef = ref<HTMLCanvasElement>();
let animationId = 0;
let lines: LineSegment[] = [];
let waves: ClickWave[] = [];
let width = 0;
let height = 0;
let dpr = 1;

const CLICK_RADIUS = 180;
const CLICK_FORCE = 10;
const VELOCITY_DAMPING = 0.9;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickGray() {
  const palette = [220, 180, 140, 100, 70, 45];
  return palette[Math.floor(Math.random() * palette.length)];
}

function createLines(w: number, h: number) {
  const count = Math.floor((w * h) / 12000);
  lines = [];

  for (let i = 0; i < count; i += 1) {
    const cx = randomBetween(0, w);
    const cy = randomBetween(0, h);
    const angle = randomBetween(0, Math.PI * 2);
    const len = randomBetween(28, 110);
    const half = len / 2;

    lines.push({
      ax1: cx - Math.cos(angle) * half,
      ay1: cy - Math.sin(angle) * half,
      ax2: cx + Math.cos(angle) * half,
      ay2: cy + Math.sin(angle) * half,
      vx1: 0,
      vy1: 0,
      vx2: 0,
      vy2: 0,
      phase1: randomBetween(0, Math.PI * 2),
      phase2: randomBetween(0, Math.PI * 2),
      phase3: randomBetween(0, Math.PI * 2),
      phase4: randomBetween(0, Math.PI * 2),
      amplitude: randomBetween(4, 16),
      speed: randomBetween(0.5, 1.6),
      gray: pickGray(),
      width: randomBetween(0.6, 1.8),
    });
  }
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createLines(width, height);
}

function pushEndpoint(
  line: LineSegment,
  ax: 'ax1' | 'ax2',
  ay: 'ay1' | 'ay2',
  vx: 'vx1' | 'vx2',
  vy: 'vy1' | 'vy2',
  cx: number,
  cy: number,
) {
  const px = line[ax];
  const py = line[ay];
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > CLICK_RADIUS || dist < 0.001) return;

  const power = (1 - dist / CLICK_RADIUS) ** 1.5 * CLICK_FORCE;
  line[vx] += (dx / dist) * power;
  line[vy] += (dy / dist) * power;
}

function applyClick(x: number, y: number, time: number) {
  waves.push({ x, y, born: time });
  lines.forEach((line) => {
    pushEndpoint(line, 'ax1', 'ay1', 'vx1', 'vy1', x, y);
    pushEndpoint(line, 'ax2', 'ay2', 'vx2', 'vy2', x, y);
  });
}

function updateLinePhysics(line: LineSegment) {
  line.ax1 += line.vx1;
  line.ay1 += line.vy1;
  line.ax2 += line.vx2;
  line.ay2 += line.vy2;

  line.vx1 *= VELOCITY_DAMPING;
  line.vy1 *= VELOCITY_DAMPING;
  line.vx2 *= VELOCITY_DAMPING;
  line.vy2 *= VELOCITY_DAMPING;

  const pad = 20;
  [line.ax1, line.ax2].forEach((x, index) => {
    const key = index === 0 ? 'vx1' : 'vx2';
    if (x < pad) line[key] += (pad - x) * 0.02;
    if (x > width - pad) line[key] -= (x - (width - pad)) * 0.02;
  });
  [line.ay1, line.ay2].forEach((y, index) => {
    const key = index === 0 ? 'vy1' : 'vy2';
    if (y < pad) line[key] += (pad - y) * 0.02;
    if (y > height - pad) line[key] -= (y - (height - pad)) * 0.02;
  });
}

function onPointerDown(event: PointerEvent) {
  applyClick(event.clientX, event.clientY, performance.now());
}

function draw(time: number) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const t = time * 0.001;
  ctx.fillStyle = '#0e0e0e';
  ctx.fillRect(0, 0, width, height);

  waves = waves.filter((wave) => time - wave.born < 500);
  waves.forEach((wave) => {
    const age = (time - wave.born) / 500;
    const radius = CLICK_RADIUS * (0.4 + age * 0.9);
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - age) * 0.18})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  lines.forEach((line) => {
    updateLinePhysics(line);
    const amp = line.amplitude;
    const s = line.speed;
    const x1 = line.ax1 + Math.sin(t * s + line.phase1) * amp;
    const y1 = line.ay1 + Math.cos(t * s * 1.1 + line.phase2) * amp;
    const x2 = line.ax2 + Math.sin(t * s * 0.9 + line.phase3) * amp;
    const y2 = line.ay2 + Math.cos(t * s * 1.2 + line.phase4) * amp;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgb(${line.gray}, ${line.gray}, ${line.gray})`;
    ctx.lineWidth = line.width;
    ctx.stroke();
  });

  animationId = requestAnimationFrame(draw);
}

onMounted(() => {
  resize();
  animationId = requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
  canvasRef.value?.addEventListener('pointerdown', onPointerDown);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', resize);
  canvasRef.value?.removeEventListener('pointerdown', onPointerDown);
});
</script>

<style scoped>
.gray-lines-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
</style>
