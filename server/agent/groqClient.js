import Groq from "groq-sdk";
import { config } from "../config.js";
import { QUESTION_TOOL, buildSystemPrompt, buildUserPrompt } from "./promptTemplates.js";
import { validateQuestionShape } from "./questionSchema.js";

const MODEL   = "llama-3.3-70b-versatile";
const RETRIES = 2; // number of extra attempts after the first failure

let client = null;
function getClient() {
  if (!client) {
    if (!config.groqApiKey) {
      throw new Error("GROQ_API_KEY is not set. Set LLM_PROVIDER=mock to develop without a real key.");
    }
    client = new Groq({ apiKey: config.groqApiKey });
  }
  return client;
}

async function callOnce({ topicName, topicDescription, difficulty, language }) {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.5, // lower = more consistent structure, less likely to generate invalid JSON
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user",   content: buildUserPrompt({ topicName, topicDescription, difficulty, language }) },
    ],
    tools: [QUESTION_TOOL],
    tool_choice: { type: "function", function: { name: QUESTION_TOOL.function.name } },
  });

  const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("Groq response contained no tool_calls");
  }

  let parsed;
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error(`tool_call arguments were not valid JSON — likely contained triple backticks`);
  }

  const validated = validateQuestionShape(parsed);

  // Warn on likely correctOptionIndex mismatch (can't auto-fix, but at
  // least visible in server logs)
  const chosen = validated.options[validated.correctOptionIndex];
  if (!validated.explanation.toLowerCase().includes(chosen.toLowerCase())) {
    console.warn(
      `[groqClient] Possible index mismatch: options[${validated.correctOptionIndex}]="${chosen}" ` +
      `| topic=${topicName} difficulty=${difficulty}`
    );
  }

  return validated;
}

/**
 * Wraps callOnce with automatic retry on Groq tool_use_failed errors.
 *
 * The most common failure mode is the model generating triple backticks
 * inside the JSON string, which breaks Groq's tool-call parser and
 * returns a 400 "tool_use_failed". The updated prompt bans this, but
 * retrying catches any remaining cases without surfacing an error to
 * the student.
 */
export async function groqGenerateQuestion(params) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      return await callOnce(params);
    } catch (err) {
      lastError = err;
      const isRetryable =
        err?.status === 400 ||              // Groq tool_use_failed
        err?.message?.includes("tool_calls") ||
        err?.message?.includes("JSON");
      if (!isRetryable) throw err;          // non-retryable error — fail fast
      console.warn(`[groqClient] Attempt ${attempt + 1} failed: ${err.message}. Retrying…`);
    }
  }
  throw lastError;
}
