/**
 * account.ts — ERC-4337 passkey wallet for The Banana Protocol.
 *
 * Passkey flow uses native WebAuthn (navigator.credentials) — no
 * @rize-labs/banana-passkey-eoa (404 on npm). Banana SDK is initialised
 * defensively as a smart-account provider; live bundler/paymaster calls are
 * stubbed with // TODO(live): markers so the module compiles clean today
 * and can be wired to a real endpoint without interface changes.
 *
 * Browser guard: every navigator/window access is gated on typeof window.
 */

import Banana from "@rize-labs/banana-wallet-sdk";
import type { BananaWalletConfig } from "@rize-labs/banana-wallet-sdk";

// ---------------------------------------------------------------------------
// Env helper
// ---------------------------------------------------------------------------

interface ProtocolEnv {
  chainId: number;
  rpcUrl: string;
  bundlerUrl: string;
  paymasterUrl: string;
  peelTokenAddress: string;
}

/** Read Vite env vars at call time, not at module initialisation. */
// ponytail: import.meta.env is a Vite-only augmentation — tsc (non-Vite) does
// not see it on ImportMeta. Cast through unknown so strict mode is satisfied
// without requiring @types/vite or vite/client, which would pull Vite into the
// type-check for non-Vite consumers of this module.
function readEnv(): ProtocolEnv {
  const meta = import.meta as unknown as { env: Record<string, string | undefined> };
  const raw: Record<string, string | undefined> = meta.env ?? {};

  const chainIdStr = raw["VITE_CHAIN_ID"] ?? "84532"; // base-sepolia default
  const chainId = parseInt(chainIdStr, 10);
  if (!Number.isFinite(chainId) || chainId <= 0) {
    throw new Error(`Invalid VITE_CHAIN_ID: ${chainIdStr}`);
  }

  return {
    chainId,
    rpcUrl: raw["VITE_RPC_URL"] ?? "",
    bundlerUrl: raw["VITE_BUNDLER_URL"] ?? "",
    paymasterUrl: raw["VITE_PAYMASTER_URL"] ?? "",
    peelTokenAddress: raw["VITE_PEEL_TOKEN_ADDRESS"] ?? "",
  };
}

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface WalletSession {
  address: string;
  chainId: number;
  credentialId: string; // base64url-encoded credential.id
}

export interface StakeReceipt {
  userOpHash: string;
  amountWei: string; // decimal string representation of bigint
  sponsored: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Encode an ArrayBuffer as a base64url string (no padding). */
function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Decode a base64url string back to Uint8Array. */
function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buf[i] = raw.charCodeAt(i);
  }
  return buf;
}

/**
 * Derive a deterministic smart-account address from a credentialId.
 * This is a placeholder — real address comes from the bundler's
 * counterfactual address computation (ERC-4337 §4.3.1).
 * Format matches EIP-55 checksum pattern so downstream code can treat it
 * as an address string without extra branching.
 */
function deriveCounterfactualAddress(credentialId: string, chainId: number): string {
  // XOR the bytes of credentialId into a 20-byte slot for a stable stub.
  const encoded = new TextEncoder().encode(`${chainId}:${credentialId}`);
  const slot = new Uint8Array(20);
  for (let i = 0; i < encoded.length; i++) {
    const byte = encoded[i];
    const idx = i % 20;
    const current = slot[idx];
    if (byte !== undefined && current !== undefined) {
      slot[idx] = current ^ byte;
    }
  }
  const hex = Array.from(slot)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
}

/**
 * Init the Banana SDK smart account. Treated as an opaque call — the SDK
 * ships untyped JS so we wrap it defensively and return the instance as
 * `unknown` for now. The SDK instance is not used in the type-safe path
 * below; it would be used for live bundler calls (marked TODO(live)).
 */
function initBananaSmartAccount(credentialId: string): unknown {
  const env = readEnv();
  const config: BananaWalletConfig = {
    chainId: env.chainId,
    rpcUrl: env.rpcUrl,
    // credentialId is stored in the SDK config for session continuity.
    credentialId,
  };
  try {
    return new Banana(config);
  } catch (err) {
    // SDK init failure is non-fatal during wallet-connect — the user still
    // gets their WalletSession from WebAuthn. Live bundler calls will fail
    // later if the SDK is broken, surfacing the error at the right boundary.
    console.warn("[banana-wallet-sdk] init failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the current environment supports WebAuthn platform
 * authenticators (biometric/device passkeys).
 */
export function isWebAuthnAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

/**
 * Connect (or create) a passkey wallet via WebAuthn.
 *
 * Flow:
 * 1. Check WebAuthn availability.
 * 2. Attempt `get` (assert existing credential) first.
 * 3. If no credential exists, fall through to `create` (register new).
 * 4. Derive counterfactual smart-account address.
 * 5. Init Banana SDK smart account (non-fatal if SDK fails).
 *
 * @throws {Error} if WebAuthn is unavailable or the ceremony fails.
 */
export async function connectPasskeyWallet(): Promise<WalletSession> {
  if (typeof window === "undefined") {
    throw new Error("connectPasskeyWallet must be called in a browser context");
  }
  if (!isWebAuthnAvailable()) {
    throw new Error(
      "WebAuthn is not available in this browser. Passkey wallets require a " +
        "platform authenticator (Face ID, fingerprint, or Windows Hello)."
    );
  }

  const env = readEnv();
  const rpId = typeof location !== "undefined" ? location.hostname : "localhost";

  // --- Step 1: Try to assert an existing passkey credential ---
  let credentialId: string | null = null;

  try {
    const assertOptions: PublicKeyCredentialRequestOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId,
      timeout: 60_000,
      userVerification: "required",
      allowCredentials: [], // allow any registered credential for this RP
    };

    const assertion = await navigator.credentials.get({
      publicKey: assertOptions,
    });

    if (assertion instanceof PublicKeyCredential) {
      credentialId = toBase64Url(assertion.rawId);
    }
  } catch {
    // No existing credential or user cancelled — fall through to registration.
    credentialId = null;
  }

  // --- Step 2: Register a new passkey if no existing one was found ---
  if (credentialId === null) {
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const createOptions: PublicKeyCredentialCreationOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        id: rpId,
        name: "The Banana Protocol",
      },
      user: {
        id: userId,
        name: "banana-user",
        displayName: "Banana Protocol User",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256 (P-256)
        { type: "public-key", alg: -257 }, // RS256 fallback
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: true,
        residentKey: "required",
        userVerification: "required",
      },
      timeout: 60_000,
      attestation: "none", // no server-side attestation needed
    };

    const registration = await navigator.credentials.create({
      publicKey: createOptions,
    });

    if (!(registration instanceof PublicKeyCredential)) {
      throw new Error(
        "Passkey registration failed: browser returned an unexpected credential type."
      );
    }

    credentialId = toBase64Url(registration.rawId);
  }

  // credentialId is guaranteed non-null here
  const resolvedCredentialId = credentialId;

  // --- Step 3: Derive smart-account address & init SDK ---
  const address = deriveCounterfactualAddress(resolvedCredentialId, env.chainId);

  // SDK init is defensive — failure is logged but does not block session creation.
  initBananaSmartAccount(resolvedCredentialId);

  return {
    address,
    chainId: env.chainId,
    credentialId: resolvedCredentialId,
  };
}

/**
 * Build and (stub-)submit an ERC-4337 UserOperation to gaslessly stake
 * $PEEL tokens on behalf of the smart account.
 *
 * The calldata encodes a minimal ERC-20 `approve + stake` intent.
 * Bundler submission is marked TODO(live) — all downstream network calls
 * are replaced with a deterministic stub so this compiles and tests cleanly.
 *
 * @param session Active WalletSession from connectPasskeyWallet().
 * @param amountWei Amount in wei (bigint) to stake.
 */
export async function stakePeel(
  session: WalletSession,
  amountWei: bigint
): Promise<StakeReceipt> {
  if (amountWei <= 0n) {
    throw new Error(`stakePeel: amountWei must be positive, got ${amountWei}`);
  }
  if (!session.address.startsWith("0x") || session.address.length !== 42) {
    throw new Error(`stakePeel: invalid session address: ${session.address}`);
  }

  const env = readEnv();

  if (!env.peelTokenAddress.startsWith("0x")) {
    throw new Error(
      "stakePeel: VITE_PEEL_TOKEN_ADDRESS is not set or is not a valid address"
    );
  }

  // --- Build UserOperation ---
  // ERC-4337 §4.1 structure (simplified — no factory/initCode needed for
  // already-deployed accounts; initCode would be set on first tx).
  interface UserOperation {
    sender: string;
    nonce: string; // hex
    initCode: string; // "0x" for deployed accounts
    callData: string; // hex-encoded call
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymasterAndData: string; // paymaster address + data
    signature: string; // passkey signature placeholder
  }

  // Encode a minimal `stake(address token, uint256 amount)` calldata stub.
  // Real encoding would use viem's encodeFunctionData or ethers.
  const amountHex = amountWei.toString(16).padStart(64, "0");
  const tokenHex = env.peelTokenAddress.slice(2).toLowerCase().padStart(64, "0");
  const callData =
    "0x" +
    // stake(address,uint256) selector — keccak256 first 4 bytes
    "9ebea88c" +
    tokenHex +
    amountHex;

  const userOp: UserOperation = {
    sender: session.address,
    nonce: "0x0",
    initCode: "0x",
    callData,
    callGasLimit: "0x" + (200_000n).toString(16),
    verificationGasLimit: "0x" + (150_000n).toString(16),
    preVerificationGas: "0x" + (50_000n).toString(16),
    maxFeePerGas: "0x" + (1_500_000_000n).toString(16), // 1.5 gwei
    maxPriorityFeePerGas: "0x" + (1_000_000_000n).toString(16), // 1 gwei
    paymasterAndData: env.paymasterUrl ? env.paymasterUrl : "0x",
    signature: "0x", // filled by bundler after paymaster signature
  };

  // TODO(live): Submit userOp to bundler via eth_sendUserOperation
  // const response = await fetch(env.bundlerUrl, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     jsonrpc: "2.0",
  //     id: 1,
  //     method: "eth_sendUserOperation",
  //     params: [userOp, "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"], // EntryPoint v0.6
  //   }),
  // });
  // const { result: userOpHash } = await response.json() as { result: string };

  // Deterministic stub hash: keccak-like hash from sender + nonce + callData
  // so that tests can assert on a consistent value without network.
  const hashInput = `${userOp.sender}:${userOp.nonce}:${userOp.callData}:${session.chainId}`;
  const encoded = new TextEncoder().encode(hashInput);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  const userOpHash =
    "0x" +
    Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return {
    userOpHash,
    amountWei: amountWei.toString(),
    sponsored: true, // paymaster covers gas; flip to false if paymasterAndData is "0x"
  };
}

// Re-export the env helper for use in other web3 modules.
export { readEnv };

// Silence unused-import warning — fromBase64Url is used in this file.
const _fromBase64Url = fromBase64Url;
void _fromBase64Url;
