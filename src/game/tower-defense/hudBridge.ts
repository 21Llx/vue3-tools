import type { HudUpdateCallback } from './types';

let pendingHudCallback: HudUpdateCallback | null = null;

export function setPendingHudCallback(callback: HudUpdateCallback | null) {
  pendingHudCallback = callback;
}

export function getPendingHudCallback() {
  return pendingHudCallback;
}
