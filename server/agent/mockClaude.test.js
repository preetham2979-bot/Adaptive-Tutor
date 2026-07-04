import { describe, it, expect } from "vitest";
import { mockGenerateQuestion } from "./mockClaude.js";
import { validateQuestionShape } from "./questionSchema.js";

describe("mockGenerateQuestion", () => {
  it("returns a question satisfying the same contract the real Claude client must satisfy", async () => {
    const question = await mockGenerateQuestion({
      topicName: "Loops",
      topicDescription: "for/while loops, iteration, break/continue.",
      difficulty: "easy",
      language: "javascript",
    });

    // Re-validating here proves the mock can't silently drift from the
    // contract — if questionSchema.js changes, this test fails too.
    expect(() => validateQuestionShape(question)).not.toThrow();
    expect(question.options).toHaveLength(4);
    expect(question.correctOptionIndex).toBeGreaterThanOrEqual(0);
    expect(question.correctOptionIndex).toBeLessThanOrEqual(3);
  });
});
