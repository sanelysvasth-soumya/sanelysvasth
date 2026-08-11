/** Phone validation — international, not India-locked. */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validatePhone, normalisePhone, digitCount } from "../src/assets/js/phone.js";

describe("Phone — accepts legitimate international numbers", () => {
  const valid = [
    ["India mobile",        "9845188112"],
    ["India + country code","+91 98451 88112"],
    ["UK",                  "+44 20 7946 0958"],
    ["US formatted",        "+1 (415) 555-2671"],
    ["Germany",             "+49 30 901820"],
    ["Japan",               "+81 3-1234-5678"],
    ["Brazil",              "+55 11 91234-5678"],
    ["Australia",           "+61 2 9374 4000"],
    ["UAE",                 "+971 4 123 4567"],
    ["Singapore",           "+65 6123 4567"],
    ["dots as separators",  "+33.1.42.68.53.00"],
    ["min length (7)",      "1234567"],
    ["max length (15)",     "+123456789012345"],
  ];
  for (const [name, input] of valid) {
    test(name, () => {
      const r = validatePhone(input);
      assert.equal(r.ok, true, `${input} -> ${r.error ?? ""}`);
    });
  }
});

describe("Phone — rejects invalid input", () => {
  const invalid = [
    ["empty",              ""],
    ["letters only",       "hello there"],
    ["letters + digits",   "98451abc88"],
    ["emoji",              "+91 98451 🙂"],
    ["emoji only",         "🙂🙂🙂"],
    ["symbols",            "98451#88112"],
    ["too short",          "12345"],
    ["too long",           "+1234567890123456"],
    ["plus in the middle", "0091+9845188112"],
    ["multiple pluses",    "++919845188112"],
    ["sql-ish text",       "DROP TABLE users"],
  ];
  for (const [name, input] of invalid) {
    test(name, () => assert.equal(validatePhone(input).ok, false, `${input} was accepted`));
  }
});

describe("Phone — normalisation", () => {
  test("strips formatting but keeps a leading plus", () => {
    assert.equal(normalisePhone("+1 (415) 555-2671"), "+14155552671");
    assert.equal(normalisePhone("98451 88112"), "9845188112");
  });
  test("validated value is the normalised form", () => {
    assert.equal(validatePhone("+44 20 7946 0958").value, "+442079460958");
  });
  test("digitCount ignores separators and plus", () => {
    assert.equal(digitCount("+91 98451-88112"), 12);
  });
});
