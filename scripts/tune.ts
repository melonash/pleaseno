/**
 * Offline tuning. Replays the saved battery (scripts/battery.answers.json) through the real resolution code with the
 * current lib/tuning.ts and scene lever tables, and prints each attempt's expected tier next to what it got.
 * No API calls. Usage: npm run tune
 */
import { readFileSync } from "node:fs";
import { LEVER_IDS } from "../lib/levers";
import { newGame, resolveTurn, type TurnAnswers } from "../lib/resolve";
import { getScene } from "../lib/scenes";
import { TUNING } from "../lib/tuning";

type Row = { tier: "W" | "S" | "s" | "N" | "B"; text: string; answers: TurnAnswers };
const data = JSON.parse(readFileSync(new URL("./battery.answers.json", import.meta.url), "utf8")) as Record<string, Row[]>;

/** What tier a first-turn delta actually lands in. */
function got(delta: number, won: boolean): Row["tier"] {
  if (won) return "W";
  if (delta >= TUNING.WIN_THRESHOLD * TUNING.BONUS_MIN_FRACTION) return "S";
  if (delta >= TUNING.SOFTENING_DELTA) return "s";
  if (delta <= TUNING.HOSTILE_DELTA) return "B";
  return "N";
}
const ORDER = ["B", "N", "s", "S", "W"];

let off = 0, total = 0, far = 0;
for (const [sceneId, rows] of Object.entries(data)) {
  const scene = getScene(sceneId)!;
  console.log(`\n=== ${sceneId}  ${JSON.stringify(scene.npc.levers)}`);
  const table = rows.map((r) => {
    const res = resolveTurn(scene, newGame(scene), r.text, r.answers, (l) => l[0]);
    const g = res.guarded ? "B" : got(res.delta, res.state.status === "won");
    const dist = Math.abs(ORDER.indexOf(g) - ORDER.indexOf(r.tier));
    total++; if (dist > 0) off++; if (dist > 1) far++;
    const top = LEVER_IDS.filter((id) => r.answers[id].score >= 0.5).sort((a, b) => r.answers[b].score - r.answers[a].score)
      .map((id) => `${id.slice(0, 4)} ${r.answers[id].score.toFixed(1)}`).join(" ");
    return { want: r.tier, got: g, ok: dist === 0 ? "" : dist === 1 ? "~" : "XX", delta: res.delta, win: res.instantWin ?? "", plaus: r.answers.plausibility.score.toFixed(1), stock: r.answers.is_stock_line.noul.toFixed(2), pulls: top, attempt: r.text.slice(0, 46) };
  });
  console.table(table);
}
console.log(`\n${total - off}/${total} exact, ${off - far} off by one tier, ${far} off by two or more`);
