import { getScene, type Scene } from "./scenes";
import { buildQuestions, buildState } from "./questions";
import { newGame, resolveTurn, type Resolution, type TurnAnswers } from "./resolve";
import type { GameState } from "./token";
import { TUNING } from "./tuning";
import { jev } from "./jev";

export type TurnResult = Resolution & { answers: TurnAnswers; scene: Scene };

/** Runs one full turn: validate, ask Jev once, resolve in code. Shared by the API route and the probe script. */
export async function playTurn(sceneId: string, prev: GameState | null, rawText: string): Promise<TurnResult> {
  const scene = getScene(sceneId);
  if (!scene) throw new TurnError(404, "Unknown scene.");
  const text = rawText.trim();
  if (!text) throw new TurnError(400, "Say something first.");
  if (text.length > TUNING.MAX_INPUT_CHARS) {
    throw new TurnError(400, `Keep it under ${TUNING.MAX_INPUT_CHARS} characters. Real people don't listen to speeches.`);
  }
  const state = prev && prev.sceneId === sceneId && prev.status === "playing" ? prev : newGame(scene);
  if (state.attempt >= TUNING.MAX_ATTEMPTS) throw new TurnError(409, "This game is over. Start a new one.");

  const jevState = buildState(scene, state.transcript, state.attempt + 1, TUNING.MAX_ATTEMPTS, text);
  const questions = buildQuestions(scene);
  const { answers } = await jev().systemOne({ state: jevState, questions }, { timeout: 20_000 });

  const resolution = resolveTurn(scene, state, text, answers);
  return { ...resolution, answers, scene };
}

export class TurnError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
