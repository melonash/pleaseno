import { ROTATION } from "./scenes";

/** Index into ROTATION for a given date, by whole UTC days since the epoch. */
export function dailyIndex(date: Date = new Date()): number {
  const days = Math.floor(date.getTime() / 86_400_000);
  return ((days % ROTATION.length) + ROTATION.length) % ROTATION.length;
}

export function sceneIdForIndex(index: number): string {
  return ROTATION[((index % ROTATION.length) + ROTATION.length) % ROTATION.length];
}
