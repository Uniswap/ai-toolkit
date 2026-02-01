import { Q96, USDC_DECIMALS } from './constants';

/**
 * Convert a human-readable price to Q96 format
 * @param priceInCurrency - Price per token in currency units (e.g., 0.50 for $0.50)
 * @param currencyDecimals - Decimals of the currency token (6 for USDC)
 * @param tokenDecimals - Decimals of the token being sold (default 18)
 */
export function priceToQ96(
  priceInCurrency: number,
  currencyDecimals: number = USDC_DECIMALS,
  tokenDecimals: number = 18
): bigint {
  const priceInSmallestUnit = BigInt(Math.floor(priceInCurrency * 10 ** currencyDecimals));
  const decimalAdjustment = BigInt(10 ** tokenDecimals);
  return (priceInSmallestUnit * Q96) / decimalAdjustment;
}

/**
 * Convert Q96 price back to human-readable format
 */
export function q96ToPrice(
  priceQ96: bigint,
  currencyDecimals: number = USDC_DECIMALS,
  tokenDecimals: number = 18
): number {
  const decimalAdjustment = BigInt(10 ** tokenDecimals);
  const priceInSmallestUnit = (priceQ96 * decimalAdjustment) / Q96;
  return Number(priceInSmallestUnit) / 10 ** currencyDecimals;
}

/**
 * Format USDC amount for display (6 decimals)
 */
export function formatUSDC(amount: bigint): string {
  const value = Number(amount) / 10 ** USDC_DECIMALS;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Parse USDC amount from string input
 */
export function parseUSDC(amount: string): bigint {
  const value = parseFloat(amount);
  if (isNaN(value) || value < 0) return 0n;
  return BigInt(Math.floor(value * 10 ** USDC_DECIMALS));
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
