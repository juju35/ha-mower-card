// Keyboard access and names of the clickable elements, in both cards.
import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const mc = load();

const makeHass = () => ({ entities, devices, states, language: "en", callService() {} });

const newCard = (config = {}, Card = mc.MowerCard) => {
  const card = new Card();
  card.setConfig({ device: "GOAT G1", show_map: "always", collapsed: [], ...config });
  card.hass = makeHass();
  return card;
};

// Opening tags of the elements a click acts on: an entity (more-info) or an action.
const clickables = (html) => html.match(/<[a-z-]+\b[^>]*\bdata-(?:entity|action)="[^"]*"[^>]*>/g) || [];

test("every clickable element of the full and mini cards can be reached and used from the keyboard", () => {
  const pages = [newCard(), newCard({ device: "Landroid Vision" }), newCard({ zoom: true }, mc.MowerMiniCard)];
  // The mini card in its detailed view draws the full card's sections.
  pages[2]._setZoom(true);
  for (const card of pages) {
    const tags = clickables(card.shadowRoot.innerHTML).filter((tag) => !/data-action="confirm_backdrop"/.test(tag));
    assert.ok(tags.length > 10, "the card has clickable elements");
    for (const tag of tags) {
      if (tag.startsWith("<button")) continue;
      assert.match(tag, /\brole="button"/, tag);
      assert.match(tag, /\btabindex="0"/, tag);
    }
  }
});

test("the section titles are buttons that tell whether they are unfolded, the toggles are switches", () => {
  const card = newCard({ device: "automower", collapsed: ["stats"] });
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="stats" aria-expanded="false">/);
  assert.match(html, /data-section="options" aria-expanded="true">/);
  assert.match(html, /<button class="toggle-btn on" role="switch" aria-checked="true" aria-label="Enable schedule"/);
});

test("the picture and the status chip, which have no text of their own, get a name", () => {
  const html = newCard().shadowRoot.innerHTML;
  assert.match(html, /<div class="picture clickable" role="button" tabindex="0" aria-label="GOAT G1" data-entity="lawn_mower\.goat">/);
  assert.match(html, /class="chip clickable ok"[^>]*aria-label="Docked"/);
  assert.match(html, /<img alt="Map" data-map="image.goat_carte">/);
});

// keydown as the shadow root receives it, on an element of the card.
const key = (card, k, target) => {
  let prevented = 0;
  card.shadowRoot.listeners.keydown({ key: k, target, preventDefault: () => prevented++ });
  return prevented;
};
const roleButton = () => ({
  clicks: 0,
  getAttribute: (a) => (a === "role" ? "button" : null),
  click() {
    this.clicks++;
  },
});

test("Enter and Space act as a click on the elements with the button role, other keys do nothing", () => {
  const card = newCard();
  const el = roleButton();
  assert.equal(key(card, "Enter", el), 1);
  assert.equal(key(card, " ", el), 1);
  assert.equal(el.clicks, 2);
  assert.equal(key(card, "a", el), 0);
  const plain = { getAttribute: () => null, clicks: 0, click() { this.clicks++; } };
  assert.equal(key(card, "Enter", plain), 0);
  assert.equal(plain.clicks, 0);
});

test("Escape closes the confirmation popup", () => {
  const card = newCard({ device: "Landroid Vision" });
  card._onClick({ composedPath: () => [{ dataset: { action: "button", entity: "button.landroid_bordures", label: "Edge cut" } }], stopPropagation() {} });
  assert.match(card.shadowRoot.innerHTML, /dialog-open/);
  mc.window.fire("keydown", { key: "Escape", stopPropagation() {} });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /dialog-open/);
});

test("the pictures honour prefers-reduced-motion", () => {
  assert.match(mc.mowerSvg("husqvarna", "mowing"), /prefers-reduced-motion: reduce/);
});
