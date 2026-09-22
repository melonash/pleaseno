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
      "How strongly does `current_attempt.text` treat the NPC as a person: acknowledging their position, their day, that the situation is not their fault, that they do not have to help, thanking them, asking rather than demanding? Generic praise or flattery ('you're amazing', 'you're a kind soul') is not recognition; people see through it.",
    levels: [
      "No acknowledgement of the NPC as a person; they are treated as an obstacle or a function.",
      "Basic politeness or generic praise only: a 'please', a 'sorry', a 'thank you', or a compliment that could be said to anyone, with nothing specific behind it.",
      "Clear acknowledgement of the NPC's position or effort, or an explicit 'I know you don't have to'.",
      "Unusually genuine recognition of the NPC as a person, specific to their situation, with no pressure attached.",
    ],
  },
  honesty: {
    label: "honesty",
    instructions:
      "How strongly does `current_attempt.text` own the situation honestly: admitting the mistake or fault, giving the real reason rather than an excuse, not arguing with what happened, or saying plainly what the player actually feels? Judge the candour, not whether the confession is flattering.",
    levels: [
      "No candour: excuses, arguing, deflecting blame, or nothing about what happened.",
      "A grudging or half admission, still wrapped in an excuse.",
      "A clear, plain admission or the real reason, with no excuse attached.",
      "Disarmingly candid: fully owns it, specific and unguarded, the kind of honesty people rarely hear in this situation.",
    ],
  },
  self_interest: {
    label: "self-interest",
    instructions:
      "How strongly does `current_attempt.text` make saying yes easy or attractive for the NPC: a tiny concrete ask, removing hassle, saving them time or paperwork, or lowering their risk where they stand? Anything handed to the NPC personally (money, a gift, a favour) is a bribe, not self-interest.",
    levels: [
      "Nothing in it for the NPC; saying yes would cost them effort or risk with no upside.",
      "A vague promise to be no trouble.",
      "A specific, concrete way the ask is small, quick or low-risk for the NPC.",
      "Saying yes is plainly the easiest or most rewarding option for the NPC, spelled out and credible.",
    ],
  },
  // Id kept as `fairness` so saved batteries and lever tables line up. Shown to the player as "compromise".
  fairness: {
    label: "compromise",
    instructions:
      "How strongly does `current_attempt.text` meet the NPC halfway: the player gives something up, accepts part of the consequence, asks for less than everything, or offers a concrete alternative, so that saying yes would feel balanced rather than a free ride? Money, gifts or favours for the NPC are a bribe, not a compromise. Making the NPC's own job easier is self-interest, not a compromise.",
    levels: [
      "No compromise; the player asks for everything and gives nothing up.",
      "A vague 'I'll make it up to you' or 'I'll owe you' with nothing specific.",
      "A concrete compromise or alternative with a real cost to the player: settling for less, taking part of the consequence, a specific trade.",
      "A generous, specific, immediately actionable compromise that clearly costs the player more than it costs the NPC.",
    ],
  },
  amusement: {
    label: "humour",
    instructions:
      "How strongly does `current_attempt.text` charm or disarm: humour, self-deprecation, wit, or an unexpected angle that would make the NPC smile despite themselves? Plain honesty is not humour.",
    levels: [
      "Flat, generic, or humourless.",
      "A small light touch that might get a half-smile.",
      "Genuinely funny or charming in a way that changes the mood.",
      "Irresistibly charming or funny; the kind of line people retell later.",
    ],
  },
  pressure: {
    label: "pressure",
    instructions:
      "How strongly does `current_attempt.text` apply pressure: threats, consequences, escalation, complaints, filming, lawyers, name-dropping status or connections, demands, or raising the stakes for the NPC? Desperation, urgency or begging without a demand or threat is not pressure.",
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
      "How strongly does `current_attempt.text` offer money, gifts, tips, or favours of value in exchange for the outcome? A trade of effort or time (a different date, cooking dinner) is not a bribe; that is a compromise.",
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
/** Player-facing names, in display order. Safe to ship to the browser. */
export const LEVER_LABELS: Record<Lever, string> = Object.fromEntries(
  LEVER_IDS.map((id) => [id, LEVERS[id].label]),
) as Record<Lever, string>;
/** Levers that make no factual claim, so believability does not discount them. A joke is not a lie. */
export const PLAUSIBILITY_EXEMPT: ReadonlySet<Lever> = new Set<Lever>(["amusement", "respect"]);
/** Hidden per-NPC susceptibility to each lever, from -1 (backfires hard) to +1 (fully open). */
export type Susceptibility = Record<Lever, number>;
