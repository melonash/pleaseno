import { describe, expect, it } from "vitest";
import { asksForFacts, soundsLikeWaiting } from "../generate";
import { ROTATION, getScene } from "../scenes";

describe("line rules", () => {
  for (const id of ROTATION) {
    const scene = getScene(id)!;

    it(`${id}: every band has at least four lines, and there are at least two impatience lines`, () => {
      for (const band of Object.values(scene.lines)) expect(band.length).toBeGreaterThanOrEqual(4);
      expect(scene.freeLines.warm.length).toBeGreaterThanOrEqual(4);
      expect(scene.freeLines.cool.length).toBeGreaterThanOrEqual(4);
      expect(scene.freeLines.impatient.length).toBeGreaterThanOrEqual(2);
    });

    it(`${id}: no line short of a win tells the player to wait`, () => {
      const lines = [
        ...scene.lines.softening,
        ...scene.lines.holding,
        ...scene.lines.unmoved,
        ...scene.freeLines.warm,
        ...scene.freeLines.cool,
        ...scene.freeLines.impatient,
      ];
      expect(lines.filter((l) => soundsLikeWaiting(l.text)).map((l) => l.text)).toEqual([]);
    });

    it(`${id}: no line short of a win asks for a bare fact`, () => {
      const lines = [...scene.lines.hostile, ...scene.lines.unmoved, ...scene.lines.softening, ...scene.lines.holding,
        ...scene.freeLines.warm, ...scene.freeLines.cool, ...scene.freeLines.impatient];
      expect(lines.filter((l) => asksForFacts(l.text)).map((l) => l.text)).toEqual([]);
    });
  }

  it("catches waiting language", () => {
    expect(soundsLikeWaiting("That's... actually nice. Stand there a minute, don't move.")).toBe(true);
    expect(soundsLikeWaiting("Give me a second. I'm not promising anything.")).toBe(true);
    expect(soundsLikeWaiting("Hold on.")).toBe(true);
    expect(soundsLikeWaiting("Let me call the purser.")).toBe(true);
    expect(soundsLikeWaiting("I'm listening. Go on.")).toBe(false);
    expect(soundsLikeWaiting("Convince me it stays small.")).toBe(false);
  });

  it("catches questions that ask for facts, not reasons", () => {
    expect(asksForFacts("That's a different reason than missing a connection. Why couldn't you get here in time.")).toBe(true);
    expect(asksForFacts("I haven't done anything yet. What made you four minutes late.")).toBe(true);
    expect(asksForFacts("How fast do you think you were going?")).toBe(true);
    expect(asksForFacts("What seat were you in?")).toBe(true);
    expect(asksForFacts("Tell me why it's worth the call.")).toBe(false);
    expect(asksForFacts("Why today?")).toBe(false);
    expect(asksForFacts("So what are you suggesting?")).toBe(false);
  });
});

describe("generated reply references", () => {
  it("every band keeps at least one untagged line, so a reply always has a reference whatever the lever", () => {
    for (const id of ROTATION) {
      const scene = getScene(id)!;
      for (const [band, lines] of Object.entries(scene.lines)) {
        expect(lines.some((l) => !l.lever), `${id} ${band}`).toBe(true);
      }
    }
  });
});
