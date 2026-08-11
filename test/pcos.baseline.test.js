/**
 * FUNCTIONAL BASELINE — PCOS root-cause questionnaire.
 * Differential-tested against an independent transcription of the legacy
 * scoring, plus golden assertions on the quirks P1–P6.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  scorePcos,
  nextQuestionIndex,
  skippedIds,
  buildPcosPayload,
} from "../src/assets/js/questionnaires/pcos-engine.js";

const DATA = JSON.parse(readFileSync(new URL("../src/_data/pcos.json", import.meta.url)));

/* ---------- legacy reference (verbatim) ---------- */
function legacyTopResult(questions, groups, answers) {
  const count = (key) =>
    questions.filter((q) => q.group === key && answers[q.id] && answers[q.id] >= 4).length;
  const scores = {};
  groups.forEach((g) => { scores[g.key] = count(g.key); });
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return "Mixed";
  if (sorted[0][1] === sorted[1][1] || (sorted[0][1] - sorted[1][1] <= 1 && sorted[1][1] > 0))
    return "Mixed";
  return sorted[0][0];
}

const idsIn = (group) => DATA.questions.filter((q) => q.group === group).map((q) => q.id);
const answerIds = (ids, value) => Object.fromEntries(ids.map((id) => [id, value]));

/* ================= structure ================= */
describe("PCOS — structure", () => {
  test("37 questions across four groups", () => {
    assert.equal(DATA.questions.length, 37);
    assert.deepEqual(DATA.groups.map((g) => g.key), [
      "Insulin Resistance", "Inflammatory", "Post-Birth Control", "Adrenal",
    ]);
  });

  test("QUIRK P2 — group sizes are unequal and never normalised", () => {
    assert.equal(idsIn("Insulin Resistance").length, 13);
    assert.equal(idsIn("Inflammatory").length, 7);
    assert.equal(idsIn("Post-Birth Control").length, 10);
    assert.equal(idsIn("Adrenal").length, 7);
  });

  test("ids are contiguous 1-37", () => {
    assert.deepEqual(
      DATA.questions.map((q) => q.id),
      Array.from({ length: 37 }, (_, i) => i + 1)
    );
  });

  test("an explanation exists for every group plus Mixed", () => {
    for (const key of [...DATA.groups.map((g) => g.key), "Mixed"]) {
      assert.ok(DATA.explanations[key]?.length > 20, `missing explanation: ${key}`);
    }
  });
});

/* ================= scoring ================= */
describe("PCOS — scoring", () => {
  test("QUIRK P1 — score counts answers >= 4, it does not sum them", () => {
    const fives = scorePcos(DATA, answerIds(idsIn("Adrenal"), 5));
    const fours = scorePcos(DATA, answerIds(idsIn("Adrenal"), 4));
    assert.equal(fives.scores["Adrenal"], 7);
    assert.equal(fours.scores["Adrenal"], 7, "a 4 counts the same as a 5");
  });

  test("answers of 3 or below never score", () => {
    for (const v of [1, 2, 3]) {
      const r = scorePcos(DATA, answerIds(idsIn("Adrenal"), v));
      assert.equal(r.scores["Adrenal"], 0, `value ${v}`);
    }
  });

  test("a clear winner needs a lead of at least 2", () => {
    // Adrenal 4 vs Inflammatory 2 -> Adrenal wins
    const answers = {
      ...answerIds(idsIn("Adrenal").slice(0, 4), 5),
      ...answerIds(idsIn("Inflammatory").slice(0, 2), 5),
    };
    const r = scorePcos(DATA, answers);
    assert.equal(r.scores["Adrenal"], 4);
    assert.equal(r.scores["Inflammatory"], 2);
    assert.equal(r.resultKey, "Adrenal");
    assert.equal(r.resultKey, legacyTopResult(DATA.questions, DATA.groups, answers));
  });

  test("QUIRK P3 — a lead of exactly 1 is reported as Mixed", () => {
    const answers = {
      ...answerIds(idsIn("Adrenal").slice(0, 3), 5),
      ...answerIds(idsIn("Inflammatory").slice(0, 2), 5),
    };
    const r = scorePcos(DATA, answers);
    assert.equal(r.scores["Adrenal"], 3);
    assert.equal(r.scores["Inflammatory"], 2);
    assert.equal(r.resultKey, "Mixed");
    assert.equal(r.resultKey, legacyTopResult(DATA.questions, DATA.groups, answers));
  });

  test("QUIRK P3 — a tie is Mixed", () => {
    const answers = {
      ...answerIds(idsIn("Adrenal").slice(0, 3), 5),
      ...answerIds(idsIn("Inflammatory").slice(0, 3), 5),
    };
    assert.equal(scorePcos(DATA, answers).resultKey, "Mixed");
  });

  test("QUIRK P3 — all zero is Mixed", () => {
    assert.equal(scorePcos(DATA, {}).resultKey, "Mixed");
    assert.equal(scorePcos(DATA, answerIds(idsIn("Adrenal"), 1)).resultKey, "Mixed");
  });

  test("QUIRK P3 — a lead of 1 over a ZERO runner-up is NOT Mixed", () => {
    // sorted[1] must be > 0 for the <=1 rule to apply
    const answers = answerIds(idsIn("Adrenal").slice(0, 1), 5);
    const r = scorePcos(DATA, answers);
    assert.equal(r.scores["Adrenal"], 1);
    assert.equal(r.resultKey, "Adrenal");
    assert.equal(r.resultKey, legacyTopResult(DATA.questions, DATA.groups, answers));
  });

  test("each group can win outright", () => {
    for (const g of DATA.groups) {
      const ids = idsIn(g.key).filter((id) => id !== 21); // Q21 can't score
      const answers = answerIds(ids, 5);
      const r = scorePcos(DATA, answers);
      assert.equal(r.resultKey, g.key, g.key);
      assert.equal(r.resultKey, legacyTopResult(DATA.questions, DATA.groups, answers));
    }
  });

  test("differential — random answer sets agree with legacy", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 250; i++) {
      const answers = {};
      for (const q of DATA.questions) answers[q.id] = 1 + Math.floor(rnd() * 5);
      assert.equal(
        scorePcos(DATA, answers).resultKey,
        legacyTopResult(DATA.questions, DATA.groups, answers),
        `iteration ${i}`
      );
    }
  });
});

/* ================= Q21 and skip logic ================= */
describe("PCOS — Q21 branch", () => {
  test("QUIRK P4 — Q21 is Yes/No (2/1) and can never score", () => {
    assert.deepEqual(DATA.binaryQuestions["21"].map((o) => o.value), [2, 1]);
    const r = scorePcos(DATA, { 21: 2 });
    assert.equal(r.scores["Post-Birth Control"], 0, "even 'Yes' contributes nothing");
  });

  test("QUIRK P5 — answering No to Q21 jumps to Q31", () => {
    const i21 = DATA.questions.findIndex((q) => q.id === 21);
    const i31 = DATA.questions.findIndex((q) => q.id === 31);
    assert.equal(nextQuestionIndex(DATA, i21, { 21: 1 }), i31);
  });

  test("answering Yes to Q21 continues to Q22", () => {
    const i21 = DATA.questions.findIndex((q) => q.id === 21);
    assert.equal(nextQuestionIndex(DATA, i21, { 21: 2 }), i21 + 1);
    assert.equal(DATA.questions[i21 + 1].id, 22);
  });

  test("the skip bypasses exactly Q22-Q30", () => {
    assert.deepEqual(skippedIds(DATA, { 21: 1 }), [22, 23, 24, 25, 26, 27, 28, 29, 30]);
    assert.deepEqual(skippedIds(DATA, { 21: 2 }), []);
  });

  test("skipped questions cannot score Post-Birth Control", () => {
    const r = scorePcos(DATA, { 21: 1, ...answerIds(idsIn("Adrenal"), 5) });
    assert.equal(r.scores["Post-Birth Control"], 0);
    assert.equal(r.resultKey, "Adrenal");
  });
});

/* ================= symptoms + payload ================= */
describe("PCOS — symptoms and payload", () => {
  const answers = {
    ...answerIds(idsIn("Insulin Resistance").slice(0, 5), 5),
    ...answerIds(idsIn("Inflammatory").slice(0, 1), 4),
    21: 1,
  };
  const result = scorePcos(DATA, answers);
  const payload = buildPcosPayload({
    data: DATA, name: "Test", contact: "9845188112", result, answers,
    now: new Date("2026-05-02T10:30:00Z"),
  });

  test("QUIRK P6 — trailing full stops are stripped from symptom text", () => {
    const list = result.highSymptoms["Insulin Resistance"];
    assert.equal(list.length, 5);
    for (const s of list) assert.ok(!s.endsWith("."), `still ends with a period: ${s}`);
  });

  test("payload targets PCOS with the legacy key names", () => {
    assert.equal(payload.sheetName, "PCOS");
    for (const k of [
      "name", "contact", "timestamp", "result",
      "InsulinResistanceScore", "InflammatoryScore", "PillInducedScore", "AdrenalScore",
    ]) assert.ok(k in payload, `missing: ${k}`);
  });

  test("PillInducedScore maps to the Post-Birth Control group", () => {
    assert.equal(payload.PillInducedScore, result.scores["Post-Birth Control"]);
  });

  test("one frequentSymptoms_ key per group, comma-joined", () => {
    for (const g of DATA.groups) {
      const key = `frequentSymptoms_${g.key}`;
      assert.ok(key in payload, `missing: ${key}`);
      assert.equal(typeof payload[key], "string");
    }
  });

  test("only answered questions appear as Q<n>", () => {
    const qKeys = Object.keys(payload).filter((k) => /^Q\d+$/.test(k));
    assert.equal(qKeys.length, Object.keys(answers).length);
    assert.ok("Q21" in payload);
    assert.equal("Q25" in payload, false, "skipped questions are omitted");
  });

  test("result is the resolved key", () => {
    assert.equal(payload.result, result.resultKey);
    assert.equal(payload.result, "Insulin Resistance");
  });
});
