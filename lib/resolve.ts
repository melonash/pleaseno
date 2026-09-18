import { LEVER_IDS, type Lever } from "./levers";
import type { Band, Scene } from "./scenes";
import type { GameState } from "./token";
import { TUNING } from "./tuning";
import { pickLine } from "./questions";

/** The subset of Jev's answers that resolution reads. Kept structural so tests can hand-build it. */
export type TurnAnswers = Record<Lever, { score: number }> & {
  plausibility: { score: number };
  is_stock_line: { noul: number };
  is_meta_instruction: { noul: number };
  contradicts_situation: { noul: number };
  line_hostile: LineAnswer;
  line_unmoved: LineAnswer;
  line_softening: LineAnswer;
  line_persuaded: LineAnswer;
};
type LineAnswer = { choice: string; probabilities?: Record<string, number> };

export type Resolution = {
  state: GameState;
  npcLine: string;
  mood: Band;
  delta: number;
  guarded: boolean;
  instantWin: Lever | null;
  /** The lever the attempt most clearly pulled (largest absolute contribution, pull at least 1), or null. Drives the reply. */
  lever: Lever | null;
  /** Each lever's contribution to the delta before plausibility and clamping. */
  contributions: Record<Lever, number>;
  closingLine?: string;
};

export function newGame(scene: Scene): GameState {
  return {
    sceneId: scene.id,
    meter: 0,
    attempt: 0,
    transcript: [{ speaker: "npc", text: scene.openingLine }],
    lastApproach: null,
    status: "playing",
  };
}

/** Pure. Given the previous state, the player's text and Jev's answers, produce the next state and the NPC's reply. */
export function resolveTurn(
  scene: Scene,
  prev: GameState,
  text: string,
  answers: TurnAnswers,
  pickGuardLine: (lines: string[]) => string = (l) => l[Math.floor(Math.random() * l.length)],
): Resolution {
  const T = TUNING;
  const plausibility = clamp(answers.plausibility.score, 0, 3);
  const plausibility01 = plausibility / 3;
  const guarded =
    answers.is_meta_instruction.noul >= T.NOUL_THRESHOLD ||
    answers.contradicts_situation.noul >= T.NOUL_THRESHOLD;

  const contributions = {} as Record<Lever, number>;
  let delta: number;
  let band: Band;
  let npcLine: string;
  let instantWin: Lever | null = null;
  let dominant: Lever | null = null;
  let meter = prev.meter;
  const pulls = {} as Record<Lever, number>;

  if (guarded) {
    for (const id of LEVER_IDS) contributions[id] = 0;
    delta = T.GUARD_PENALTY;
    meter += delta;
    band = "unmoved";
    npcLine = pickGuardLine(scene.guardLines);
  } else {
    let positive = 0;
    let negative = 0;
    for (const id of LEVER_IDS) {
      const pull = clamp(answers[id].score, 0, 3);
      pulls[id] = pull;
      const susceptibility = scene.npc.levers[id];
      const c = (pull / 3) * susceptibility * T.LEVER_SCALE;
      contributions[id] = Math.round(c);
      if (c > 0) positive += c;
      else negative += c;
      if (
        pull >= T.INSTANT_WIN_PULL &&
        susceptibility >= T.INSTANT_WIN_SUSCEPTIBILITY &&
        plausibility >= T.INSTANT_WIN_PLAUSIBILITY
      ) {
        instantWin = id;
      }
    }
    const plausFactor = T.PLAUSIBILITY_FLOOR + (1 - T.PLAUSIBILITY_FLOOR) * plausibility01;
    delta = Math.round(positive * plausFactor + negative);
    if (answers.is_stock_line.noul >= T.STOCK_THRESHOLD) delta -= T.STOCK_PENALTY;
    delta = Math.max(T.MIN_DELTA, delta);
    meter += delta;

    if (instantWin || meter >= T.WIN_THRESHOLD) band = "persuaded";
    else if (delta <= T.HOSTILE_DELTA) band = "hostile";
    else if (delta >= T.SOFTENING_DELTA) band = "softening";
    else band = "unmoved";
    dominant = replyLever(pulls, contributions, band);
    npcLine = pickLine(scene, band, answers[`line_${band}`], dominant);
  }

  const attempt = prev.attempt + 1;
  let status: GameState["status"] = "playing";
  let closingLine: string | undefined;
  if (band === "persuaded") {
    status = "won";
    closingLine = scene.winClosing;
  } else if (attempt >= T.MAX_ATTEMPTS) {
    status = "lost";
    closingLine = scene.loseClosing;
  }

  const state: GameState = {
    sceneId: scene.id,
    meter,
    attempt,
    transcript: [...prev.transcript, { speaker: "player", text }, { speaker: "npc", text: npcLine }],
    lastApproach: dominant,
    status,
  };

  return { state, npcLine, mood: band, delta, guarded, instantWin, lever: dominant, contributions, closingLine };
}

/**
 * The lever the reply should answer. Normally the strongest pull. When the mood is hostile or warm and a lever
 * that pushed in that direction was pulled nearly as hard, that lever wins: a threat with a whimper of compassion
 * gets the threat reply, but a sob story that merely insisted gets the sob-story reply.
 */
function replyLever(pulls: Record<Lever, number>, contributions: Record<Lever, number>, band: Band): Lever | null {
  const strongest = (ids: Lever[]): Lever | null =>
    ids.reduce<Lever | null>((best, id) => (best === null || pulls[id] > pulls[best] ? id : best), null);
  const top = strongest(LEVER_IDS);
  if (!top || pulls[top] < TUNING.LEVER_REPLY_MIN_PULL) return null;
  const wantSign = band === "hostile" ? -1 : band === "unmoved" ? 0 : 1;
  if (wantSign === 0) return top;
  const explains = strongest(LEVER_IDS.filter((id) => Math.sign(contributions[id]) === wantSign));
  if (explains && pulls[explains] >= pulls[top] - TUNING.LEVER_REPLY_MARGIN) return explains;
  return top;
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
