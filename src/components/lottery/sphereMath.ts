export interface SpherePoint {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
}

/** 斐波那契球面分布，将 n 个点均匀铺在球面上 */
export function fibonacciSphere(index: number, total: number, radius: number): SpherePoint {
  const i = index + 0.5;
  const phi = Math.acos(1 - (2 * i) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  const rotateY = (Math.atan2(x, z) * 180) / Math.PI;
  const rotateX = (-Math.atan2(y, Math.hypot(x, z)) * 180) / Math.PI;

  return { x, y, z, rotateX, rotateY };
}

export function getTagTransform(point: SpherePoint): string {
  return `translate3d(${point.x}px, ${point.y}px, ${point.z}px) rotateY(${point.rotateY}deg) rotateX(${point.rotateX}deg)`;
}
