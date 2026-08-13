import { solveTsunami } from '../simulation/tsunami.js';

self.onmessage = (event) => {
  try {
    const field = solveTsunami(event.data);
    self.postMessage({ ok: true, field });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
