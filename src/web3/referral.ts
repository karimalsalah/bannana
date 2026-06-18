/**
 * referral.ts — Conditional referral reward logic for The Banana Protocol.
 *
 * Economics invariant (from web3-engineer.md):
 *   A referrer is rewarded ONLY after the referred account crosses an
 *   on-chain volume threshold. Never pay on signup alone.
 *
 * All values are in wei (bigint) to avoid floating-point loss.
 * No network calls; pure deterministic predicates.
 */

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface ReferralTerms {
  /** Minimum on-chain volume the referred account must reach before the
   *  referrer earns any reward. Expressed in wei. */
  thresholdVolumeWei: bigint;
  /** Flat reward paid to the referrer once the threshold is crossed. */
  rewardWei: bigint;
}

// ---------------------------------------------------------------------------
// Default terms
// ---------------------------------------------------------------------------

/**
 * Default referral terms for The Banana Protocol.
 *
 * Threshold: 100 $PEEL (1e20 wei for an 18-decimal token).
 * Reward:    10 $PEEL  (1e19 wei).
 *
 * These values are intentionally conservative — adjust via governance
 * or a V-controlled config before mainnet.
 */
export const DEFAULT_TERMS: ReferralTerms = {
  thresholdVolumeWei: 100n * 10n ** 18n, // 100 $PEEL
  rewardWei: 10n * 10n ** 18n, //  10 $PEEL
} as const;

// ---------------------------------------------------------------------------
// Public predicates
// ---------------------------------------------------------------------------

/**
 * Returns true ONLY when the referred account's on-chain volume equals
 * or exceeds the threshold. A referrer is never paid on signup alone.
 *
 * @param referredVolumeWei Cumulative on-chain volume for the referred account.
 * @param terms             The active referral terms.
 */
export function isReferralUnlocked(
  referredVolumeWei: bigint,
  terms: ReferralTerms
): boolean {
  if (referredVolumeWei < 0n) {
    throw new RangeError(
      `isReferralUnlocked: referredVolumeWei must be non-negative, got ${referredVolumeWei}`
    );
  }
  if (terms.thresholdVolumeWei < 0n) {
    throw new RangeError(
      `isReferralUnlocked: thresholdVolumeWei must be non-negative, got ${terms.thresholdVolumeWei}`
    );
  }
  return referredVolumeWei >= terms.thresholdVolumeWei;
}

/**
 * Compute the reward owed to the referrer.
 *
 * Returns `rewardWei` when the threshold has been crossed, 0n otherwise.
 * This is intentionally a flat reward (not a percentage) to keep the
 * on-chain accounting simple and predictable.
 *
 * @param referredVolumeWei Cumulative on-chain volume for the referred account.
 * @param terms             The active referral terms.
 */
export function computeReferralReward(
  referredVolumeWei: bigint,
  terms: ReferralTerms
): bigint {
  if (referredVolumeWei < 0n) {
    throw new RangeError(
      `computeReferralReward: referredVolumeWei must be non-negative, got ${referredVolumeWei}`
    );
  }
  return isReferralUnlocked(referredVolumeWei, terms) ? terms.rewardWei : 0n;
}
