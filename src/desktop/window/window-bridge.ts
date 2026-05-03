import type { DesktopBridge } from '../../types/desktop';

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.desktopPetApi ?? null;
}

export function isDesktopShell(): boolean {
  return Boolean(getDesktopBridge()?.isDesktopMode());
}
