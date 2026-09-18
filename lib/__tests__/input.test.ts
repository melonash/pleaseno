import { describe, expect, it } from "vitest";
import { classifyInput } from "../input";

describe("classifyInput", () => {
  it("treats punctuation, single letters and emoji as silence", () => {
    for (const t of ["x", "...", "?", "-", "  .  ", "🙃", "!!!", "a"]) expect(classifyInput(t)).toBe("silence");
  });
  it("treats short real words as attempts", () => {
    for (const t of ["no", "ok", "please", "hi", "yes?", "why"]) expect(classifyInput(t)).toBe("attempt");
  });
});
