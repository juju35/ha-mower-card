// The status pill in Chromium (skipped without it), in en, fr, de, hu, el and ru, from 190 to 500 px, on the full
// card and the mini card (compact and expanded), illustrated and classic: the pill sits right after the title only
// when the whole title and the whole label fit there (the title is then not cut), else on its own line under the
// subtitle (only when it could not fit beside the whole title); its label is whole or only its dot shows (always at
// 190 px); nothing goes over the lawn strip or out of the banner. The mini card's expand / collapse button is a 24 px
// round button 5 px from the top right corner of the banner.
import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { source } from "./source.mjs";


let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {}
const browser = await chromium?.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch((err) => {
  // In Validate (REQUIRE_BROWSER=1) the browser must start: a missing Chromium fails the job instead of skipping.
  if (process.env.REQUIRE_BROWSER === "1") throw err;
  return null;
});

const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;border:1px solid #ddd;overflow:hidden}</style><slot></slot>"; } });`;

test("status pill: beside the whole title when both fit, else under the subtitle, label whole or dot only, inside the banner", { skip: !browser && "no Chromium" }, async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  try {
    await page.setContent('<!doctype html><body style="margin:0;font-family:Roboto,Arial,sans-serif"></body>');
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: source });
    const failures = await page.evaluate(
      async ({ states, entities, devices }) => {
        const frames = (n) => new Promise((r) => {
          const step = () => (n-- > 0 ? requestAnimationFrame(step) : r());
          step();
        });
        const full = (el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return Math.max(el.scrollWidth, range.getBoundingClientRect().width);
        };
        const out = [];
        for (const lang of ["en", "fr", "de", "hu", "el", "ru"]) {
          const hass = { states, entities, devices, language: lang, locale: { language: lang }, themes: {}, callService() {} };
          for (const width of [190, 245, 300, 400, 460, 500]) {
            for (const [type, zoom, illustration] of [["mower-card", false, true], ["mower-mini-card", false, true], ["mower-mini-card", true, true], ["mower-card", false, false], ["mower-mini-card", false, false]]) {
              for (const title of [undefined, "Mower", "A very long robot mower name for the back garden"]) {
                document.body.innerHTML = "";
                const box = document.body.appendChild(document.createElement("div"));
                box.style.width = `${width}px`;
                const card = box.appendChild(document.createElement(type));
                card.setConfig({ type: `custom:${type}`, ...(title ? { title } : {}), ...(illustration ? {} : { illustration: false }) });
                card.hass = hass;
                await frames(2);
                const r = card.shadowRoot;
                if (zoom) r.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
                await frames(4);
                const tag = `${lang} ${type}${zoom ? " zoomed" : ""}${illustration ? "" : " classic"} ${width}px${title ? ` "${title.slice(0, 10)}"` : ""}`;
                const chip = r.querySelector(".titles .chip");
                if (!chip) {
                  out.push(`${tag}: no pill`);
                  continue;
                }
                const text = chip.querySelector(".chip-text");
                const dotOnly = getComputedStyle(text).display === "none";
                if (!dotOnly && (text.scrollWidth > text.clientWidth + 0.5 || text.clientWidth === 0)) out.push(`${tag}: label cut`);
                if (width <= 200 && !dotOnly) out.push(`${tag}: label shown at ${width}px`);
                const name = r.querySelector(".titles .name");
                const nb = name.getBoundingClientRect();
                const cb = chip.getBoundingClientRect();
                const onRow = Math.abs(cb.top + cb.height / 2 - (nb.top + nb.height / 2)) < 3;
                if (onRow && full(name) > name.clientWidth + 1) out.push(`${tag}: title cut beside the pill`);
                if (onRow && cb.left - nb.right > 10.5) out.push(`${tag}: pill ${Math.round(cb.left - nb.right)}px after the title`);
                const room = name.closest(".titles").getBoundingClientRect().width;
                if (!onRow && full(name) + 8 + cb.width <= room - 1) out.push(`${tag}: pill under the subtitle although it fits beside the title`);
                if (!onRow && title === "Mower" && width >= 460) out.push(`${tag}: pill not beside a short title`);
                const banner = r.querySelector(".banner")?.getBoundingClientRect();
                if (!banner) continue;
                const ground = banner.bottom - 10;
                for (const el of r.querySelectorAll(".banner .titles > *, .banner .titles .chip, .banner .titles .name")) {
                  const b = el.getBoundingClientRect();
                  if (!b.height) continue;
                  if (b.bottom > ground + 0.5 || b.top < banner.top - 0.5 || b.right > banner.right + 0.5 || b.left < banner.left - 0.5) out.push(`${tag}: ${el.className} out of the banner or over the strip`);
                }
                if (type === "mower-mini-card") {
                  const zb = r.querySelector(".banner .zoom")?.getBoundingClientRect();
                  if (!zb) out.push(`${tag}: no zoom button`);
                  else if (Math.round(zb.width) !== 24 || Math.round(zb.height) !== 24 || Math.round(zb.top - banner.top) !== 5 || Math.round(banner.right - zb.right) !== 5)
                    out.push(`${tag}: zoom button ${Math.round(zb.width)}x${Math.round(zb.height)} at ${Math.round(zb.top - banner.top)}/${Math.round(banner.right - zb.right)}`);
                }
              }
            }
          }
        }
        return out;
      },
      { states, entities, devices },
    );
    assert.deepEqual(failures, []);
  } finally {
    await page.close();
  }
});

test.after(() => browser?.close());
