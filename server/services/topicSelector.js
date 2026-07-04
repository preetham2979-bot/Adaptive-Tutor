import { isMastered } from "../bkt/bktEngine.js";

/**
 * Picks which topic to practice next.
 *
 * Two fixes over the naive "always pick lowest mastery" approach:
 *
 * 1. Near-tie randomisation — when multiple topics have equal or very
 *    close mastery (within 5%), pick randomly among them. This prevents
 *    always drilling topic 1 when everything starts at 0%.
 *
 * 2. Recent-topic exclusion — avoids giving the same topic back-to-back
 *    by excluding the most recently answered topic from the candidate
 *    pool (unless it is the only option).
 */
export function selectNextTopic(topicsWithMastery, excludeTopicId = null) {
  if (topicsWithMastery.length === 0) {
    throw new Error("No topics available to select from");
  }

  const unmastered = topicsWithMastery.filter(t => !isMastered(t.mastery));
  const pool = unmastered.length > 0 ? unmastered : topicsWithMastery;

  // All topics within 5% of the weakest are equally valid candidates.
  const minMastery = Math.min(...pool.map(t => t.mastery));
  const NEAR_TIE   = 0.05;
  const candidates = pool.filter(t => t.mastery <= minMastery + NEAR_TIE);

  // Exclude the most recently answered topic if other candidates exist.
  const withoutRecent = excludeTopicId
    ? candidates.filter(t => t.id !== excludeTopicId)
    : candidates;

  const finalPool = withoutRecent.length > 0 ? withoutRecent : candidates;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
