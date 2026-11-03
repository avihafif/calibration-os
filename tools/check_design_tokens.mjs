import { readFileSync } from "node:fs";

const css = readFileSync("packages/ts/ui-kit/src/tokens.css", "utf8");
const themeStart = css.indexOf('.calos-app[data-theme="dark"]');
if (themeStart < 0) throw new Error("DARK_THEME_MISSING");

function parse(source) {
  const tokens = new Map();
  for (const match of source.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gu)) {
    if (tokens.has(match[1]))
      throw new Error(`DUPLICATE_DESIGN_TOKEN: ${match[1]}`);
    tokens.set(match[1], match[2]);
  }
  return tokens;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const approvedProtected = {
  light: {
    sim: "#6d28d9",
    "deployment-test": "#0a5f8c",
    "deployment-prod": "#8a1c1c",
    hazard: "#b93815",
    focus: "#0b57d0",
    "on-fill": "#ffffff",
  },
  dark: {
    sim: "#c4a8ff",
    "deployment-test": "#6cc4ee",
    "deployment-prod": "#ff8f8f",
    hazard: "#ff9a6b",
    focus: "#9dbdff",
    "on-fill": "#0b1220",
  },
};
const pairs = [
  ["text", "surface", 4.5],
  ["text-muted", "surface", 4.5],
  ["primary", "surface", 4.5],
  ["border", "surface", 3],
  ["focus", "surface", 3],
  ["on-fill", "sim", 4.5],
  ["on-fill", "deployment-test", 4.5],
  ["on-fill", "deployment-prod", 4.5],
  ["error", "error-bg", 4.5],
  ["warn", "warn-bg", 4.5],
  ["ok", "ok-bg", 4.5],
  ["info", "info-bg", 4.5],
];
for (const [theme, tokens] of Object.entries({
  light: parse(css.slice(0, themeStart)),
  dark: parse(css.slice(themeStart)),
})) {
  for (const [name, value] of Object.entries(approvedProtected[theme])) {
    if (tokens.get(name) !== value)
      throw new Error(`PROTECTED_TOKEN_DRIFT: ${theme}: ${name}`);
  }
  for (const [foreground, background, floor] of pairs) {
    const first = tokens.get(foreground);
    const second = tokens.get(background);
    if (!first || !second || contrast(first, second) < floor)
      throw new Error(
        `TOKEN_CONTRAST_FAILURE: ${theme}: ${foreground}/${background}`,
      );
  }
}
if (contrast("#ffffff", "#ffffff") >= 4.5)
  throw new Error("CONTRAST_NEGATIVE_PROBE_FAILED");
if (/@font-face|url\(/iu.test(css)) throw new Error("FONT_ASSET_FORBIDDEN");
process.stdout.write(
  `Approved light/dark tokens and ${pairs.length * 2} contrast pairs passed.\n`,
);
