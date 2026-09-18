import { beforeAll, describe, expect, it } from "vitest";
import { decodeState, encodeState, type GameState } from "../token";

beforeAll(() => {
  process.env.GAME_STATE_SECRET = "test-secret-that-is-long-enough";
});

const state: GameState = {
  sceneId: "gate",
  meter: -12,
  attempt: 1,
  transcript: [{ speaker: "npc", text: "hi" }],
  lastApproach: "plead",
  status: "playing",
};

describe("state token", () => {
  it("round-trips", () => {
    expect(decodeState(encodeState(state))).toEqual(state);
  });
  it("rejects a tampered payload", () => {
    const t = encodeState(state);
    const [payload, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...state, meter: 999 })).toString("base64url");
    expect(decodeState(`${forged}.${sig}`)).toBeNull();
    expect(decodeState(`${payload}.AAAA`)).toBeNull();
    expect(decodeState("garbage")).toBeNull();
    expect(decodeState(null)).toBeNull();
  });
});
