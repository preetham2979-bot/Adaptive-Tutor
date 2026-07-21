import OpenAI from "openai";
import { config } from "../config.js";
import { QUESTION_TOOL, buildSystemPrompt, buildUserPrompt } from "./promptTemplates.js";
import { validateQuestionShape } from "./questionSchema.js";

const PROVIDERS = [
  {
    name:    "Groq",
    apiKey:  config.groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
    model:   "llama-3.3-70b-versatile",
  },
  {
    name:    "Google",
    apiKey:  config.googleAiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    model:   "gemini-1.5-flash",
  },
  {
    name:    "OpenRouter",
    apiKey:  config.openRouterKey,
    baseURL: "https://openrouter.ai/api/v1",
    model:   "meta-llama/llama-3.3-70b-instruct:free",
  },
].filter(p => p.apiKey);

async function tryProvider(provider, params) {
  const client = new OpenAI({
    apiKey:  provider.apiKey,
    baseURL: provider.baseURL,
  });

  const response = await client.chat.completions.create({
    model:       provider.model,
    max_tokens:  1024,
    temperature: 0.5,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user",   content: buildUserPrompt(params) },
    ],
    tools:        [QUESTION_TOOL],
    tool_choice:  { type: "function", function: { name: QUESTION_TOOL.function.name } },
  });

  const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool_calls in response");

  let parsed;
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error("tool_call arguments were not valid JSON");
  }

  const validated = validateQuestionShape(parsed);

  // Warn on likely correctOptionIndex mismatch
  const chosen = validated.options[validated.correctOptionIndex];
  if (!validated.explanation.toLowerCase().includes(chosen.toLowerCase())) {
    console.warn(
      `[${provider.name}] Possible index mismatch: options[${validated.correctOptionIndex}]="${chosen}" | topic=${params.topicName}`
    );
  }

  return validated;
}

/**
 * Tries each configured provider in order.
 * Falls back to the next on rate limits or JSON parse errors.
 */
export async function groqGenerateQuestion(params) {
  if (!PROVIDERS.length) {
    throw new Error("No LLM API keys configured. Set GROQ_API_KEY, GOOGLE_AI_KEY, or OPENROUTER_API_KEY.");
  }

  let lastError;

  for (const provider of PROVIDERS) {
    try {
      console.log(`[LLM] Trying ${provider.name}...`);
      const result = await tryProvider(provider, params);
      console.log(`[LLM] Success with ${provider.name}`);
      return result;
    } catch (err) {
      lastError = err;

      const isRateLimit =
        err.status === 429 ||
        err.message?.toLowerCase().includes("rate") ||
        err.message?.toLowerCase().includes("quota");

      const isParseError =
        err.message?.includes("JSON") ||
        err.message?.includes("tool_calls") ||
        err.message?.includes("tool_use_failed");

      if (isRateLimit) {
        console.warn(`[LLM] ${provider.name} rate limited — trying next provider...`);
        continue;
      }
      if (isParseError) {
        console.warn(`[LLM] ${provider.name} parse error — trying next provider...`);
        continue;
      }

      // Unexpected error — don't retry
      throw err;
    }
  }

  throw lastError ?? new Error("All LLM providers failed");
}
