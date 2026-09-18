import type { Band, Scene } from "./scenes";
import type { GameState } from "./token";
import { TUNING } from "./tuning";
import { lineForId } from "./questions";

/** The subset of Jev's answers that resolution reads. Kept structural so tests can hand-build it. */
export type TurnAnswers = {
  persuasion: { score: number };
  plausibility: { score: number };
  offends: { noul: number };
  approach: { choice: string };
  is_meta_instruction: { noul: number };
  contradicts_situation: { noul: number };
  line_hostile: { choice: string };
  line_unmoved: { choice: string };
  line_softening: { choice: string };
  line_persuaded: { choice: string };
};

export type Resolution = {
  state: GameState;
  npcLine: string;
  mood: Band;
  delta: number;
  guarded: boolean;
  closingLine?: string;
};

export function newGame(scene: Scene): GameState {
  return {
    sceneId: scene.id,
    meter: scene.startMeter,
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
  const persuasion01 = clamp01(answers.persuasion.score / 4);
  const plausibility01 = clamp01(answers.plausibility.score / 3);
  const guarded =
    answers.is_meta_instruction.noul >= T.NOUL_THRESHOLD ||
    answers.contradicts_situation.noul >= T.NOUL_THRESHOLD;

  let delta: number;
  let band: Band;
  let npcLine: string;
  let meter = prev.meter;

  if (guarded) {
    delta = T.GUARD_PENALTY;
    meter += delta;
    band = "unmoved";
    npcLine = pickGuardLine(scene.guardLines);
  } else {
    delta = Math.round((persuasion01 - T.PERSUASION_PIVOT) * T.PERSUASION_SCALE);
    if (delta > 0) {
      delta = Math.round(delta * (T.PLAUSIBILITY_FLOOR + (1 - T.PLAUSIBILITY_FLOOR) * plausibility01));
    }
    if (answers.offends.noul >= T.NOUL_THRESHOLD) delta -= T.OFFENCE_PENALTY;
    if (answers.approach.choice === prev.lastApproach && delta > 0) {
      delta = Math.round(delta * T.REPEAT_APPROACH_FACTOR);
    }
    meter += delta;
    if (meter >= T.WIN_THRESHOLD) band = "persuaded";
    else if (delta <= T.HOSTILE_DELTA) band = "hostile";
    else if (delta >= T.SOFTENING_DELTA) band = "softening";
    else band = "unmoved";
    npcLine = lineForId(scene, band, answers[`line_${band}`].choice);
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
    lastApproach: answers.approach.choice,
    status,
  };

  return { state, npcLine, mood: band, delta, guarded, closingLine };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
