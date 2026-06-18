import { STAGE_HUD, type Stage } from "../protocol/lifecycle";

/**
 * The terminal HUD — the brutalist mono captions from the promo
 * ("SUBJECT DETECTED. STATUS: UNRIPE."). Pure DOM/CSS overlay.
 *
 * ponytail: the promo's captions are flat 2D terminal text, so a DOM overlay is
 * the faithful and efficient choice — no GPU text rasterizer (and no patent-
 * encumbered Slug atlas) needed for what is, visually, monospace HUD copy.
 */
export interface Hud {
  root: HTMLElement;
  setStage(stage: Stage): void;
  setReadout(ripeness: number, charge: number, peelWei: bigint): void;
  log(line: string): void;
  dispose(): void;
}

const STATUS_ID = "bp-status";
const LINE_ID = "bp-line";
const READOUT_ID = "bp-readout";
const LOG_ID = "bp-log";

export function createHud(): Hud {
  const root = document.createElement("div");
  root.className = "bp-hud";
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <header class="bp-hud__top">
      <span class="bp-hud__mark">◢ BANANA&nbsp;PROTOCOL</span>
      <span id="${STATUS_ID}" class="bp-hud__status">STATUS: UNRIPE</span>
    </header>
    <p id="${LINE_ID}" class="bp-hud__line">SUBJECT DETECTED. A spatial anomaly stirs in the void.</p>
    <pre id="${READOUT_ID}" class="bp-hud__readout"></pre>
    <pre id="${LOG_ID}" class="bp-hud__log" aria-hidden="true"></pre>
  `;

  const statusEl = root.querySelector<HTMLElement>(`#${STATUS_ID}`)!;
  const lineEl = root.querySelector<HTMLElement>(`#${LINE_ID}`)!;
  const readoutEl = root.querySelector<HTMLElement>(`#${READOUT_ID}`)!;
  const logEl = root.querySelector<HTMLElement>(`#${LOG_ID}`)!;
  const history: string[] = [];

  function setStage(stage: Stage): void {
    const hud = STAGE_HUD[stage];
    statusEl.textContent = `STATUS: ${hud.status}`;
    statusEl.dataset["danger"] = String(hud.danger);
    lineEl.textContent = hud.line;
    root.dataset["stage"] = stage;
  }

  function setReadout(ripeness: number, charge: number, peelWei: bigint): void {
    const pct = (n: number) => `${Math.round(clamp01(n) * 100)}`.padStart(3, " ");
    readoutEl.textContent =
      `RIPENESS  [${bar(ripeness)}] ${pct(ripeness)}%\n` +
      `CHARGE    [${bar(charge)}] ${pct(charge)}%\n` +
      `$PEEL FED  ${formatWei(peelWei)}`;
  }

  function log(line: string): void {
    const stamp = `${performance.now().toFixed(0).padStart(7, "0")}`;
    history.push(`${stamp}  ${line}`);
    if (history.length > 6) history.shift();
    logEl.textContent = history.join("\n");
  }

  return {
    root,
    setStage,
    setReadout,
    log,
    dispose() {
      root.remove();
    },
  };
}

function bar(value: number): string {
  const filled = Math.round(clamp01(value) * 12);
  return "█".repeat(filled) + "░".repeat(12 - filled);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function formatWei(wei: bigint): string {
  // 18-decimal token, trimmed to 3 fractional digits.
  const base = 10n ** 18n;
  const whole = wei / base;
  const frac = ((wei % base) * 1000n) / base;
  return `${whole.toString()}.${frac.toString().padStart(3, "0")} PEEL`;
}
