import * as THREE from 'three';

const CARD_WIDTH = 3.2;
const CARD_HEIGHT = 2.2;
const CARD_GAP = 0.55;
const RIBBON_COUNT = 36;
const SCROLL_SPEED = 1.15;

interface RibbonUnit {
  mesh: THREE.Mesh;
  baseY: number;
  driftX: number;
  driftY: number;
  spin: number;
  delay: number;
  wobble: number;
}

interface LoomCard {
  root: THREE.Group;
  ribbons: RibbonUnit[];
  texture: THREE.Texture;
  unravel: number;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createCardTexture(index: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const hue = (index * 47 + 180) % 360;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `hsl(${hue}, 42%, 78%)`);
  gradient.addColorStop(0.45, `hsl(${(hue + 40) % 360}, 55%, 62%)`);
  gradient.addColorStop(1, `hsl(${(hue + 90) % 360}, 38%, 88%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let y = 0; y < canvas.height; y += 14) {
    ctx.fillRect(0, y, canvas.width, 3);
  }

  ctx.strokeStyle = 'rgba(20, 20, 20, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  ctx.fillStyle = 'rgba(15, 15, 15, 0.65)';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(`LOOM ${index + 1}`, 36, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createCard(index: number): LoomCard {
  const root = new THREE.Group();
  const texture = createCardTexture(index);
  const ribbons: RibbonUnit[] = [];
  const stripHeight = CARD_HEIGHT / RIBBON_COUNT;

  for (let i = 0; i < RIBBON_COUNT; i += 1) {
    const geometry = new THREE.PlaneGeometry(CARD_WIDTH, stripHeight * 1.02, 1, 1);
    const map = texture.clone();
    const material = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    map.repeat.set(1, 1 / RIBBON_COUNT);
    map.offset.set(0, 1 - (i + 1) / RIBBON_COUNT);

    const mesh = new THREE.Mesh(geometry, material);
    const y = -CARD_HEIGHT / 2 + (i + 0.5) * stripHeight;
    mesh.position.y = y;
    root.add(mesh);

    ribbons.push({
      mesh,
      baseY: y,
      driftX: randomBetween(-1.4, 1.4),
      driftY: randomBetween(-0.35, 0.55),
      spin: randomBetween(-0.6, 0.6),
      delay: randomBetween(0, 0.55),
      wobble: randomBetween(0.8, 2.4),
    });
  }

  return { root, ribbons, texture, unravel: 0 };
}

function resetCard(card: LoomCard, x: number) {
  card.root.position.set(x, 0, 0);
  card.unravel = 0;
  card.ribbons.forEach((ribbon) => {
    ribbon.mesh.position.x = 0;
    ribbon.mesh.position.y = ribbon.baseY;
    ribbon.mesh.rotation.z = 0;
    const mat = ribbon.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 1;
  });
}

function updateCardUnravel(card: LoomCard, edgeStrength: number, time: number) {
  card.unravel = THREE.MathUtils.lerp(card.unravel, edgeStrength, 0.12);

  card.ribbons.forEach((ribbon) => {
    const progress = THREE.MathUtils.smoothstep(card.unravel, ribbon.delay, 1);
    const mat = ribbon.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 1 - progress;

    ribbon.mesh.position.x = ribbon.driftX * progress * 2.2;
    ribbon.mesh.position.y =
      ribbon.baseY + ribbon.driftY * progress * 1.8 + Math.sin(time * ribbon.wobble) * progress * 0.08;
    ribbon.mesh.rotation.z = ribbon.spin * progress;
  });
}

export function createInfiniteLoom(container: HTMLElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 1);
  container.appendChild(renderer.domElement);

  const cards: LoomCard[] = [];
  const cardCount = 7;

  let viewWidth = 1;
  let viewHeight = 1;

  function layoutCards() {
    const span = cardCount * (CARD_WIDTH + CARD_GAP);
    for (let i = 0; i < cardCount; i += 1) {
      if (!cards[i]) {
        cards[i] = createCard(i);
        scene.add(cards[i].root);
      }
      resetCard(cards[i], -span / 2 + i * (CARD_WIDTH + CARD_GAP));
    }
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    viewWidth = width / height * 6.8;
    viewHeight = 6.8;
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  layoutCards();
  resize();

  let animationId = 0;
  const clock = new THREE.Clock();

  const animate = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const halfView = viewWidth / 2;
    const edgeStart = halfView * 0.5;
    const edgeEnd = halfView * 0.9;

    cards.forEach((card) => {
      card.root.position.x -= SCROLL_SPEED * dt;

      const unravelAmount = THREE.MathUtils.smoothstep(edgeStart, edgeEnd, Math.abs(card.root.position.x));
      updateCardUnravel(card, unravelAmount, time);

      if (card.root.position.x < -halfView - CARD_WIDTH * 0.75) {
        const maxX = Math.max(...cards.map((item) => item.root.position.x));
        resetCard(card, maxX + CARD_WIDTH + CARD_GAP);
      }
    });

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  };

  animationId = requestAnimationFrame(animate);
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  const dispose = () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onResize);
    cards.forEach((card) => {
      card.ribbons.forEach((ribbon) => {
        ribbon.mesh.geometry.dispose();
        const mat = ribbon.mesh.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.dispose();
      });
      card.texture.dispose();
      scene.remove(card.root);
    });
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return { dispose };
}