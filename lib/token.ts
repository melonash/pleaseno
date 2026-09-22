import { createHmac, timingSafeEqual } from "node:crypto";

export type Speaker = "npc" | "player";
export type Status = "playing" | "won" | "lost";

export type GameState = {
  sceneId: string;
  meter: number;
  attempt: number;
  /** `free` marks a player message that cost nothing (small talk, an unsure guard). */
  transcript: { speaker: Speaker; text: string; free?: boolean }[];
  lastApproach: string | null;
  status: Status;
  /** "granted": the player is wavering-close and gets one last attempt. "used": that attempt has been played. */
  bonus?: "granted" | "used";
  /** Small-talk messages since the last move. Absent means 0. */
  freeStreak?: number;
  /** Small-talk messages this game. Absent means 0. */
  freeUsed?: number;
};

function secret(): string {
  const s = process.env.GAME_STATE_SECRET;
  if (!s || s.length < 16) {
    throw new Error("GAME_STATE_SECRET is missing or too short (need 16+ chars)");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeState(state: GameState): string {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the state, or null if the token is missing, malformed, or forged. */
export function decodeState(token: string | null | undefined): GameState | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" || parsed === null ||
      typeof parsed.sceneId !== "string" ||
      typeof parsed.meter !== "number" ||
      typeof parsed.attempt !== "number" ||
      !Array.isArray(parsed.transcript)
    ) {
      return null;
    }
    return parsed as GameState;
  } catch {
    return null;
  }
}
