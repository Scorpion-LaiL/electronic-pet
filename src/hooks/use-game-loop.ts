import { useEffect } from 'react';
import { ONLINE_TICK_INTERVAL_MS } from '../domain/time/decay-rules';

export function useGameLoop(enabled: boolean, onTick: () => void) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      onTick();
    }, ONLINE_TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, onTick]);
}
