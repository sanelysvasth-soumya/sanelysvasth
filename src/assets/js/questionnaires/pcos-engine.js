/**
 * PCOS root-cause questionnaire — SCORING ENGINE. Pure, no DOM.
 *
 * ============================ CONTRACT ============================
 * Questions, groups, explanations, scoring and payload shape are
 * transcribed VERBATIM from legacy questionniarePCOS.html (preserved in
 * _archive/legacy/). Data lives in src/_data/pcos.json.
 *
 * Preserved quirks — covered by test/pcos.baseline.test.js:
 *
 *  P1  A group's score is the COUNT of its questions answered >= 4, not
 *      the sum of the answers. So a 5 and a 4 both contribute exactly 1.
 *
 *  P2  Groups have unequal question counts (13 / 7 / 10 / 7), and the
 *      counts are compared raw — never normalised. Insulin Resistance
 *      therefore has almost twice the ceiling of Inflammatory or Adrenal
 *      and is structurally easier to "win".
 *
 *  P3  "Mixed" is returned when the top score is 0, when the top two tie,
 *      OR when they differ by <= 1 and the runner-up is > 0. A clear
 *      single result therefore needs a lead of at least 2.
 *
 *  P4  Q21 ("have you taken birth control") is a Yes/No question scored
 *      2 or 1. Because scoring counts only answers >= 4, Q21 can never
 *      contribute to any group score — it exists purely to drive skip
 *      logic.
 *
 *  P5  Answering "No" (1) to Q21 skips ahead to Q31, bypassing the whole
 *      Post-Birth Control block (Q22-Q30). Those questions stay
 *      unanswered and are omitted from the payload.
 *
 *  P6  Trailing full stops are stripped from symptom text when it is
 *      listed back to the user.
 * ==================================================================
 */

/**
 * @param {object} data      parsed pcos.json
 * @param {Record<number, number>} answers  questionId -> value
 */
export function scorePcos(data, answers) {
  const { questions, groups } = data;

  // NOTE (P1): count of answers >= 4, not a sum.
  const countGroupScore = (key) =>
    questions.filter((q) => q.group === key && answers[q.id] && answers[q.id] >= 4).length;

  // NOTE (P6): trailing "." removed.
  const highSymptomsFor = (key) =>
    questions
      .filter((q) => q.group === key && answers[q.id] && answers[q.id] >= 4)
      .map((q) => q.text.replace(/\.$/, ""));

  const scores = {};
  for (const g of groups) scores[g.key] = countGroupScore(g.key);

  // NOTE (P2, P3): raw comparison, and a lead of <= 1 is "Mixed".
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let resultKey;
  if (sorted[0][1] === 0) {
    resultKey = "Mixed";
  } else if (
    sorted[0][1] === sorted[1][1] ||
    (sorted[0][1] - sorted[1][1] <= 1 && sorted[1][1] > 0)
  ) {
    resultKey = "Mixed";
  } else {
    resultKey = sorted[0][0];
  }

  const highSymptoms = {};
  for (const g of groups) highSymptoms[g.key] = highSymptomsFor(g.key);

  return {
    scores,
    sorted,
    resultKey,
    explanation: data.explanations[resultKey] ?? data.explanations.Mixed ?? "",
    highSymptoms,
  };
}

/**
 * Question order for a given answer set, honouring the Q21 skip.
 * NOTE (P5): answering "No" to Q21 jumps to Q31.
 */
export function nextQuestionIndex(data, currentIndex, answers) {
  const { questions, skip } = data;
  const current = questions[currentIndex];

  if (
    current &&
    current.id === skip.whenQuestion &&
    answers[skip.whenQuestion] === skip.equals
  ) {
    const target = questions.findIndex((q) => q.id === skip.jumpTo);
    if (target !== -1) return target;
  }
  return currentIndex + 1 < questions.length ? currentIndex + 1 : currentIndex;
}

/** Ids skipped by the Q21 = "No" branch, for progress accounting. */
export function skippedIds(data, answers) {
  if (answers[data.skip.whenQuestion] !== data.skip.equals) return [];
  return data.questions
    .filter((q) => q.id > data.skip.whenQuestion && q.id < data.skip.jumpTo)
    .map((q) => q.id);
}

/**
 * Payload posted to the sheet. Key names, ordering and the timestamp
 * format are part of the data contract — do not rename.
 */
export function buildPcosPayload({ data, name, contact, result, answers, now = new Date() }) {
  const formattedTimestamp = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const payload = {
    sheetName: data.sheetName,
    name,
    contact,
    timestamp: formattedTimestamp,
    result: result.resultKey || "",
    InsulinResistanceScore: result.scores["Insulin Resistance"],
    InflammatoryScore: result.scores["Inflammatory"],
    // Legacy key name differs from the group name — preserved deliberately.
    PillInducedScore: result.scores["Post-Birth Control"],
    AdrenalScore: result.scores["Adrenal"],
  };

  for (const g of data.groups) {
    payload[`frequentSymptoms_${g.key}`] = result.highSymptoms[g.key].join(", ");
  }
  for (const q of data.questions) {
    if (answers[q.id]) payload[`Q${q.id}`] = answers[q.id];
  }
  return payload;
}
