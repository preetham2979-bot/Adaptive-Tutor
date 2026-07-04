import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config.js";
import { seedTopics } from "./db/seedTopics.js";
import statsRoutes from "./routes/stats.js";
import authRoutes from "./routes/auth.js";
import topicsRoutes from "./routes/topics.js";
import sessionRoutes from "./routes/session.js";

seedTopics();

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/topics", topicsRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/stats", statsRoutes);

// Centralized error handler — keeps try/catch out of every route.
// Preserves a real status code when the error carries one (e.g. the
// body-parser SyntaxError for malformed JSON sets statusCode: 400);
// only truly unexpected errors fall back to 500.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const message = status < 500 ? err.message : "Internal server error";
  res.status(status).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`Adaptive Tutor backend listening on http://localhost:${config.port}`);
});
