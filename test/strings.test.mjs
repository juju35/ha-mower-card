// Every language carries every key of the English strings, with the same placeholders.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { STRINGS, lang, intlLocale } = load();
const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort();

test("the 22 languages are there", () => {
  assert.deepEqual(Object.keys(STRINGS).sort(), [...LANGS].sort());
});

for (const l of LANGS) {
  test(`${l} has every English key, no extra key and the same placeholders`, () => {
    const en = Object.keys(STRINGS.en).sort();
    assert.deepEqual(Object.keys(STRINGS[l]).sort(), en);
    for (const k of en) {
      assert.ok(String(STRINGS[l][k]).trim(), `${l}.${k} is empty`);
      assert.deepEqual(placeholders(STRINGS[l][k]), placeholders(STRINGS.en[k]), `${l}.${k} placeholders`);
    }
  });
}

test("the language follows the option, then Home Assistant's, with a region-less fallback", () => {
  assert.equal(lang({ language: "fr" }, {}), "fr");
  assert.equal(lang({ locale: { language: "de-CH" } }, {}), "de");
  assert.equal(lang({ language: "fr" }, { language: "es" }), "es");
  assert.equal(lang({ language: "xx" }, {}), "en");
  assert.equal(intlLocale({ locale: { language: "de-CH" } }, {}), "de-CH");
  assert.equal(intlLocale({ locale: { language: "pt" } }, {}), "pt-PT");
  assert.equal(intlLocale({ locale: { language: "en" } }, { language: "fr" }), "fr");
});
