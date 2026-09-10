# Adaptive Tutor — Knowledge-Tracing Agent
### Project setup doc — paste into a new Claude.ai Project, then use this file as your build companion

---

## 1. Paste this into your new Claude Project

When you create a Project in Claude.ai, you'll see a **name**, a short **description**, and a **custom instructions** field. Use these exactly:

**Project name**
```
Adaptive Tutor — Knowledge Tracing Agent
```

**Project description** (short field)
```
A fresher portfolio project: a Bayesian Knowledge Tracing engine estimates a
student's per-topic mastery from quiz responses, and a Claude-powered agent
decides what to ask next and generates the question/hint/explanation text.
React + Node.js stack, zero-cost tooling, built solo.
```

**Custom instructions** (paste this whole block — this is what keeps every chat in this Project consistent as you build over multiple sessions)
```
You are helping me build a solo fresher portfolio project called "Adaptive
Tutor — Knowledge Tracing Agent." Treat yourself as a senior engineer pairing
with a junior dev who is learning as they go. Keep these constraints in mind
in every response:

GOAL: Build a tutoring web app where a Bayesian Knowledge Tracing (BKT)
engine tracks per-topic mastery probability from a student's quiz answers,
and a Claude API agent (Haiku model) makes the next-step decision and
generates the actual question/hint/explanation text. This must stay simple
enough for one person to build and fully explain in a 45-minute interview.

SCOPE DISCIPLINE: Do not suggest deep learning, knowledge graphs, multi-agent
frameworks (LangChain/CrewAI/AutoGen), vector databases, or anything that
adds infrastructure without adding interview-defensible insight. If I ask for
something that breaks the "not complex" constraint, push back and explain why
the simpler version is better for this specific goal before giving in.

STACK: React (Vite) frontend with Tailwind CSS, Node.js + Express backend
(or Next.js API routes if I choose to merge them), SQLite for storage, plain
JavaScript for the BKT math (no ML libraries needed — it's four equations).
Claude API (claude-haiku-4-5) for question/hint/explanation generation only.
Everything must run free: local SQLite, free-tier hosting (Vercel/Render),
GitHub for version control.

WHEN WRITING CODE: Keep functions small and commented like I'll need to
explain every line in an interview. Prefer clarity over cleverness. Always
note which Claude API calls cost tokens so I can keep my dev-time usage low
(e.g., suggest mocking the Claude response with hardcoded JSON while I build
the UI, and only flipping on real API calls once the UI works).

WHEN EXPLAINING ML CONCEPTS: Always connect the math back to what an
interviewer would ask — "why BKT over a neural net," "what does P(guess) vs
P(slip) actually represent," "how would you evaluate this." I should always
be able to say in my own words why each design choice was made.

TONE: Direct, practical, no fluff. Tell me when an idea is overengineered.
```

---

## 2. Architecture (see the diagram above)

- **Frontend (React + Vite + Tailwind):** quiz UI, mastery dashboard, calls your backend — never calls Claude directly (keep your API key server-side only).
- **Backend (Node.js + Express):** owns the BKT engine and is the only thing that talks to the Claude API.
- **BKT engine (plain JS, no library):** pure math, zero cost, updates mastery probability after every answer.
- **Claude agent (Haiku):** called only when you need generated text — a new question, a hint, an explanation, a "why this topic next" rationale.
- **Database (SQLite):** one file, zero setup, stores topics, BKT parameters, and per-student state.

The split matters for your interview: **the BKT engine makes the decision, Claude generates the language.** That's a clean, explainable division of labor — not "an LLM doing everything."

---

## 3. The ML core: Bayesian Knowledge Tracing, explained simply

For each topic, you track one number: **P(L)** — the probability the student has mastered it. Four parameters control how it updates after each answer:

| Parameter | Meaning |
|---|---|
| `P(L0)` | Prior probability of mastery before any evidence (start around 0.3 if unknown) |
| `P(T)` | Probability of transitioning from "not mastered" to "mastered" after one practice opportunity |
| `P(G)` | Probability of guessing correctly *despite not* having mastered it |
| `P(S)` | Probability of slipping (answering wrong *despite* having mastered it) |

**Update step**, after observing whether the student got the question right or wrong:

```
If correct:
  P(L | correct) = P(L) * (1 - P(S)) / [ P(L) * (1 - P(S)) + (1 - P(L)) * P(G) ]

If incorrect:
  P(L | incorrect) = P(L) * P(S) / [ P(L) * P(S) + (1 - P(L)) * (1 - P(G)) ]

Then apply learning:
  P(L_new) = P(L | observation) + (1 - P(L | observation)) * P(T)
```

That's it — no gradient descent, no training loop. You can hand-set reasonable defaults (`P(T)=0.3, P(G)=0.2, P(S)=0.1`) per topic, or — for a stronger interview answer — fit them per topic using a small grid search against historical response data once you have some.

**Decision policy (this is your "agent brain" before Claude gets involved):**
```
if P(L) < 0.5         → stay on this topic, same difficulty
if 0.5 <= P(L) < 0.85 → stay on this topic, increase difficulty
if P(L) >= 0.85        → mark topic mastered, move to next weakest topic
```

---

## 4. The agent loop (where Claude comes in)

1. **Observe** — student submits an answer (correct/incorrect) for the current question.
2. **Update** — BKT engine recalculates `P(L)` for that topic.
3. **Decide** — the rule-based policy above picks the next topic + difficulty. *No LLM call yet — this is free.*
4. **Act** — backend calls Claude (Haiku) with a structured prompt asking for a question + hint at that exact topic/difficulty, requesting JSON output so your frontend can render it directly.
5. **Loop** — repeat from step 1.

**Example prompt structure for step 4** (use Claude's structured output / JSON mode so parsing is reliable):
```
System: You are a tutoring content generator. Always respond with valid JSON
matching this schema: {"question": string, "options": string[4],
"correct_index": number, "hint": string, "difficulty": "easy"|"medium"|"hard"}

User: Topic: "Python list comprehensions". Difficulty: medium.
Student's current mastery estimate: 0.62.
Generate one multiple-choice question appropriate for this mastery level.
```

Keep this to **one Claude call per question generated** — don't chain multiple agent calls per turn, that's where costs and complexity both spiral for no real benefit at this scope.

---

## 5. Build roadmap

**Phase 0 — Setup (half a day)**
- [ ] GitHub repo
- [ ] Anthropic console account + API key (note your free credit balance)
- [ ] `npm create vite@latest` for frontend, `npm init` for backend

**Phase 1 — BKT engine (no UI yet)**
- [ ] Write the BKT update function in plain JS
- [ ] Write 5-10 unit tests with mock answer sequences — confirm mastery rises with correct answers, falls with incorrect ones
- [ ] This phase has zero API cost — get it fully working before touching Claude

**Phase 2 — Backend + storage**
- [ ] Express routes: `POST /answer`, `GET /next-question`, `GET /mastery`
- [ ] SQLite schema: `topics`, `student_state`, `response_log`
- [ ] Mock the Claude response with a hardcoded JSON object so you can build and test the full loop for free

**Phase 3 — Wire up Claude**
- [ ] Replace the mock with a real Haiku API call
- [ ] Add a simple cache: don't regenerate a question for the same topic/difficulty pair you already have one for
- [ ] Test with ~10-20 real calls total — track this against your free credit

**Phase 4 — Frontend (see section 6 for the vibe)**
- [ ] Quiz screen: question, options, instant feedback
- [ ] Mastery dashboard: per-topic progress, streaks
- [ ] Loading/empty states — don't skip these, they're part of "interactive and attractive"

**Phase 5 — Evaluation (this is what makes it an ML project, not just an app)**
- [ ] Simulate 50-100 synthetic students with known "true" mastery and noisy responses
- [ ] Plot predicted P(L) vs. true mastery over time — a calibration curve
- [ ] Compare against a naive baseline (e.g., rolling % correct) and show BKT tracks faster/more accurately
- [ ] Write this up — it's your strongest interview material

**Phase 6 — Deploy + polish**
- [ ] Frontend → Vercel (free)
- [ ] Backend → Render or Railway free tier (or fold into Vercel serverless functions)
- [ ] README with architecture diagram, demo GIF, and the evaluation plot
- [ ] Record a 2-minute demo video — many recruiters watch before reading code

---

## 6. Frontend direction — interactive, not just a form

"Gen-Z vibe" in practice means: dark-mode-first, confident typography, visible progress/gamification, and motion that responds to the student rather than decorating the page. A few concrete choices:

- **Dark mode default**, with one accent gradient used sparingly (not on every element)
- **Streaks and XP-style mastery bars** instead of plain percentages — make progress feel earned
- **Micro-animations on feedback** (correct/incorrect) using Framer Motion — keep them under ~300ms, snappy not gimmicky
- **Give the agent a face** — even a simple animated avatar/icon for "the tutor" makes the agent concept tangible to a viewer, and it's a great hook in your demo video
- **Playful but not childish copy** — confident, encouraging microcopy beats generic "Correct!" / "Incorrect."

When you're ready to actually build the frontend, start a new chat in this Project and ask for the React components directly — that's a separate, code-heavy conversation from this planning doc.

---

## 7. Keeping it at $0

- Build and test BKT logic with **zero Claude calls** (it's pure JS)
- Design and refine your Claude prompts **manually in Claude.ai chat** before wiring up the API — costs nothing, lets you iterate fast
- Mock Claude's JSON responses while building the frontend
- Use **Haiku**, not Sonnet or Opus, for all agent calls — it's the cheapest and plenty capable for short structured generation tasks like this
- Cache generated questions per topic/difficulty so you're not regenerating the same content
- Host on free tiers: Vercel (frontend), Render/Railway free tier or Vercel serverless (backend), SQLite (no hosted DB needed for a solo demo)
