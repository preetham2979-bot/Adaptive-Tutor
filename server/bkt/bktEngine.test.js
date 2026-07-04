import { describe, it, expect } from "vitest";
import {
  updateMastery,
  traceMastery,
  isMastered,
  DEFAULT_PARAMS,
} from "./bktEngine.js";

describe("updateMastery — hand-verified math", () => {
  // p=0.5, pSlip=0.1, pGuess=0.2, pTransit=0.1
  // posterior = (0.5*0.9) / (0.5*0.9 + 0.5*0.2) = 0.45/0.55 = 0.818181...
  // updated   = 0.818181... + (1-0.818181...)*0.1 = 0.836363...
  it("matches a hand-calculated posterior for a correct answer", () => {
    const result = updateMastery(0.5, true, {
      pTransit: 0.1,
      pGuess: 0.2,
      pSlip: 0.1,
    });
    expect(result).toBeCloseTo(0.8363636364, 9);
  });

  // posterior = (0.5*0.1) / (0.5*0.1 + 0.5*0.8) = 0.05/0.45 = 0.111111...
  // updated   = 0.111111... + (1-0.111111...)*0.1 = 0.2 exactly
  it("matches a hand-calculated posterior for an incorrect answer", () => {
    const result = updateMastery(0.5, false, {
      pTransit: 0.1,
      pGuess: 0.2,
      pSlip: 0.1,
    });
    expect(result).toBeCloseTo(0.2, 9);
  });
});

describe("updateMastery — directional behavior", () => {
  it("increases mastery on a correct answer", () => {
    const before = 0.4;
    const after = updateMastery(before, true, DEFAULT_PARAMS);
    expect(after).toBeGreaterThan(before);
  });

  it("decreases mastery on an incorrect answer", () => {
    const before = 0.6;
    const after = updateMastery(before, false, DEFAULT_PARAMS);
    expect(after).toBeLessThan(before);
  });

  it("keeps mastery within [0, 1] across a long mixed sequence", () => {
    const answers = [true, false, true, true, false, false, true, false, true, true];
    const trace = traceMastery(0.3, answers, DEFAULT_PARAMS);
    for (const p of trace) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe("updateMastery — convergence over a sequence", () => {
  it("converges toward full mastery after a long streak of correct answers", () => {
    const answers = Array(20).fill(true);
    const trace = traceMastery(0.1, answers, DEFAULT_PARAMS);
    const final = trace[trace.length - 1];
    expect(final).toBeGreaterThan(0.99);
    expect(isMastered(final)).toBe(true);
  });

  it("trends toward (but never reaches) zero after a long streak of incorrect answers", () => {
    const answers = Array(20).fill(false);
    const trace = traceMastery(0.5, answers, DEFAULT_PARAMS);
    const final = trace[trace.length - 1];
    expect(final).toBeGreaterThan(0); // pTransit always nudges it back up a bit
    expect(final).toBeLessThan(0.3); // but it should still be clearly low
  });
});

describe("updateMastery — parameter sensitivity", () => {
  it("a higher guess rate produces a smaller mastery jump on a correct answer", () => {
    const before = 0.5;
    const lowGuess = updateMastery(before, true, { pTransit: 0, pGuess: 0.1, pSlip: 0.1 });
    const highGuess = updateMastery(before, true, { pTransit: 0, pGuess: 0.4, pSlip: 0.1 });
    // a correct answer is less informative about real mastery when
    // guessing right is already likely, so the jump should be smaller
    expect(highGuess - before).toBeLessThan(lowGuess - before);
  });

  it("a higher slip rate produces a smaller mastery drop on an incorrect answer", () => {
    const before = 0.5;
    const lowSlip = updateMastery(before, false, { pTransit: 0, pGuess: 0.2, pSlip: 0.05 });
    const highSlip = updateMastery(before, false, { pTransit: 0, pGuess: 0.2, pSlip: 0.3 });
    // a wrong answer is less damning about real mastery when slipping
    // is already likely, so the drop should be smaller
    expect(before - highSlip).toBeLessThan(before - lowSlip);
  });
});

describe("updateMastery — input validation", () => {
  it("throws on an out-of-range mastery probability", () => {
    expect(() => updateMastery(1.5, true, DEFAULT_PARAMS)).toThrow();
  });

  it("throws on an out-of-range BKT parameter", () => {
    expect(() =>
      updateMastery(0.5, true, { pTransit: 0.1, pGuess: -0.1, pSlip: 0.1 })
    ).toThrow();
  });
});
