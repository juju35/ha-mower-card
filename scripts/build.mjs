// Bundles src/mower-card.js into the single Marketplace file dist/mower-card.js, inlining the brand logos (Husqvarna,
// Worx Landroid, Ecovacs, Mammotion, ZCS, Bosch Indego, Gardena) so the card needs no extra resource.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const dataUri = (file) => `data:image/png;base64,${readFileSync(`${root}images/${file}`).toString("base64")}`;

let out = readFileSync(`${root}src/mower-card.js`, "utf8").replace("__VERSION__", pkg.version);
for (const brand of ["husqvarna", "landroid", "ecovacs", "mammotion", "zcs", "indego", "gardena"]) {
  out = out.replace(`__IMG_LOGO_${brand.toUpperCase()}__`, dataUri(`${brand}.png`));
}

mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/mower-card.js`, out);
console.log(`Built dist/mower-card.js (${(out.length / 1024).toFixed(1)} KB)`);
