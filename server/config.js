import "dotenv/config";

export const config = {
  port:         process.env.PORT        || 3001,
  jwtSecret:    process.env.JWT_SECRET  || "dev-secret-change-me",
  dbPath:       process.env.DB_PATH     || "./server/db/adaptive_tutor.sqlite",
  nodeEnv:      process.env.NODE_ENV    || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  llmProvider:  process.env.LLM_PROVIDER  || "mock",
  // LLM API keys — add as many as you have; the system tries them in order
  groqApiKey:    process.env.GROQ_API_KEY      || "",
  googleAiKey:   process.env.GOOGLE_AI_KEY     || "",
  openRouterKey: process.env.OPENROUTER_API_KEY || "",
};
