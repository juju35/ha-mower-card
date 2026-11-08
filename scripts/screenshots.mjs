// Renders the cards with mock lawn mower data and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { devices, entities, states } from "./mock-states.mjs";
import { unchanged } from "./pixels.mjs";
import { gifs, shots } from "./screenshot-list.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

// Every capture is rendered to a temporary file and copied over screenshots/<file> only when its decoded pixels
// differ (scripts/pixels.mjs): a run that draws the same pictures changes no file, so the workflow commits nothing.
const work = mkdtempSync(join(tmpdir(), "mc-shots-"));
const keep = (fresh, name) => {
  const target = `${root}screenshots/${name}`;
  if (unchanged(fresh, target)) return console.log(`screenshots/${name} (unchanged)`);
  copyFileSync(fresh, target);
  console.log(`screenshots/${name}`);
};
const cardJs = readFileSync(`${root}dist/mower-card.js`, "utf8");

// Every uncaught page error is collected here; the script exits non-zero when any occurred,
// so a card that throws on load cannot silently produce blank screenshots.
const pageErrors = [];

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed",
    "--secondary-background-color": "#ececec",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

// Minimal stand-ins for Home Assistant's <ha-card> and <ha-camera-stream>: the player draws a still garden scene per
// camera (the view from a mower's vision camera: lawn in the foreground, hedge or fence, sky), as ha-home-camera-card
// does for its rooms.
const scene = (body) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">${body}</svg>`)}")`;
const garden = (sky, far, extra) =>
  '<defs><linearGradient id="s" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient>' +
  '<linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6fae4a"/><stop offset="1" stop-color="#3f7a2c"/></linearGradient>' +
  '<radialGradient id="v" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".4"/></radialGradient></defs>' +
  '<rect width="160" height="90" fill="url(#s)"/>' + far +
  '<path d="M0 50 L160 48 L160 90 L0 90Z" fill="url(#g)"/>' +
  // Mowing stripes and the lawn's own grain
  '<g fill="#fff" opacity=".08"><path d="M20 90 L48 50 L62 50 L50 90Z"/><path d="M90 90 L92 48 L106 48 L120 90Z"/></g>' +
  '<g stroke="#2f5f22" stroke-width=".5" opacity=".5"><path d="M0 62 L160 60"/><path d="M0 74 L160 72"/></g>' + extra +
  '<rect width="160" height="90" fill="url(#v)"/>';
const SCENES = {
  // Left: hedge and a flower bed along the lawn, a tree behind.
  left: scene(garden(["#8fbfe3", "#d7e9f2"], '<ellipse cx="34" cy="30" rx="18" ry="16" fill="#3f7a35"/><rect x="31" y="40" width="6" height="12" fill="#6b4a2b"/><path d="M60 52 Q80 34 160 38 L160 50 L60 52Z" fill="#4d8a3a"/>',
    '<g><ellipse cx="22" cy="60" rx="14" ry="5" fill="#6b4a2b"/><circle cx="14" cy="56" r="2.2" fill="#e8577a"/><circle cx="22" cy="54" r="2.2" fill="#f2c94c"/><circle cx="30" cy="57" r="2.2" fill="#e8577a"/></g>')),
  // Right: wooden fence and the house wall, a garden chair.
  right: scene(garden(["#9cc3e4", "#e3eef5"], '<rect x="96" y="16" width="64" height="34" fill="#e9e2d4"/><rect x="108" y="24" width="14" height="14" rx="1" fill="#6f8fb0"/><g fill="#a9825c"><path d="M0 34 L96 40 L96 50 L0 52Z"/></g><g stroke="#8c6a48" stroke-width=".8"><path d="M16 35 V51"/><path d="M40 37 V51"/><path d="M64 38 V50"/></g>',
    '<rect x="118" y="54" width="12" height="10" rx="1" fill="#e9e4da"/><rect x="118" y="48" width="12" height="7" rx="1" fill="#f3efe6"/>')),
  // Rear: the charging station on the lawn and the mowed stripe behind the mower.
  rear: scene(garden(["#86b6dc", "#cfe3ef"], '<path d="M0 44 Q40 30 80 36 T160 34 L160 50 L0 50Z" fill="#4d8a3a"/>',
    '<path d="M62 90 L72 50 L88 50 L98 90Z" fill="#fff" opacity=".14"/><rect x="118" y="46" width="10" height="20" rx="2" fill="#4b5057"/><rect x="120" y="49" width="6" height="8" rx="1" fill="#2b2f34"/><circle cx="123" cy="51" r="1" fill="#43c463"/><path d="M104 66 L134 66 L136 70 L102 70Z" fill="#3a3e43"/>')),
};
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});
const SCENES = ${JSON.stringify(SCENES)};
customElements.define("ha-camera-stream", class extends HTMLElement {
  get stateObj() { return this._st; }
  set stateObj(st) {
    this._st = st;
    // The scene follows the camera's name (Left / Right / Rear vision camera).
    const name = (st && st.attributes.friendly_name) || "";
    const key = /right/i.test(name) ? "right" : /rear/i.test(name) ? "rear" : "left";
    this.style.background = st ? SCENES[key] + " center / cover" : "";
    if (st) setTimeout(() => this.dispatchEvent(new CustomEvent("load", { bubbles: true, composed: true })));
  }
});`;

const page_html = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

// Opens a card on a fresh page (its script declares top-level names, which cannot be evaluated twice in one page)
// and mounts it with the mock hass; `overrides` patch the mock states for this shot only.
async function openCard(browser, { file, type, config, theme, width, overrides }) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
  page.on("pageerror", (err) => {
    console.error(`pageerror (${file}): ${err.message}`);
    pageErrors.push(`${file}: ${err.message}`);
  });
  await page.setContent(page_html(theme, width));
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  await page.addScriptTag({ content: `window.inlinePictures = ${inlinePictures};` });
  await page.evaluate(
    ({ type, config, states, entities, devices, overrides, theme }) => {
      for (const [id, o] of Object.entries(overrides || {})) states[id] = { ...states[id], ...o };
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      el.hass = {
        states, entities, devices, language: "en", locale: { language: "en" }, themes: { darkMode: theme === "dark" }, callService: () => {},
      };
      document.getElementById("root").appendChild(el);
    },
    { type, config, states, entities, devices, overrides, theme }
  );
  return page;
}


// The mower pictures are SVG <img>: their CSS animations run in a document of their own, out of reach of
// document.getAnimations() and of Playwright's `animations: "disabled"`. For the capture each one is redrawn inline,
// in a shadow root of its own (its styles and ids stay apart), at the same size and with the same filter, so that
// its animations can be reset (screenshots) or paused and stepped (GIFs). Returns every animation of the page: those
// of the document and of the shadow roots of the card and of the pictures (document.getAnimations() leaves out the
// shadow trees). Run before every frame: a card re-render puts the <img> back, and stepping restarts from the same
// times anyway.
function inlinePictures() {
  const card = document.querySelector("#root").firstElementChild.shadowRoot;
  window.pictureRoots ||= [];
  for (const img of card.querySelectorAll("img")) {
    const src = img.getAttribute("src") || "";
    if (!src.startsWith("data:image/svg+xml,")) continue;
    const svg = new DOMParser().parseFromString(decodeURIComponent(src.slice(src.indexOf(",") + 1)), "image/svg+xml").documentElement;
    const box = img.getBoundingClientRect();
    const host = document.createElement("div");
    host.style.cssText = `width:${box.width}px;height:${box.height}px;filter:${getComputedStyle(img).filter};flex:none`;
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    host.attachShadow({ mode: "open" }).appendChild(svg);
    img.replaceWith(host);
    window.pictureRoots.push(host.shadowRoot);
  }
  window.pictureRoots = window.pictureRoots.filter((r) => r.host.isConnected);
  return [document, card, ...window.pictureRoots].flatMap((r) => r.getAnimations());
}

// Deterministic text rendering: software rasterization, grayscale anti-aliasing and whole-pixel glyph positions.
// Otherwise Chromium draws a few texts (the battery figure, the button labels) differently from one run to the next
// once the camera player sits in the card, and the exact pixel comparison would rewrite captures that look the same.
const browser = await chromium.launch({
  args: ["--disable-lcd-text", "--disable-font-subpixel-positioning", "--disable-gpu"],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
for (const s of shots) {
  const page = await openCard(browser, s);
  for (const sel of s.clicks || []) {
    // A mouse click (detail 1), not .click(): a keyboard-like click would move the focus and show its ring.
    await page.evaluate(
      (sel) =>
        document
          .querySelector("#root")
          .firstElementChild.shadowRoot.querySelector(sel)
          .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 })),
      sel
    );
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.inlinePictures();
  });
  const box = await page.locator("#root").boundingBox();
  await page.screenshot({
    path: join(work, `${s.file}.png`),
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  keep(join(work, `${s.file}.png`), `${s.file}.png`);
  await page.close();
}

// Records one animated state as a looping GIF (screenshots/<gif.file>.gif) — needs ffmpeg on PATH.
// Every animation is paused and stepped frame by frame, so the GIF is identical whatever the machine's speed
// (the mower pictures are inlined first, see inlinePictures: as <img>, getAnimations() did not see them).
async function makeGif(browser, gif, { fps = 20, seconds = 3 } = {}) {
  const page = await openCard(browser, gif);
  await page.waitForTimeout(300);
  const box = await page.locator("#root").boundingBox();
  const clip = { x: 0, y: 0, width: gif.width + 32, height: Math.ceil(box.height) + 32 };
  const dir = mkdtempSync(join(tmpdir(), "mc-frames-"));
  const frames = Math.round(fps * seconds);
  for (let i = 0; i < frames; i++) {
    const n = await page.evaluate(
      (t) => {
        const all = window.inlinePictures();
        for (const a of all) {
          a.pause();
          a.currentTime = t;
        }
        return all.length;
      },
      (i * 1000) / fps,
    );
    // An animated state with no animation to step would record frames at the machine's speed again.
    if (!n) throw new Error(`${gif.file}: no animation found to step`);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  const out = join(work, `${gif.file}.gif`);
  // Halve the retina capture and build a per-clip palette: the colours stay clean and the file stays small. Both are
  // deterministic: the palette is computed from the stepped frames only, and Bayer dithering is an ordered pattern
  // (no random error diffusion), so the same frames give the same GIF.
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${clip.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", out,
  ]);
  rmSync(dir, { recursive: true });
  keep(out, `${gif.file}.gif`);
}

for (const g of gifs) await makeGif(browser, g);
await browser.close();
rmSync(work, { recursive: true });

if (pageErrors.length) {
  console.error(`\n${pageErrors.length} page error(s) while rendering:`);
  for (const e of pageErrors) console.error(`  ${e}`);
  process.exitCode = 1;
}
