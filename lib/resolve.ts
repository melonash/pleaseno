import { LEVER_IDS, PLAUSIBILITY_EXEMPT, type Lever } from "./levers";
import type { Band, Scene } from "./scenes";
import type { GameState } from "./token";
import { TUNING } from "./tuning";
import { pickFreeLine, pickLine, type FreeKind } from "./questions";

/** The subset of Jev's answers that resolution reads. Kept structural so tests can hand-build it. */
export type TurnAnswers = Record<Lever, { score: number }> & {
  plausibility: { score: number };
  is_stock_line: { noul: number };
  is_unintelligible?: { noul: number };
  is_meta_instruction: { noul: number };
  contradicts_situation: { noul: number };
  line_hostile: LineAnswer;
  line_unmoved: LineAnswer;
  line_softening: LineAnswer;
  line_persuaded: LineAnswer;
  /** Optional so batteries captured before these questions existed still replay. Absent means no. */
  is_small_talk?: { noul: number };
  line_holding?: LineAnswer;
  line_free?: LineAnswer;
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
  /** Each lever's contribution to the delta, after the dead zone and plausibility, before the stock penalty and clamping. */
  contributions: Record<Lever, number>;
  /** What Jev read in the attempt, per lever, 0..3. Shown to the player so they can see how they were understood. */
  pulls: Record<Lever, number>;
  closingLine?: string;
  /** True when this turn granted the one bonus attempt. */
  bonusGranted: boolean;
  /** Set when the message was small talk: no attempt used, meter unchanged. Names the bank the reply came from. */
  free: FreeKind | null;
  /** True when the attempt mostly repeated an earlier one, so it earned nothing. */
  repeat: boolean;
};

/** Which small-talk bank the next free reply comes from. The free message that uses up the allowance gets the impatient one. */
export function freeKindFor(prev: GameState): FreeKind {
  const streak = prev.freeStreak ?? 0;
  const used = prev.freeUsed ?? 0;
  if (streak + 1 >= TUNING.FREE_STREAK_MAX || used + 1 >= TUNING.FREE_TOTAL_MAX) return "impatient";
  return prev.meter >= TUNING.WARM_METER ? "warm" : "cool";
}

function freeAllowed(prev: GameState): boolean {
  return (prev.freeStreak ?? 0) < TUNING.FREE_STREAK_MAX && (prev.freeUsed ?? 0) < TUNING.FREE_TOTAL_MAX;
}

/** Attempts the player can still make, including a granted bonus. */
export function attemptsLeft(state: GameState): number {
  if (state.status !== "playing") return 0;
  if (state.bonus === "granted") return 1;
  return Math.max(0, TUNING.MAX_ATTEMPTS - state.attempt);
}

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

  const pulls = {} as Record<Lever, number>;
  // A lever missing from the answers (a battery captured before it existed) counts as not pulled.
  for (const id of LEVER_IDS) pulls[id] = clamp(answers[id]?.score ?? 0, 0, 3);

  const contributions = {} as Record<Lever, number>;
  let delta: number;
  let band: Band;
  let npcLine: string;
  let lineClosing: string | undefined;
  let instantWin: Lever | null = null;
  let dominant: Lever | null = null;
  let meter = prev.meter;
  // Saying the same thing again earns nothing new. Its backfires still count.
  const repeat = !guarded && repeatsEarlier(text, prev.transcript);

  if (guarded) {
    for (const id of LEVER_IDS) {
      contributions[id] = 0;
      pulls[id] = 0;
    }
    delta = T.GUARD_PENALTY;
    meter += delta;
    band = "unmoved";
    npcLine = pickGuardLine(scene.guardLines);
  } else {
    const plausFactor = T.PLAUSIBILITY_FLOOR + (1 - T.PLAUSIBILITY_FLOOR) * plausibility01;
    let positive = 0;
    let negative = 0;
    for (const id of LEVER_IDS) {
      const pull = pulls[id];
      const susceptibility = scene.npc.levers[id];
      const effective = Math.max(0, pull - T.PULL_DEADZONE) / (3 - T.PULL_DEADZONE);
      let c = effective * susceptibility * T.LEVER_SCALE;
      // Believability discounts gains from claims. Jokes and respect make no claim.
      if (c > 0 && !PLAUSIBILITY_EXEMPT.has(id)) c *= plausFactor;
      if (c > 0 && repeat) c = 0;
      contributions[id] = Math.round(c);
      if (c > 0) positive += c;
      else negative += c;
      if (
        !repeat &&
        pull >= T.INSTANT_WIN_PULL &&
        susceptibility >= T.INSTANT_WIN_SUSCEPTIBILITY &&
        plausibility >= T.INSTANT_WIN_PLAUSIBILITY
      ) {
        instantWin = id;
      }
    }
    delta = Math.round(positive + negative);
    if (answers.is_stock_line.noul >= T.STOCK_THRESHOLD) delta -= T.STOCK_PENALTY;
    delta = Math.max(T.MIN_DELTA, delta);

    // Small talk costs nothing, but only if it would have been a flat move anyway: neither landing nor backfiring.
    // A thank-you that happens to brush a lever should not burn an attempt, or tip a win.
    const smallTalk =
      freeAllowed(prev) &&
      !repeat &&
      (answers.is_small_talk?.noul ?? 0) >= T.SMALL_TALK_THRESHOLD &&
      answers.is_stock_line.noul < T.STOCK_THRESHOLD &&
      delta > T.HOSTILE_DELTA &&
      delta < T.SOFTENING_DELTA;
    if (smallTalk) return resolveFree(scene, prev, text, answers, pulls);

    meter += delta;
    // An overwhelming pull does not win if the attempt also backfired hard enough to cancel it out.
    if (instantWin && delta <= 0) instantWin = null;

    if (instantWin || meter >= T.WIN_THRESHOLD) band = "persuaded";
    else if (delta <= T.HOSTILE_DELTA) band = "hostile";
    else if (delta >= T.SOFTENING_DELTA) band = "softening";
    // Warm from earlier moves: a flat move does not make them cold again.
    else if (meter >= T.WARM_METER) band = "holding";
    else band = "unmoved";
    dominant = replyLever(pulls, contributions, band);
    const line = pickLine(scene, band, answers[`line_${band}`] ?? { choice: "" }, dominant);
    npcLine = line.text;
    lineClosing = line.closing;
  }

  const attempt = prev.attempt + 1;
  const wasBonus = prev.bonus === "granted";
  let status: GameState["status"] = "playing";
  let closingLine: string | undefined;
  let bonus: GameState["bonus"] = wasBonus ? "used" : prev.bonus;
  let bonusGranted = false;
  if (band === "persuaded") {
    status = "won";
    closingLine = lineClosing ?? scene.winClosing;
  } else if (attempt >= T.MAX_ATTEMPTS) {
    const wavering = band === "softening" && meter >= T.WIN_THRESHOLD * T.BONUS_MIN_FRACTION;
    if (!prev.bonus && wavering) {
      // They found something that works, just not enough of it. One last thing.
      bonus = "granted";
      bonusGranted = true;
    } else {
      status = "lost";
      closingLine = wasBonus && band === "hostile" ? scene.blownClosing : scene.loseClosing;
    }
  }

  const state: GameState = {
    sceneId: scene.id,
    meter,
    attempt,
    transcript: [...prev.transcript, { speaker: "player", text }, { speaker: "npc", text: npcLine }],
    lastApproach: dominant,
    status,
    ...(bonus ? { bonus } : {}),
    // A move ends any run of small talk.
    ...(prev.freeUsed ? { freeUsed: prev.freeUsed, freeStreak: 0 } : {}),
  };

  return { state, npcLine, mood: band, delta, guarded, instantWin, lever: dominant, contributions, pulls, closingLine, bonusGranted, free: null, repeat };
}

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []);
}

/** True when the text mostly repeats one of the player's earlier messages. Short messages never count. */
export function repeatsEarlier(text: string, transcript: GameState["transcript"]): boolean {
  const a = words(text);
  if (a.size < TUNING.REPEAT_MIN_WORDS) return false;
  return transcript.some((t) => {
    if (t.speaker !== "player") return false;
    const b = words(t.text);
    let shared = 0;
    for (const w of a) if (b.has(w)) shared++;
    return shared / (a.size + b.size - shared) >= TUNING.REPEAT_OVERLAP;
  });
}

function resolveFree(scene: Scene, prev: GameState, text: string, answers: TurnAnswers, pulls: Record<Lever, number>): Resolution {
  const kind = freeKindFor(prev);
  const npcLine = pickFreeLine(scene, kind, answers.line_free).text;
  const contributions = Object.fromEntries(LEVER_IDS.map((id) => [id, 0])) as Record<Lever, number>;
  const state: GameState = {
    ...prev,
    transcript: [...prev.transcript, { speaker: "player", text }, { speaker: "npc", text: npcLine }],
    freeStreak: (prev.freeStreak ?? 0) + 1,
    freeUsed: (prev.freeUsed ?? 0) + 1,
  };
  // The mood shown is how they feel overall; small talk does not change it.
  const mood: Band = prev.meter >= TUNING.WARM_METER ? "holding" : "unmoved";
  return { state, npcLine, mood, delta: 0, guarded: false, instantWin: null, lever: null, contributions, pulls, bonusGranted: false, free: kind, repeat: false };
}

/**
 * The lever the reply should answer.
 * Warm moods (softening, persuaded): the lever that moved them most, by contribution (pull x susceptibility).
 * Hostile: the backfiring lever pulled hardest, unless a positive lever was pulled clearly harder (a stock sob story
 * that landed hostile through the stock penalty should still get the sob-story reply).
 * Unmoved: the strongest pull.
 */
function replyLever(pulls: Record<Lever, number>, contributions: Record<Lever, number>, band: Band): Lever | null {
  const eligible = LEVER_IDS.filter((id) => pulls[id] >= TUNING.LEVER_REPLY_MIN_PULL);
  if (eligible.length === 0) return null;
  const byPull = (ids: Lever[]) => ids.reduce<Lever | null>((b, id) => (b === null || pulls[id] > pulls[b] ? id : b), null);
  const byEffect = (ids: Lever[]) =>
    ids.reduce<Lever | null>((b, id) => (b === null || Math.abs(contributions[id]) > Math.abs(contributions[b]) ? id : b), null);
  if (band === "softening" || band === "persuaded") {
    return byEffect(eligible.filter((id) => contributions[id] > 0)) ?? byPull(eligible);
  }
  const top = byPull(eligible)!;
  if (band === "hostile") {
    const worst = byEffect(eligible.filter((id) => contributions[id] < 0));
    if (worst && pulls[worst] >= pulls[top] - TUNING.LEVER_REPLY_MARGIN) return worst;
  }
  return top;
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
