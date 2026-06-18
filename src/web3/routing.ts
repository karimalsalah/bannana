/**
 * routing.ts — Multi-chain transaction routing abstraction for The Banana Protocol.
 *
 * Architectural reality (from web3-engineer.md + HANDOFF.md):
 *   - EVM chains: ERC-4337 bundler (base-sepolia / base) + Axelar cross-chain.
 *   - Solana: Jito / Nozomi MEV-protected relay.
 *   These runtimes are fundamentally incompatible; they cannot share a single
 *   SDK import. This module exposes a typed routing interface that documents
 *   which lane WOULD handle a given intent, without hard-depending on
 *   incompatible SDKs.
 *
 * // ponytail: disk is tight (9.9 GB free) and no EVM/Solana client lib is
 * //   installed. Routing is a pure abstraction — real bundler/relay calls are
 * //   wired externally once the SDK environment is stabilised.
 *
 * No network calls in this file.
 */

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

/** Chains supported by The Banana Protocol's routing layer. */
export type Chain = "base-sepolia" | "base" | "solana";

/** Describes a routing intent submitted to TxRouter. */
interface RoutingIntent {
  /** Target chain for this transaction. */
  chain: Chain;
  /** Hex-encoded calldata (EVM) or base58/base64 transaction bytes (Solana). */
  calldata: string;
  /** When true, the router MUST select an MEV-protected lane. */
  mevProtected: boolean;
}

/** Result returned by TxRouter.route(). */
interface RoutingResult {
  /** Whether the router accepted the intent for this lane. */
  accepted: boolean;
  /**
   * Human-readable lane identifier.
   * EVM: "erc4337-bundler" | "axelar-crosschain"
   * Solana: "jito-mev" | "nozomi-mev" | "standard-rpc"
   */
  lane: string;
}

/** Public interface for the transaction router. */
export interface TxRouter {
  route(intent: RoutingIntent): Promise<RoutingResult>;
}

// ---------------------------------------------------------------------------
// Internal lane selectors
// ---------------------------------------------------------------------------

type EvmLane = "erc4337-bundler" | "axelar-crosschain";
type SolanaLane = "jito-mev" | "nozomi-mev" | "standard-rpc";

function selectEvmLane(intent: RoutingIntent): EvmLane {
  // Axelar is used only for cross-chain messages (calldata starts with the
  // Axelar gateway selector 0x09c5eabe for sendToken / callContract).
  // All other EVM intents go to the ERC-4337 bundler.
  const AXELAR_SELECTOR = "0x09c5eabe";
  if (intent.calldata.toLowerCase().startsWith(AXELAR_SELECTOR)) {
    return "axelar-crosschain";
  }
  return "erc4337-bundler";
}

function selectSolanaLane(intent: RoutingIntent): SolanaLane {
  if (intent.mevProtected) {
    // Prefer Jito over Nozomi: Jito has broader validator adoption (>80 % stake
    // weight as of mid-2025). Nozomi is a fallback for latency-sensitive cases.
    return "jito-mev";
  }
  return "standard-rpc";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SUPPORTED_CHAINS = new Set<Chain>(["base-sepolia", "base", "solana"]);

function validateIntent(intent: RoutingIntent): void {
  if (!SUPPORTED_CHAINS.has(intent.chain)) {
    throw new Error(
      `TxRouter: unsupported chain "${String(intent.chain)}". ` +
        `Supported: ${[...SUPPORTED_CHAINS].join(", ")}`
    );
  }
  if (!intent.calldata || intent.calldata.length === 0) {
    throw new Error("TxRouter: calldata must not be empty");
  }
  // EVM calldata must start with 0x.
  if (intent.chain !== "solana" && !intent.calldata.startsWith("0x")) {
    throw new Error(
      `TxRouter: EVM calldata must be hex-encoded (starts with "0x"), ` +
        `got: ${intent.calldata.slice(0, 10)}...`
    );
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a TxRouter instance.
 *
 * The returned router is a pure routing-decision engine. It documents which
 * lane WOULD handle a given intent and returns `accepted: true` when the
 * intent is valid for the selected lane.
 *
 * Live integration points (not wired here — no compatible SDK installed):
 *   - "erc4337-bundler" → eth_sendUserOperation via env VITE_BUNDLER_URL
 *   - "axelar-crosschain" → Axelar Gateway contract callContract / sendToken
 *   - "jito-mev" → Jito Block Engine sendBundle endpoint
 *   - "nozomi-mev" → Nozomi validator tip-account transaction
 *   - "standard-rpc" → standard Solana RPC sendTransaction
 */
export function createTxRouter(): TxRouter {
  return {
    async route(intent: RoutingIntent): Promise<RoutingResult> {
      // Validate before any lane selection so errors surface early.
      validateIntent(intent);

      let lane: string;

      switch (intent.chain) {
        case "base-sepolia":
        case "base":
          lane = selectEvmLane(intent);
          break;
        case "solana":
          lane = selectSolanaLane(intent);
          break;
        default: {
          // Exhaustiveness check — TypeScript will error here if Chain gains
          // a new member that isn't handled above.
          const _exhaustive: never = intent.chain;
          throw new Error(
            `TxRouter: unhandled chain "${String(_exhaustive)}"`
          );
        }
      }

      // TODO(live): submit the intent to the selected lane's endpoint.
      // EVM example:
      //   const bundlerUrl = import.meta.env["VITE_BUNDLER_URL"];
      //   await fetch(bundlerUrl, { method: "POST", body: JSON.stringify({ ... }) });
      // Solana example:
      //   await jitoClient.sendBundle([transaction], { tip: JITO_TIP_LAMPORTS });

      return { accepted: true, lane };
    },
  };
}
