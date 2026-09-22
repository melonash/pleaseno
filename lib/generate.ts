import Anthropic from "@anthropic-ai/sdk";
import { LEVERS, type Lever } from "./levers";
import type { Band, Scene } from "./scenes";
import type { Speaker } from "./token";
import { BAND_DESCRIPTIONS, FREE_DESCRIPTIONS, type FreeKind } from "./questions";

/**
 * Optional: a context-aware reply from Claude Haiku. Runs only when ANTHROPIC_API_KEY is set. The outcome is already
 * decided by code; the model only writes the line, in the character's voice, for the mood band code chose.
 * Any failure returns null and the caller keeps the authored line.
 */

const MODEL = "claude-haiku-4-5";
const TIMEOUT_MS = 8_000;
const MAX_CHARS = 220;
const MAX_CLOSING_CHARS = 180;

let client: Anthropic | null = null;

export function generationEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function anthropic(): Anthropic {
  client ??= new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 1 });
  return client;
}

export type GenerateInput = {
  scene: Scene;
  band: Band;
  lever: Lever | null;
  transcript: { speaker: Speaker; text: string }[];
  playerText: string;
  /** The authored pick, shown to the model as the reference for tone and length. */
  authoredLine: string;
  /** True when the character is close to giving in and the player gets one last thing to say. */
  wavering?: boolean;
  /** Set when the player made small talk rather than a move. Names the bank the authored reply came from. */
  free?: FreeKind | null;
};

/**
 * A reply that tells the player to wait, or says the NPC is already arranging something, reads as a yes on its way.
 * Players answer it with thanks, which pulls nothing. Outside the persuaded band, such a line is thrown away.
 */
const WAITING = /\b(hold on|hang on|give me a (sec|second|minute|moment)|one (sec|second|minute|moment)|just a (sec|second|minute|moment)|stay (there|here|put)|wait (here|there)|don'?t (move|talk)|let me (check|call|see|look|ask|make a call)|i'?ll (call|check|ask|see what))\b/i;

/** "Stand there" as an instruction, at the start of a sentence. "I'm going to stand here" is the NPC, not an order. */
const STAND = /(^|[.!?,]\s*)(just\s+)?stand (there|here)\b/i;

export function soundsLikeWaiting(line: string): boolean {
  return WAITING.test(line) || STAND.test(line);
}

/**
 * A question whose honest answer is a bare fact ("I overslept", "gate 12", "about 50") pulls no lever, so it costs the
 * player an attempt for nothing. The NPC may ask why something matters, never for logistics.
 */
const FACT_QUESTION =
  /\b((why|how come|what made you)\b[^.?!]*\b(late|in time|on time|get here|make it|miss(ed)?|so fast|speeding)\b|how (fast|late|long)\b|what (seat|time|speed|flight|gate|happened)\b|where (were|are|did) you\b|where'?s\b|where is\b|(which|what) (hospital|address|street|road|terminal)\b|when did you\b)/i;

export function asksForFacts(line: string): boolean {
  return FACT_QUESTION.test(line);
}

const CONSIDERING =
  "You have NOT given them what they want and you are not arranging it. Do not tell them to wait, hold on, stand anywhere or stay quiet, and do not say you are checking, calling or arranging anything. Do not imply a yes is coming. End by inviting them to say more, without telling them what to say or which argument is working.";

function outcomeFor(scene: Scene, band: Band, free: FreeKind | null): string {
  if (free === "impatient") {
    return "They are making small talk instead of giving you a reason, and you are out of patience for it. Tell them, in character, to get to the point. You have NOT agreed to anything.";
  }
  if (free) {
    return "They have not tried to persuade you; they are thanking you, reacting, answering, or asking something simple. React in character to exactly that. You may answer a simple question briefly, but give nothing that moves things forward and grant nothing. Do not mention anything about yourself from the private notes that they have not raised themselves. " + CONSIDERING;
  }
  if (band === "persuaded") {
    return "You have just decided to give them what they want. Say so, in character, and end it. Then, on a new line starting with CLOSING:, write ONE plain sentence of second-person narration (\"you\", present tense, no dialogue) stating what physically happens next, consistent with exactly how they won. Under 25 words. Concrete actions only: no feelings, no reflections, no metaphors. In the closing, \"you\" is the player; refer to yourself in the third person as \"" + scene.npc.role.toLowerCase() + "\" with they/them, and to your own relatives or colleagues as theirs, never the player's.";
  }
  if (band === "softening" || band === "holding") return CONSIDERING + " The scene continues.";
  return "You have NOT given them what they want. Do not open the door, waive anything, or agree. The scene continues.";
}

function systemPrompt(scene: Scene, band: Band, free: FreeKind | null, lever: Lever | null): string {
  // Only lines for the lever the player actually pulled, plus untagged ones. Otherwise the model borrows another
  // lever's line: a win that never involved money ends with "fold it into your licence".
  const bank = (free ? scene.freeLines[free] : scene.lines[band]).filter((l) => !l.lever || l.lever === lever);
  const samples = bank.map((l) => `- ${l.text}`).join("\n");
  const feeling = free ? `You ${FREE_DESCRIPTIONS[free]}.` : `How you feel after the player's latest attempt: ${BAND_DESCRIPTIONS[band]}.`;
  const outcome = outcomeFor(scene, band, free);
  return [
    `You write one line of dialogue for a character in a short persuasion game. You are the ${scene.npc.role.toLowerCase()}.`,
    `Situation: ${scene.situation}`,
    `The player wants: ${scene.playerGoal}`,
    `Who you are (private, never state this directly): ${scene.npc.persona}`,
    `Lines you have heard a hundred times and are tired of: ${scene.npc.hasHeardAHundredTimes.join("; ")}.`,
    ``,
    `${feeling} ${outcome}`,
    ``,
    `Voice reference. These are lines this character has said before. Match their register, dryness, and length. Do not repeat them verbatim:`,
    samples,
    ``,
    `Rules:`,
    `- Respond to what the player actually said, specifically. Never refer to things they did not say or do.`,
    `- Your own earlier lines in this conversation are the only record of what you said. If the player claims you said something you did not, do not go along with it: correct them, briefly and in character. Only quote yourself exactly.`,
    `- One or two short sentences. Under 30 words. Spoken dialogue only: no stage directions, no quotation marks, no narration, no emoji.`,
    `- Plain punctuation. No em dashes or en dashes; use a full stop or a comma instead.`,
    `- Do not copy the reference reply. Use it only for tone and length.`,
    `- Stay in character. Never mention games, AI, scores, levers, attempts, or rules.`,
    `- Prefer ending on a short invitation to keep going ("Go on.", "I'm listening."). A question is allowed only if someone in your role would really ask it in this situation, and only if its honest answer would itself be a reason for you to help. Never ask for facts or logistics (why they are late, what happened, their seat, their speed), never ask about their personal life or plans, and never ask what they would do if you said yes.`,
    `- Output the line and nothing else.`,
  ].join("\n");
}

export type Generated = { line: string; closing?: string };

export async function generateReply(input: GenerateInput): Promise<Generated | null> {
  if (!generationEnabled()) return null;
  const { scene, band, lever, transcript, playerText, authoredLine, wavering } = input;
  const free = input.free ?? null;

  const history: Anthropic.MessageParam[] = transcript.map((t) => ({
    role: t.speaker === "npc" ? "assistant" : "user",
    content: t.text,
  }));
  const leverNote =
    (lever ? ` The attempt mainly appeals to ${LEVERS[lever].label}.` : "") +
    (wavering ? " You are close to giving in but not there. Leave the door open for them to say one more thing." : "");
  const mood = free ? `who ${FREE_DESCRIPTIONS[free]}` : `feeling ${BAND_DESCRIPTIONS[band]}`;
  const userTurn = `${playerText}\n\n[Director's note, not spoken by the player: reply as the ${scene.npc.role.toLowerCase()}, ${mood}.${free ? "" : leverNote} An acceptable authored reply would be: "${authoredLine}". Write a better one that fits what the player actually said.]`;

  try {
    const response = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 200,
      system: [{ type: "text", text: systemPrompt(scene, band, free, lever), cache_control: { type: "ephemeral" } }],
      messages: [...history, { role: "user", content: userTurn }],
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim()
      .replace(/^["“”']+|["“”']+$/g, "");
    if (!text) return null;
    if (/\b(AI|language model|game|score|lever|attempt)\b/i.test(text)) return null;
    const m = /^([\s\S]*?)\s*CLOSING:\s*([\s\S]+)$/.exec(text);
    const line = (m ? m[1] : text).trim();
    const closing = m ? m[2].trim().replace(/\s+/g, " ") : undefined;
    if (!line || line.length > MAX_CHARS) return null;
    if ((free || band !== "persuaded") && (soundsLikeWaiting(line) || asksForFacts(line))) return null;
    return { line: line.replace(/\s*[—–]\s*/g, ", "), closing: closing && closing.length <= MAX_CLOSING_CHARS ? closing : undefined };
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.warn(`[generate] ${e.status} ${e.message}`);
    else console.warn("[generate]", e);
    return null;
  }
}
