# CCA Personas and Use Case Examples

This reference provides detailed configuration examples for different token launch scenarios using Uniswap's Continuous Clearing Auction (CCA) and Liquidity Launchpad.

## Table of Contents

1. [Memecoin Launcher](#1-memecoin-launcher)
2. [Prediction Market Creator](#2-prediction-market-creator)
3. [ICO/Token Sale](#3-icotoken-sale-aztec-style)
4. [DAO Treasury Bootstrap](#4-dao-treasury-bootstrap)
5. [Protocol Owned Liquidity](#5-protocol-owned-liquidity-pol)
6. [Gaming/NFT Token Launch](#6-gamingnft-token-launch-igo)
7. [Community Airdrop Distribution](#7-community-airdrop-distribution)

---

## 1. Memecoin Launcher

**Persona**: Creator who wants to launch a memecoin with ongoing creator rewards from trading fees, similar to [Clanker](https://clanker.gitbook.io/clanker-documentation/general/creator-rewards-and-fees).

### Overview

Unlike Pump.fun's bonding curve model where price increases with each purchase, CCA provides fair price discovery through gradual allocation. The creator earns through:

1. **Initial LP Position Ownership** - Creator receives the V4 LP NFT
2. **Trading Fee Accumulation** - 0.3% fees on all swaps
3. **Fee Collection** - Periodically claim accumulated fees

### Key Characteristics

| Parameter       | Value                       | Rationale                      |
| --------------- | --------------------------- | ------------------------------ |
| Duration        | 4-24 hours                  | Short for hype-driven launches |
| Floor Price     | Very low ($0.0000001/token) | Accessible entry point         |
| Required Raise  | Low (1-10 ETH)              | Easy graduation threshold      |
| Supply Schedule | Front-loaded                | Quick distribution             |

### Configuration Example

```typescript
import { parseEther, encodeAbiParameters } from 'viem';

const Q96 = 2n ** 96n;

// Memecoin: 1 billion supply, 100% to auction
const MEME_CONFIG = {
  // Token parameters
  tokenName: 'Moon Coin',
  tokenSymbol: 'MOON',
  totalSupply: parseEther('1000000000'), // 1 billion tokens

  // Auction parameters - SHORT and AGGRESSIVE
  auctionParams: {
    currency: '0x0000000000000000000000000000000000000000', // ETH
    startBlock: currentBlock + 50, // Start in ~10 minutes
    endBlock: currentBlock + 1800, // ~6 hours on mainnet (12s blocks)
    claimBlock: currentBlock + 1850, // Claims shortly after
    tickSpacing: 200, // Wider spacing for gas efficiency

    // Very low floor - let market discover price
    floorPrice: (BigInt(1e10) * Q96) / BigInt(1e18), // $0.00000001 equivalent

    // Low graduation threshold - easy to graduate
    requiredCurrencyRaised: parseEther('2'), // Only 2 ETH needed

    // Front-loaded distribution: sell most tokens early
    auctionSteps: encodeAuctionSteps([
      { rateInMps: 5000, blocks: 600 }, // 0.5 bp/block first 2 hours (50%)
      { rateInMps: 3000, blocks: 600 }, // 0.3 bp/block next 2 hours (30%)
      { rateInMps: 2000, blocks: 600 }, // 0.2 bp/block last 2 hours (20%)
    ]),
  },

  // CRITICAL: Creator receives LP position for fee collection
  positionRecipient: CREATOR_ADDRESS,
  fundsRecipient: CREATOR_ADDRESS, // ETH from auction also goes to creator
};

// Use FullRangeLBPStrategy for simple full-range LP
const strategyFactory = '0x65aF3B62EE79763c704f04238080fBADD005B332'; // Mainnet
```

### Creator Fee Collection

```typescript
// After migration, the creator owns the V4 LP NFT
// Fees accumulate in the position and can be collected

import { POSITION_MANAGER_ABI } from '@uniswap/v4-sdk';

async function collectCreatorFees(positionManagerAddress: `0x${string}`, tokenId: bigint) {
  // Collect accumulated trading fees
  const { request } = await publicClient.simulateContract({
    address: positionManagerAddress,
    abi: POSITION_MANAGER_ABI,
    functionName: 'collect',
    args: [
      {
        tokenId,
        recipient: CREATOR_ADDRESS,
        amount0Max: BigInt(2) ** BigInt(128) - 1n,
        amount1Max: BigInt(2) ** BigInt(128) - 1n,
      },
    ],
    account,
  });

  return walletClient.writeContract(request);
}
```

### Revenue Model Comparison

| Platform | Creator Revenue         | Mechanism                      |
| -------- | ----------------------- | ------------------------------ |
| Clanker  | 80-100% LP fees         | Initial LP ownership           |
| Pump.fun | 0% (platform takes all) | Bonding curve fees to platform |
| **CCA**  | **100% LP fees**        | **LP NFT ownership**           |

---

## 2. Prediction Market Creator

**Persona**: Creator building a prediction market that needs to bootstrap liquidity for outcome tokens before trading can begin.

### Overview

Use CCA to:

1. Distribute outcome tokens (YES/NO) fairly
2. Raise minimum capital to ensure market liquidity
3. Create AMM pool at market-determined probability

### Key Characteristics

| Parameter       | Value             | Rationale                                         |
| --------------- | ----------------- | ------------------------------------------------- |
| Duration        | 24-72 hours       | Allow proper price discovery                      |
| Floor Price     | $0.01-0.05        | Outcome tokens start near 50% implied probability |
| Required Raise  | $50k+             | High enough for meaningful liquidity              |
| Supply Schedule | Even distribution | Fair participation                                |

### Configuration Example

```typescript
// Prediction market: Will X happen by date Y?
// YES token launch via CCA

const PREDICTION_MARKET_CONFIG = {
  tokenName: 'Election YES Token',
  tokenSymbol: 'ELECT-YES',
  totalSupply: parseEther('1000000'), // 1M outcome tokens

  auctionParams: {
    currency: USDC_ADDRESS, // Use stablecoin for prediction markets

    // Longer auction for thoughtful participation
    startBlock: currentBlock + 100,
    endBlock: currentBlock + 21600, // ~3 days

    // Higher graduation threshold ensures meaningful liquidity
    requiredCurrencyRaised: parseUnits('50000', 6), // $50k USDC minimum

    // Floor price: $0.05 (5% implied probability)
    floorPrice: calculateQ96Price(0.05, 6), // USDC has 6 decimals

    // Even distribution over time
    auctionSteps: encodeAuctionSteps([
      { rateInMps: 3333, blocks: 7200 }, // Day 1: 33.33%
      { rateInMps: 3333, blocks: 7200 }, // Day 2: 33.33%
      { rateInMps: 3334, blocks: 7200 }, // Day 3: 33.34%
    ]),

    tickSpacing: 10, // Tight spacing for accurate pricing
  },

  // Market operator receives funds for resolution guarantee
  fundsRecipient: MARKET_OPERATOR_ADDRESS,
  positionRecipient: MARKET_OPERATOR_ADDRESS,
};
```

### Post-Auction Market Operation

```typescript
// After graduation, the YES token trades on V4
// Current price implies market probability

async function getImpliedProbability(
  poolAddress: `0x${string}`,
  yesTokenAddress: `0x${string}`,
  usdcAddress: `0x${string}`
): Promise<number> {
  const slot0 = await publicClient.readContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: 'slot0',
  });

  // Convert sqrtPriceX96 to implied probability
  const sqrtPrice = slot0.sqrtPriceX96;
  const price = (sqrtPrice * sqrtPrice) / Q96 / Q96;

  // If YES token price is $0.65, implied probability is 65%
  return Number(price) / 1e6; // Adjust for USDC decimals
}
```

---

## 3. ICO/Token Sale (Aztec Style)

**Persona**: Protocol team conducting a large-scale token distribution event, similar to [Aztec's $59M raise](https://unchainedcrypto.com/aztec-raises-59-million-in-token-sale-with-uniswaps-cca/).

### Overview

Aztec's successful CCA deployment demonstrated:

- 19,388 ETH in bids
- 16,658 successful participants
- Final price 59.65% above floor
- Per-user caps via ZK Passport validation

### Key Characteristics

| Parameter       | Value                                | Rationale                         |
| --------------- | ------------------------------------ | --------------------------------- |
| Duration        | 4-7 days                             | Extended for global participation |
| Floor Price     | Significant discount to expected FDV | Incentivize early participation   |
| Required Raise  | High ($10M+)                         | Ensures serious commitment        |
| Validation Hook | ZK Passport or allowlist             | Compliance and fair distribution  |

### Configuration Example

```typescript
// Large-scale token sale: 15% of supply, targeting $50M raise
const ICO_CONFIG = {
  tokenName: 'Protocol Token',
  tokenSymbol: 'PROTO',
  totalSupply: parseEther('1000000000'), // 1B total
  saleAmount: parseEther('150000000'), // 15% for sale

  auctionParams: {
    currency: '0x0000000000000000000000000000000000000000', // ETH

    // Extended duration for global participation
    startBlock: currentBlock + 7200, // Start in 1 day
    endBlock: currentBlock + 50400, // Run for 6 days

    // Claims after TGE announcement
    claimBlock: currentBlock + 86400, // ~12 days after start

    // Floor: $350M FDV = $0.35/token
    // With 1B supply and ETH at $3500
    floorPrice: calculateQ96Price(0.0001), // 0.0001 ETH/token

    // High graduation threshold
    requiredCurrencyRaised: parseEther('15000'), // ~$50M at $3500/ETH

    // Gradual release over 6 days
    auctionSteps: encodeAuctionSteps([
      { rateInMps: 1000, blocks: 7200 }, // Day 1: ~10%
      { rateInMps: 1500, blocks: 7200 }, // Day 2: ~15%
      { rateInMps: 1500, blocks: 7200 }, // Day 3: ~15%
      { rateInMps: 2000, blocks: 7200 }, // Day 4: ~20%
      { rateInMps: 2000, blocks: 7200 }, // Day 5: ~20%
      { rateInMps: 2000, blocks: 7200 }, // Day 6: ~20%
    ]),

    tickSpacing: 60,

    // CRITICAL: Validation hook for compliance
    validationHook: ZK_PASSPORT_HOOK_ADDRESS,
  },

  // Team treasury receives funds
  fundsRecipient: TEAM_TREASURY_ADDRESS,
  // DAO treasury receives LP position
  positionRecipient: DAO_TREASURY_ADDRESS,
};
```

### Per-User Cap Validation Hook

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IValidationHook} from "./interfaces/IValidationHook.sol";

contract UserCapValidationHook is IValidationHook {
    uint128 public constant MAX_BID_PER_USER = 240 ether; // 240 ETH cap like Aztec

    mapping(address => uint128) public userTotalBids;

    function validate(
        uint256 maxPrice,
        uint128 amount,
        address owner,
        address sender,
        bytes calldata hookData
    ) external override {
        // Check user hasn't exceeded cap
        uint128 newTotal = userTotalBids[owner] + amount;
        require(newTotal <= MAX_BID_PER_USER, "Exceeds per-user cap");

        userTotalBids[owner] = newTotal;
    }

    // ERC165 support
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IValidationHook).interfaceId;
    }
}
```

---

## 4. DAO Treasury Bootstrap

**Persona**: DAO seeking to distribute governance tokens and raise treasury funds through a fair, transparent process.

### Overview

Similar to [Balancer LBP](https://docs.balancer.fi/concepts/explore-available-balancer-pools/liquidity-bootstrapping-pool.html) launches but with CCA's continuous clearing mechanism. Benefits:

- Fair price discovery without front-running
- Anti-whale mechanics through gradual distribution
- Immediate V4 liquidity post-auction

### Key Characteristics

| Parameter       | Value             | Rationale                |
| --------------- | ----------------- | ------------------------ |
| Duration        | 3-5 days          | Standard LBP duration    |
| Floor Price     | Conservative      | Protect early supporters |
| Required Raise  | 18+ months runway | Sustainable treasury     |
| Supply Schedule | Back-loaded       | Discourage early dumps   |

### Configuration Example

```typescript
// DAO governance token: 40% to auction, 60% to treasury/team
const DAO_BOOTSTRAP_CONFIG = {
  tokenName: 'DAO Governance',
  tokenSymbol: 'GOV',
  totalSupply: parseEther('100000000'), // 100M total
  saleAmount: parseEther('40000000'), // 40% for sale

  auctionParams: {
    currency: USDC_ADDRESS,

    // 4-day auction (standard LBP duration)
    startBlock: currentBlock + 200,
    endBlock: currentBlock + 28800, // ~4 days

    // Target: $2M raise for 18 months runway
    requiredCurrencyRaised: parseUnits('2000000', 6),

    // Floor: $0.02/token = $2M FDV
    floorPrice: calculateQ96Price(0.02, 6),

    // BACK-LOADED: More tokens released later
    // This discourages dumping early tokens
    auctionSteps: encodeAuctionSteps([
      { rateInMps: 1000, blocks: 7200 }, // Day 1: 10%
      { rateInMps: 2000, blocks: 7200 }, // Day 2: 20%
      { rateInMps: 3000, blocks: 7200 }, // Day 3: 30%
      { rateInMps: 4000, blocks: 7200 }, // Day 4: 40%
    ]),

    tickSpacing: 60,
  },

  // DAO multisig receives everything
  fundsRecipient: DAO_MULTISIG_ADDRESS,
  positionRecipient: DAO_MULTISIG_ADDRESS,
};
```

### Timelocked LP Position

For DAOs wanting to lock liquidity, use the TimelockedPositionRecipient:

```typescript
// Deploy timelocked position recipient
const TIMELOCK_DURATION = 365 * 24 * 60 * 60; // 1 year

// Use TimelockedPositionRecipient as positionRecipient
const positionRecipient = await deployTimelockedRecipient(DAO_MULTISIG_ADDRESS, TIMELOCK_DURATION);
```

---

## 5. Protocol Owned Liquidity (POL)

**Persona**: Protocol wanting to own its liquidity permanently, inspired by [OlympusDAO's POL model](https://docs.olympusdao.finance/main/overview/pol/).

### Overview

Instead of relying on mercenary liquidity providers, the protocol:

1. Uses CCA to raise funds
2. Automatically deploys to V4 LP
3. **Never withdraws** - liquidity is permanent

### Key Characteristics

| Parameter          | Value                           | Rationale             |
| ------------------ | ------------------------------- | --------------------- |
| Duration           | Extended                        | Maximum participation |
| Position Recipient | Burn address or locked contract | Permanent liquidity   |
| Strategy           | FullRange                       | Maximum depth         |

### Configuration Example

```typescript
// POL token: Permanent liquidity, never withdrawable
const POL_CONFIG = {
  tokenName: 'Protocol Liquidity Token',
  tokenSymbol: 'PLIQ',
  totalSupply: parseEther('100000000'),

  auctionParams: {
    currency: '0x0000000000000000000000000000000000000000',

    startBlock: currentBlock + 500,
    endBlock: currentBlock + 43200, // ~6 days

    requiredCurrencyRaised: parseEther('500'), // ~$1.75M

    floorPrice: calculateQ96Price(0.00005), // Conservative floor

    auctionSteps: encodeAuctionSteps([
      { rateInMps: 1667, blocks: 14400 },
      { rateInMps: 1667, blocks: 14400 },
      { rateInMps: 1666, blocks: 14400 },
    ]),

    tickSpacing: 60,
  },

  // CRITICAL: Position recipient is a contract that CANNOT withdraw
  // Option 1: Burn address (liquidity is truly permanent)
  positionRecipient: '0x000000000000000000000000000000000000dEaD',

  // Option 2: Governance-controlled but timelocked
  // positionRecipient: TIMELOCKED_TREASURY,

  // Protocol treasury receives ETH from auction
  fundsRecipient: PROTOCOL_TREASURY,
};
```

### Buyback and Burn Position Recipient

For protocols wanting to use LP fees for buybacks:

```solidity
// BuybackAndBurnPositionRecipient:
// - Collects LP fees automatically
// - Swaps all collected fees for protocol token
// - Burns the purchased tokens

// Deploy and use as positionRecipient
const positionRecipient = BUYBACK_AND_BURN_RECIPIENT_ADDRESS;
```

---

## 6. Gaming/NFT Token Launch (IGO)

**Persona**: Gaming project launching utility token for in-game economy, similar to [IGO launches](https://academy.binance.com/en/articles/what-is-an-initial-game-offering-igo).

### Overview

Gaming tokens often need:

- Wide distribution for healthy economy
- Low entry barrier for players
- Immediate liquidity for trading

### Key Characteristics

| Parameter      | Value             | Rationale                   |
| -------------- | ----------------- | --------------------------- |
| Duration       | 1-3 days          | Gaming community moves fast |
| Floor Price    | Low ($0.001-0.01) | Accessible for players      |
| Required Raise | Moderate          | Game development funding    |
| Supply         | High              | In-game economy needs       |

### Configuration Example

```typescript
// Gaming token: utility for in-game purchases
const GAMING_TOKEN_CONFIG = {
  tokenName: 'Game Gold',
  tokenSymbol: 'GOLD',
  totalSupply: parseEther('10000000000'), // 10B for in-game economy

  // Only 10% for public sale, rest for in-game rewards
  saleAmount: parseEther('1000000000'),

  auctionParams: {
    currency: '0x0000000000000000000000000000000000000000',

    // Quick 2-day auction
    startBlock: currentBlock + 100,
    endBlock: currentBlock + 14400,

    // Low graduation threshold for accessibility
    requiredCurrencyRaised: parseEther('50'), // ~$175k

    // Very low floor for wide distribution
    floorPrice: calculateQ96Price(0.0000001),

    // Even distribution
    auctionSteps: encodeAuctionSteps([
      { rateInMps: 5000, blocks: 7200 },
      { rateInMps: 5000, blocks: 7200 },
    ]),

    tickSpacing: 200, // Wide for gas efficiency
  },

  // Game studio receives funds for development
  fundsRecipient: GAME_STUDIO_ADDRESS,
  positionRecipient: GAME_TREASURY_ADDRESS,
};
```

### Allowlist Validation for Early Players

```solidity
contract PlayerAllowlistHook is IValidationHook {
    mapping(address => bool) public allowlisted;
    mapping(address => bool) public hasBid;

    function addPlayers(address[] calldata players) external onlyOwner {
        for (uint i = 0; i < players.length; i++) {
            allowlisted[players[i]] = true;
        }
    }

    function validate(
        uint256,
        uint128,
        address owner,
        address,
        bytes calldata
    ) external override {
        require(allowlisted[owner], "Not allowlisted");
        require(!hasBid[owner], "Already bid");
        hasBid[owner] = true;
    }
}
```

---

## 7. Community Airdrop Distribution

**Persona**: Protocol wanting to distribute tokens to community members with price discovery rather than free distribution.

### Overview

Instead of free airdrops that often get dumped:

- Users commit capital to receive tokens
- Price discovered by market
- Only committed users receive allocation
- Immediate liquidity for trading

### Key Characteristics

| Parameter      | Value             | Rationale                               |
| -------------- | ----------------- | --------------------------------------- |
| Duration       | 1 week            | Allow all eligible users to participate |
| Floor Price    | Very low          | Airdrop-like accessibility              |
| Required Raise | Minimal           | Focus on distribution, not fundraising  |
| Validation     | Eligibility check | Only qualifying addresses               |

### Configuration Example

```typescript
// Community distribution: rewards for protocol users
const AIRDROP_CONFIG = {
  tokenName: 'Community Rewards',
  tokenSymbol: 'REWARD',
  totalSupply: parseEther('100000000'),

  auctionParams: {
    currency: '0x0000000000000000000000000000000000000000',

    // Week-long to maximize participation
    startBlock: currentBlock + 200,
    endBlock: currentBlock + 50400, // ~7 days

    // Very low threshold - not about raising money
    requiredCurrencyRaised: parseEther('1'), // Just 1 ETH minimum

    // Near-zero floor price
    floorPrice: calculateQ96Price(0.00000001),

    // Even distribution
    auctionSteps: encodeAuctionSteps([
      { rateInMps: 1429, blocks: 7200 },
      { rateInMps: 1429, blocks: 7200 },
      { rateInMps: 1429, blocks: 7200 },
      { rateInMps: 1429, blocks: 7200 },
      { rateInMps: 1429, blocks: 7200 },
      { rateInMps: 1429, blocks: 7200 },
      { rateInMps: 1426, blocks: 7200 },
    ]),

    // Eligibility check
    validationHook: AIRDROP_ELIGIBILITY_HOOK,

    tickSpacing: 200,
  },

  // DAO treasury receives minimal funds
  fundsRecipient: DAO_TREASURY,
  positionRecipient: DAO_TREASURY,
};
```

### Eligibility Validation Hook

```solidity
contract AirdropEligibilityHook is IValidationHook {
    // Merkle root of eligible addresses
    bytes32 public immutable merkleRoot;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function validate(
        uint256,
        uint128,
        address owner,
        address,
        bytes calldata hookData
    ) external view override {
        // hookData contains merkle proof
        bytes32[] memory proof = abi.decode(hookData, (bytes32[]));

        bytes32 leaf = keccak256(abi.encodePacked(owner));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Not eligible");
    }
}
```

---

## Migration Timing Considerations

After the auction, the LBP Strategy has a configurable delay before allowing pool creation. This `migrationDelay` is important:

### Recommended Migration Delays by Use Case

| Use Case                 | Recommended Delay                   | Rationale                            |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Memecoin                 | 100-300 blocks (~20-60 min)         | Quick migration for hype maintenance |
| Prediction Market        | 300-600 blocks (~1-2 hours)         | Time for oracles to finalize         |
| ICO/Token Sale           | 600-1200 blocks (~2-4 hours)        | Coordinate announcements, TGE prep   |
| DAO Bootstrap            | 1200-7200 blocks (~4 hours - 1 day) | Governance approval for migration    |
| Protocol Owned Liquidity | 300-600 blocks (~1-2 hours)         | Standard buffer                      |
| Gaming/IGO               | 100-300 blocks (~20-60 min)         | Quick availability for players       |
| Airdrop                  | 300-600 blocks (~1-2 hours)         | Allow all claims to process          |

### Why Migration Delay Matters

The delay between `endBlock` (auction ends) and `migrationBlock` allows:

1. **Final settlements** - All bids fully processed
2. **Price stabilization** - Let clearing price finalize
3. **Announcement coordination** - Teams can prepare TGE announcements
4. **Claim preparation** - Users understand what they're getting before pool goes live
5. **Bot prevention** - Reduces risk of MEV bots front-running pool creation

### Example Configuration

```typescript
// In LBP Strategy deployment, typically set via factory
const strategyConfig = {
  // ... auction parameters
  migrationDelay: 300, // 300 blocks (~1 hour on mainnet)
};

// This means:
// - Auction ends at block X
// - Anyone can call migrate() starting at block X + 300
// - Pool becomes tradable immediately after migration
```

## Quick Reference: Parameter Selection Guide

### Duration Selection

| Use Case          | Recommended Duration | Blocks (12s)  |
| ----------------- | -------------------- | ------------- |
| Memecoin          | 4-24 hours           | 1,200-7,200   |
| Prediction Market | 1-3 days             | 7,200-21,600  |
| ICO/Token Sale    | 4-7 days             | 28,800-50,400 |
| DAO Bootstrap     | 3-5 days             | 21,600-36,000 |
| Gaming/IGO        | 1-3 days             | 7,200-21,600  |
| Airdrop           | 5-7 days             | 36,000-50,400 |

### Supply Schedule Patterns

| Pattern          | Use Case               | Example         |
| ---------------- | ---------------------- | --------------- |
| **Front-loaded** | Memecoin, hype-driven  | 50%/30%/20%     |
| **Back-loaded**  | DAO, long-term holders | 10%/20%/30%/40% |
| **Even**         | Fair distribution      | 33%/33%/34%     |
| **Accelerating** | FOMO inducement        | 10%/15%/25%/50% |

### Tick Spacing Selection

| Tick Spacing | Use Case                             | Gas Cost |
| ------------ | ------------------------------------ | -------- |
| 10           | Precise pricing (prediction markets) | Higher   |
| 60           | Standard (most launches)             | Medium   |
| 200          | Gas-efficient (memecoins)            | Lower    |

---

## Additional Resources

- [Aztec Token Launch Analysis](https://unchainedcrypto.com/aztec-raises-59-million-in-token-sale-with-uniswaps-cca/)
- [Clanker Creator Rewards](https://clanker.gitbook.io/clanker-documentation/general/creator-rewards-and-fees)
- [Balancer LBP Documentation](https://docs.balancer.fi/concepts/explore-available-balancer-pools/liquidity-bootstrapping-pool.html)
- [OlympusDAO POL](https://docs.olympusdao.finance/main/overview/pol/)
- [Understanding Bonding Curves](https://flashift.app/blog/bonding-curves-pump-fun-meme-coin-launches/)
