/** Every numeric constant that shapes how the game feels. Tune here, not inline. */
export const TUNING = {
  /** Meter value at or above which the NPC gives in. */
  WIN_THRESHOLD: 50,
  /** Attempts per game. */
  MAX_ATTEMPTS: 3,
  /** Max player input length, enforced server-side. */
  MAX_INPUT_CHARS: 400,

  /** persuasion01 below this loses ground, above it gains. */
  PERSUASION_PIVOT: 0.4,
  /** Multiplier applied to (persuasion01 - pivot). Range with pivot 0.4: -36 .. +54. */
  PERSUASION_SCALE: 90,
  /** Positive deltas are multiplied by (floor + (1 - floor) * plausibility01). */
  PLAUSIBILITY_FLOOR: 0.5,

  /** Noul probability at or above which a flag counts as true. */
  NOUL_THRESHOLD: 0.6,
  /** Subtracted from delta when the attempt offends. */
  OFFENCE_PENALTY: 20,
  /** Delta when a guard (meta instruction, contradiction) fires. */
  GUARD_PENALTY: -15,
  /** Positive delta multiplier when the same approach is used twice in a row. */
  REPEAT_APPROACH_FACTOR: 0.6,

  /** delta <= this reads as hostile. */
  HOSTILE_DELTA: -8,
  /** delta >= this reads as softening. */
  SOFTENING_DELTA: 8,
} as const;
