---
description: Create and manage Continuous Clearing Auctions (CCA) for token launches via Uniswap Liquidity Launchpad. Use when user says "launch token", "CCA", "continuous clearing auction", "liquidity launchpad", "token distribution", "bootstrap liquidity", "fair launch", or mentions creating token auctions on Uniswap.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), Bash(npx:*), Bash(yarn:*), Bash(forge:*), Bash(cast:*), Bash(curl:*), WebFetch, Task(subagent_type:cca-integration-expert)
model: opus
metadata.openclaw: { 'requires': { 'bins': ['forge'] }, 'primaryEnv': 'PRIVATE_KEY' }
---

# CCA Integration - Uniswap Liquidity Launchpad

Create and manage Continuous Clearing Auctions (CCA) for fair token launches and liquidity bootstrapping on Uniswap V4.

## Overview

The Uniswap Liquidity Launchpad is a comprehensive framework for bootstrapping initial liquidity through fair, transparent price discovery. It combines:

1. **Price Discovery** - Novel CCA mechanism for fair market price determination
2. **Liquidity Bootstrapping** - Automatically seeds Uniswap V4 pools with auction proceeds
3. **Token Creation** (optional) - Deploy new ERC-20 tokens with metadata and cross-chain capabilities

## Prerequisites

This skill assumes familiarity with:

- Solidity and smart contract deployment
- viem or ethers.js for blockchain interactions
- Foundry (forge) for contract compilation and deployment

See the [viem Integration Skill](../viem-integration/viem-integration.md) for blockchain interaction basics.

## Quick Decision Guide

| Use Case                                   | Recommended Approach                        |
| ------------------------------------------ | ------------------------------------------- |
| New token launch with fair price discovery | Full Launchpad flow (Token + CCA + V4 Pool) |
| Existing token liquidity bootstrap         | CCA only via Factory                        |
| Custom distribution logic                  | Direct CCA deployment                       |
| Testnet experimentation                    | Sepolia or Base Sepolia                     |

## Use Cases & Personas

CCA supports diverse token launch scenarios. See [Personas and Examples](./personas-and-examples.md) for detailed configurations.

| Persona                      | Use Case                                                                                                                             | Key Features                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Memecoin Launcher**        | Launch meme token with creator fees                                                                                                  | Short duration, low floor, creator owns LP for fee collection |
| **Prediction Market**        | Bootstrap outcome token liquidity                                                                                                    | Stablecoin currency, price = implied probability              |
| **ICO/Token Sale**           | Large-scale distribution ([Aztec raised $59M](https://unchainedcrypto.com/aztec-raises-59-million-in-token-sale-with-uniswaps-cca/)) | Extended duration, validation hooks, per-user caps            |
| **DAO Bootstrap**            | Governance token + treasury funding                                                                                                  | Back-loaded distribution, timelocked LP                       |
| **Protocol Owned Liquidity** | Permanent, protocol-owned LP                                                                                                         | Position sent to burn address or locked contract              |
| **Gaming/IGO**               | In-game utility token                                                                                                                | Low floor, wide distribution, player allowlists               |
| **Airdrop Distribution**     | Committed community distribution                                                                                                     | Very low floor, eligibility merkle proofs                     |

### Quick Comparison: CCA vs Alternatives

| Feature                  | CCA                       | Pump.fun            | Balancer LBP | Traditional ICO |
| ------------------------ | ------------------------- | ------------------- | ------------ | --------------- |
| Price Discovery          | Gradual clearing          | Bonding curve       | Weight decay | Fixed price     |
| Front-running Protection | Yes                       | Limited             | Partial      | No              |
| Creator Fees             | LP ownership (100%)       | Platform takes fees | LP ownership | None            |
| Automatic Liquidity      | V4 pool at clearing price | Raydium migration   | Manual       | None            |
| Per-user Caps            | Via validation hooks      | No                  | No           | Centralized     |

## Reference Files

- **[Personas and Examples](./personas-and-examples.md)** - Detailed configurations for each use case
- **[Helper Functions](./helpers.md)** - Utility functions for Q96 conversion, step encoding, etc.

## Contract Addresses

### ContinuousClearingAuctionFactory (v1.1.0)

| Network        | Address                                      |
| -------------- | -------------------------------------------- |
| All EVM Chains | `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` |

### LiquidityLauncher

| Network      | Address                                      |
| ------------ | -------------------------------------------- |
| All Networks | `0x00000008412db3394C91A5CbD01635c6d140637C` |

### FullRangeLBPStrategyFactory

| Chain        | Address                                      |
| ------------ | -------------------------------------------- |
| Mainnet      | `0x65aF3B62EE79763c704f04238080fBADD005B332` |
| Unichain     | `0xAa56d4d68646B4858A5A3a99058169D0100b38e2` |
| Base         | `0x39E5eB34dD2c8082Ee1e556351ae660F33B04252` |
| Sepolia      | `0x89Dd5691e53Ea95d19ED2AbdEdCf4cBbE50da1ff` |
| Base Sepolia | `0xa3A236647c80BCD69CAD561ACf863c29981b6fbC` |

### AdvancedLBPStrategyFactory

| Chain        | Address                                      |
| ------------ | -------------------------------------------- |
| Mainnet      | `0x982DC187cbeB4E21431C735B01Ecbd8A606129C5` |
| Unichain     | `0xeB44195e1847F23D4ff411B7d501b726C7620529` |
| Base         | `0x9C5A6fb9B0D9A60e665d93a3e6923bDe428c389a` |
| Sepolia      | `0xdC3553B7Cea1ad3DAB35cBE9d40728C4198BCBb6` |
| Base Sepolia | `0x67E24586231D4329AfDbF1F4Ac09E081cFD1e6a6` |

---

## Core Concepts

### How CCA Works

The Continuous Clearing Auction generalizes uniform-price auctions into continuous time:

1. **Continuous allocation**: Each block releases predetermined tokens to active bidders
2. **Uniform clearing price**: All participants in a block pay the same price
3. **Dynamic bid removal**: Bids drop out when clearing price exceeds their max price
4. **Automatic price discovery**: System ensures full token supply sells

**Key Benefits**:

- Eliminates timing games and sniping
- Early bidders get natural exposure to lower prices
- Fair price discovery without concentrated demand moments

### Auction Parameters

```solidity
struct AuctionParameters {
    address currency;              // Fundraising token (address(0) for ETH)
    address tokensRecipient;       // Receives leftover tokens
    address fundsRecipient;        // Receives raised funds
    uint40 startBlock;             // Auction start
    uint40 endBlock;               // Auction end
    uint40 claimBlock;             // Token claim eligibility
    int24 tickSpacing;             // Price granularity
    address validationHook;        // Optional bid validator
    uint160 floorPrice;            // Starting price (Q96 format)
    uint128 requiredCurrencyRaised;// Graduation threshold
    bytes auctionStepsData;        // Supply issuance schedule
}
```

### Q96 Fixed-Point Format

Prices use Q96 format for precision:

```solidity
uint256 constant Q96 = 2**96; // 0x1000000000000000000000000

// Convert human-readable price to Q96
// For 1 TOKEN = 0.001 ETH (1000 tokens per ETH):
uint160 priceQ96 = uint160((0.001e18 * Q96) / 1e18);
```

### Auction Steps (Supply Schedule)

Packed as `bytes8` entries defining token release rate:

```solidity
// Upper 24 bits: per-block issuance rate (MPS units, 1 MPS = 0.0001 basis points)
// Lower 40 bits: block duration for that rate

// Example: 1000 MPS (0.1 bp) for 100 blocks, then 2000 MPS for 100 blocks
bytes8 step1 = bytes8(uint64(1000) | (uint64(100) << 24));
bytes8 step2 = bytes8(uint64(2000) | (uint64(100) << 24));
bytes memory auctionSteps = abi.encodePacked(step1, step2);
```

---

## Integration Methods

### Method 1: Full Launchpad Flow (Recommended)

Complete token creation + CCA + V4 pool migration.

#### Step 1: Prepare Configuration

```typescript
import { encodeFunctionData, parseEther } from 'viem';

// Token configuration
const tokenConfig = {
  name: 'My Token',
  symbol: 'MTK',
  totalSupply: parseEther('1000000000'), // 1 billion tokens
  description: 'A fair launch token',
  website: 'https://mytoken.xyz',
  imageUri: 'ipfs://...',
};

// Auction configuration
const auctionConfig = {
  currency: '0x0000000000000000000000000000000000000000', // ETH
  tokensRecipient: deployer, // Receives unsold tokens
  fundsRecipient: deployer, // Receives raised ETH
  startBlock: currentBlock + 100, // Start in ~100 blocks
  endBlock: currentBlock + 7200, // ~24 hours on mainnet
  claimBlock: currentBlock + 7300, // Claims available after auction
  tickSpacing: 60, // Standard tick spacing
  validationHook: '0x0000000000000000000000000000000000000000', // No validation
  floorPrice: calculateQ96Price(0.0001), // 0.0001 ETH per token
  requiredCurrencyRaised: parseEther('10'), // 10 ETH minimum to graduate
  auctionStepsData: encodeAuctionSteps([
    { rate: 1000, blocks: 3600 }, // 0.1 bp/block for first half
    { rate: 2000, blocks: 3600 }, // 0.2 bp/block for second half
  ]),
};
```

#### Step 2: Deploy via LiquidityLauncher

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const LIQUIDITY_LAUNCHER = '0x00000008412db3394C91A5CbD01635c6d140637C';
const LBP_STRATEGY_FACTORY = '0x65aF3B62EE79763c704f04238080fBADD005B332';

// Encode createToken call
const createTokenData = encodeFunctionData({
  abi: liquidityLauncherAbi,
  functionName: 'createToken',
  args: [
    UERC20_FACTORY,
    tokenConfig.name,
    tokenConfig.symbol,
    tokenConfig.totalSupply,
    tokenConfig.description,
    tokenConfig.website,
    tokenConfig.imageUri,
  ],
});

// Encode distributeToken call
const distributeData = encodeFunctionData({
  abi: liquidityLauncherAbi,
  functionName: 'distributeToken',
  args: [
    LBP_STRATEGY_FACTORY,
    tokenAddress, // Predicted address
    tokenConfig.totalSupply,
    encodeStrategyConfig(auctionConfig),
    false, // payerIsUser = false since tokens in launcher
  ],
});

// Execute atomically via multicall
const tx = await walletClient.writeContract({
  address: LIQUIDITY_LAUNCHER,
  abi: liquidityLauncherAbi,
  functionName: 'multicall',
  args: [[createTokenData, distributeData]],
});
```

### Method 2: CCA Factory Direct Deployment

For existing tokens or custom integrations.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IContinuousClearingAuctionFactory} from "./interfaces/IContinuousClearingAuctionFactory.sol";
import {IContinuousClearingAuction} from "./interfaces/IContinuousClearingAuction.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CCALauncher {
    IContinuousClearingAuctionFactory public constant FACTORY =
        IContinuousClearingAuctionFactory(0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5);

    function launchAuction(
        address token,
        uint256 amount,
        IContinuousClearingAuction.AuctionParameters calldata params
    ) external returns (address auction) {
        // Encode parameters
        bytes memory configData = abi.encode(params);

        // Deploy auction via factory
        auction = address(FACTORY.initializeDistribution(
            token,
            amount,
            configData,
            bytes32(0) // salt for deterministic address
        ));

        // Transfer tokens to auction
        IERC20(token).transferFrom(msg.sender, auction, amount);

        // Notify auction of token receipt
        IContinuousClearingAuction(auction).onTokensReceived();
    }
}
```

### Method 3: TypeScript SDK Integration

```typescript
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseEther,
  encodeAbiParameters,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

// Constants
const CCA_FACTORY = '0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5';
const Q96 = 2n ** 96n;

// Helper: Convert price to Q96 format
function priceToQ96(priceInEth: number, tokenDecimals: number = 18): bigint {
  const priceWei = BigInt(Math.floor(priceInEth * 10 ** 18));
  return (priceWei * Q96) / BigInt(10 ** tokenDecimals);
}

// Helper: Encode auction steps
function encodeAuctionSteps(steps: { rateInMps: number; blocks: number }[]): `0x${string}` {
  let result = '0x';
  for (const step of steps) {
    const packed = BigInt(step.rateInMps) | (BigInt(step.blocks) << 24n);
    result += packed.toString(16).padStart(16, '0');
  }
  return result as `0x${string}`;
}

// Deploy CCA
async function deployCCA(
  tokenAddress: `0x${string}`,
  tokenAmount: bigint,
  config: {
    currency: `0x${string}`;
    startBlock: number;
    endBlock: number;
    claimBlock: number;
    floorPriceEth: number;
    requiredRaiseEth: number;
    steps: { rateInMps: number; blocks: number }[];
  }
) {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  // Encode AuctionParameters struct
  const configData = encodeAbiParameters(
    [
      {
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
      },
    ],
    [
      {
        currency: config.currency,
        tokensRecipient: account.address,
        fundsRecipient: account.address,
        startBlock: config.startBlock,
        endBlock: config.endBlock,
        claimBlock: config.claimBlock,
        tickSpacing: 60,
        validationHook: '0x0000000000000000000000000000000000000000',
        floorPrice: priceToQ96(config.floorPriceEth),
        requiredCurrencyRaised: parseEther(config.requiredRaiseEth.toString()),
        auctionStepsData: encodeAuctionSteps(config.steps),
      },
    ]
  );

  // Deploy via factory
  const { request } = await publicClient.simulateContract({
    address: CCA_FACTORY,
    abi: ccaFactoryAbi,
    functionName: 'initializeDistribution',
    args: [tokenAddress, tokenAmount, configData, '0x' + '0'.repeat(64)],
    account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Get auction address from logs
  const auctionAddress = receipt.logs[0]?.topics[1];

  return { hash, auctionAddress };
}
```

---

## Participating in CCAs

### Submit a Bid

```typescript
const CCA_ABI = [
  {
    name: 'submitBid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'maxPrice', type: 'uint256' },
      { name: 'amount', type: 'uint128' },
      { name: 'owner', type: 'address' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [{ name: 'bidId', type: 'uint256' }],
  },
] as const;

async function submitBid(auctionAddress: `0x${string}`, maxPriceEth: number, bidAmountEth: number) {
  const maxPriceQ96 = priceToQ96(maxPriceEth);
  const bidAmount = parseEther(bidAmountEth.toString());

  const { request } = await publicClient.simulateContract({
    address: auctionAddress,
    abi: CCA_ABI,
    functionName: 'submitBid',
    args: [maxPriceQ96, bidAmount, account.address, '0x'],
    value: bidAmount, // For ETH auctions
    account,
  });

  return walletClient.writeContract(request);
}
```

### Exit a Bid

```typescript
// Exit when outbid or after auction ends
async function exitBid(auctionAddress: `0x${string}`, bidId: bigint) {
  const { request } = await publicClient.simulateContract({
    address: auctionAddress,
    abi: ccaAbi,
    functionName: 'exitBid',
    args: [bidId],
    account,
  });

  return walletClient.writeContract(request);
}
```

### Claim Tokens

```typescript
// After claimBlock and auction graduation
async function claimTokens(auctionAddress: `0x${string}`, bidId: bigint) {
  const { request } = await publicClient.simulateContract({
    address: auctionAddress,
    abi: ccaAbi,
    functionName: 'claimTokens',
    args: [bidId],
    account,
  });

  return walletClient.writeContract(request);
}
```

---

## Post-Auction Lifecycle & V4 Pool Migration

After the CCA completes, liquidity is automatically migrated to a Uniswap V4 pool. Here's the complete process.

### Overview

When using the full Launchpad flow with an LBP Strategy, the system:

1. **Auction completes** - CCA determines final clearing price
2. **Graduation check** - Auction must meet `requiredCurrencyRaised`
3. **Migration delay** - Wait until `migrationBlock` (configured in LBP Strategy)
4. **Anyone calls `migrate()`** - Permissionless pool creation
5. **V4 pool initialized** - Liquidity deployed at discovered price

### Migration Requirements

```typescript
// Check if strategy is ready for migration
async function canMigrate(strategyAddress: `0x${string}`): Promise<{
  canMigrate: boolean;
  reason?: string;
}> {
  const [currentBlock, migrationBlock, auctionAddress] = await Promise.all([
    publicClient.getBlockNumber(),
    publicClient.readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'migrationBlock',
    }),
    publicClient.readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'auction',
    }),
  ]);

  // Check if auction graduated
  const isGraduated = await publicClient.readContract({
    address: auctionAddress,
    abi: CCA_ABI,
    functionName: 'isGraduated',
  });

  if (!isGraduated) {
    return { canMigrate: false, reason: 'Auction has not graduated' };
  }

  if (currentBlock < migrationBlock) {
    return {
      canMigrate: false,
      reason: `Migration block not reached (current: ${currentBlock}, required: ${migrationBlock})`,
    };
  }

  // Check if already migrated
  const alreadyMigrated = await publicClient
    .readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'poolId',
    })
    .catch(() => null);

  if (alreadyMigrated) {
    return { canMigrate: false, reason: 'Already migrated' };
  }

  return { canMigrate: true };
}
```

### Calling migrate()

**IMPORTANT**: The `migrate()` function is **permissionless** - anyone can call it after `migrationBlock`. This is typically called by:

- The token deployer
- A keeper/bot monitoring auctions
- Any interested party (since it benefits the ecosystem)

```typescript
/**
 * Migrate LBP Strategy to Uniswap V4
 * @param strategyAddress - Address of the deployed LBP Strategy
 * @returns Transaction hash
 */
async function migrateToV4(strategyAddress: `0x${string}`) {
  // First check if migration is possible
  const { canMigrate, reason } = await canMigrate(strategyAddress);
  if (!canMigrate) {
    throw new Error(`Cannot migrate: ${reason}`);
  }

  // Simulate first to catch any errors
  const { request } = await publicClient.simulateContract({
    address: strategyAddress,
    abi: LBP_STRATEGY_ABI,
    functionName: 'migrate',
    args: [],
    account,
  });

  const hash = await walletClient.writeContract(request);
  console.log('Migration transaction submitted:', hash);

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Migration successful! Pool created.');

  return { hash, receipt };
}
```

### What Happens During Migration

The `migrate()` function performs these steps atomically:

1. **Validate auction graduation** - Ensures `requiredCurrencyRaised` was met
2. **Calculate pool price** - Uses auction's final clearing price
3. **Initialize V4 pool** - Creates pool at the discovered price
4. **Deploy full-range LP** - Deposits auction proceeds + leftover tokens
5. **(Optional) Create one-sided position** - AdvancedLBPStrategy creates additional positions for unused funds
6. **Transfer LP NFT** - Sends position to `positionRecipient`

#### Gas Optimization Note

From the [Uniswap docs](https://docs.uniswap.org/contracts/liquidity-launchpad/Overview):

> To optimize gas costs, any minimal dust amounts are foregone and locked in the PoolManager rather than being swept at the end of the migration process.

### Monitoring Migration Status

```typescript
/**
 * Get migration status and details
 */
async function getMigrationStatus(strategyAddress: `0x${string}`) {
  const [migrationBlock, currentBlock, auctionAddress] = await Promise.all([
    publicClient.readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'migrationBlock',
    }),
    publicClient.getBlockNumber(),
    publicClient.readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'auction',
    }),
  ]);

  const isGraduated = await publicClient.readContract({
    address: auctionAddress,
    abi: CCA_ABI,
    functionName: 'isGraduated',
  });

  // Try to get pool ID (will fail if not migrated)
  let poolId: `0x${string}` | null = null;
  try {
    poolId = await publicClient.readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'poolId',
    });
  } catch {
    // Not migrated yet
  }

  const blocksUntilMigration = Number(migrationBlock) - Number(currentBlock);
  const estimatedTimeMinutes = Math.max(0, blocksUntilMigration * 12) / 60; // 12s blocks

  return {
    auctionGraduated: isGraduated,
    migrationBlock: Number(migrationBlock),
    currentBlock: Number(currentBlock),
    blocksUntilMigration: Math.max(0, blocksUntilMigration),
    estimatedTimeMinutes,
    isMigrated: poolId !== null,
    poolId,
    canMigrateNow: isGraduated && blocksUntilMigration <= 0 && poolId === null,
  };
}
```

### Post-Migration: Pool Information

```typescript
/**
 * Get V4 pool info after migration
 */
async function getPoolInfo(strategyAddress: `0x${string}`) {
  const [poolId, positionId] = await Promise.all([
    publicClient.readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'poolId',
    }),
    publicClient.readContract({
      address: strategyAddress,
      abi: LBP_STRATEGY_ABI,
      functionName: 'positionId',
    }),
  ]);

  // Get pool state
  const poolManager = await publicClient.readContract({
    address: strategyAddress,
    abi: LBP_STRATEGY_ABI,
    functionName: 'poolManager',
  });

  const slot0 = await publicClient.readContract({
    address: poolManager,
    abi: POOL_MANAGER_ABI,
    functionName: 'getSlot0',
    args: [poolId],
  });

  return {
    poolId,
    positionId,
    sqrtPriceX96: slot0.sqrtPriceX96,
    tick: slot0.tick,
    // Convert sqrtPriceX96 to human-readable price
    price: (Number(slot0.sqrtPriceX96) ** 2 / 2 ** 192).toFixed(6),
  };
}
```

### Migration Timeline Example

For a 3-day auction on Ethereum Mainnet:

```typescript
const AUCTION_CONFIG = {
  startBlock: currentBlock + 100, // ~20 minutes
  endBlock: currentBlock + 21600, // ~3 days (7200 blocks/day)
  claimBlock: currentBlock + 21700, // Claims available shortly after
  // Migration delay is set in LBP Strategy, typically:
  migrationDelay: 100, // ~20 minutes after auction ends
};

// So migrationBlock = endBlock + 100 = currentBlock + 21700
// Anyone can call migrate() at block 21700
```

### Keeper Bot Example

Many projects run a keeper bot to automatically migrate when ready:

```typescript
// Keeper bot that monitors and migrates strategies
async function keeperBot(strategies: `0x${string}`[]) {
  for (const strategy of strategies) {
    try {
      const status = await getMigrationStatus(strategy);

      if (status.canMigrateNow) {
        console.log(`Strategy ${strategy} ready for migration`);
        await migrateToV4(strategy);
        console.log(`Successfully migrated ${strategy}`);
      } else if (status.blocksUntilMigration > 0) {
        console.log(
          `Strategy ${strategy} can migrate in ${
            status.blocksUntilMigration
          } blocks (${status.estimatedTimeMinutes.toFixed(1)}min)`
        );
      }
    } catch (error) {
      console.error(`Error processing ${strategy}:`, error);
    }
  }
}

// Run every minute
setInterval(() => keeperBot([STRATEGY_ADDRESS]), 60_000);
```

### LBP Strategy ABI (Migration Functions)

```typescript
const LBP_STRATEGY_ABI = [
  {
    name: 'migrate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'migrationBlock',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint40' }],
  },
  {
    name: 'auction',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'poolId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'positionId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'poolManager',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;
```

---

## Key ABIs

### ContinuousClearingAuctionFactory ABI

```typescript
const ccaFactoryAbi = [
  {
    name: 'initializeDistribution',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'configData', type: 'bytes' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'distributionContract', type: 'address' }],
  },
  {
    name: 'getAuctionAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'configData', type: 'bytes' },
      { name: 'salt', type: 'bytes32' },
      { name: 'sender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;
```

### ContinuousClearingAuction ABI

```typescript
const ccaAbi = [
  {
    name: 'submitBid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'maxPrice', type: 'uint256' },
      { name: 'amount', type: 'uint128' },
      { name: 'owner', type: 'address' },
      { name: 'prevTickPrice', type: 'uint256' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [{ name: 'bidId', type: 'uint256' }],
  },
  {
    name: 'exitBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'bidId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'bidId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimTokensBatch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'bidIds', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'checkpoint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: '', type: 'tuple' }],
  },
  {
    name: 'sweepCurrency',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'sweepUnsoldTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'isGraduated',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'onTokensReceived',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;
```

### LiquidityLauncher ABI

```typescript
const liquidityLauncherAbi = [
  {
    name: 'createToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'factory', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'website', type: 'string' },
      { name: 'imageUri', type: 'string' },
    ],
    outputs: [{ name: 'token', type: 'address' }],
  },
  {
    name: 'distributeToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'strategyFactory', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'configData', type: 'bytes' },
      { name: 'payerIsUser', type: 'bool' },
    ],
    outputs: [{ name: 'strategy', type: 'address' }],
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const;
```

---

## Important Safety Notes

### Critical Warnings

1. **Do not send excess tokens** - Unallocated funds sent to auction are permanently lost

2. **Tick spacing** - Setting too small of a tick spacing makes the auction extremely gas inefficient and risks DoS

3. **Supply limits** - Maximum 1e30 wei (1 trillion 18-decimal tokens); currency raised capped at 2^107 wei

4. **Auction steps** - Final block must issue significant supply; inadequate final step allows price manipulation

5. **Rebasing/Fee-on-transfer tokens** - NOT compatible with LiquidityLauncher

6. **Always use multicall** - Batch token creation and distribution atomically

### Validation Hooks

For permissioned auctions (KYC, allowlists):

```solidity
interface IValidationHook {
    function validate(
        uint256 maxPrice,
        uint128 amount,
        address owner,
        address sender,
        bytes calldata hookData
    ) external;
}
```

The hook must revert to reject bids.

---

## Troubleshooting

| Issue                      | Solution                                    |
| -------------------------- | ------------------------------------------- |
| "Bid below clearing price" | Increase maxPrice above current clearing    |
| "Auction not graduated"    | requiredCurrencyRaised not met              |
| "Cannot claim yet"         | Wait until claimBlock                       |
| "Tokens not received"      | Call `onTokensReceived()` after transfer    |
| "Migration failed"         | Wait until migrationBlock, check graduation |

---

## Complete Example: Memecoin Launch with React Frontend

See `examples/test-token-cca/` in this repository for a complete working example of a CCA memecoin launch on Base Sepolia. This example includes:

### Components

1. **Token Deployment Script** (`scripts/deploy-token.ts`)

   - Deploys simple ERC-20 token
   - Configurable name, symbol, supply
   - Outputs token address for CCA deployment

2. **CCA Deployment Script** (`scripts/deploy-cca.ts`)

   - Creates CCA via factory
   - Transfers tokens to auction
   - Configures auction parameters (duration, reserve, floor price)
   - Uses USDC as bid currency

3. **React Frontend** (`src/`)
   - Wallet connection (wagmi + viem)
   - USDC approval flow
   - Bid submission interface
   - Real-time auction status
   - Balance display

### Configuration

```typescript
// Example configuration from test-token-cca
const AUCTION_CONFIG = {
  tokenName: 'TEST_Token',
  tokenSymbol: 'TEST',
  totalSupply: 1_000_000_000n * 10n ** 18n, // 1 billion
  reserveAmount: 5_000_000n, // 5 USDC (6 decimals)
  floorPricePerToken: 0.000001, // Very low for testing
  durationBlocks: 1800, // ~1 hour on Base Sepolia (2s blocks)
};
```

### Quick Start

```bash
# Navigate to example
cd examples/test-token-cca

# Install dependencies
npm install

# Deploy token (requires Base Sepolia ETH)
PRIVATE_KEY=0x... npm run deploy-token

# Deploy CCA (requires token address from previous step)
PRIVATE_KEY=0x... TOKEN_ADDRESS=0x... npm run deploy-cca

# Update src/constants.ts with auction address, then start frontend
npm run dev
```

### Getting Testnet Assets

**Base Sepolia ETH** (for gas):

```bash
# Visit Coinbase faucet
open https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

**Base Sepolia USDC** (for bidding):

```bash
# Visit Circle faucet
open https://faucet.circle.com/
# Select Base Sepolia network
```

### Key Code Patterns

**Price Conversion to Q96 Format:**

```typescript
function priceToQ96(priceInUSDC: number): bigint {
  // USDC has 6 decimals, token has 18 decimals
  const priceInSmallestUnit = BigInt(Math.floor(priceInUSDC * 10 ** 6));
  const decimalAdjustment = BigInt(10 ** 18);
  return (priceInSmallestUnit * Q96) / decimalAdjustment;
}
```

**Auction Steps Encoding:**

```typescript
function encodeAuctionSteps(steps: { rateInMps: number; blocks: number }[]): `0x${string}` {
  let result = '0x';
  for (const step of steps) {
    const packed = BigInt(step.rateInMps) | (BigInt(step.blocks) << 24n);
    result += packed.toString(16).padStart(16, '0');
  }
  return result as `0x${string}`;
}
```

**React Bid Submission:**

```typescript
// In your React component
const { writeContract } = useWriteContract();

function handleBid(bidAmount: string, maxPrice: string) {
  const amount = parseUnits(bidAmount, 6); // USDC decimals
  const maxPriceQ96 = priceToQ96(parseFloat(maxPrice), 6);

  writeContract({
    address: AUCTION_ADDRESS,
    abi: CCA_ABI,
    functionName: 'submitBid',
    args: [maxPriceQ96, amount, address, '0x'],
  });
}
```

### Frontend Features

The example frontend demonstrates:

- **Wallet Integration**: Multi-wallet support (MetaMask, Coinbase Wallet, WalletConnect)
- **USDC Approval**: Two-step flow (approve then bid)
- **Balance Display**: Shows USDC balance and current allowance
- **Auction Status**: Real-time graduation status check
- **User Experience**: Clear error messages, loading states, transaction feedback

### Deployment Workflow

The example demonstrates the recommended 3-step deployment flow:

1. **Deploy Token** → Get token address
2. **Deploy CCA** → Get auction address
3. **Update Frontend** → Configure with auction address

This matches the production workflow used by projects like [Clanker](https://clanker.world) for memecoin launches.

---

## Additional Resources

- [CCA Whitepaper](https://docs.uniswap.org/whitepaper_cca.pdf)
- [Liquidity Launchpad Docs](https://docs.uniswap.org/contracts/liquidity-launchpad/Overview)
- [CCA Technical Docs](https://github.com/Uniswap/continuous-clearing-auction/blob/main/docs/TechnicalDocumentation.md)
- [CCA GitHub](https://github.com/Uniswap/continuous-clearing-auction)
- [Liquidity Launcher GitHub](https://github.com/Uniswap/liquidity-launcher)
- [CCA Portal](https://cca.uniswap.org/)
- [Complete Example](../../../../../../examples/test-token-cca/) - Memecoin launch with React frontend
