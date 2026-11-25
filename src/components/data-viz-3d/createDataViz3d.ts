import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { VizDataItem } from './sampleData';

export interface DataVizCallbacks {
  onHover?: (item: VizDataItem | null) => void;
  onSelect?: (item: VizDataItem | null) => void;
}

interface BarObject {
  mesh: THREE.Mesh;
  item: VizDataItem;
  targetHeight: number;
  currentHeight: number;
}

const BAR_WIDTH = 0.85;
const BAR_DEPTH = 0.85;
const BAR_GAP = 1.15;
const MAX_VALUE = 100;

const palette = [0x4a90e2, 0x67b7ff, 0x5ad8a6, 0x7c6cf0, 0xffb454, 0xff7b8a, 0x63d2ff, 0xc77dff];

function colorForIndex(index: number) {
  return palette[index % palette.length];
}

export function createDataViz3d(
  container: HTMLElement,
  callbacks: DataVizCallbacks = {},
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f7fb);
  scene.fog = new THREE.Fog(0xf4f7fb, 18, 42);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(8, 9, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 2.5, 0);
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 6;
  controls.maxDistance = 28;

  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(6, 12, 8);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);

  const fill = new THREE.DirectionalLight(0xb9d8ff, 0.45);
  fill.position.set(-8, 4, -6);
  scene.add(fill);

  const chartRoot = new THREE.Group();
  scene.add(chartRoot);

  const grid = new THREE.GridHelper(24, 24, 0xc7d2e3, 0xdce4f0);
  grid.position.y = 0;
  scene.add(grid);

  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 16),
    new THREE.MeshStandardMaterial({ color: 0xe8eef7, roughness: 1, metalness: 0 }),
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.01;
  base.receiveShadow = true;
  scene.add(base);

  const bars: BarObject[] = [];
  const barGroup = new THREE.Group();
  chartRoot.add(barGroup);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered: BarObject | null = null;
  let selected: BarObject | null = null;

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function clearBars() {
    bars.forEach((bar) => {
      barGroup.remove(bar.mesh);
      bar.mesh.geometry.dispose();
      (bar.mesh.material as THREE.Material).dispose();
    });
    bars.length = 0;
  }

  function buildBars(data: VizDataItem[]) {
    clearBars();
    const offsetX = ((data.length - 1) * BAR_GAP) / 2;

    data.forEach((item, index) => {
      const height = (item.value / MAX_VALUE) * 7.5 + 0.2;
      const geometry = new THREE.BoxGeometry(BAR_WIDTH, height, BAR_DEPTH);
      const material = new THREE.MeshStandardMaterial({
        color: colorForIndex(index),
        roughness: 0.35,
        metalness: 0.08,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(index * BAR_GAP - offsetX, height / 2, 0);
      mesh.userData.itemId = item.id;

      barGroup.add(mesh);
      bars.push({
        mesh,
        item,
        targetHeight: height,
        currentHeight: 0.01,
      });
    });
  }

  function setBarHeight(bar: BarObject, height: number) {
    const safeHeight = Math.max(0.05, height);
    bar.mesh.scale.y = safeHeight / bar.targetHeight;
    bar.mesh.position.y = safeHeight / 2;
  }

  function setData(data: VizDataItem[]) {
    buildBars(data);
    hovered = null;
    selected = null;
    callbacks.onHover?.(null);
    callbacks.onSelect?.(null);
  }

  function findBar(mesh: THREE.Object3D | null): BarObject | null {
    if (!mesh) return null;
    return bars.find((bar) => bar.mesh === mesh) ?? null;
  }

  function applyHighlight(bar: BarObject | null, active: boolean) {
    const mat = bar?.mesh.material as THREE.MeshStandardMaterial | undefined;
    if (!mat) return;
    mat.emissive.setHex(active ? 0x224466 : 0x000000);
    mat.emissiveIntensity = active ? 0.35 : 0;
  }

  function onPointerMove(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(bars.map((b) => b.mesh), false);
    const bar = findBar(hits[0]?.object ?? null);

    if (bar !== hovered) {
      applyHighlight(hovered, false);
      hovered = bar;
      applyHighlight(hovered, true);
      callbacks.onHover?.(hovered?.item ?? null);
    }
  }

  function onPointerDown() {
    selected = hovered;
    callbacks.onSelect?.(selected?.item ?? null);
  }

  function onPointerLeave() {
    applyHighlight(hovered, false);
    hovered = null;
    callbacks.onHover?.(null);
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  resize();

  let animationId = 0;
  const clock = new THREE.Clock();

  const animate = () => {
    const dt = clock.getDelta();
    controls.update();

    bars.forEach((bar) => {
      bar.currentHeight = THREE.MathUtils.lerp(bar.currentHeight, bar.targetHeight, 1 - Math.pow(0.001, dt));
      setBarHeight(bar, bar.currentHeight);
    });

    chartRoot.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.08;

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);

  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  const dispose = () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onResize);
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
    controls.dispose();
    clearBars();
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return { setData, dispose };
}