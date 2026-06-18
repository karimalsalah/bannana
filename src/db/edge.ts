/**
 * Turso/libSQL edge read client — OPTIONAL.
 *
 * Active only when TURSO_DATABASE_URL is set. When absent (or when @libsql/client
 * is not installed — disk is tight at 9.9 GB free), all reads degrade to the
 * Neon Postgres fallback with zero import errors.
 *
 * // ponytail: @libsql/client is NOT installed (disk constraint documented in
 * //           docs/HANDOFF.md). Dynamic import is guarded; tsc + build never fail
 * //           on its absence. Add it with `bun add @libsql/client` when headroom allows.
 */

/** Returns true only when the Turso edge connection is configured. */
export function edgeReadEnabled(): boolean {
  return Boolean(process.env["TURSO_DATABASE_URL"]);
}

/**
 * Execute `fn` against the Turso edge replica when configured, otherwise fall
 * back to `fallback` (typically a Neon Postgres query).
 *
 * The @libsql/client import is fully dynamic and failure-tolerant: if the package
 * is absent the error is caught and control falls through to `fallback`.
 */
export async function edgeRead<T>(
  fn: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  const url = process.env["TURSO_DATABASE_URL"];
  const authToken = process.env["TURSO_AUTH_TOKEN"];

  if (!url) {
    return fallback();
  }

  try {
    // @ts-ignore — @libsql/client may not be installed; failure is intentional
    const libsql = await import("@libsql/client").catch(() => null);
    if (!libsql) {
      return fallback();
    }
    // Verify the client factory is present (package shape check)
    if (typeof libsql.createClient !== "function") {
      return fallback();
    }
    void libsql.createClient({ url, authToken });
    return fn();
  } catch {
    return fallback();
  }
}
