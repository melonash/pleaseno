/** Every numeric constant that shapes how the game feels. Tune here, not inline. */
export const TUNING = {
  /** Meter value at or above which the NPC gives in. Every scene starts at 0. */
  WIN_THRESHOLD: 50,
  /** Attempts per game. */
  MAX_ATTEMPTS: 3,
  /** Max player input length, enforced server-side. */
  MAX_INPUT_CHARS: 400,

  /** Meter points for a full-strength pull on a lever the NPC is fully susceptible to (pull 1.0 x susceptibility 1.0). */
  LEVER_SCALE: 60,
  /** Positive pulls are multiplied by (floor + (1 - floor) * plausibility01). Implausible claims earn less. */
  PLAUSIBILITY_FLOOR: 0.4,
  /** Floor on a single turn's delta, so one bad attempt does not end the game on its own. */
  MIN_DELTA: -30,

  /** Instant win: a lever pulled at least this hard (0..3 scale)... */
  INSTANT_WIN_PULL: 2.5,
  /** ...on a lever the NPC is at least this susceptible to... */
  INSTANT_WIN_SUSCEPTIBILITY: 0.8,
  /** ...and at least this plausible (0..3 scale), wins on the spot regardless of the meter. */
  INSTANT_WIN_PLAUSIBILITY: 1.5,

  /** Noul probability at or above which a guard counts as true. */
  NOUL_THRESHOLD: 0.6,
  /** Delta when a guard (meta instruction, contradiction) fires. */
  GUARD_PENALTY: -15,
  /** Noul probability at or above which the attempt counts as a stock line the NPC is sick of. */
  STOCK_THRESHOLD: 0.7,
  /** Subtracted when the attempt is a stock line delivered with nothing new. */
  STOCK_PENALTY: 15,

  /** delta <= this reads as hostile. */
  HOSTILE_DELTA: -10,
  /** delta >= this reads as softening. */
  SOFTENING_DELTA: 10,
} as const;
