// Ambient declarations for packages that ship JS without TypeScript types.

// @rize-labs/banana-wallet-sdk (0.1.28) ships `dist/index.js` with no `types`
// field. We declare the surface we actually use; everything else stays `unknown`.
declare module "@rize-labs/banana-wallet-sdk" {
  export interface BananaWalletConfig {
    chainId?: number;
    rpcUrl?: string;
    [key: string]: unknown;
  }

  // The SDK's runtime shape varies by build; we treat the default export as a
  // constructable wallet provider and narrow at the call site in src/web3.
  const Banana: {
    new (config?: BananaWalletConfig): unknown;
    [key: string]: unknown;
  };
  export default Banana;
  export const Banana: typeof Banana;
}

// Minimal WebGPU navigator typing so feature-detection compiles without pulling
// the full @webgpu/types package.
interface Navigator {
  readonly gpu?: unknown;
}
