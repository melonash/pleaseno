/** The emotional levers an attempt can pull. Jev scores the pull; each NPC has a hidden susceptibility per lever. */
export const LEVERS = {
  compassion: {
    label: "compassion",
    instructions:
      "How strongly does `current_attempt.text` appeal to compassion: hardship, grief, illness, fear, vulnerability, a person in real need? Judge the appeal itself and how it is delivered, not whether this particular NPC would be moved by it.",
    levels: [
      "No appeal to compassion at all.",
      "A passing mention of a difficulty, stated flatly, easy to ignore.",
      "A clear, specific hardship or emotional stake, delivered with some feeling.",
      "An overwhelming appeal: a serious, specific, human situation (death, last chances, a child, real fear) delivered with raw emotion that would be hard for anyone to shrug off.",
    ],
  },
  respect: {
    label: "respect",
    instructions:
      "How strongly does `current_attempt.text` treat the NPC as a person: acknowledging their position, their day, that the situation is not their fault, that they do not have to help, thanking them, asking rather than demanding?",
    levels: [
      "No acknowledgement of the NPC as a person; they are treated as an obstacle or a function.",
      "Basic politeness only, a 'please' or 'sorry' with nothing behind it.",
      "Clear acknowledgement of the NPC's position or effort, or an explicit 'I know you don't have to'.",
      "Unusually genuine recognition of the NPC as a person, specific to their situation, with no pressure attached.",
    ],
  },
  self_interest: {
    label: "self-interest",
    instructions:
      "How strongly does `current_attempt.text` make saying yes easy or attractive for the NPC: a tiny concrete ask, removing hassle, saving them time or paperwork, lowering their risk, or offering something they want (not money)?",
    levels: [
      "Nothing in it for the NPC; saying yes would cost them effort or risk with no upside.",
      "A vague promise to be no trouble.",
      "A specific, concrete way the ask is small, quick or low-risk for the NPC.",
      "Saying yes is plainly the easiest or most rewarding option for the NPC, spelled out and credible.",
    ],
  },
  fairness: {
    label: "fairness",
    instructions:
      "How strongly does `current_attempt.text` offer a fair trade: a compromise, a concrete alternative, reciprocity, taking on a cost yourself, or making things even? Offering to buy the NPC something, or money, is a bribe, not fairness.",
    levels: [
      "No trade or compromise offered.",
      "A vague 'I'll make it up to you' with nothing specific.",
      "A concrete alternative or trade with a real cost to the player.",
      "A generous, specific, immediately actionable offer that clearly costs the player more than it costs the NPC.",
    ],
  },
  amusement: {
    label: "amusement",
    instructions:
      "How strongly does `current_attempt.text` charm or disarm: humour, self-deprecation, wit, refreshing honesty, or an unexpected angle that would make the NPC smile despite themselves?",
    levels: [
      "Flat, generic, or humourless.",
      "A small light touch that might get a half-smile.",
      "Genuinely funny, charming, or disarmingly honest in a way that changes the mood.",
      "Irresistibly charming or funny; the kind of line people retell later.",
    ],
  },
  pressure: {
    label: "pressure",
    instructions:
      "How strongly does `current_attempt.text` apply pressure: threats, consequences, escalation, complaints, filming, lawyers, name-dropping status or connections, demands, or raising the stakes for the NPC?",
    levels: [
      "No pressure; nothing is demanded or threatened.",
      "Mild insistence or a hint of consequences.",
      "An explicit demand, threat, complaint, or invocation of status or connections.",
      "Aggressive, sustained pressure: multiple threats, intimidation, or an attempt to frighten the NPC into compliance.",
    ],
  },
  bribe: {
    label: "bribe",
    instructions:
      "How strongly does `current_attempt.text` offer money, gifts, tips, or favours of value in exchange for the outcome? A trade of effort or time (a different date, cooking dinner) is not a bribe; that is fairness.",
    levels: [
      "No offer of money, gifts, or favours of value.",
      "A vague hint that the player could make it worth their while.",
      "An explicit offer of money, a gift, or a valuable favour in exchange for the outcome.",
      "A large, specific, or insistent bribe, pressed as the main argument.",
    ],
  },
  guilt: {
    label: "guilt",
    instructions:
      "How strongly does `current_attempt.text` try to make the NPC feel responsible or bad: blaming them, 'you always', 'if you cared', accusing them of not caring, or making their choice the cause of the player's suffering?",
    levels: [
      "No blame directed at the NPC.",
      "A light implication that the NPC could be more helpful.",
      "Clear blame or an accusation that the NPC is being unfair or uncaring.",
      "Heavy, manipulative guilt-tripping that makes the NPC the villain.",
    ],
  },
} as const;

export type Lever = keyof typeof LEVERS;
export const LEVER_IDS = Object.keys(LEVERS) as Lever[];
/** Hidden per-NPC susceptibility to each lever, from -1 (backfires hard) to +1 (fully open). */
export type Susceptibility = Record<Lever, number>;
