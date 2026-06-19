// Run the full Banana Protocol stack locally with one command:
//   bun run dev:all
// Backend (Elysia/Bun) on :3000 + frontend (Vite) on :5173, wired via the Vite proxy.
import { spawn } from "node:child_process";

// A dev-only secret so Better Auth boots without setup. Override in your shell/.env
// for anything real.
process.env.BETTER_AUTH_SECRET ??= "bp-local-dev-0123456789abcdef0123456789abcdef";

const opts = { stdio: "inherit", shell: true, env: process.env };
const procs = [
  spawn("bun", ["run", "src/backend/server.ts"], opts),
  spawn("bun", ["x", "vite", "--port", "5173", "--strictPort"], opts),
];

const stop = () => procs.forEach((p) => p.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
procs.forEach((p) => p.on("exit", (code) => code && stop()));
