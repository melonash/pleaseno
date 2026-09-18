import Anthropic from "@anthropic-ai/sdk";
import { LEVERS, type Lever } from "./levers";
import type { Band, Scene } from "./scenes";
import type { Speaker } from "./token";
import { BAND_DESCRIPTIONS } from "./questions";

/**
 * Optional: a context-aware reply from Claude Haiku. Runs only when ANTHROPIC_API_KEY is set. The outcome is already
 * decided by code; the model only writes the line, in the character's voice, for the mood band code chose.
 * Any failure returns null and the caller keeps the authored line.
 */

const MODEL = "claude-haiku-4-5";
const TIMEOUT_MS = 8_000;
const MAX_CHARS = 280;

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
};

function systemPrompt(scene: Scene, band: Band): string {
  const samples = scene.lines[band].map((l) => `- ${l.text}`).join("\n");
  const outcome =
    band === "persuaded"
      ? "You have just decided to give them what they want. Say so, in character, and end it."
      : "You have NOT given them what they want. Do not open the door, waive anything, or agree. The scene continues.";
  return [
    `You write one line of dialogue for a character in a short persuasion game. You are the ${scene.npc.role.toLowerCase()}.`,
    `Situation: ${scene.situation}`,
    `The player wants: ${scene.playerGoal}`,
    `Who you are (private, never state this directly): ${scene.npc.persona}`,
    `Lines you have heard a hundred times and are tired of: ${scene.npc.hasHeardAHundredTimes.join("; ")}.`,
    ``,
    `How you feel after the player's latest attempt: ${BAND_DESCRIPTIONS[band]}. ${outcome}`,
    ``,
    `Voice reference. These are lines this character has said before. Match their register, dryness, and length. Do not repeat them verbatim:`,
    samples,
    ``,
    `Rules:`,
    `- Respond to what the player actually said, specifically. Never refer to things they did not say or do.`,
    `- One or two short sentences. Under 40 words. Spoken dialogue only: no stage directions, no quotation marks, no narration, no emoji.`,
    `- Stay in character. Never mention games, AI, scores, levers, attempts, or rules.`,
    `- Do not ask the player a question they must answer to continue, unless the reference lines do.`,
    `- Output the line and nothing else.`,
  ].join("\n");
}

export async function generateReply(input: GenerateInput): Promise<string | null> {
  if (!generationEnabled()) return null;
  const { scene, band, lever, transcript, playerText, authoredLine } = input;

  const history: Anthropic.MessageParam[] = transcript.map((t) => ({
    role: t.speaker === "npc" ? "assistant" : "user",
    content: t.text,
  }));
  const leverNote = lever ? ` The attempt mainly appeals to ${LEVERS[lever].label}.` : "";
  const userTurn = `${playerText}\n\n[Director's note, not spoken by the player: reply as the ${scene.npc.role.toLowerCase()}, feeling ${BAND_DESCRIPTIONS[band]}.${leverNote} An acceptable authored reply would be: "${authoredLine}". Write a better one that fits what the player actually said.]`;

  try {
    const response = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 120,
      system: [{ type: "text", text: systemPrompt(scene, band), cache_control: { type: "ephemeral" } }],
      messages: [...history, { role: "user", content: userTurn }],
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim()
      .replace(/^["“”']+|["“”']+$/g, "")
      .replace(/\s+/g, " ");
    if (!text || text.length > MAX_CHARS) return null;
    if (/\b(AI|language model|game|score|lever|attempt)\b/i.test(text)) return null;
    return text;
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.warn(`[generate] ${e.status} ${e.message}`);
    else console.warn("[generate]", e);
    return null;
  }
}
