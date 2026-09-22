/**
 * Offline tuning. Replays the saved battery (scripts/battery.answers.json, and scripts/battery.sequences.json when
 * present) through the real resolution code with the current lib/tuning.ts and scene lever tables, and prints each
 * attempt's expected tier next to what it got. No API calls. Usage: npm run tune
 *
 * Sequences replay turn by turn on one game. Their answers were captured under the transcript of the live run; if
 * tuning changes which line was picked, later turns saw a slightly different conversation. Good enough to tune on.
 */
import { existsSync, readFileSync } from "node:fs";
import { LEVER_IDS } from "../lib/levers";
import { newGame, resolveTurn, type Resolution, type TurnAnswers } from "../lib/resolve";
import { getScene } from "../lib/scenes";
import { TUNING } from "../lib/tuning";

type Tier = "W" | "S" | "s" | "N" | "B" | "F" | "H";
type Row = { tier: Tier; text: string; answers: TurnAnswers };
const data = JSON.parse(readFileSync(new URL("./battery.answers.json", import.meta.url), "utf8")) as Record<string, Row[]>;
const seqPath = new URL("./battery.sequences.json", import.meta.url);
const sequences = existsSync(seqPath) ? (JSON.parse(readFileSync(seqPath, "utf8")) as Record<string, Row[][]>) : {};

/** What tier a turn actually lands in. */
function got(res: Resolution): Tier {
  if (res.free) return "F";
  if (res.guarded) return "B";
  if (res.state.status === "won") return "W";
  if (res.delta >= TUNING.WIN_THRESHOLD * TUNING.BONUS_MIN_FRACTION) return "S";
  if (res.delta >= TUNING.SOFTENING_DELTA) return "s";
  if (res.delta <= TUNING.HOSTILE_DELTA) return "B";
  return res.mood === "holding" ? "H" : "N";
}
// Free and holding sit with neutral on the scale: getting N for an expected F is off by one (an attempt wasted),
// getting B for an expected F is off by two (a guard or a backfire where the player was just talking).
const RANK: Record<Tier, number> = { B: 0, N: 1, F: 1, H: 1, s: 2, S: 3, W: 4 };
function distance(want: Tier, g: Tier): number {
  if (want === g) return 0;
  return Math.max(1, Math.abs(RANK[want] - RANK[g]));
}

let off = 0, total = 0, far = 0;
function row(r: Row, res: Resolution, label: string) {
  const g = got(res);
  const dist = distance(r.tier, g);
  total++; if (dist > 0) off++; if (dist > 1) far++;
  const top = LEVER_IDS.filter((id) => (r.answers[id]?.score ?? 0) >= 0.5).sort((a, b) => r.answers[b].score - r.answers[a].score)
    .map((id) => `${id.slice(0, 4)} ${r.answers[id].score.toFixed(1)}`).join(" ");
  return {
    step: label, want: r.tier, got: g, ok: dist === 0 ? "" : dist === 1 ? "~" : "XX", delta: res.delta, meter: res.state.meter,
    win: res.instantWin ?? "", plaus: r.answers.plausibility.score.toFixed(1), stock: r.answers.is_stock_line.noul.toFixed(2),
    talk: r.answers.is_small_talk ? r.answers.is_small_talk.noul.toFixed(2) : "", pulls: top, attempt: r.text.slice(0, 46),
  };
}

for (const [sceneId, rows] of Object.entries(data)) {
  const scene = getScene(sceneId)!;
  console.log(`\n=== ${sceneId}  ${JSON.stringify(scene.npc.levers)}`);
  console.table(rows.map((r, i) => row(r, resolveTurn(scene, newGame(scene), r.text, r.answers, (l) => l[0]), String(i))));
}
for (const [sceneId, seqs] of Object.entries(sequences)) {
  const scene = getScene(sceneId)!;
  console.log(`\n=== ${sceneId} sequences`);
  const table = seqs.flatMap((steps, si) => {
    let state = newGame(scene);
    return steps.map((r, ti) => {
      const res = resolveTurn(scene, state, r.text, r.answers, (l) => l[0]);
      state = res.state;
      return row(r, res, `${si}.${ti}`);
    });
  });
  console.table(table);
}
console.log(`\n${total - off}/${total} exact, ${off - far} off by one tier, ${far} off by two or more`);
