/**
 * Gut health questionnaire — SCORING ENGINE. Pure, no DOM.
 *
 * ============================ CONTRACT ============================
 * Questions, scores, bands and the submitted payload shape are
 * transcribed VERBATIM from legacy questionniareGut.html
 * (preserved in _archive/legacy/). Behaviour must not change.
 *
 * Preserved quirks:
 *  G1  Score is a percentage of the MAXIMUM (26 × 5 = 130), so a
 *      perfectly healthy respondent answering "Never" (1) to
 *      everything scores 20%, not 0%. The lowest achievable band is
 *      therefore "Excellent" at exactly 20%.
 *  G2  Question 8 ("How often do you poop?") uses a non-monotonic
 *      custom scale: scores run [1, 2, 5, 4, 3] across the five
 *      options, so "Once a day" scores highest (5). Because a HIGHER
 *      total means WORSE gut health everywhere else, this single
 *      question inverts. Preserved exactly as authored.
 *  G3  "High symptoms" are those answered >= 4.
 * ==================================================================
 */

/**
 * 26 questions, in display order. Question 8 carries the custom scale.
 *
 * ⚠️ IDS ARE THE COLUMN MAP — 1:1, SEQUENTIAL, NO GAPS.
 * `buildGutPayload` writes one `Q<id>` field per question, and the Apps
 * Script drops `Q<n>` straight into the `Q<n>` column of Gut_Health. So
 * position N in this array MUST have id N: question 1 -> Q1 ... question
 * 26 -> Q26. `assertSequentialIds()` below enforces it at import time.
 *
 * HISTORY (2026-08-11 reset): ids used to be frozen across edits, leaving
 * retired ids 16 ("Stomach noise?"), 18 ("Skin issues") and 25 ("Hormonal
 * imbalances?") permanently unused while newer questions ran on to 29.
 * That produced empty Q16/Q18/Q25 columns and live answers landing in
 * Q27-Q29. The old data has been archived to a separate sheet, so the
 * gap-preserving scheme is retired: ids are now renumbered to match
 * position, and Gut_Health is a clean destination for new submissions.
 *
 * Adding or removing a question means renumbering everything after it —
 * that is intentional. Keep the sheet in step when you do.
 *
 * Question text, order, options and scores are UNCHANGED by that reset.
 */
export const QUESTIONS = Object.freeze([
  { id: 1, text: "Gassy?" },
  { id: 2, text: "Bloating?" },
  { id: 3, text: "Heaviness after meals?" },
  { id: 4, text: "Stomach pain?" },
  { id: 5, text: "Lethargy or feeling tired?" },
  { id: 6, text: "Brain fog?" },
  { id: 7, text: "Constipation (without laxative)?" },
  {
    id: 8,
    text: "How often do you poop?",
    isCustomScale: true,
    labels: [
      { emoji: "💩", text: "< 3 times/week" },
      { emoji: "💩💫", text: "Every other day" },
      { emoji: "💩✨", text: "Once a day" },
      { emoji: "💩💩", text: "Twice a day" },
      { emoji: "💩💩➕", text: "> 2 times/day" },
    ],
    values: [
      "Less than three times a week",
      "Once every other day",
      "Once a day",
      "Twice a day",
      "More than two times a day",
    ],
    // NOTE (G2): deliberately non-monotonic.
    scores: [1, 2, 5, 4, 3],
  },
  { id: 9, text: "Diarrhea?" },
  { id: 10, text: "Mucus in stool?" },
  { id: 11, text: "Undigested food in stool?" },
  { id: 12, text: "Bad breath?" },
  { id: 13, text: "Nausea?" },
  { id: 14, text: "Heartburn / Acid Reflux?" },
  { id: 15, text: "Burping?" },
  { id: 16, text: "Food sensitivities / allergies?" },
  { id: 17, text: "Anxiety / Depression?" },
  { id: 18, text: "Joint pain?" },
  { id: 19, text: "Headaches / Migraines?" },
  { id: 20, text: "Sleep issues?" },
  { id: 21, text: "Sugar cravings?" },
  { id: 22, text: "Weight issues (Gain/Loss)?" },
  { id: 23, text: "Hair fall / brittle hair?" },
  { id: 24, text: "Acne?" },
  // ONE question, one column — never split on the slashes.
  { id: 25, text: "Eczema / Psoriasis / Rosacea / Rashes?" },
  { id: 26, text: "Flatulence / Farting?" },
]);

/**
 * Guards the invariant the sheet depends on: the Nth question has id N.
 * Runs once at import; a mismatch is a build-breaking bug, not a warning.
 */
(function assertSequentialIds() {
  QUESTIONS.forEach((q, i) => {
    if (q.id !== i + 1) {
      throw new Error(
        `gut-engine: question ${i + 1} ("${q.text}") has id ${q.id}. ` +
          `Ids must be sequential 1..${QUESTIONS.length} so Q<n> maps to column Q<n>.`
      );
    }
  });
})();

/** Standard frequency scale used by every question except #8. */
export const FREQUENCY_SCALE = Object.freeze([
  { score: 1, label: "Never" },
  { score: 2, label: "Rarely" },
  { score: 3, label: "Sometimes" },
  { score: 4, label: "Often" },
  { score: 5, label: "Always" },
]);

/**
 * @param {Record<number, number>} answers  questionId -> score
 * @returns {{ percentage:number, rounded:number, category:string,
 *             message:string, highSymptoms:string[] }}
 */
export function scoreGutQuestionnaire(answers) {
  let totalScore = 0;
  for (const key in answers) totalScore += answers[key];

  // NOTE (G1): denominator is the max, not the range.
  const maxScore = QUESTIONS.length * 5;
  const percentage = (totalScore / maxScore) * 100;

  let category, message;
  if (percentage <= 20) {
    category = "Excellent";
    message =
      "Your gut health seems to be in great shape! Keep up your healthy lifestyle.";
  } else if (percentage <= 40) {
    category = "Good";
    message =
      "Your gut health is good, but there's room for improvement. Pay attention to your diet and stress levels.";
  } else if (percentage <= 60) {
    category = "Fair";
    message =
      "You are experiencing some gut issues. It might be time to look at your diet and lifestyle more closely.";
  } else if (percentage <= 80) {
    category = "Poor";
    message =
      "Your gut health needs attention. You are experiencing significant symptoms that shouldn't be ignored.";
  } else {
    category = "Very Poor";
    message =
      "Your gut health requires immediate attention. Please consider consulting a professional.";
  }

  // NOTE (G3)
  const highSymptoms = QUESTIONS.filter(
    (q) => answers[q.id] && answers[q.id] >= 4
  ).map((q) => q.text);

  return {
    totalScore,
    maxScore,
    percentage,
    rounded: Math.round(percentage),
    category,
    message,
    highSymptoms,
  };
}

/**
 * Builds the exact payload the legacy page posted. Key names, ordering
 * and the timestamp format are part of the sheet's data contract.
 *
 * The question fields are `Q1`..`Q26` — one per question, in order, with
 * no gaps and nothing past Q26. The Apps Script writes each into the
 * like-named column.
 */
export function buildGutPayload({ name, contact, result, answers, now = new Date() }) {
  const formattedTimestamp = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const data = {
    sheetName: "Gut_Health",
    name,
    contact,
    score: result.rounded,
    category: result.category,
    highSymptoms: result.highSymptoms.join(", "),
    timestamp: formattedTimestamp,
  };

  for (const q of QUESTIONS) {
    if (answers[q.id]) data[`Q${q.id}`] = answers[q.id];
  }
  return data;
}
