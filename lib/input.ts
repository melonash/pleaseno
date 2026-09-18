/** What kind of thing the player typed, decided in code before any model call. */
export type InputKind = "silence" | "attempt";

/**
 * Silence: nothing that could be a word. Punctuation only ("...", "?", "-"), a single letter or two ("x", "ok" is
 * NOT silence), emoji-only. Deliberate speechlessness and a slipped keystroke look the same and get the same reply.
 */
export function classifyInput(raw: string): InputKind {
  const text = raw.trim();
  const letters = (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
  if (letters === 0) return "silence";
  if (letters <= 1) return "silence";
  return "attempt";
}
