import { NextResponse } from "next/server";
import { decodeState, encodeState } from "@/lib/token";
import { playTurn, TurnError } from "@/lib/turn";
import { attemptsLeft } from "@/lib/resolve";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { sceneId?: unknown; stateToken?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const sceneId = typeof body.sceneId === "string" ? body.sceneId : "";
  const text = typeof body.text === "string" ? body.text : "";
  const prev = typeof body.stateToken === "string" ? decodeState(body.stateToken) : null;
  const params = new URL(req.url).searchParams;
  const debug = params.get("debug") === "1";
  // Tuning runs pass nogen=1 to skip the optional generated reply and its cost.
  const generate = params.get("nogen") !== "1";

  try {
    const r = await playTurn(sceneId, prev, text, { generate });
    if ("kind" in r) {
      return NextResponse.json({
        npcLine: r.npcLine,
        mood: "waiting",
        moodLabel: "waiting",
        attemptsLeft: attemptsLeft(r.state),
        bonus: r.state.bonus === "granted",
        status: r.state.status,
        closingLine: null,
        pulls: {},
        lever: null,
        guarded: false,
        nonTurn: r.kind,
        stateToken: encodeState(r.state),
      });
    }
    const res: Record<string, unknown> = {
      npcLine: r.npcLine,
      mood: r.mood,
      moodLabel: r.scene.moodLabels[r.mood],
      attemptsLeft: attemptsLeft(r.state),
      bonus: r.state.bonus === "granted",
      status: r.state.status,
      closingLine: r.closingLine ?? null,
      pulls: Object.fromEntries(Object.entries(r.pulls).map(([k, v]) => [k, Math.round(v * 10) / 10])),
      lever: r.lever,
      guarded: r.guarded,
      stateToken: encodeState(r.state),
    };
    if (debug) {
      res.debug = {
        meter: r.state.meter,
        delta: r.delta,
        guarded: r.guarded,
        instantWin: r.instantWin,
        lever: r.lever,
        generated: r.generated,
        contributions: r.contributions,
        answers: r.answers,
      };
    }
    return NextResponse.json(res);
  } catch (e) {
    if (e instanceof TurnError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[turn]", e);
    const msg = e instanceof Error && /TYPESAFE_API_KEY|GAME_STATE_SECRET/.test(e.message)
      ? "Server is missing configuration."
      : "The other person zoned out for a second. Try again.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
