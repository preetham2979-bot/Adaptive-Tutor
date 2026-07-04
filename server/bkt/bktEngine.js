/**
 * Bayesian Knowledge Tracing (BKT) engine.
 *
 * Per-topic mastery is modeled as a hidden binary state: "mastered" or
 * "not mastered". We never observe that state directly — we only see
 * whether the student answered correctly. BKT keeps a probability
 * p(mastery) and updates it after every observed answer using four
 * parameters:
 *
 *   pInit    (L0) - prior probability the student already had the
 *                    topic mastered before any evidence was seen
 *   pTransit (T)  - probability the student moves from "not mastered"
 *                    to "mastered" after one practice opportunity
 *   pGuess   (G)  - probability of answering correctly despite NOT
 *                    having mastered the topic (a lucky guess)
 *   pSlip    (S)  - probability of answering incorrectly despite
 *                    HAVING mastered the topic (a careless slip)
 *
 * The update happens in two steps, both grounded in Bayes' rule:
 *   1. Bayesian update — revise p(mastery) using the observed answer
 *      and the guess/slip rates.
 *   2. Learning step — account for the chance the student learned
 *      the skill during this opportunity, via pTransit.
 *
 * This module is pure math: no I/O, no database, no API calls. It
 * takes a probability and a boolean answer, and returns a new
 * probability. That purity is what makes it independently testable
 * and easy to reason about and explain — the BKT engine decides
 * *what* to do next; it never touches *how* a question is phrased.
 */

export const DEFAULT_PARAMS = Object.freeze({
  pInit: 0.3,
  pTransit: 0.1,
  pGuess: 0.2,
  pSlip: 0.1,
});

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function assertValidProbability(value, name) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a number in [0, 1], got ${value}`);
  }
}

function assertValidParams(params) {
  assertValidProbability(params.pTransit, "pTransit");
  assertValidProbability(params.pGuess, "pGuess");
  assertValidProbability(params.pSlip, "pSlip");
}

/**
 * Step 1: Bayesian update of p(mastery) given one observed answer.
 * Does NOT yet account for learning that may have happened during
 * this opportunity — see applyLearningTransit for that.
 */
export function bayesianUpdate(pMastery, correct, { pGuess, pSlip }) {
  if (correct) {
    // P(correct | mastered)     = 1 - pSlip
    // P(correct | not mastered) = pGuess
    const numerator = pMastery * (1 - pSlip);
    const denominator = numerator + (1 - pMastery) * pGuess;
    return denominator === 0 ? pMastery : numerator / denominator;
  } else {
    // P(incorrect | mastered)     = pSlip
    // P(incorrect | not mastered) = 1 - pGuess
    const numerator = pMastery * pSlip;
    const denominator = numerator + (1 - pMastery) * (1 - pGuess);
    return denominator === 0 ? pMastery : numerator / denominator;
  }
}

/**
 * Step 2: account for the possibility the student learned the skill
 * during this practice opportunity, regardless of whether they
 * answered correctly. Once "learned" in the BKT model, mastery is
 * treated as permanent — pTransit only ever pushes mastery up.
 */
export function applyLearningTransit(pMasteryPosterior, pTransit) {
  return pMasteryPosterior + (1 - pMasteryPosterior) * pTransit;
}

/**
 * Full BKT update: given the mastery probability BEFORE this answer,
 * whether the answer was correct, and the topic's BKT parameters,
 * returns the mastery probability AFTER this answer.
 *
 * @param {number} pMastery - current p(mastery), in [0, 1]
 * @param {boolean} correct - whether the student answered correctly
 * @param {{pTransit:number, pGuess:number, pSlip:number}} params
 * @returns {number} updated p(mastery), in [0, 1]
 */
export function updateMastery(pMastery, correct, params = DEFAULT_PARAMS) {
  assertValidProbability(pMastery, "pMastery");
  assertValidParams(params);

  const posterior = bayesianUpdate(pMastery, correct, params);
  const updated = applyLearningTransit(posterior, params.pTransit);

  return clamp01(updated);
}

/**
 * Convenience helper: replay a whole sequence of answers (oldest
 * first) starting from pInit, returning the full trace of mastery
 * probabilities including the starting value. Useful for tests and
 * for charting a student's mastery curve over time.
 *
 * @param {number} pInit - starting mastery probability
 * @param {boolean[]} answers - sequence of correct/incorrect answers
 * @param {object} params - BKT params (pTransit, pGuess, pSlip)
 * @returns {number[]} trace; trace[0] === pInit, trace[i] is mastery
 *                      after the i-th answer
 */
export function traceMastery(pInit, answers, params = DEFAULT_PARAMS) {
  const trace = [pInit];
  let p = pInit;
  for (const correct of answers) {
    p = updateMastery(p, correct, params);
    trace.push(p);
  }
  return trace;
}

/**
 * A topic is considered "mastered" once mastery crosses a threshold.
 * 0.95 is the conventional default in BKT literature (Corbett &
 * Anderson). This is a policy decision, not part of the core math —
 * kept separate so it's easy to tune without touching the equations.
 */
export function isMastered(pMastery, threshold = 0.95) {
  return pMastery >= threshold;
}
