import { validateQuestionShape } from "./questionSchema.js";

/**
 * Mock question generator. Returns the exact same shape claudeClient.js
 * returns (both are run through validateQuestionShape), so the rest of
 * the app — routes, and eventually the frontend — never has to know or
 * care whether this or the real Claude API produced the question.
 *
 * This is what lets us build and test the entire session flow without
 * spending real API calls, per the "minimize real API calls during
 * development" constraint.
 */
export async function mockGenerateQuestion({ topicName, topicDescription, difficulty, language }) {
  // Simulate real network latency so the rest of the app (loading
  // states, timeouts, etc.) behaves the same as it will in live mode.
  await new Promise((resolve) => setTimeout(resolve, 150));

  const mock = {
    question: `[MOCK] A ${difficulty} ${language} question about "${topicName}" — which statement is correct?`,
    options: [
      `A plausible-sounding but incorrect claim about ${topicName}`,
      `The actually correct statement about ${topicName}`,
      `A common beginner misconception about ${topicName}`,
      `An off-by-one-style wrong answer about ${topicName}`,
    ],
    correctOptionIndex: 1,
    hint: `[MOCK] Think about how ${topicName} actually behaves in ${language}.`,
    explanation: `[MOCK] Option B is correct — this is mock content standing in for ${topicName} (${topicDescription}).`,
  };

  return validateQuestionShape(mock);
}
