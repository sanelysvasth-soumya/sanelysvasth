/**
 * Svasth by Soumya — Google Apps Script Web App.
 *
 * REFERENCE COPY. This file is not built or deployed by Eleventy (the build
 * only reads src/). It exists so the deployed script has a home in version
 * control. To apply changes: open the Apps Script project, replace the code,
 * then Deploy -> Manage deployments -> edit the active deployment -> Deploy.
 * The website posts to the deployment URL in:
 *   src/assets/js/contact.js
 *   src/assets/js/questionnaires/quiz-ui.js
 *
 * SHEET TABS (renamed from Sheet1..Sheet4):
 *   Gut_Health     <- gut questionnaire      (was Sheet1)
 *   PCOS           <- PCOS questionnaire     (was Sheet2)
 *   Habit_Tracker  <- habit tracker          (was Sheet3)
 *   Leads          <- contact form           (was Sheet4)
 *
 * DIFFERENCES FROM THE DRAFT REFERENCE — both are data-loss fixes verified
 * against the payloads the live site actually sends:
 *
 *   1. Gut_Health looped Q1..Q24, then Q1..Q29. Both were wrong: the gut
 *      questionnaire has exactly 26 questions and, since the 2026-08-11
 *      reset, they carry sequential ids 1..26. The site now posts Q1..Q26
 *      and this script writes exactly those 26 columns — no Q27/Q28/Q29,
 *      no permanently-empty Q16/Q18/Q25. See GUT_QUESTION_COUNT below.
 *
 *   2. PCOS wrote only Timestamp/Name/Contact/Result/Q1..Q37. The site also
 *      sends four group scores and four frequent-symptom lists; all eight
 *      were being dropped. Now written.
 *
 *   3. Unknown or missing sheetName is rejected instead of defaulting, so a
 *      malformed submission can never be silently filed under the wrong tab
 *      or create a stray sheet.
 */

var SPREADSHEET_ID = '1Lx7Bw1FXYElxKWZ3X3C08Yw7Oh7_5g6P_PMJkJXHwko';

/** The only tabs this endpoint will ever write to. */
var ALLOWED_SHEETS = ['Gut_Health', 'PCOS', 'Habit_Tracker', 'Leads'];

var HABITS = [
  'Vegetables in two meals of the day',
  '20 mins Sunlight (Between 9 AM and 2 PM)',
  'Including any seasonal fruit',
  'Noticed how my body responds to food',
  'Order of eating veggies-proteins-carbs',
  'Limited coffee/tea',
  'Buttermilk in two meals of the day',
  'Early dinner(two hours before sleep)',
  'Had 3L water',
  'Early Sleep routine (10 - 10:30 PM)',
  'Basic activity (Walk/Stretch/Workout)',
  'Ate out, but ate consciously (veggies-protein-carbs)',
  '5-Min walk after each meal',
  'Proteins in two meals of the day Sprouts/Dairy/Eggs/Whey/Tofu/Soya',
  'Oil pulling (coconut oil)'
];

/**
 * The gut questionnaire is exactly 26 questions and posts Q1..Q26, one
 * field per question, in display order. Question N -> field QN -> column
 * QN. Nothing is split, combined or shifted, and there is no Q27+.
 * Source of truth: src/assets/js/questionnaires/gut-engine.js.
 */
var GUT_QUESTION_COUNT = 26;

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Write the header row on a brand-new sheet, and top up a short header row
 * on an existing one. Only ever writes into header cells beyond the current
 * width, so existing headers and all data rows are left untouched.
 */
function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  var width = sheet.getLastColumn();
  if (width < headers.length) {
    var missing = headers.slice(width);
    sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]);
  }
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var sheetName = p.sheetName;

  // Reject rather than default. Defaulting would let a malformed submission
  // land in the wrong tab, which is worse than losing it loudly.
  if (!sheetName) {
    return jsonOut({ status: 'error', message: 'sheetName is required' });
  }
  if (ALLOWED_SHEETS.indexOf(sheetName) === -1) {
    return jsonOut({ status: 'error', message: 'unknown sheetName: ' + sheetName });
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);

  // The four tabs already exist. Creating one here means a rename or a
  // deletion went unnoticed, so say so instead of quietly making a new tab.
  if (!sheet) {
    return jsonOut({ status: 'error', message: 'sheet not found: ' + sheetName });
  }

  var now = new Date().toISOString();
  var headers;
  var row;
  var i;

  if (sheetName === 'Leads') {
    headers = ['Name', 'Contact', 'Subject', 'Message', 'Timestamp'];
    row = [
      p.Name || '',
      p.Contact || '',
      p.Subject || '',
      p.Message || '',
      p.timestamp || now
    ];

  } else if (sheetName === 'Habit_Tracker') {
    headers = ['Name', 'Contact', 'Date', 'Progress', 'Timestamp'].concat(HABITS);
    row = [
      p.Name || '',
      p.Contact || '',
      p.Date || '',
      p.Progress || '',
      p.timestamp || now
    ];
    for (i = 0; i < HABITS.length; i++) {
      row.push(p[HABITS[i]] || '');
    }

  } else if (sheetName === 'PCOS') {
    headers = [
      'Timestamp', 'Name', 'Contact', 'Result',
      'Insulin Resistance Score', 'Inflammatory Score',
      'Pill Induced Score', 'Adrenal Score',
      'Frequent Symptoms (Insulin Resistance)',
      'Frequent Symptoms (Inflammatory)',
      'Frequent Symptoms (Post-Birth Control)',
      'Frequent Symptoms (Adrenal)'
    ];
    row = [
      p.timestamp || now,
      p.name || '',
      p.contact || '',
      p.result || '',
      p.InsulinResistanceScore || '',
      p.InflammatoryScore || '',
      p.PillInducedScore || '',
      p.AdrenalScore || '',
      p['frequentSymptoms_Insulin Resistance'] || '',
      p['frequentSymptoms_Inflammatory'] || '',
      p['frequentSymptoms_Post-Birth Control'] || '',
      p['frequentSymptoms_Adrenal'] || ''
    ];
    for (i = 1; i <= 37; i++) {
      headers.push('Q' + i);
      row.push(p['Q' + i] || '');
    }

  } else { // Gut_Health
    headers = [
      'Name', 'Contact', 'Score', 'Category', 'High Symptoms', 'Timestamp',
      'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
      'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20',
      'Q21', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26'
    ];
    // Strict 1:1. Each of the 26 questions has exactly one field and one
    // column; the comment is the question the user actually saw. Nothing
    // is split (Q25 is one four-symptom question, one value) and there is
    // deliberately no Q27/Q28/Q29.
    row = [
      p.name || '',
      p.contact || '',
      p.score || 0,
      p.category || '',
      p.highSymptoms || '',
      p.timestamp || now,
      p.Q1  || '',  // Gassy?
      p.Q2  || '',  // Bloating?
      p.Q3  || '',  // Heaviness after meals?
      p.Q4  || '',  // Stomach pain?
      p.Q5  || '',  // Lethargy or feeling tired?
      p.Q6  || '',  // Brain fog?
      p.Q7  || '',  // Constipation (without laxative)?
      p.Q8  || '',  // How often do you poop?  (custom scale 1,2,5,4,3)
      p.Q9  || '',  // Diarrhea?
      p.Q10 || '',  // Mucus in stool?
      p.Q11 || '',  // Undigested food in stool?
      p.Q12 || '',  // Bad breath?
      p.Q13 || '',  // Nausea?
      p.Q14 || '',  // Heartburn / Acid Reflux?
      p.Q15 || '',  // Burping?
      p.Q16 || '',  // Food sensitivities / allergies?
      p.Q17 || '',  // Anxiety / Depression?
      p.Q18 || '',  // Joint pain?
      p.Q19 || '',  // Headaches / Migraines?
      p.Q20 || '',  // Sleep issues?
      p.Q21 || '',  // Sugar cravings?
      p.Q22 || '',  // Weight issues (Gain/Loss)?
      p.Q23 || '',  // Hair fall / brittle hair?
      p.Q24 || '',  // Acne?
      p.Q25 || '',  // Eczema / Psoriasis / Rosacea / Rashes?
      p.Q26 || ''   // Flatulence / Farting?
    ];
    if (headers.length !== 6 + GUT_QUESTION_COUNT) {
      return jsonOut({ status: 'error', message: 'gut header/question count mismatch' });
    }
  }

  ensureHeaders(sheet, headers);
  sheet.appendRow(row);

  return jsonOut({ status: 'success', sheet: sheetName });
}
