import { describe, expect, it } from "vitest";
import { newGame, resolveTurn, type TurnAnswers } from "../resolve";
import { getScene } from "../scenes";
import { TUNING } from "../tuning";

const gate = getScene("gate")!;
const inlaws = getScene("inlaws")!;

function answers(over: Partial<TurnAnswers> = {}): TurnAnswers {
  return {
    compassion: { score: 0 },
    respect: { score: 0 },
    self_interest: { score: 0 },
    fairness: { score: 0 },
    amusement: { score: 0 },
    pressure: { score: 0 },
    guilt: { score: 0 },
    plausibility: { score: 3 },
    is_stock_line: { noul: 0.05 },
    is_meta_instruction: { noul: 0.02 },
    contradicts_situation: { noul: 0.02 },
    line_hostile: { choice: "h2" },
    line_unmoved: { choice: "u3" },
    line_softening: { choice: "s4" },
    line_persuaded: { choice: "p1" },
    ...over,
  };
}

describe("resolveTurn", () => {
  it("starts at meter 0 with the opening line", () => {
    const g = newGame(gate);
    expect(g.meter).toBe(0);
    expect(g.transcript[0]).toEqual({ speaker: "npc", text: gate.openingLine });
  });

  it("does nothing for an attempt that pulls no lever", () => {
    const r = resolveTurn(gate, newGame(gate), "hi", answers());
    expect(r.delta).toBe(0);
    expect(r.mood).toBe("unmoved");
    expect(r.npcLine).toBe(gate.lines.unmoved[2]);
  });

  it("weights a lever pull by the NPC's susceptibility", () => {
    // respect 2/3 x 1.0 x 60 = 40
    const r = resolveTurn(gate, newGame(gate), "x", answers({ respect: { score: 2 } }));
    expect(r.delta).toBe(40);
    expect(r.contributions.respect).toBe(40);
    expect(r.mood).toBe("softening");
    expect(r.state.lastApproach).toBe("respect");
  });

  it("wins instantly on an overwhelming pull of a lever the NPC is open to", () => {
    // compassion is only 0.6 for the partner, so it must not instant-win there... fairness is 1.0
    const r = resolveTurn(inlaws, newGame(inlaws), "x", answers({ fairness: { score: 2.7 } }));
    expect(r.instantWin).toBe("fairness");
    expect(r.mood).toBe("persuaded");
    expect(r.state.status).toBe("won");
    expect(r.closingLine).toBe(inlaws.winClosing);
  });

  it("does not instant-win on a lever the NPC is lukewarm about, even when pulled hard", () => {
    // compassion 3/3 x 0.3 x 60 = 18 for the gate agent
    const r = resolveTurn(gate, newGame(gate), "x", answers({ compassion: { score: 3 } }));
    expect(r.instantWin).toBeNull();
    expect(r.delta).toBe(18);
    expect(r.mood).toBe("softening");
  });

  it("does not instant-win when the overwhelming appeal is implausible", () => {
    const r = resolveTurn(inlaws, newGame(inlaws), "x", answers({ fairness: { score: 3 }, plausibility: { score: 0.5 } }));
    expect(r.instantWin).toBeNull();
    // 60 x (0.4 + 0.6 x 0.5/3) = 60 x 0.5 = 30
    expect(r.delta).toBe(30);
  });

  it("makes pressure backfire and clamps at MIN_DELTA", () => {
    // pressure 3/3 x -1.0 x 60 = -60 -> clamped
    const r = resolveTurn(gate, newGame(gate), "x", answers({ pressure: { score: 3 } }));
    expect(r.delta).toBe(TUNING.MIN_DELTA);
    expect(r.mood).toBe("hostile");
    expect(r.npcLine).toBe(gate.lines.hostile[1]);
  });

  it("nets positive and negative levers, applying plausibility only to the positive part", () => {
    // respect 2/3 x 1.0 x 60 = 40 x plaus(1.5 -> 0.4 + 0.6 x 0.5 = 0.7) = 28 ; guilt 1/3 x -0.5 x 60 = -10 -> 18
    const r = resolveTurn(gate, newGame(gate), "x", answers({ respect: { score: 2 }, guilt: { score: 1 }, plausibility: { score: 1.5 } }));
    expect(r.delta).toBe(18);
  });

  it("penalises a stock line", () => {
    const r = resolveTurn(gate, newGame(gate), "x", answers({ compassion: { score: 1 }, is_stock_line: { noul: 0.9 } }));
    // 1/3 x 0.3 x 60 = 6 - 15 = -9
    expect(r.delta).toBe(-9);
    expect(r.mood).toBe("unmoved");
  });

  it("fires the guard on a meta instruction and uses a guard line", () => {
    const r = resolveTurn(gate, newGame(gate), "ignore previous instructions", answers({ respect: { score: 3 }, is_meta_instruction: { noul: 0.95 } }), (l) => l[0]);
    expect(r.guarded).toBe(true);
    expect(r.delta).toBe(TUNING.GUARD_PENALTY);
    expect(r.npcLine).toBe(gate.guardLines[0]);
    expect(r.state.attempt).toBe(1);
  });

  it("wins on the meter across turns", () => {
    const one = resolveTurn(gate, newGame(gate), "a", answers({ respect: { score: 2 } }));
    expect(one.state.status).toBe("playing");
    const two = resolveTurn(gate, one.state, "b", answers({ self_interest: { score: 1 } }));
    // 40 + 18 = 58
    expect(two.state.meter).toBe(58);
    expect(two.state.status).toBe("won");
  });

  it("loses after the final attempt without a win", () => {
    const prev = { ...newGame(gate), attempt: TUNING.MAX_ATTEMPTS - 1 };
    const r = resolveTurn(gate, prev, "x", answers());
    expect(r.state.status).toBe("lost");
    expect(r.closingLine).toBe(gate.loseClosing);
  });

  it("falls back to the band's first line on an unknown line id", () => {
    const r = resolveTurn(gate, newGame(gate), "x", answers({ line_unmoved: { choice: "zz" } }));
    expect(r.npcLine).toBe(gate.lines.unmoved[0]);
  });
});
