import { describe, expect, it } from "vitest";
import { soundsLikeWaiting } from "../generate";
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
  }

  it("catches waiting language", () => {
    expect(soundsLikeWaiting("That's... actually nice. Stand there a minute, don't move.")).toBe(true);
    expect(soundsLikeWaiting("Give me a second. I'm not promising anything.")).toBe(true);
    expect(soundsLikeWaiting("Hold on.")).toBe(true);
    expect(soundsLikeWaiting("Let me call the purser.")).toBe(true);
    expect(soundsLikeWaiting("I'm listening. Go on.")).toBe(false);
    expect(soundsLikeWaiting("Convince me it stays small.")).toBe(false);
  });
});
