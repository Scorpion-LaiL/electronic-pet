import type { DesktopBridge } from './desktop';

declare global {
  interface Window {
    desktopPetApi?: DesktopBridge;
  }
}

export {};
