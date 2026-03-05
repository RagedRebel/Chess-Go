import { useRef, useCallback } from 'react';

const SOUNDS = {
  move:   '/sounds/move.mp3',
  check:  '/sounds/check.mp3',
  win:    '/sounds/win.mp3',
  lose:   '/sounds/lose.mp3',
};

/**
 * Returns a `play(name)` function.
 * Audio objects are lazily created and cached so there's no double-load.
 */
export function useSounds() {
  const cache = useRef({});

  const play = useCallback((name) => {
    const src = SOUNDS[name];
    if (!src) return;

    if (!cache.current[name]) {
      cache.current[name] = new Audio(src);
    }

    const audio = cache.current[name];
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay blocked (user hasn't interacted yet) — ignore silently
    });
  }, []);

  return play;
}
