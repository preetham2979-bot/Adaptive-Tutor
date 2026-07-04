import { config } from "../config.js";
import { mockGenerateQuestion } from "./mockClaude.js";
import { groqGenerateQuestion } from "./groqClient.js";

/**
 * The single entry point the rest of the app calls to generate a question.
 * Reads LLM_PROVIDER and dispatches to the right implementation.
 * Nothing outside this file knows or cares which provider is active.
 *
 *   LLM_PROVIDER=mock  (default) — zero API calls, zero cost, for development
 *   LLM_PROVIDER=groq  — Groq free tier, Llama 3.3 70B, no credit card needed
 */
export async function generateQuestion(params) {
  if (config.llmProvider === "groq") {
    return groqGenerateQuestion(params);
  }
  return mockGenerateQuestion(params);
}
