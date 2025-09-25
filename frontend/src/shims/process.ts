// src/shims/process.ts
export const process = {
  nextTick: (cb: Function) => setTimeout(cb, 0),
  env: {}
};
