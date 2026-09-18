/** Every numeric constant that shapes how the game feels. Tune here, not inline. */
export const TUNING = {
  /** Meter value at or above which the NPC gives in. */
  WIN_THRESHOLD: 50,
  /** Attempts per game. */
  MAX_ATTEMPTS: 3,
  /** Max player input length, enforced server-side. */
  MAX_INPUT_CHARS: 400,

  /** persuasion01 below this loses ground, above it gains. */
  PERSUASION_PIVOT: 0.35,
  /** Multiplier applied to (persuasion01 - pivot). Range with pivot 0.35: -35 .. +65. */
  PERSUASION_SCALE: 100,
  /** Floor on a single turn's delta, so one bad attempt does not end the game on its own. */
  MIN_DELTA: -25,
  /** Positive deltas are multiplied by (floor + (1 - floor) * plausibility01). */
  PLAUSIBILITY_FLOOR: 0.5,

  /** Noul probability at or above which a guard counts as true. */
  NOUL_THRESHOLD: 0.6,
  /** Noul probability at or above which the attempt counts as offensive. Higher than the guards: Jev flags stock excuses as mildly manipulative. */
  OFFENCE_THRESHOLD: 0.75,
  /** Subtracted from delta when the attempt offends. */
  OFFENCE_PENALTY: 12,
  /** Delta when a guard (meta instruction, contradiction) fires. */
  GUARD_PENALTY: -15,
  /** Positive delta multiplier when the same approach is used twice in a row. */
  REPEAT_APPROACH_FACTOR: 0.6,

  /** delta <= this reads as hostile. */
  HOSTILE_DELTA: -8,
  /** delta >= this reads as softening. */
  SOFTENING_DELTA: 8,
} as const;
