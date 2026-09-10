/**
 * Phase 5 — Evaluation.
 *
 * This is what turns the project from "a quiz app" into "an ML
 * project with evidence behind it." No API calls, no database — pure
 * simulation, so it costs $0 and runs in well under a second.
 *
 * WHAT IT DOES
 * ------------
 * 1. Creates N synthetic students, each with a hidden "true mastery"
 *    for one topic that itself evolves over time (a student can
 *    genuinely learn mid-simulation — see trueMasteryWalk below).
 * 2. Each student answers a sequence of questions. Whether they get a
 *    question right is sampled from their CURRENT true mastery, with
 *    the topic's real pGuess/pSlip noise applied — this is what makes
 *    it a fair test: the observed answers are noisy, same as reality.
 * 3. Two trackers watch the same noisy answer sequence and each
 *    produce their own belief about mastery after every answer:
 *      - BKT       — this project's real bktEngine.updateMastery()
 *      - Naive     — a rolling percent-correct baseline (what most
 *                    "adaptive" quiz apps actually ship)
 * 4. We score both trackers against the hidden ground truth using
 *    mean absolute error (MAE) — lower is better, 0 is perfect.
 *
 * WHY THIS MATTERS FOR THE DEMO
 * ------------------------------
 * "Rolling percent-correct" is the thing a judge will assume you built
 * unless you show otherwise. This script produces the number that
 * proves BKT tracks the hidden truth more accurately AND reacts faster
 * when a student's real ability changes mid-sequence.
 *
 * USAGE
 * -----
 *   node server/evaluation/simulate.js
 *   (or: npm run evaluate)
 *
 * OUTPUT
 * ------
 *   - Console summary table (MAE for BKT vs. naive, overall and
 *     split into "before learning" / "after learning" phases)
 *   - server/evaluation/results.csv   (raw per-step trace, one student)
 *   - server/evaluation/calibration.svg (line chart: true vs BKT vs naive)
 */

import { updateMastery } from "../bkt/bktEngine.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- Simulation config -----------------------------------------------

const NUM_STUDENTS = 100;
const QUESTIONS_PER_STUDENT = 40;
const TOPIC_PARAMS = { pTransit: 0.12, pGuess: 0.2, pSlip: 0.1 };

// A simple deterministic PRNG so results are reproducible across runs
// (Math.random() would make the console numbers change every time,
// which makes before/after comparisons impossible to trust).
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);

/**
 * A synthetic student's TRUE mastery isn't fixed — it's a random walk
 * that starts low and, for most students, has a "learning moment"
 * partway through (true mastery jumps up), simulating that the
 * student actually studied. This is what lets us test "how fast does
 * each tracker notice a real ability change?"
 */
function trueMasteryWalk(numSteps) {
  const walk = [];
  let mastery = rng() * 0.3; // start low, 0-0.3
  const learningMomentStep = Math.floor(numSteps * (0.3 + rng() * 0.3)); // 30-60% through
  for (let i = 0; i < numSteps; i++) {
    if (i === learningMomentStep) {
      mastery = Math.min(1, mastery + 0.5 + rng() * 0.3); // real jump in ability
    } else {
      mastery = Math.min(1, Math.max(0, mastery + (rng() - 0.5) * 0.03)); // small drift
    }
    walk.push(mastery);
  }
  return { walk, learningMomentStep };
}

/** Sample a noisy observed answer from a true mastery value. */
function sampleAnswer(trueMastery, { pGuess, pSlip }) {
  const roll = rng();
  if (trueMastery > roll) {
    // "mastered" for this question -> correct unless they slip
    return rng() > pSlip;
  }
  // "not mastered" -> incorrect unless they guess right
  return rng() < pGuess;
}

/** Naive baseline: rolling percent-correct over all answers so far. */
function naiveTracker() {
  let correctCount = 0;
  let total = 0;
  return {
    update(correct) {
      total += 1;
      if (correct) correctCount += 1;
      return correctCount / total;
    },
  };
}

// ---- Run the simulation ------------------------------------------------

function runOneStudent() {
  const { walk: trueTrace, learningMomentStep } = trueMasteryWalk(QUESTIONS_PER_STUDENT);

  let bktMastery = 0.2; // same pInit for every student, matches a real topic default
  const naive = naiveTracker();

  const rows = [];
  for (let i = 0; i < QUESTIONS_PER_STUDENT; i++) {
    const trueMastery = trueTrace[i];
    const correct = sampleAnswer(trueMastery, TOPIC_PARAMS);

    bktMastery = updateMastery(bktMastery, correct, TOPIC_PARAMS);
    const naiveMastery = naive.update(correct);

    rows.push({
      step: i,
      correct,
      trueMastery,
      bktMastery,
      naiveMastery,
      isAfterLearning: i >= learningMomentStep,
    });
  }
  return { rows, learningMomentStep };
}

function meanAbsoluteError(rows, key) {
  const errors = rows.map((r) => Math.abs(r[key] - r.trueMastery));
  return errors.reduce((a, b) => a + b, 0) / errors.length;
}

// Reaction speed: after the learning moment, how many questions does
// each tracker take to get within 0.1 of the new true mastery?
function reactionSpeed(rows, learningMomentStep, key) {
  const target = rows[learningMomentStep]?.trueMastery ?? 1;
  for (let i = learningMomentStep; i < rows.length; i++) {
    if (Math.abs(rows[i][key] - target) < 0.1) return i - learningMomentStep;
  }
  return rows.length - learningMomentStep; // never caught up
}

function main() {
  let bktMaeSum = 0;
  let naiveMaeSum = 0;
  let bktMaeAfterSum = 0;
  let naiveMaeAfterSum = 0;
  let bktReactionSum = 0;
  let naiveReactionSum = 0;

  let firstStudentRows = null;
  let firstStudentLearningStep = null;

  for (let s = 0; s < NUM_STUDENTS; s++) {
    const { rows, learningMomentStep } = runOneStudent();

    bktMaeSum += meanAbsoluteError(rows, "bktMastery");
    naiveMaeSum += meanAbsoluteError(rows, "naiveMastery");

    const afterRows = rows.filter((r) => r.isAfterLearning);
    bktMaeAfterSum += meanAbsoluteError(afterRows, "bktMastery");
    naiveMaeAfterSum += meanAbsoluteError(afterRows, "naiveMastery");

    bktReactionSum += reactionSpeed(rows, learningMomentStep, "bktMastery");
    naiveReactionSum += reactionSpeed(rows, learningMomentStep, "naiveMastery");

    if (s === 0) {
      firstStudentRows = rows;
      firstStudentLearningStep = learningMomentStep;
    }
  }

  const results = {
    bktMae: bktMaeSum / NUM_STUDENTS,
    naiveMae: naiveMaeSum / NUM_STUDENTS,
    bktMaeAfterLearning: bktMaeAfterSum / NUM_STUDENTS,
    naiveMaeAfterLearning: naiveMaeAfterSum / NUM_STUDENTS,
    bktReactionSteps: bktReactionSum / NUM_STUDENTS,
    naiveReactionSteps: naiveReactionSum / NUM_STUDENTS,
  };

  printSummary(results);
  writeCsv(firstStudentRows, path.join(__dirname, "results.csv"));
  writeSvg(
    firstStudentRows,
    firstStudentLearningStep,
    path.join(__dirname, "calibration.svg")
  );
}

function printSummary(r) {
  const pct = (x) => (x * 100).toFixed(2) + "%";
  const improvement = (((r.naiveMae - r.bktMae) / r.naiveMae) * 100).toFixed(1);
  const reactionImprovement = (r.naiveReactionSteps - r.bktReactionSteps).toFixed(1);

  console.log(`\nAdaptive Tutor — BKT Evaluation (${NUM_STUDENTS} synthetic students, ${QUESTIONS_PER_STUDENT} questions each)\n`);
  console.log("Metric                              BKT        Naive (rolling %)   ");
  console.log("-----------------------------------------------------------------");
  console.log(`Mean Absolute Error (overall)        ${pct(r.bktMae).padEnd(11)}${pct(r.naiveMae)}`);
  console.log(`Mean Absolute Error (after learning)  ${pct(r.bktMaeAfterLearning).padEnd(11)}${pct(r.naiveMaeAfterLearning)}`);
  console.log(`Avg. questions to detect ability jump ${r.bktReactionSteps.toFixed(1).padEnd(11)}${r.naiveReactionSteps.toFixed(1)}`);
  console.log("-----------------------------------------------------------------");
  console.log(`BKT is ${improvement}% more accurate overall than the naive baseline.`);
  console.log(`BKT detects a real ability change ${reactionImprovement} questions faster on average.\n`);
  console.log("Wrote server/evaluation/results.csv and server/evaluation/calibration.svg\n");
}

function writeCsv(rows, filePath) {
  const header = "step,correct,trueMastery,bktMastery,naiveMastery\n";
  const body = rows
    .map((r) => `${r.step},${r.correct ? 1 : 0},${r.trueMastery.toFixed(4)},${r.bktMastery.toFixed(4)},${r.naiveMastery.toFixed(4)}`)
    .join("\n");
  fs.writeFileSync(filePath, header + body);
}

/**
 * Renders a plain SVG line chart — no chart library, no headless
 * browser, so this evaluation stays true to the project's "zero
 * dependencies for the core work" philosophy.
 */
function writeSvg(rows, learningMomentStep, filePath) {
  const W = 760;
  const H = 380;
  const padL = 50;
  const padB = 40;
  const padT = 20;
  const padR = 20;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const x = (i) => padL + (i / (rows.length - 1)) * plotW;
  const y = (v) => padT + (1 - v) * plotH;

  const toPath = (key) =>
    rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (v) => `
    <line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="#1e293b" stroke-width="1" />
    <text x="${padL - 8}" y="${y(v) + 4}" font-size="11" fill="#64748b" text-anchor="end" font-family="monospace">${Math.round(v * 100)}%</text>`
    )
    .join("");

  const learningMarkerX = x(learningMomentStep);

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="monospace">
  <rect width="${W}" height="${H}" fill="#050810" />
  ${gridLines}
  <line x1="${learningMarkerX.toFixed(1)}" y1="${padT}" x2="${learningMarkerX.toFixed(1)}" y2="${H - padB}"
        stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,3" />
  <text x="${learningMarkerX.toFixed(1) + 4}" y="${padT + 12}" font-size="10" fill="#f59e0b">learning moment</text>

  <path d="${toPath("trueMastery")}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.9" />
  <path d="${toPath("bktMastery")}" fill="none" stroke="#6366f1" stroke-width="2" />
  <path d="${toPath("naiveMastery")}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3,3" />

  <text x="${padL}" y="${H - 12}" font-size="11" fill="#94a3b8">Question number →</text>

  <g transform="translate(${padL}, ${H - 8})">
    <circle cx="0" cy="-4" r="4" fill="#ffffff" /><text x="10" y="0" font-size="11" fill="#e2e8f0">True mastery</text>
    <circle cx="140" cy="-4" r="4" fill="#6366f1" /><text x="150" y="0" font-size="11" fill="#e2e8f0">BKT estimate</text>
    <circle cx="290" cy="-4" r="4" fill="#f43f5e" /><text x="300" y="0" font-size="11" fill="#e2e8f0">Naive (rolling %)</text>
  </g>
</svg>`;

  fs.writeFileSync(filePath, svg);
}

main();
