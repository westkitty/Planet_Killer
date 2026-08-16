import { solveTsunami } from '../simulation/tsunami.js';

self.onmessage = (event) => {
  const requestId = event.data?.requestId;
  try {
    const field = solveTsunami(event.data);
    self.postMessage({ ok: true, requestId, field });
  } catch (error) {
    self.postMessage({ ok: false, requestId, error: error instanceof Error ? error.message : String(error) });
  }
};
