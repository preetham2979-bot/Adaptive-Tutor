/**
 * The exact JSON shape a generated question must have, and a strict
 * validator that enforces it. Both mockClaude.js (dev/test) and
 * claudeClient.js (real API) run their output through this same
 * validator — that's what guarantees the rest of the app never has to
 * care which one produced the question.
 *
 * Deliberately NOT using the Claude API's beta "Structured Outputs"
 * feature here: as of writing it doesn't yet reliably cover Haiku 4.5,
 * and a hand-written validator is simpler to explain and has zero
 * dependency on a beta header.
 */

export function validateQuestionShape(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Question payload is not an object");
  }

  if (typeof data.question !== "string" || !data.question.trim()) {
    throw new Error("Missing or empty 'question' string");
  }

  if (
    !Array.isArray(data.options) ||
    data.options.length !== 4 ||
    data.options.some((opt) => typeof opt !== "string" || !opt.trim())
  ) {
    throw new Error("'options' must be an array of exactly 4 non-empty strings");
  }

  if (
    !Number.isInteger(data.correctOptionIndex) ||
    data.correctOptionIndex < 0 ||
    data.correctOptionIndex > 3
  ) {
    throw new Error("'correctOptionIndex' must be an integer between 0 and 3");
  }

  if (typeof data.hint !== "string" || !data.hint.trim()) {
    throw new Error("Missing or empty 'hint' string");
  }

  if (typeof data.explanation !== "string" || !data.explanation.trim()) {
    throw new Error("Missing or empty 'explanation' string");
  }

  return {
    question: data.question,
    options: data.options,
    correctOptionIndex: data.correctOptionIndex,
    hint: data.hint,
    explanation: data.explanation,
  };
}
