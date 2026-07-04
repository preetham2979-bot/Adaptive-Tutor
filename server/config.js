import "dotenv/config";

export const config = {
  port:         process.env.PORT        || 3001,
  jwtSecret:    process.env.JWT_SECRET  || "dev-secret-change-me",
  dbPath:       process.env.DB_PATH     || "./server/db/adaptive_tutor.sqlite",
  nodeEnv:      process.env.NODE_ENV    || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  llmProvider:  process.env.LLM_PROVIDER  || "mock",
  groqApiKey:   process.env.GROQ_API_KEY  || "",
  // Email — OTP verification via Resend (resend.com, free tier).
  // Sign up → API Keys → Create → paste the re_xxx key here.
  resendApiKey: process.env.RESEND_API_KEY || "",
};
