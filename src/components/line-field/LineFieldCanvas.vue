<template>
  <canvas ref="canvasRef" class="line-field-canvas" />
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

interface Vertex {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
}

interface Shape {
  sides: number;
  vertexStart: number;
  hue: number;
}

const canvasRef = ref<HTMLCanvasElement>();
let animationId = 0;
let vertices: Vertex[] = [];
let shapes: Shape[] = [];
let width = 0;
let height = 0;
let dpr = 1;
let mouseX = -1000;
let mouseY = -1000;
let active = false;

const ATTRACT_RADIUS = 140;
const ATTRACT_FORCE = 0.14;
const DRIFT = 0.35;
const BOUNDS_PADDING = 40;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createVertices(w: number, h: number) {
  vertices = [];
  shapes = [];

  const cols = Math.max(4, Math.floor(w / 140));
  const rows = Math.max(3, Math.floor(h / 120));
  const cellW = w / cols;
  const cellH = h / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * cellW + cellW / 2 + randomBetween(-18, 18);
      const cy = row * cellH + cellH / 2 + randomBetween(-14, 14);
      const sides = 3 + Math.floor(Math.random() * 4);
      const radius = randomBetween(22, 46);
      const vertexStart = vertices.length;

      for (let i = 0; i < sides; i += 1) {
        const angle = (Math.PI * 2 * i) / sides + randomBetween(-0.2, 0.2);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        vertices.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: randomBetween(-0.4, 0.4),
          vy: randomBetween(-0.4, 0.4),
          phase: randomBetween(0, Math.PI * 2),
          speed: randomBetween(0.6, 1.4),
        });
      }

      shapes.push({
        sides,
        vertexStart,
        hue: randomBetween(180, 260),
      });
    }
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

  createVertices(width, height);
}

function updateVertex(vertex: Vertex, time: number) {
  const waveX = Math.sin(time * vertex.speed + vertex.phase) * DRIFT * 8;
  const waveY = Math.cos(time * vertex.speed * 0.9 + vertex.phase) * DRIFT * 8;

  let targetX = vertex.baseX + waveX + vertex.vx * 6;
  let targetY = vertex.baseY + waveY + vertex.vy * 6;

  if (active) {
    const dx = mouseX - vertex.x;
    const dy = mouseY - vertex.y;
    const dist = Math.hypot(dx, dy);
    if (dist < ATTRACT_RADIUS && dist > 0.001) {
      const strength = (1 - dist / ATTRACT_RADIUS) ** 2;
      targetX += dx * strength * ATTRACT_FORCE * 3;
      targetY += dy * strength * ATTRACT_FORCE * 3;
    }
  }

  vertex.x += (targetX - vertex.x) * 0.08;
  vertex.y += (targetY - vertex.y) * 0.08;

  vertex.baseX += vertex.vx * DRIFT * 0.02;
  vertex.baseY += vertex.vy * DRIFT * 0.02;

  if (vertex.baseX < BOUNDS_PADDING) {
    vertex.baseX = BOUNDS_PADDING;
    vertex.vx *= -1;
  } else if (vertex.baseX > width - BOUNDS_PADDING) {
    vertex.baseX = width - BOUNDS_PADDING;
    vertex.vx *= -1;
  }

  if (vertex.baseY < BOUNDS_PADDING) {
    vertex.baseY = BOUNDS_PADDING;
    vertex.vy *= -1;
  } else if (vertex.baseY > height - BOUNDS_PADDING) {
    vertex.baseY = height - BOUNDS_PADDING;
    vertex.vy *= -1;
  }
}

function draw(time: number) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const t = time * 0.001;
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#0b1020');
  bg.addColorStop(1, '#121a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  vertices.forEach((vertex) => updateVertex(vertex, t));

  shapes.forEach((shape) => {
    const start = shape.vertexStart;
    const end = start + shape.sides;
    ctx.beginPath();
    const first = vertices[start];
    ctx.moveTo(first.x, first.y);
    for (let i = start + 1; i < end; i += 1) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = `hsla(${shape.hue}, 72%, 68%, 0.55)`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  if (active) {
    const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, ATTRACT_RADIUS);
    gradient.addColorStop(0, 'rgba(120, 180, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(120, 180, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, ATTRACT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  animationId = requestAnimationFrame(draw);
}

function onPointerMove(event: PointerEvent) {
  mouseX = event.clientX;
  mouseY = event.clientY;
  active = true;
}

function onPointerLeave() {
  active = false;
}

onMounted(() => {
  resize();
  animationId = requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerleave', onPointerLeave);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', resize);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerleave', onPointerLeave);
});
</script>

<style scoped>
.line-field-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
