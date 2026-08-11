/**
 * International phone-number validation — shared by the assessments and
 * the contact form.
 *
 * Deliberately NOT locked to Indian numbers. The rule is E.164 shaped:
 *   - an optional leading "+"
 *   - 7 to 15 digits once separators are stripped
 *   - separators allowed while typing: space, hyphen, dot, parentheses
 *   - nothing else: no letters, no emoji, no punctuation
 *
 * No dependency: a full libphonenumber metadata set is ~150KB for what is
 * a single contact field, and per-country national rules would reject
 * legitimate numbers we cannot anticipate. E.164 length bounds are the
 * standard's own limits and accept every real number worldwide.
 */

/** Characters permitted in the raw field while typing. */
const ALLOWED = /[^\d+\s().-]/g;

/** Strip everything that is not a digit or a leading plus. */
export function normalisePhone(value) {
  const raw = String(value ?? "").trim();
  const plus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return (plus ? "+" : "") + digits;
}

export function digitCount(value) {
  return String(value ?? "").replace(/\D/g, "").length;
}

/**
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 */
export function validatePhone(value) {
  const raw = String(value ?? "").trim();

  if (!raw) return { ok: false, error: "Enter a contact number." };

  // Anything outside the permitted set — letters, emoji, other symbols.
  if (ALLOWED.test(raw)) {
    return {
      ok: false,
      error: "Use digits only — you can include a country code like +44.",
    };
  }
  // "+" is only meaningful as the first character.
  if (raw.indexOf("+") > 0 || (raw.match(/\+/g) || []).length > 1) {
    return { ok: false, error: "The + belongs at the start, before the country code." };
  }

  const n = digitCount(raw);
  if (n < 7) return { ok: false, error: "That number looks too short — include the area or country code." };
  if (n > 15) return { ok: false, error: "That number looks too long — check for extra digits." };

  return { ok: true, value: normalisePhone(raw) };
}

/**
 * Attaches live filtering to a tel input: blocks disallowed characters as
 * they are typed or pasted, without fighting the caret.
 */
export function attachPhoneInput(input) {
  if (!input) return;
  input.setAttribute("inputmode", "tel");
  input.setAttribute("autocomplete", "tel");
  input.setAttribute("maxlength", "22");

  const clean = () => {
    const before = input.value;
    const after = before.replace(ALLOWED, "");
    if (after !== before) {
      const pos = input.selectionStart - (before.length - after.length);
      input.value = after;
      try {
        input.setSelectionRange(pos, pos);
      } catch {
        /* detached or unsupported — position is cosmetic */
      }
    }
  };

  input.addEventListener("input", clean);
  input.addEventListener("paste", () => setTimeout(clean, 0));
}
