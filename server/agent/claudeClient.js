import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { QUESTION_TOOL, buildSystemPrompt, buildUserPrompt } from "./promptTemplates.js";
import { validateQuestionShape } from "./questionSchema.js";

const MODEL = "claude-haiku-4-5-20251001";

let client = null;
function getClient() {
  if (!client) {
    if (!config.anthropicApiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Set CLAUDE_MODE=mock to develop without a real key."
      );
    }
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

/**
 * Calls the real Claude API to generate one multiple-choice question.
 * Only invoked when CLAUDE_MODE=live — see generateQuestion.js.
 *
 * Forces Claude to call QUESTION_TOOL rather than asking it to write
 * free-text JSON: the response arrives as already-structured data in
 * a tool_use content block, with no JSON.parse needed on our end.
 */
export async function liveGenerateQuestion({ topicName, topicDescription, difficulty, language }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    tools: [QUESTION_TOOL],
    tool_choice: { type: "tool", name: QUESTION_TOOL.name },
    messages: [
      { role: "user", content: buildUserPrompt({ topicName, topicDescription, difficulty, language }) },
    ],
  });

  const toolUseBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolUseBlock) {
    throw new Error("Claude response contained no tool_use block");
  }

  // toolUseBlock.input is already a parsed object (the SDK handles the
  // JSON parsing of the tool call arguments) — still validated below,
  // since a JSON-schema-shaped tool call doesn't guarantee the kind of
  // business-level checks (non-empty strings, etc.) validateQuestionShape enforces.
  return validateQuestionShape(toolUseBlock.input);
}
