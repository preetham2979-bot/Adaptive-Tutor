import { describe, it, expect } from "vitest";
import { computeMasteryUpdate } from "./masteryUpdater.js";

// Same topic-row shape as a `SELECT * FROM topics` row.
const topic = { p_transit: 0.1, p_guess: 0.2, p_slip: 0.1 };

describe("computeMasteryUpdate", () => {
  it("matches the hand-verified BKT posterior for a correct answer", () => {
    // Same numbers as bktEngine.test.js's hand-verified case, just
    // routed through the DB-row-shaped wrapper this time.
    const result = computeMasteryUpdate(topic, 0.5, true);
    expect(result).toBeCloseTo(0.8363636364, 9);
  });

  it("matches the hand-verified BKT posterior for an incorrect answer", () => {
    const result = computeMasteryUpdate(topic, 0.5, false);
    expect(result).toBeCloseTo(0.2, 9);
  });

  it("is NOT a fixed +/-5% delta", () => {
    // Regression guard: this is exactly the bug we're fixing. A fixed
    // delta would move 0.5 to 0.55/0.45 regardless of topic params.
    // The real BKT update should not land on either value here.
    const up = computeMasteryUpdate(topic, 0.5, true);
    const down = computeMasteryUpdate(topic, 0.5, false);
    expect(up).not.toBeCloseTo(0.55, 2);
    expect(down).not.toBeCloseTo(0.45, 2);
  });

  it("produces different jump sizes for topics with different params", () => {
    // A topic with a high guess rate (easy to fluke) should move less
    // on a correct answer than one with a low guess rate — this is
    // the entire point of per-topic BKT params, and a fixed delta
    // could never express it.
    const easyToGuess = { p_transit: 0.1, p_guess: 0.4, p_slip: 0.1 };
    const hardToGuess = { p_transit: 0.1, p_guess: 0.05, p_slip: 0.1 };

    const jumpEasy = computeMasteryUpdate(easyToGuess, 0.5, true) - 0.5;
    const jumpHard = computeMasteryUpdate(hardToGuess, 0.5, true) - 0.5;

    expect(jumpEasy).toBeLessThan(jumpHard);
  });

  it("stays within [0, 1]", () => {
    expect(computeMasteryUpdate(topic, 0.98, true)).toBeLessThanOrEqual(1);
    expect(computeMasteryUpdate(topic, 0.02, false)).toBeGreaterThanOrEqual(0);
  });
});
