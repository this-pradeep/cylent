let ready = false;
const listeners = new Set<() => void>();

export function markLoaderReady(): void {
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

/** Calls back immediately if the loader has already finished, otherwise waits for it. */
export function onLoaderReady(callback: () => void): () => void {
  if (ready) {
    callback();
    return () => {};
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}
