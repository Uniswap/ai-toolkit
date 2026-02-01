# CCA Helper Functions

Utility functions for working with CCA parameters and encoding.

## Price Conversion (Q96 Format)

CCA uses Q96 fixed-point format for prices. These helpers convert between human-readable prices and Q96.

```typescript
const Q96 = 2n ** 96n;

/**
 * Convert a human-readable price to Q96 format
 * @param priceInCurrency - Price per token in currency units (e.g., 0.001 for 0.001 ETH/token)
 * @param currencyDecimals - Decimals of the currency token (18 for ETH, 6 for USDC)
 * @param tokenDecimals - Decimals of the token being sold (default 18)
 * @returns Q96-formatted price as bigint
 */
function priceToQ96(
  priceInCurrency: number,
  currencyDecimals: number = 18,
  tokenDecimals: number = 18
): bigint {
  // Convert price to smallest currency unit
  const priceInSmallestUnit = BigInt(Math.floor(priceInCurrency * 10 ** currencyDecimals));

  // Adjust for token decimals and convert to Q96
  const decimalAdjustment = BigInt(10 ** tokenDecimals);
  return (priceInSmallestUnit * Q96) / decimalAdjustment;
}

/**
 * Convert Q96 price back to human-readable format
 * @param priceQ96 - Q96-formatted price
 * @param currencyDecimals - Decimals of the currency token
 * @param tokenDecimals - Decimals of the token being sold
 * @returns Human-readable price
 */
function q96ToPrice(
  priceQ96: bigint,
  currencyDecimals: number = 18,
  tokenDecimals: number = 18
): number {
  const decimalAdjustment = BigInt(10 ** tokenDecimals);
  const priceInSmallestUnit = (priceQ96 * decimalAdjustment) / Q96;
  return Number(priceInSmallestUnit) / 10 ** currencyDecimals;
}

// Convenience wrapper with clearer naming
function calculateQ96Price(priceInCurrency: number, currencyDecimals: number = 18): bigint {
  return priceToQ96(priceInCurrency, currencyDecimals);
}
```

### Price Conversion Examples

```typescript
// ETH as currency (18 decimals)
const ethPrice = priceToQ96(0.001); // 0.001 ETH per token
const ethPrice2 = priceToQ96(0.0001); // 0.0001 ETH per token

// USDC as currency (6 decimals)
const usdcPrice = priceToQ96(0.5, 6); // $0.50 per token
const usdcPrice2 = priceToQ96(0.05, 6); // $0.05 per token

// Converting FDV to floor price
function fdvToFloorPrice(
  fdvInCurrency: number,
  totalSupply: bigint,
  currencyDecimals: number = 18
): bigint {
  const pricePerToken = fdvInCurrency / Number(totalSupply / BigInt(1e18));
  return priceToQ96(pricePerToken, currencyDecimals);
}

// Example: $350M FDV with 1B token supply
const floorPrice = fdvToFloorPrice(350_000_000, parseEther('1000000000'));
```

---

## Auction Steps Encoding

Auction steps define the token release schedule. Each step specifies:

- **Rate (MPS)**: Milli-basis points per block (1 MPS = 0.0001 basis points = 0.000001%)
- **Duration**: Number of blocks for this rate

```typescript
interface AuctionStep {
  rateInMps: number; // Rate in milli-basis points (1-10000000)
  blocks: number; // Duration in blocks
}

/**
 * Encode auction steps into packed bytes format
 * @param steps - Array of auction steps
 * @returns Hex-encoded steps for AuctionParameters
 */
function encodeAuctionSteps(steps: AuctionStep[]): `0x${string}` {
  let result = '0x';

  for (const step of steps) {
    // Validate
    if (step.rateInMps <= 0 || step.rateInMps > 10_000_000) {
      throw new Error(`Invalid rate: ${step.rateInMps}. Must be 1-10000000`);
    }
    if (step.blocks <= 0 || step.blocks > 2 ** 40 - 1) {
      throw new Error(`Invalid blocks: ${step.blocks}`);
    }

    // Pack: lower 24 bits = rate, upper 40 bits = blocks
    const packed = BigInt(step.rateInMps) | (BigInt(step.blocks) << 24n);

    // Convert to hex (8 bytes = 16 hex chars)
    result += packed.toString(16).padStart(16, '0');
  }

  return result as `0x${string}`;
}

/**
 * Decode auction steps from packed bytes
 * @param encoded - Hex-encoded steps
 * @returns Array of decoded steps
 */
function decodeAuctionSteps(encoded: `0x${string}`): AuctionStep[] {
  const hex = encoded.slice(2); // Remove 0x prefix
  const steps: AuctionStep[] = [];

  for (let i = 0; i < hex.length; i += 16) {
    const packed = BigInt('0x' + hex.slice(i, i + 16));
    steps.push({
      rateInMps: Number(packed & 0xffffffn), // Lower 24 bits
      blocks: Number(packed >> 24n), // Upper 40 bits
    });
  }

  return steps;
}
```

### Auction Steps Examples

```typescript
// Example 1: Even distribution over 3 days (21600 blocks)
const evenSteps = encodeAuctionSteps([
  { rateInMps: 3333, blocks: 7200 }, // Day 1: 33.33%
  { rateInMps: 3333, blocks: 7200 }, // Day 2: 33.33%
  { rateInMps: 3334, blocks: 7200 }, // Day 3: 33.34%
]);

// Example 2: Front-loaded for memecoins (6 hours)
const frontLoadedSteps = encodeAuctionSteps([
  { rateInMps: 5000, blocks: 600 }, // First 2 hours: 50%
  { rateInMps: 3000, blocks: 600 }, // Next 2 hours: 30%
  { rateInMps: 2000, blocks: 600 }, // Last 2 hours: 20%
]);

// Example 3: Back-loaded for DAOs (4 days)
const backLoadedSteps = encodeAuctionSteps([
  { rateInMps: 1000, blocks: 7200 }, // Day 1: 10%
  { rateInMps: 2000, blocks: 7200 }, // Day 2: 20%
  { rateInMps: 3000, blocks: 7200 }, // Day 3: 30%
  { rateInMps: 4000, blocks: 7200 }, // Day 4: 40%
]);

// Example 4: ICO-style 6-day distribution
const icoSteps = encodeAuctionSteps([
  { rateInMps: 1000, blocks: 7200 }, // Day 1: 10%
  { rateInMps: 1500, blocks: 7200 }, // Day 2: 15%
  { rateInMps: 1500, blocks: 7200 }, // Day 3: 15%
  { rateInMps: 2000, blocks: 7200 }, // Day 4: 20%
  { rateInMps: 2000, blocks: 7200 }, // Day 5: 20%
  { rateInMps: 2000, blocks: 7200 }, // Day 6: 20%
]);
```

### Rate Calculation Helpers

```typescript
/**
 * Calculate MPS rate to distribute a percentage over given blocks
 * @param percentage - Percentage to distribute (0-100)
 * @param blocks - Number of blocks
 * @returns Rate in MPS
 */
function percentageToMps(percentage: number, blocks: number): number {
  // 100% = 10,000,000 MPS (10^7)
  // Rate = (percentage * 10^5) / blocks
  return Math.round((percentage * 100_000) / blocks);
}

/**
 * Create even distribution steps
 * @param totalBlocks - Total auction duration in blocks
 * @param numSteps - Number of steps to divide into
 * @returns Array of auction steps
 */
function createEvenSteps(totalBlocks: number, numSteps: number): AuctionStep[] {
  const blocksPerStep = Math.floor(totalBlocks / numSteps);
  const percentagePerStep = 100 / numSteps;

  return Array(numSteps)
    .fill(null)
    .map((_, i) => ({
      rateInMps: percentageToMps(percentagePerStep, blocksPerStep),
      blocks: i === numSteps - 1 ? totalBlocks - blocksPerStep * (numSteps - 1) : blocksPerStep,
    }));
}

// Example: 4-day auction with 4 even steps
const steps = createEvenSteps(28800, 4);
```

---

## Duration Calculation

Convert between time and blocks for different networks.

```typescript
interface NetworkConfig {
  name: string;
  blockTime: number; // seconds
}

const NETWORKS: Record<number, NetworkConfig> = {
  1: { name: 'Ethereum Mainnet', blockTime: 12 },
  10: { name: 'Optimism', blockTime: 2 },
  137: { name: 'Polygon', blockTime: 2 },
  8453: { name: 'Base', blockTime: 2 },
  42161: { name: 'Arbitrum', blockTime: 0.25 },
  130: { name: 'Unichain', blockTime: 1 },
};

/**
 * Convert duration to blocks for a specific network
 * @param durationSeconds - Duration in seconds
 * @param chainId - Network chain ID
 * @returns Number of blocks
 */
function durationToBlocks(durationSeconds: number, chainId: number): number {
  const network = NETWORKS[chainId];
  if (!network) throw new Error(`Unknown chain: ${chainId}`);
  return Math.ceil(durationSeconds / network.blockTime);
}

/**
 * Convert blocks to duration for a specific network
 * @param blocks - Number of blocks
 * @param chainId - Network chain ID
 * @returns Duration in seconds
 */
function blocksToDuration(blocks: number, chainId: number): number {
  const network = NETWORKS[chainId];
  if (!network) throw new Error(`Unknown chain: ${chainId}`);
  return blocks * network.blockTime;
}

// Convenience functions
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;

function hoursToBlocks(hours: number, chainId: number = 1): number {
  return durationToBlocks(hours * HOUR, chainId);
}

function daysToBlocks(days: number, chainId: number = 1): number {
  return durationToBlocks(days * DAY, chainId);
}
```

### Duration Examples

```typescript
// Ethereum Mainnet (12s blocks)
const sixHours = hoursToBlocks(6, 1); // 1800 blocks
const oneDay = daysToBlocks(1, 1); // 7200 blocks
const oneWeek = daysToBlocks(7, 1); // 50400 blocks

// Base (2s blocks)
const sixHoursBase = hoursToBlocks(6, 8453); // 10800 blocks
const oneDayBase = daysToBlocks(1, 8453); // 43200 blocks
```

---

## AuctionParameters Encoding

Encode the full AuctionParameters struct for factory deployment.

```typescript
import { encodeAbiParameters } from 'viem';

interface AuctionConfig {
  currency: `0x${string}`;
  tokensRecipient: `0x${string}`;
  fundsRecipient: `0x${string}`;
  startBlock: number;
  endBlock: number;
  claimBlock: number;
  tickSpacing: number;
  validationHook: `0x${string}`;
  floorPrice: bigint;
  requiredCurrencyRaised: bigint;
  auctionStepsData: `0x${string}`;
}

const AUCTION_PARAMETERS_TYPE = {
  type: 'tuple',
  components: [
    { name: 'currency', type: 'address' },
    { name: 'tokensRecipient', type: 'address' },
    { name: 'fundsRecipient', type: 'address' },
    { name: 'startBlock', type: 'uint40' },
    { name: 'endBlock', type: 'uint40' },
    { name: 'claimBlock', type: 'uint40' },
    { name: 'tickSpacing', type: 'int24' },
    { name: 'validationHook', type: 'address' },
    { name: 'floorPrice', type: 'uint160' },
    { name: 'requiredCurrencyRaised', type: 'uint128' },
    { name: 'auctionStepsData', type: 'bytes' },
  ],
} as const;

/**
 * Encode auction configuration for factory deployment
 * @param config - Auction configuration
 * @returns Encoded config data
 */
function encodeAuctionConfig(config: AuctionConfig): `0x${string}` {
  return encodeAbiParameters([AUCTION_PARAMETERS_TYPE], [config]);
}
```

### Full Deployment Example

```typescript
async function deployAuction(
  tokenAddress: `0x${string}`,
  tokenAmount: bigint,
  config: AuctionConfig
) {
  const CCA_FACTORY = '0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5';

  const configData = encodeAuctionConfig(config);

  const { request } = await publicClient.simulateContract({
    address: CCA_FACTORY,
    abi: CCA_FACTORY_ABI,
    functionName: 'initializeDistribution',
    args: [
      tokenAddress,
      tokenAmount,
      configData,
      '0x' + '0'.repeat(64), // salt
    ],
    account,
  });

  return walletClient.writeContract(request);
}
```

---

## Bid Submission Helpers

```typescript
/**
 * Submit a bid to a CCA auction
 * @param auctionAddress - Address of the auction contract
 * @param maxPriceInCurrency - Maximum price willing to pay per token
 * @param bidAmount - Amount of currency to bid
 * @param currencyDecimals - Decimals of currency (18 for ETH)
 */
async function submitBid(
  auctionAddress: `0x${string}`,
  maxPriceInCurrency: number,
  bidAmount: bigint,
  currencyDecimals: number = 18
) {
  const maxPriceQ96 = priceToQ96(maxPriceInCurrency, currencyDecimals);

  const { request } = await publicClient.simulateContract({
    address: auctionAddress,
    abi: CCA_ABI,
    functionName: 'submitBid',
    args: [
      maxPriceQ96,
      bidAmount,
      account.address,
      '0x', // hookData (empty if no validation hook)
    ],
    value: bidAmount, // For ETH auctions
    account,
  });

  return walletClient.writeContract(request);
}

/**
 * Submit bid with ERC20 currency (requires approval)
 */
async function submitBidWithERC20(
  auctionAddress: `0x${string}`,
  currencyAddress: `0x${string}`,
  maxPriceInCurrency: number,
  bidAmount: bigint,
  currencyDecimals: number
) {
  // First approve the auction contract
  await walletClient.writeContract({
    address: currencyAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [auctionAddress, bidAmount],
  });

  const maxPriceQ96 = priceToQ96(maxPriceInCurrency, currencyDecimals);

  const { request } = await publicClient.simulateContract({
    address: auctionAddress,
    abi: CCA_ABI,
    functionName: 'submitBid',
    args: [maxPriceQ96, bidAmount, account.address, '0x'],
    account,
  });

  return walletClient.writeContract(request);
}
```

---

## Reading Auction State

```typescript
/**
 * Get current auction state
 */
async function getAuctionState(auctionAddress: `0x${string}`) {
  const [isGraduated, currentBlock] = await Promise.all([
    publicClient.readContract({
      address: auctionAddress,
      abi: CCA_ABI,
      functionName: 'isGraduated',
    }),
    publicClient.getBlockNumber(),
  ]);

  // Get auction parameters by reading storage or events
  // This is a simplified version

  return {
    isGraduated,
    currentBlock,
  };
}

/**
 * Check if a bid can be claimed
 */
async function canClaimBid(auctionAddress: `0x${string}`, bidId: bigint): Promise<boolean> {
  const [isGraduated, currentBlock, claimBlock] = await Promise.all([
    publicClient.readContract({
      address: auctionAddress,
      abi: CCA_ABI,
      functionName: 'isGraduated',
    }),
    publicClient.getBlockNumber(),
    // Read claimBlock from contract
  ]);

  return isGraduated && currentBlock >= claimBlock;
}
```
