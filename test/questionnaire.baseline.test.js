/**
 * FUNCTIONAL BASELINE — gut questionnaire scoring.
 * Same differential approach as the calculator suite: the legacy scoring
 * is re-transcribed independently and asserted equal to the engine.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  QUESTIONS,
  scoreGutQuestionnaire,
  buildGutPayload,
} from "../src/assets/js/questionnaires/gut-engine.js";

/* ---------- legacy reference (verbatim) ----------
   The count is taken from the live question set: this reference exists to
   verify the FORMULA (sum ÷ (n × 5), banded at 20/40/60/80), not to pin a
   particular number of questions. */
function legacyScore(answers, questionCount = QUESTIONS.length) {
  let totalScore = 0;
  for (const key in answers) totalScore += answers[key];
  const maxScore = questionCount * 5;
  const percentage = (totalScore / maxScore) * 100;
  let category;
  if (percentage <= 20) category = "Excellent";
  else if (percentage <= 40) category = "Good";
  else if (percentage <= 60) category = "Fair";
  else if (percentage <= 80) category = "Poor";
  else category = "Very Poor";
  return { percentage, category };
}

const answerAll = (score) =>
  Object.fromEntries(QUESTIONS.map((q) => [q.id, score]));

describe("Gut questionnaire — structure", () => {
  test("has 26 questions", () => {
    assert.equal(QUESTIONS.length, 26);
  });

  // 2026-08-11 reset: the old scheme froze ids across edits, so retired
  // ids 16/18/25 sat empty and live answers ran out to Q27-Q29. Old data
  // is archived; ids now equal position so Q<n> lands in column Q<n>.
  test("ids are sequential 1..26 — the Nth question has id N", () => {
    const ids = QUESTIONS.map((q) => q.id);
    assert.deepEqual(
      ids,
      Array.from({ length: 26 }, (_, i) => i + 1)
    );
  });

  test("no id exceeds 26 — Q27/Q28/Q29 must never be posted again", () => {
    for (const q of QUESTIONS) {
      assert.ok(q.id <= 26, `id ${q.id} is past the 26-question range`);
    }
  });

  test("the full 26-question map, in display order", () => {
    assert.deepEqual(
      QUESTIONS.map((q) => [q.id, q.text]),
      [
        [1, "Gassy?"],
        [2, "Bloating?"],
        [3, "Heaviness after meals?"],
        [4, "Stomach pain?"],
        [5, "Lethargy or feeling tired?"],
        [6, "Brain fog?"],
        [7, "Constipation (without laxative)?"],
        [8, "How often do you poop?"],
        [9, "Diarrhea?"],
        [10, "Mucus in stool?"],
        [11, "Undigested food in stool?"],
        [12, "Bad breath?"],
        [13, "Nausea?"],
        [14, "Heartburn / Acid Reflux?"],
        [15, "Burping?"],
        [16, "Food sensitivities / allergies?"],
        [17, "Anxiety / Depression?"],
        [18, "Joint pain?"],
        [19, "Headaches / Migraines?"],
        [20, "Sleep issues?"],
        [21, "Sugar cravings?"],
        [22, "Weight issues (Gain/Loss)?"],
        [23, "Hair fall / brittle hair?"],
        [24, "Acne?"],
        [25, "Eczema / Psoriasis / Rosacea / Rashes?"],
        [26, "Flatulence / Farting?"],
      ]
    );
  });

  test("multi-symptom questions stay whole — one question, one id", () => {
    // "Eczema / Psoriasis / Rosacea / Rashes?" is ONE question with ONE
    // answer. Splitting it on the slashes would break the column map.
    const skin = QUESTIONS.filter((q) => q.text.includes("Eczema"));
    assert.equal(skin.length, 1);
    assert.equal(skin[0].id, 25);
    assert.equal(skin[0].text, "Eczema / Psoriasis / Rosacea / Rashes?");
  });

  test("QUIRK G2 — question 8 uses a non-monotonic custom scale", () => {
    const q8 = QUESTIONS.find((q) => q.id === 8);
    assert.equal(q8.isCustomScale, true);
    assert.deepEqual(q8.scores, [1, 2, 5, 4, 3]);
    assert.equal(q8.labels.length, 5);
    assert.equal(q8.values.length, 5);
    // "Once a day" is the highest-scoring option
    assert.equal(q8.scores[2], 5);
  });

  test("only question 8 carries a custom scale", () => {
    assert.equal(QUESTIONS.filter((q) => q.isCustomScale).length, 1);
  });
});

describe("Gut questionnaire — scoring bands", () => {
  const cases = [
    { n: "all 'Never' (1)", score: 1, pct: 20, cat: "Excellent" },
    { n: "all 'Rarely' (2)", score: 2, pct: 40, cat: "Good" },
    { n: "all 'Sometimes' (3)", score: 3, pct: 60, cat: "Fair" },
    { n: "all 'Often' (4)", score: 4, pct: 80, cat: "Poor" },
    { n: "all 'Always' (5)", score: 5, pct: 100, cat: "Very Poor" },
  ];
  for (const c of cases) {
    test(c.n, () => {
      const answers = answerAll(c.score);
      const got = scoreGutQuestionnaire(answers);
      const ref = legacyScore(answers);
      assert.equal(got.percentage, c.pct, "golden percentage");
      assert.equal(got.category, c.cat, "golden category");
      assert.equal(got.percentage, ref.percentage, "differential");
      assert.equal(got.category, ref.category, "differential");
    });
  }

  test("QUIRK G1 — a perfectly healthy result floors at 20%, never 0%", () => {
    const got = scoreGutQuestionnaire(answerAll(1));
    assert.equal(got.percentage, 20);
    assert.equal(got.category, "Excellent");
    assert.equal(got.totalScore, 26);
    assert.equal(got.maxScore, 130);
  });

  test("boundary — exactly 20% is Excellent, just above is Good", () => {
    assert.equal(scoreGutQuestionnaire(answerAll(1)).category, "Excellent");
    const justOver = { ...answerAll(1), 1: 2 }; // 27/130 = 20.77%
    assert.equal(scoreGutQuestionnaire(justOver).category, "Good");
  });

  test("boundary — exactly 40 / 60 / 80 stay in the lower band", () => {
    assert.equal(scoreGutQuestionnaire(answerAll(2)).category, "Good");
    assert.equal(scoreGutQuestionnaire(answerAll(3)).category, "Fair");
    assert.equal(scoreGutQuestionnaire(answerAll(4)).category, "Poor");
  });

  test("partial answers score against the full maximum, not the answered count", () => {
    const partial = { 1: 5, 2: 5, 3: 5 }; // 15 / (26 × 5) = 11.54%
    const got = scoreGutQuestionnaire(partial);
    assert.equal(got.maxScore, 130);
    assert.ok(Math.abs(got.percentage - 11.538) < 0.01);
    assert.equal(got.category, "Excellent");
    assert.equal(got.percentage, legacyScore(partial).percentage);
  });

  test("empty answers yield 0%", () => {
    const got = scoreGutQuestionnaire({});
    assert.equal(got.percentage, 0);
    assert.equal(got.category, "Excellent");
  });
});

describe("Gut questionnaire — high symptoms (G3)", () => {
  test("captures only answers >= 4, in question order", () => {
    const answers = { ...answerAll(1), 2: 4, 5: 5, 17: 4 };
    const got = scoreGutQuestionnaire(answers);
    assert.deepEqual(got.highSymptoms, [
      "Bloating?",
      "Lethargy or feeling tired?",
      "Anxiety / Depression?",
    ]);
  });

  test("score of 3 is not a high symptom", () => {
    const got = scoreGutQuestionnaire({ ...answerAll(1), 4: 3 });
    assert.deepEqual(got.highSymptoms, []);
  });

  test("all-high yields every question text", () => {
    const got = scoreGutQuestionnaire(answerAll(5));
    assert.equal(got.highSymptoms.length, 26);
  });
});

describe("Gut questionnaire — submitted payload contract", () => {
  const answers = { ...answerAll(3), 8: 5 };
  const result = scoreGutQuestionnaire(answers);
  const payload = buildGutPayload({
    name: "Test User",
    contact: "9845188112",
    result,
    answers,
    now: new Date("2026-03-04T09:05:00Z"),
  });

  test("targets Gut_Health with the legacy key names", () => {
    assert.equal(payload.sheetName, "Gut_Health");
    for (const k of ["name", "contact", "score", "category", "highSymptoms", "timestamp"]) {
      assert.ok(k in payload, `missing key: ${k}`);
    }
  });

  test("includes one Q<n> key per answered question", () => {
    const qKeys = Object.keys(payload).filter((k) => /^Q\d+$/.test(k));
    assert.equal(qKeys.length, 26);
    assert.equal(payload.Q8, 5);
    assert.equal(payload.Q1, 3);
  });

  test("posts exactly Q1..Q26 — no gaps, nothing past Q26", () => {
    const qNums = Object.keys(payload)
      .filter((k) => /^Q\d+$/.test(k))
      .map((k) => Number(k.slice(1)))
      .sort((a, b) => a - b);
    assert.deepEqual(
      qNums,
      Array.from({ length: 26 }, (_, i) => i + 1)
    );
    for (const dead of ["Q27", "Q28", "Q29"]) {
      assert.equal(dead in payload, false, `${dead} must not be posted`);
    }
  });

  test("each question's own answer lands in its own key — no shifting", () => {
    // Distinct-ish answers so a one-column shift cannot pass silently.
    const distinct = Object.fromEntries(
      QUESTIONS.map((q, i) => [q.id, (i % 5) + 1])
    );
    const p = buildGutPayload({
      name: "A",
      contact: "B",
      result: scoreGutQuestionnaire(distinct),
      answers: distinct,
    });
    QUESTIONS.forEach((q, i) => {
      assert.equal(p[`Q${i + 1}`], distinct[q.id], `question ${i + 1} -> Q${i + 1}`);
    });
  });

  test("score is the rounded percentage", () => {
    assert.equal(payload.score, result.rounded);
    assert.equal(Number.isInteger(payload.score), true);
  });

  test("highSymptoms is a comma-separated string, not an array", () => {
    assert.equal(typeof payload.highSymptoms, "string");
  });

  test("unanswered questions are omitted entirely", () => {
    const sparse = { 1: 2, 2: 3 };
    const p = buildGutPayload({
      name: "A",
      contact: "B",
      result: scoreGutQuestionnaire(sparse),
      answers: sparse,
    });
    assert.equal(Object.keys(p).filter((k) => /^Q\d+$/.test(k)).length, 2);
    assert.equal("Q3" in p, false);
  });
});
