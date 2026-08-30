import { storage } from './storage';

export function applyColorblindMode(on: boolean) {
  if (on) document.documentElement.dataset.colorblind = 'on';
  else delete document.documentElement.dataset.colorblind;
}

export function initColorblindMode() {
  if (storage.getColorblind()) applyColorblindMode(true);
}
