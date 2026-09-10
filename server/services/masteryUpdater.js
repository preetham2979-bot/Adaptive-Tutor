import { updateMastery } from "../bkt/bktEngine.js";

/**
 * Bridges a DB topic row to the pure BKT engine.
 *
 * This is the ONLY place the answer route should compute a new mastery
 * value. It exists as its own tiny, database-free function (rather than
 * being inlined in the route handler) for one reason: it makes the
 * "did we actually call the real BKT math?" question unit-testable
 * without spinning up Express or SQLite.
 *
 * @param {{p_transit:number, p_guess:number, p_slip:number}} topic
 *        A row from the `topics` table (or any object with these
 *        three columns) — each topic carries its own guess/slip/
 *        transit rates, seeded in server/bkt/topics.js.
 * @param {number} pMasteryBefore - current p(mastery) for this
 *        student+topic, in [0, 1]
 * @param {boolean} correct - whether the student answered correctly
 * @returns {number} updated p(mastery), in [0, 1]
 */
export function computeMasteryUpdate(topic, pMasteryBefore, correct) {
  return updateMastery(pMasteryBefore, correct, {
    pTransit: topic.p_transit,
    pGuess: topic.p_guess,
    pSlip: topic.p_slip,
  });
}
