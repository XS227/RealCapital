/**
 * Centralised environment configuration with startup validation.
 *
 * In production (NODE_ENV=production) the app refuses to start if
 * ADMIN_PASSWORD_HASH or SESSION_SECRET are missing or look like placeholders.
 * In development, insecure fallbacks are allowed with a console warning.
 */

const isProd = process.env.NODE_ENV === "production";

function requireEnv(key: string, validate?: (v: string) => boolean): string {
  const value = process.env[key] ?? "";
  if (!value || value.startsWith("<") || value === "change_me_to_32_random_chars_minimum_please") {
    if (isProd) {
      throw new Error(
        `[REAL Capital] Missing or placeholder env var: ${key}\n` +
          `Set it in .env.local and rebuild. See README for instructions.`
      );
    }
    return "";
  }
  if (validate && !validate(value)) {
    if (isProd) {
      throw new Error(`[REAL Capital] Invalid env var: ${key}`);
    }
    console.warn(`[REAL Capital] Warning: ${key} may be misconfigured.`);
  }
  return value;
}

const SHA256_RE = /^[0-9a-f]{64}$/i;

export const config = {
  adminPasswordHash: requireEnv(
    "ADMIN_PASSWORD_HASH",
    (v) => SHA256_RE.test(v)
  ),
  sessionSecret: (() => {
    const v = process.env.SESSION_SECRET ?? "";
    const placeholder = "change_me_to_32_random_chars_minimum_please";
    if (!v || v === placeholder || v.startsWith("<")) {
      if (isProd) {
        throw new Error(
          "[REAL Capital] SESSION_SECRET is missing or placeholder. " +
            "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
      }
      console.warn("[REAL Capital] Warning: SESSION_SECRET not set — using insecure dev fallback.");
      return "dev_fallback_secret_not_for_production_12345678";
    }
    if (v.length < 32) {
      const msg = "[REAL Capital] SESSION_SECRET must be at least 32 characters.";
      if (isProd) throw new Error(msg);
      console.warn(msg);
    }
    return v;
  })(),
  bridgeApiUrl: process.env.BRIDGE_API_URL || "",
  bridgeApiKey: process.env.BRIDGE_API_KEY || "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4012",
  isProd,
} as const;
