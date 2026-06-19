/**
 * WebGPU capability guard — degrades gracefully when WebGPU is unavailable.
 * No dependencies. All browser globals guarded with typeof checks.
 */

/**
 * Synchronous check: is the WebGPU API surface present in this environment?
 * Safe to call in SSR / non-browser contexts.
 */
export function isWebGPUAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/**
 * Asynchronous probe: attempt to acquire a GPU adapter.
 * Returns true only when a real adapter is obtained; never throws.
 */
export async function probeWebGPU(): Promise<boolean> {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    const adapter = await gpu?.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

/**
 * Render a dark neon-noir fallback notice into `mount`.
 * Appends a styled panel with `message` and a WebGPU browser hint.
 * Returns the created element.
 */
export function renderWebGPUNotice(mount: HTMLElement, message: string): HTMLElement {
  const panel = document.createElement("div");

  Object.assign(panel.style, {
    position: "fixed",
    inset: "0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0f",
    color: "#e0e0e0",
    fontFamily: "'Courier New', Courier, monospace",
    padding: "2rem",
    boxSizing: "border-box",
    zIndex: "9999",
  } satisfies Partial<CSSStyleDeclaration>);

  const title = document.createElement("div");
  Object.assign(title.style, {
    fontSize: "1.1rem",
    fontWeight: "700",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#ff2d78",
    marginBottom: "1rem",
    textShadow: "0 0 12px #ff2d78, 0 0 24px #ff2d7855",
  } satisfies Partial<CSSStyleDeclaration>);
  title.textContent = "// WEBGPU UNAVAILABLE";

  const body = document.createElement("div");
  Object.assign(body.style, {
    fontSize: "0.95rem",
    lineHeight: "1.6",
    maxWidth: "480px",
    textAlign: "center",
    color: "#a0a0b0",
    marginBottom: "1.5rem",
    border: "1px solid #ff2d7833",
    borderRadius: "4px",
    padding: "1rem 1.5rem",
    background: "#0f0f1a",
  } satisfies Partial<CSSStyleDeclaration>);
  body.textContent = message;

  const hint = document.createElement("div");
  Object.assign(hint.style, {
    fontSize: "0.8rem",
    color: "#5a5a7a",
    letterSpacing: "0.08em",
    textAlign: "center",
  } satisfies Partial<CSSStyleDeclaration>);
  hint.textContent =
    "A WebGPU-capable browser is required — use a recent version of Chrome or Edge.";

  panel.appendChild(title);
  panel.appendChild(body);
  panel.appendChild(hint);
  mount.appendChild(panel);

  return panel;
}
