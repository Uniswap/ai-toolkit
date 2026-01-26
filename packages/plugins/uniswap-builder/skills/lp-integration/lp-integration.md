---
description: Integrate Uniswap liquidity provisioning into applications. Use when user says "integrate LP", "liquidity provisioning", "create LP functionality", "build an LP frontend", "create an LP script", "add liquidity ui", "Trading API lp", "position manager", "smart contract LP integration", "provide liquidity", "manage LP positions", "create pool", "add liquidity", or mentions providing liquidity or managing LP positions on Uniswap.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), Bash(npx:*), Bash(yarn:*), Bash(curl:*), WebFetch, Task(subagent_type:lp-integration-expert)
model: opus
---

# LP Integration

Integrate Uniswap liquidity provisioning into frontends, backends, and smart contracts.

## Prerequisites

This skill assumes familiarity with viem basics. If you're new to viem, see the [viem Integration Skill](../viem-integration/viem-integration.md) for:

- Setting up PublicClient and WalletClient
- Account and key management
- Basic contract interactions
- Transaction signing and sending

## Quick Decision Guide

| Building...                  | Use This Method               |
| ---------------------------- | ----------------------------- |
| Frontend with React/Next.js  | Trading API                   |
| Backend script or bot        | Trading API                   |
| Smart contract integration   | Position Manager direct calls |
| Need full control            | V3/V4 SDKs + Position Manager |
| Migrating V3 to V4 positions | Trading API `/lp/migrate`     |

## Integration Methods

### 1. Trading API (Recommended)

Best for: Frontends, backends, scripts. Handles approvals and encoding automatically.

**Base URL**: `https://trade.api.uniswap.org/v1`

**Authentication**: `x-api-key: <your-api-key>` header required

**LP Endpoints**:

```text
POST /lp/approve          -> Check/get approvals for LP operations
POST /lp/create           -> Create pool and/or position
POST /lp/increase         -> Add liquidity to existing position
POST /lp/decrease         -> Remove liquidity from position
POST /lp/claim            -> Claim accrued trading fees
POST /lp/claim_rewards    -> Claim incentive rewards
POST /lp/migrate          -> Migrate V3 position to V4
```

### 2. Position Manager SDKs

Best for: Direct control over position management.

**V3**:

```bash
npm install @uniswap/v3-sdk @uniswap/sdk-core
```

**V4**:

```bash
npm install @uniswap/v4-sdk @uniswap/sdk-core
```

### 3. Smart Contract Integration

Best for: On-chain LP integrations, vault contracts, automated strategies.

**V3**: Call `NonfungiblePositionManager` directly
**V4**: Call `PositionManager` directly

---

## Trading API Reference

### Important: Native ETH Support

**Native ETH (address `0x0000000000000000000000000000000000000000`) is only supported in V4 pools.**

For V2 and V3, you must use WETH (`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` on mainnet) instead.

### Request Structure

All LP endpoints use a consistent request structure with nested `position` and `pool` objects:

```json
{
  "simulateTransaction": true,
  "protocol": "V4",
  "walletAddress": "0x...",
  "chainId": 1,
  "independentAmount": "10000",
  "independentToken": "TOKEN_0",
  "position": {
    "tickLower": -197400,
    "tickUpper": -195600,
    "pool": {
      "tickSpacing": 60,
      "token0": "0x...",
      "token1": "0x...",
      "fee": 3000
    }
  }
}
```

**Key Parameters**:

| Parameter                   | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `simulateTransaction`       | If true, returns simulation results without transaction data |
| `protocol`                  | `V2`, `V3`, or `V4`                                          |
| `walletAddress`             | User's wallet address                                        |
| `chainId`                   | Chain ID (1 = mainnet, etc.)                                 |
| `independentAmount`         | Amount as string (in token's smallest unit)                  |
| `independentToken`          | Which token the amount refers to: `TOKEN_0` or `TOKEN_1`     |
| `position.tickLower`        | Lower bound tick (V3/V4 only)                                |
| `position.tickUpper`        | Upper bound tick (V3/V4 only)                                |
| `position.pool.tickSpacing` | Tick spacing for the pool                                    |
| `position.pool.token0`      | Token0 address (use zero address for native ETH in V4)       |
| `position.pool.token1`      | Token1 address                                               |
| `position.pool.fee`         | Fee tier in hundredths of bips (3000 = 0.3%)                 |
| `position.pool.hooks`       | V4 only: hook contract address                               |

### Step 1: Create Position (`/lp/create`)

```bash
POST /lp/create
```

**V4 Request with Native ETH**:

```json
{
  "simulateTransaction": false,
  "protocol": "V4",
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "independentAmount": "1000000",
  "independentToken": "TOKEN_1",
  "position": {
    "tickLower": -197400,
    "tickUpper": -195600,
    "pool": {
      "tickSpacing": 60,
      "token0": "0x0000000000000000000000000000000000000000",
      "token1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "fee": 3000
    }
  }
}
```

**V3 Request with ERC-20 tokens**:

```json
{
  "simulateTransaction": false,
  "protocol": "V3",
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "independentAmount": "1000000000",
  "independentToken": "TOKEN_0",
  "position": {
    "tickLower": -887220,
    "tickUpper": 887220,
    "pool": {
      "tickSpacing": 60,
      "token0": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "token1": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "fee": 3000
    }
  }
}
```

**Response**:

```json
{
  "create": {
    "to": "0x...",
    "from": "0x...",
    "data": "0x...",
    "value": "0",
    "chainId": 1,
    "gasLimit": "500000"
  },
  "poolAddress": "0x...",
  "positionId": null
}
```

### Step 2: Check Approvals (`/lp/approve`)

```bash
POST /lp/approve
```

**Request** (different structure than create - uses flat token/amount fields):

```json
{
  "simulateTransaction": true,
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "protocol": "V4",
  "token0": "0x0000000000000000000000000000000000000000",
  "token1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "amount0": "316540372455860",
  "amount1": "1000000",
  "generatePermitAsTransaction": true
}
```

**Approve Request Parameters**:

| Parameter                     | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `simulateTransaction`         | If true, only simulates without returning tx                |
| `walletAddress`               | User's wallet address                                       |
| `chainId`                     | Chain ID                                                    |
| `protocol`                    | `V2`, `V3`, or `V4`                                         |
| `token0`                      | Token0 address (use zero address for ETH in V4)             |
| `token1`                      | Token1 address                                              |
| `amount0`                     | Amount of token0 (in smallest unit)                         |
| `amount1`                     | Amount of token1 (in smallest unit)                         |
| `generatePermitAsTransaction` | If true, returns permit as transaction instead of signature |

**Response**:

```json
{
  "approvals": [
    {
      "to": "0x...",
      "from": "0x...",
      "data": "0x...",
      "value": "0",
      "chainId": 1,
      "token": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    }
  ]
}
```

If `approvals` is empty array, tokens are already approved.

**Protocol Differences**:

| Protocol | Requires Approval For        | Native ETH Support |
| -------- | ---------------------------- | ------------------ |
| V2       | Create AND Remove operations | No (use WETH)      |
| V3       | Create operations only       | No (use WETH)      |
| V4       | Create operations only       | Yes                |

### Step 3: Increase Position (`/lp/increase`)

Add liquidity to an existing position.

```bash
POST /lp/increase
```

**Request**:

```json
{
  "simulateTransaction": false,
  "protocol": "V4",
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "tokenId": 12345,
  "independentAmount": "500000",
  "independentToken": "TOKEN_1",
  "position": {
    "tickLower": -197400,
    "tickUpper": -195600,
    "pool": {
      "tickSpacing": 60,
      "token0": "0x0000000000000000000000000000000000000000",
      "token1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "fee": 3000
    }
  }
}
```

**Increase Request Parameters**:

| Parameter           | Type   | Required | Description                                 |
| ------------------- | ------ | -------- | ------------------------------------------- |
| `tokenId`           | number | No       | Position NFT token ID                       |
| `independentAmount` | string | No       | Amount as string (in token's smallest unit) |
| `independentToken`  | enum   | No       | `TOKEN_0` or `TOKEN_1`                      |
| `amount0`           | string | No       | Alternative: specify exact amount0          |
| `amount1`           | string | No       | Alternative: specify exact amount1          |
| `slippageTolerance` | number | No       | Slippage tolerance (e.g., 0.5 for 0.5%)     |
| `deadline`          | number | No       | Unix timestamp for transaction expiry       |

**Response**:

```json
{
  "increase": {
    "to": "0x...",
    "from": "0x...",
    "data": "0x...",
    "value": "500000000000000000",
    "chainId": 1,
    "gasLimit": "300000"
  }
}
```

### Step 4: Decrease Position (`/lp/decrease`)

Remove liquidity from a position.

```bash
POST /lp/decrease
```

**Request**:

```json
{
  "simulateTransaction": false,
  "protocol": "V4",
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "tokenId": 12345,
  "liquidityPercentageToDecrease": 50,
  "positionLiquidity": "1000000000000000000",
  "position": {
    "tickLower": -197400,
    "tickUpper": -195600,
    "pool": {
      "tickSpacing": 60,
      "token0": "0x0000000000000000000000000000000000000000",
      "token1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "fee": 3000
    }
  }
}
```

**Decrease Request Parameters**:

| Parameter                       | Type    | Required | Description                                  |
| ------------------------------- | ------- | -------- | -------------------------------------------- |
| `tokenId`                       | number  | No       | Position NFT token ID                        |
| `liquidityPercentageToDecrease` | number  | No       | 1-100, percentage of liquidity to remove     |
| `positionLiquidity`             | string  | No       | Current position liquidity (for calculation) |
| `liquidity0`                    | string  | No       | Alternative: specific liquidity amount       |
| `liquidity1`                    | string  | No       | Alternative: specific liquidity amount       |
| `slippageTolerance`             | number  | No       | Slippage tolerance                           |
| `collectAsWETH`                 | boolean | No       | If true, receive WETH instead of native ETH  |
| `deadline`                      | number  | No       | Unix timestamp for transaction expiry        |

**Response**:

```json
{
  "decrease": {
    "to": "0x...",
    "from": "0x...",
    "data": "0x...",
    "value": "0",
    "chainId": 1,
    "gasLimit": "300000"
  },
  "expectedAmount0": "500000000000000000",
  "expectedAmount1": "500000000"
}
```

### Step 5: Claim Fees (`/lp/claim`)

Collect accrued trading fees from a position.

```bash
POST /lp/claim
```

**Request**:

```json
{
  "simulateTransaction": false,
  "protocol": "V4",
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "tokenId": 12345,
  "position": {
    "tickLower": -197400,
    "tickUpper": -195600,
    "pool": {
      "tickSpacing": 60,
      "token0": "0x0000000000000000000000000000000000000000",
      "token1": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "fee": 3000
    }
  }
}
```

**Claim Request Parameters**:

| Parameter       | Type    | Required | Description                                 |
| --------------- | ------- | -------- | ------------------------------------------- |
| `tokenId`       | number  | No       | Position NFT token ID                       |
| `collectAsWETH` | boolean | No       | If true, receive WETH instead of native ETH |

**Response**:

```json
{
  "claim": {
    "to": "0x...",
    "from": "0x...",
    "data": "0x...",
    "value": "0",
    "chainId": 1,
    "gasLimit": "150000"
  },
  "expectedFees0": "1000000000000000",
  "expectedFees1": "500000"
}
```

### Step 6: Claim Rewards (`/lp/claim_rewards`)

Claim incentive rewards (liquidity mining, etc.).

```bash
POST /lp/claim_rewards
```

**Request**:

```json
{
  "simulateTransaction": false,
  "protocol": "V4",
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "tokenId": 12345,
  "incentiveId": "0x..."
}
```

### Step 7: Migrate Position (`/lp/migrate`)

Migrate a V3 position to V4.

```bash
POST /lp/migrate
```

**Request**:

```json
{
  "simulateTransaction": false,
  "protocol": "V4",
  "walletAddress": "0x18d058a7E0486E632f7DfC473BC76D72CD201cAd",
  "chainId": 1,
  "tokenId": 12345,
  "position": {
    "tickLower": -887220,
    "tickUpper": 887220,
    "pool": {
      "tickSpacing": 60,
      "token0": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "token1": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "fee": 3000,
      "hooks": "0x0000000000000000000000000000000000000000"
    }
  }
}
```

**Migrate Request Parameters**:

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| `tokenId` | number | No       | V3 position NFT token ID to migrate          |
| `hooks`   | string | No       | V4 hook contract address (zero for no hooks) |

**Response**:

```json
{
  "migrate": {
    "to": "0x...",
    "from": "0x...",
    "data": "0x...",
    "value": "0",
    "chainId": 1,
    "gasLimit": "600000"
  },
  "v4PoolId": "0x..."
}
```

### Supported Chains

| ID  | Chain    | ID    | Chain    |
| --- | -------- | ----- | -------- |
| 1   | Mainnet  | 42161 | Arbitrum |
| 10  | Optimism | 8453  | Base     |
| 137 | Polygon  | 81457 | Blast    |
| 56  | BNB      | 130   | Unichain |

### Pool Version Comparison

| Feature            | V2              | V3               | V4                  |
| ------------------ | --------------- | ---------------- | ------------------- |
| Price Range        | Full range only | Custom ticks     | Custom ticks        |
| Position Token     | ERC-20 LP token | NFT (ERC-721)    | NFT (ERC-1155)      |
| Fee Tiers          | 0.3% fixed      | 0.01/0.05/0.3/1% | Dynamic + custom    |
| Hooks              | No              | No               | Yes                 |
| Native ETH         | No (use WETH)   | No (use WETH)    | Yes                 |
| Gas Efficiency     | Baseline        | Higher           | Highest (singleton) |
| Capital Efficiency | Low             | High             | High                |

---

## Custom Range Positions

Custom range positions are the core feature of concentrated liquidity in V3/V4. Instead of providing liquidity across the entire price range (like V2), users select specific price bounds (ticks) where their liquidity is active.

### Range Selection UI

The ideal custom range UI shows a liquidity distribution chart with a draggable range selector:

![Custom Range Chart](./assets/custom%20range%20chart.png)

**Key UI Elements**:

- **Liquidity histogram**: Shows where existing liquidity is concentrated (taller bars = more liquidity)
- **Current price indicator**: Dotted vertical line showing the current market price
- **Selected range highlight**: The pink/magenta area shows the user's selected price range
- **Draggable handles**: White circles on each end allow users to adjust min/max prices
- **Center handle**: Allows dragging the entire range while maintaining width

### Key Concepts

**Trade-offs**:

| Range Type    | Fee Share             | Management           | Risk                                  |
| ------------- | --------------------- | -------------------- | ------------------------------------- |
| Tight (±5%)   | Highest when in range | Frequent rebalancing | High impermanent loss if out of range |
| Medium (±20%) | Good balance          | Periodic monitoring  | Moderate IL risk                      |
| Wide (±50%)   | Lower share           | Less management      | Lower IL risk                         |
| Full range    | Lowest share          | Set and forget       | Minimal IL risk                       |

**When out of range**: Position stops earning fees and holds 100% of one token. User must:

1. Wait for price to return to range, OR
2. Remove liquidity and create new position at current price

### Fetching Liquidity Distribution Data

Use the Uniswap GraphQL API to fetch tick-level liquidity data for building distribution charts.

**Endpoint**: `https://interface.gateway.uniswap.org/v1/graphql`

**Query: AllV3Ticks** (for V3 pools)

```graphql
query AllV3Ticks($chain: Chain!, $address: String!, $skip: Int, $first: Int) {
  v3Pool(chain: $chain, address: $address) {
    id
    ticks(skip: $skip, first: $first) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
}
```

**Query: AllV4Ticks** (for V4 pools)

```graphql
query AllV4Ticks($chain: Chain!, $poolId: String!, $skip: Int, $first: Int) {
  v4Pool(chain: $chain, poolId: $poolId) {
    id
    ticks(skip: $skip, first: $first) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
}
```

**V3 Variables**:

```json
{
  "chain": "ETHEREUM",
  "address": "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36",
  "skip": 0,
  "first": 1000
}
```

**V4 Variables**:

```json
{
  "chain": "ETHEREUM",
  "poolId": "0x...",
  "skip": 0,
  "first": 1000
}
```

**Chain Values**: `ETHEREUM`, `ARBITRUM`, `OPTIMISM`, `POLYGON`, `BASE`, `BNB`, `BLAST`, `UNICHAIN`

**V3 vs V4 Key Differences**:

| Aspect          | V3                           | V4                      |
| --------------- | ---------------------------- | ----------------------- |
| Query name      | `AllV3Ticks`                 | `AllV4Ticks`            |
| Pool identifier | `address` (contract address) | `poolId` (pool ID hash) |
| GraphQL field   | `v3Pool`                     | `v4Pool`                |
| Native ETH      | No (use WETH)                | Yes (zero address)      |

**Response** (same structure for both V3 and V4):

```json
{
  "data": {
    "v3Pool": {
      "id": "VjNQb29sOkVUSEVSRVVN...",
      "ticks": [
        {
          "tick": -887220,
          "liquidityNet": "30633761019434898",
          "price0": "0.000000000000000000000000000000000000002954",
          "price1": "338492131855223783697272027718681500000"
        },
        {
          "tick": -414480,
          "liquidityNet": "35998697322842",
          "price0": "0.000000000000000001000604118149093065",
          "price1": "999396246589299915.3216344427820397"
        }
      ]
    }
  }
}
```

**Understanding the Response**:

| Field          | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `tick`         | The tick index (used for position bounds)                                |
| `liquidityNet` | Net liquidity change at this tick (positive = added, negative = removed) |
| `price0`       | Price of token0 in terms of token1 at this tick                          |
| `price1`       | Price of token1 in terms of token0 at this tick                          |

### Tick Data Fetching (TypeScript)

```typescript
const UNISWAP_GRAPHQL_URL = 'https://interface.gateway.uniswap.org/v1/graphql';

interface TickData {
  tick: number;
  liquidityNet: string;
  price0: string;
  price1: string;
}

type PoolProtocol = 'V3' | 'V4';

// V3 query uses pool address, V4 uses poolId
const V3_TICKS_QUERY = `
  query AllV3Ticks($chain: Chain!, $address: String!, $skip: Int, $first: Int) {
    v3Pool(chain: $chain, address: $address) {
      id
      ticks(skip: $skip, first: $first) {
        tick: tickIdx
        liquidityNet
        price0
        price1
      }
    }
  }
`;

const V4_TICKS_QUERY = `
  query AllV4Ticks($chain: Chain!, $poolId: String!, $skip: Int, $first: Int) {
    v4Pool(chain: $chain, poolId: $poolId) {
      id
      ticks(skip: $skip, first: $first) {
        tick: tickIdx
        liquidityNet
        price0
        price1
      }
    }
  }
`;

async function fetchPoolTicks(
  poolIdentifier: string, // address for V3, poolId for V4
  chain: string = 'ETHEREUM',
  protocol: PoolProtocol = 'V3',
  skip: number = 0,
  first: number = 1000
): Promise<TickData[]> {
  const isV4 = protocol === 'V4';
  const query = isV4 ? V4_TICKS_QUERY : V3_TICKS_QUERY;
  const operationName = isV4 ? 'AllV4Ticks' : 'AllV3Ticks';

  // V3 uses 'address', V4 uses 'poolId'
  const variables = isV4
    ? { chain, poolId: poolIdentifier, skip, first }
    : { chain, address: poolIdentifier, skip, first };

  const response = await fetch(UNISWAP_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://app.uniswap.org/',
    },
    body: JSON.stringify({ operationName, variables, query }),
  });

  const result = await response.json();

  // Response field is v3Pool or v4Pool
  const poolData = isV4 ? result.data.v4Pool : result.data.v3Pool;
  return poolData?.ticks ?? [];
}

// Fetch all ticks (paginated) - works for both V3 and V4
async function fetchAllPoolTicks(
  poolIdentifier: string,
  chain: string = 'ETHEREUM',
  protocol: PoolProtocol = 'V3'
): Promise<TickData[]> {
  const allTicks: TickData[] = [];
  let skip = 0;
  const pageSize = 1000;

  while (true) {
    const ticks = await fetchPoolTicks(poolIdentifier, chain, protocol, skip, pageSize);
    allTicks.push(...ticks);

    if (ticks.length < pageSize) break;
    skip += pageSize;
  }

  return allTicks;
}

// Example usage:
// V3 pool (use contract address)
// const v3Ticks = await fetchAllPoolTicks('0x4e68ccd3e89f51c3074ca5072bbac773960dfa36', 'ETHEREUM', 'V3');

// V4 pool (use pool ID) - supports native ETH
// const v4Ticks = await fetchAllPoolTicks('0x...poolId...', 'ETHEREUM', 'V4');
```

### Building Liquidity Distribution for Charts

Transform tick data into chart-ready liquidity distribution:

```typescript
interface LiquidityBar {
  tickLower: number;
  tickUpper: number;
  priceLower: number;
  priceUpper: number;
  liquidity: bigint;
}

function buildLiquidityDistribution(
  ticks: TickData[],
  tickSpacing: number,
  currentTick: number
): LiquidityBar[] {
  // Sort ticks by index
  const sortedTicks = [...ticks].sort((a, b) => a.tick - b.tick);

  // Calculate cumulative liquidity at each tick
  let cumulativeLiquidity = 0n;
  const tickLiquidity: Map<number, bigint> = new Map();

  for (const tick of sortedTicks) {
    cumulativeLiquidity += BigInt(tick.liquidityNet);
    tickLiquidity.set(tick.tick, cumulativeLiquidity);
  }

  // Build bars for visualization
  const bars: LiquidityBar[] = [];
  let prevTick: number | null = null;
  let prevLiquidity = 0n;

  for (const [tick, liquidity] of tickLiquidity) {
    if (prevTick !== null && prevLiquidity > 0n) {
      bars.push({
        tickLower: prevTick,
        tickUpper: tick,
        priceLower: tickToPrice(prevTick),
        priceUpper: tickToPrice(tick),
        liquidity: prevLiquidity,
      });
    }
    prevTick = tick;
    prevLiquidity = liquidity;
  }

  return bars;
}

// Price conversion utilities
function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}

function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

function roundToValidTick(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing;
}
```

### React Hook for Liquidity Chart Data

```typescript
import { useState, useEffect, useMemo } from 'react';

interface UsePoolLiquidityParams {
  poolIdentifier: string; // address for V3, poolId for V4
  chain: string;
  protocol: 'V3' | 'V4';
  tickSpacing: number;
  currentTick: number;
}

interface LiquidityChartData {
  bars: LiquidityBar[];
  loading: boolean;
  error: string | null;
  currentPrice: number;
  maxLiquidity: bigint;
}

function usePoolLiquidity({
  poolIdentifier,
  chain,
  protocol,
  tickSpacing,
  currentTick,
}: UsePoolLiquidityParams): LiquidityChartData {
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!poolIdentifier) return;

    setLoading(true);
    setError(null);

    fetchAllPoolTicks(poolIdentifier, chain, protocol)
      .then(setTicks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [poolIdentifier, chain, protocol]);

  const bars = useMemo(
    () => buildLiquidityDistribution(ticks, tickSpacing, currentTick),
    [ticks, tickSpacing, currentTick]
  );

  const maxLiquidity = useMemo(
    () => bars.reduce((max, bar) => (bar.liquidity > max ? bar.liquidity : max), 0n),
    [bars]
  );

  return {
    bars,
    loading,
    error,
    currentPrice: tickToPrice(currentTick),
    maxLiquidity,
  };
}

// Example usage:
// V3 pool
// const v3Data = usePoolLiquidity({
//   poolIdentifier: '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
//   chain: 'ETHEREUM',
//   protocol: 'V3',
//   tickSpacing: 60,
//   currentTick: -197220,
// });

// V4 pool (supports native ETH)
// const v4Data = usePoolLiquidity({
//   poolIdentifier: '0x...poolId...',
//   chain: 'ETHEREUM',
//   protocol: 'V4',
//   tickSpacing: 60,
//   currentTick: -197220,
// });
```

### Tick/Price Conversion Utilities

Use Uniswap SDK helpers for accurate tick-to-price conversion:

```typescript
import { tickToPrice as sdkTickToPrice, priceToClosestTick } from '@uniswap/v3-sdk';
import { Token, Price } from '@uniswap/sdk-core';

// SDK-based tick to price (more accurate for display)
function tickToPriceWithTokens(tick: number, token0: Token, token1: Token): Price<Token, Token> {
  return sdkTickToPrice(token0, token1, tick);
}

// Simple tick to price (for calculations)
function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}

// Price to tick
function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

// Round tick to valid tick spacing
function roundToValidTick(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing;
}

// Format price for display
function formatPrice(price: number): string {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toPrecision(4)}`;
}

// Format liquidity for display
function formatLiquidity(liquidity: bigint): string {
  const num = Number(liquidity);
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}k`;
  return num.toFixed(0);
}
```

### Liquidity Chart Component (React + Canvas)

```tsx
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface LiquidityChartProps {
  bars: LiquidityBar[];
  currentTick: number;
  selectedTickLower: number;
  selectedTickUpper: number;
  tickSpacing: number;
  maxLiquidity: bigint;
  onRangeChange: (tickLower: number, tickUpper: number) => void;
  // Optional: configure visible range (default: show all tick data)
  minTick?: number;
  maxTick?: number;
  width?: number;
  height?: number;
}

interface TooltipData {
  x: number;
  y: number;
  tick: number;
  price: number;
  liquidity: bigint;
}

function LiquidityChart({
  bars,
  currentTick,
  selectedTickLower,
  selectedTickUpper,
  tickSpacing,
  maxLiquidity,
  onRangeChange,
  minTick: propMinTick,
  maxTick: propMaxTick,
  width = 800,
  height = 400,
}: LiquidityChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<'left' | 'right' | 'center' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialRange, setInitialRange] = useState({ lower: 0, upper: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Chart margins for axis labels
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom - 50; // Extra space for selector

  // Compute visible tick range from data or props
  const { minTick, maxTick } = useMemo(() => {
    if (propMinTick !== undefined && propMaxTick !== undefined) {
      return { minTick: propMinTick, maxTick: propMaxTick };
    }
    // Auto-calculate from bars data with some padding
    if (bars.length === 0) {
      // Default to ±50% around current price
      const range = Math.abs(currentTick) * 0.5 || 10000;
      return { minTick: currentTick - range, maxTick: currentTick + range };
    }
    const ticks = bars.map((b) => b.tickLower).concat(bars.map((b) => b.tickUpper));
    const dataMin = Math.min(...ticks);
    const dataMax = Math.max(...ticks);
    const padding = (dataMax - dataMin) * 0.05;
    return { minTick: dataMin - padding, maxTick: dataMax + padding };
  }, [bars, currentTick, propMinTick, propMaxTick]);

  // Tick-based coordinate conversion
  const getXFromTick = useCallback(
    (tick: number): number => {
      return margin.left + ((tick - minTick) / (maxTick - minTick)) * chartWidth;
    },
    [minTick, maxTick, chartWidth, margin.left]
  );

  const getTickFromX = useCallback(
    (x: number): number => {
      const ratio = (x - margin.left) / chartWidth;
      return minTick + ratio * (maxTick - minTick);
    },
    [minTick, maxTick, chartWidth, margin.left]
  );

  // Find bar at a given tick
  const getBarAtTick = useCallback(
    (tick: number): LiquidityBar | undefined => {
      return bars.find((bar) => tick >= bar.tickLower && tick < bar.tickUpper);
    },
    [bars]
  );

  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const selectedLeftX = getXFromTick(selectedTickLower);
    const selectedRightX = getXFromTick(selectedTickUpper);
    const currentPriceX = getXFromTick(currentTick);

    // Draw selected range background
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(selectedLeftX, margin.top, selectedRightX - selectedLeftX, chartHeight);

    // Draw liquidity bars
    bars.forEach((bar) => {
      if (bar.tickUpper < minTick || bar.tickLower > maxTick) return;

      const x = getXFromTick(Math.max(bar.tickLower, minTick));
      const xEnd = getXFromTick(Math.min(bar.tickUpper, maxTick));
      const barWidth = Math.max(xEnd - x, 1);
      const barHeight = (Number(bar.liquidity) / Number(maxLiquidity)) * chartHeight;
      const isInRange = bar.tickLower >= selectedTickLower && bar.tickUpper <= selectedTickUpper;

      // Gradient effect for bars
      const gradient = ctx.createLinearGradient(
        0,
        margin.top + chartHeight - barHeight,
        0,
        margin.top + chartHeight
      );
      if (isInRange) {
        gradient.addColorStop(0, 'rgba(236, 72, 153, 1)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
      } else {
        gradient.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, margin.top + chartHeight - barHeight, barWidth, barHeight);

      // Bar outline
      ctx.strokeStyle = isInRange ? 'rgba(236, 72, 153, 1)' : 'rgba(236, 72, 153, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, margin.top + chartHeight - barHeight, barWidth, barHeight);
    });

    // Draw current price line (dotted green)
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(currentPriceX, margin.top);
    ctx.lineTo(currentPriceX, margin.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw selected range boundary lines
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    [selectedLeftX, selectedRightX].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    });

    // Draw labels at top
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';

    // Min price label
    ctx.fillStyle = '#818cf8';
    ctx.fillText(
      `Min: ${formatPrice(tickToPrice(selectedTickLower))}`,
      selectedLeftX,
      margin.top - 10
    );

    // Current price label
    ctx.fillStyle = '#4ade80';
    ctx.fillText('Current', currentPriceX, margin.top - 10);

    // Max price label
    ctx.fillStyle = '#818cf8';
    ctx.fillText(
      `Max: ${formatPrice(tickToPrice(selectedTickUpper))}`,
      selectedRightX,
      margin.top - 10
    );

    // Draw X-axis (price labels)
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    const numXLabels = 6;
    for (let i = 0; i <= numXLabels; i++) {
      const tick = minTick + (i / numXLabels) * (maxTick - minTick);
      const x = getXFromTick(tick);
      const price = tickToPrice(tick);
      ctx.fillText(formatPrice(price), x, margin.top + chartHeight + 20);
    }

    // Draw Y-axis (liquidity labels)
    ctx.textAlign = 'right';
    const numYLabels = 5;
    for (let i = 0; i <= numYLabels; i++) {
      const liquidity = (BigInt(i) * maxLiquidity) / BigInt(numYLabels);
      const y = margin.top + chartHeight - (i / numYLabels) * chartHeight;
      ctx.fillText(formatLiquidity(liquidity), margin.left - 10, y + 4);

      // Grid line
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw range selector bar
    const selectorY = margin.top + chartHeight + 35;
    const selectorHeight = 24;
    const handleRadius = 10;

    // Selector track (background)
    ctx.fillStyle = 'rgba(75, 85, 99, 0.5)';
    ctx.beginPath();
    ctx.roundRect(margin.left, selectorY, chartWidth, selectorHeight, selectorHeight / 2);
    ctx.fill();

    // Selector bar (selected range)
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.roundRect(
      selectedLeftX,
      selectorY,
      selectedRightX - selectedLeftX,
      selectorHeight,
      selectorHeight / 2
    );
    ctx.fill();

    // Left handle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(selectedLeftX, selectorY + selectorHeight / 2, handleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right handle
    ctx.beginPath();
    ctx.arc(selectedRightX, selectorY + selectorHeight / 2, handleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center grip
    const centerX = (selectedLeftX + selectedRightX) / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    [-3, 0, 3].forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(centerX + offset, selectorY + 6);
      ctx.lineTo(centerX + offset, selectorY + selectorHeight - 6);
      ctx.stroke();
    });

    // Draw tooltip if hovering
    if (tooltip) {
      const tooltipWidth = 160;
      const tooltipHeight = 60;
      let tooltipX = tooltip.x + 10;
      let tooltipY = tooltip.y - tooltipHeight - 10;

      // Keep tooltip in bounds
      if (tooltipX + tooltipWidth > width) tooltipX = tooltip.x - tooltipWidth - 10;
      if (tooltipY < 0) tooltipY = tooltip.y + 10;

      // Tooltip background
      ctx.fillStyle = 'rgba(30, 30, 46, 0.95)';
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Tooltip content
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '11px Inter, system-ui, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Tick: ${tooltip.tick.toFixed(0)}`, tooltipX + 10, tooltipY + 18);
      ctx.fillText(`Price: ${formatPrice(tooltip.price)}`, tooltipX + 10, tooltipY + 34);
      ctx.fillText(
        `Liquidity: ${formatLiquidity(tooltip.liquidity)}`,
        tooltipX + 10,
        tooltipY + 50
      );
    }
  }, [
    bars,
    currentTick,
    selectedTickLower,
    selectedTickUpper,
    maxLiquidity,
    width,
    height,
    minTick,
    maxTick,
    getXFromTick,
    tooltip,
    chartWidth,
    chartHeight,
    margin,
  ]);

  // Handle mouse interactions
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const selectedLeftX = getXFromTick(selectedTickLower);
      const selectedRightX = getXFromTick(selectedTickUpper);
      const selectorY = margin.top + chartHeight + 35;
      const selectorHeight = 24;
      const handleRadius = 10;

      // Check if clicking on left handle
      if (Math.hypot(x - selectedLeftX, y - (selectorY + selectorHeight / 2)) <= handleRadius) {
        setDragging('left');
        setDragStartX(x);
        setInitialRange({ lower: selectedTickLower, upper: selectedTickUpper });
        return;
      }

      // Check if clicking on right handle
      if (Math.hypot(x - selectedRightX, y - (selectorY + selectorHeight / 2)) <= handleRadius) {
        setDragging('right');
        setDragStartX(x);
        setInitialRange({ lower: selectedTickLower, upper: selectedTickUpper });
        return;
      }

      // Check if clicking on selector bar
      if (
        x >= selectedLeftX &&
        x <= selectedRightX &&
        y >= selectorY &&
        y <= selectorY + selectorHeight
      ) {
        setDragging('center');
        setDragStartX(x);
        setInitialRange({ lower: selectedTickLower, upper: selectedTickUpper });
      }
    },
    [selectedTickLower, selectedTickUpper, getXFromTick, chartHeight, margin.top]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update tooltip when hovering over chart area
      if (
        y >= margin.top &&
        y <= margin.top + chartHeight &&
        x >= margin.left &&
        x <= margin.left + chartWidth
      ) {
        const tick = getTickFromX(x);
        const bar = getBarAtTick(tick);
        setTooltip({
          x,
          y,
          tick,
          price: tickToPrice(tick),
          liquidity: bar?.liquidity ?? 0n,
        });
      } else {
        setTooltip(null);
      }

      if (!dragging) return;

      const tick = roundToValidTick(getTickFromX(x), tickSpacing);

      if (dragging === 'left') {
        const newLower = Math.min(tick, selectedTickUpper - tickSpacing);
        onRangeChange(newLower, selectedTickUpper);
      } else if (dragging === 'right') {
        const newUpper = Math.max(tick, selectedTickLower + tickSpacing);
        onRangeChange(selectedTickLower, newUpper);
      } else if (dragging === 'center') {
        const deltaTicks = tick - getTickFromX(dragStartX);
        const rangeWidth = initialRange.upper - initialRange.lower;
        const newLower = roundToValidTick(initialRange.lower + deltaTicks, tickSpacing);
        const newUpper = newLower + rangeWidth;
        onRangeChange(newLower, newUpper);
      }
    },
    [
      dragging,
      dragStartX,
      initialRange,
      selectedTickLower,
      selectedTickUpper,
      tickSpacing,
      onRangeChange,
      getTickFromX,
      getBarAtTick,
      margin,
      chartWidth,
      chartHeight,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDragging(null);
    setTooltip(null);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        cursor: dragging ? 'grabbing' : 'crosshair',
        borderRadius: 8,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
```

### Range Selection Presets

Provide users with common range presets based on current tick:

```typescript
interface RangePreset {
  label: string;
  tickLower: number;
  tickUpper: number;
  priceLower: number;
  priceUpper: number;
  description: string;
}

function getRangePresets(currentTick: number, tickSpacing: number): RangePreset[] {
  const currentPrice = tickToPrice(currentTick);

  const presets = [
    {
      label: 'Tight (±5%)',
      pctLower: 0.95,
      pctUpper: 1.05,
      desc: 'High fees, frequent rebalancing',
    },
    { label: 'Medium (±10%)', pctLower: 0.9, pctUpper: 1.1, desc: 'Balanced approach' },
    { label: 'Wide (±25%)', pctLower: 0.75, pctUpper: 1.25, desc: 'Less management needed' },
    { label: 'Very Wide (±50%)', pctLower: 0.5, pctUpper: 1.5, desc: 'Minimal rebalancing' },
    { label: 'Full Range', pctLower: 0, pctUpper: Infinity, desc: 'Always in range (like V2)' },
  ];

  return presets.map(({ label, pctLower, pctUpper, desc }) => {
    let tickLower: number;
    let tickUpper: number;

    if (pctLower === 0) {
      tickLower = -887220; // Min tick
      tickUpper = 887220; // Max tick
    } else {
      tickLower = roundToValidTick(priceToTick(currentPrice * pctLower), tickSpacing);
      tickUpper = roundToValidTick(priceToTick(currentPrice * pctUpper), tickSpacing);
    }

    return {
      label,
      tickLower,
      tickUpper,
      priceLower: tickToPrice(tickLower),
      priceUpper: tickToPrice(tickUpper),
      description: desc,
    };
  });
}
```

### Complete Custom Range Position Flow

```typescript
import { useState } from 'react';

function CustomRangePositionForm() {
  const [poolIdentifier, setPoolIdentifier] = useState('');
  const [protocol, setProtocol] = useState<'V3' | 'V4'>('V4');
  const [tickLower, setTickLower] = useState<number | null>(null);
  const [tickUpper, setTickUpper] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [independentToken, setIndependentToken] = useState<'TOKEN_0' | 'TOKEN_1'>('TOKEN_0');

  // Pool data (would come from API/subgraph)
  const currentTick = -197220;
  const tickSpacing = 60;

  // V4 pool supports native ETH (zero address)
  // V3 pool must use WETH instead
  const pool =
    protocol === 'V4'
      ? {
          token0: '0x0000000000000000000000000000000000000000', // Native ETH (V4 only!)
          token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          fee: 3000,
          tickSpacing: 60,
        }
      : {
          token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH (V3)
          token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          fee: 3000,
          tickSpacing: 60,
        };

  // Fetch liquidity data - works for both V3 and V4
  const { bars, loading, maxLiquidity } = usePoolLiquidity({
    poolIdentifier,
    chain: 'ETHEREUM',
    protocol,
    tickSpacing,
    currentTick,
  });

  // Range presets
  const presets = getRangePresets(currentTick, tickSpacing);

  const handlePresetSelect = (preset: RangePreset) => {
    setTickLower(preset.tickLower);
    setTickUpper(preset.tickUpper);
  };

  const handleCreatePosition = async () => {
    if (tickLower === null || tickUpper === null) return;

    const response = await fetch('https://trade.api.uniswap.org/v1/lp/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_UNISWAP_API_KEY!,
      },
      body: JSON.stringify({
        simulateTransaction: false,
        protocol, // 'V3' or 'V4'
        walletAddress: '0x...', // Connected wallet
        chainId: 1,
        independentAmount: amount,
        independentToken,
        position: {
          tickLower,
          tickUpper,
          pool, // V4 can use native ETH, V3 must use WETH
        },
      }),
    });

    const { create } = await response.json();
    // Submit transaction with wallet...
  };

  return (
    <div>
      {/* Protocol selector */}
      <div>
        <label>Protocol:</label>
        <select value={protocol} onChange={(e) => setProtocol(e.target.value as 'V3' | 'V4')}>
          <option value="V3">V3 (use WETH)</option>
          <option value="V4">V4 (supports native ETH)</option>
        </select>
      </div>

      {/* Pool identifier - address for V3, poolId for V4 */}
      <input
        placeholder={protocol === 'V3' ? 'Pool address' : 'Pool ID'}
        value={poolIdentifier}
        onChange={(e) => setPoolIdentifier(e.target.value)}
      />

      {/* Liquidity distribution chart */}
      {!loading && (
        <LiquidityChart
          bars={bars}
          currentTick={currentTick}
          selectedTickLower={tickLower ?? undefined}
          selectedTickUpper={tickUpper ?? undefined}
          maxLiquidity={maxLiquidity}
        />
      )}

      {/* Range presets */}
      <div>
        <h3>Quick Select Range</h3>
        {presets.map((preset) => (
          <button key={preset.label} onClick={() => handlePresetSelect(preset)}>
            {preset.label}
            <span>{preset.description}</span>
          </button>
        ))}
      </div>

      {/* Manual tick input */}
      <div>
        <label>
          Lower Tick:
          <input
            type="number"
            step={tickSpacing}
            value={tickLower ?? ''}
            onChange={(e) => setTickLower(Number(e.target.value))}
          />
          <span>Price: {tickLower ? tickToPrice(tickLower).toFixed(6) : '-'}</span>
        </label>
        <label>
          Upper Tick:
          <input
            type="number"
            step={tickSpacing}
            value={tickUpper ?? ''}
            onChange={(e) => setTickUpper(Number(e.target.value))}
          />
          <span>Price: {tickUpper ? tickToPrice(tickUpper).toFixed(6) : '-'}</span>
        </label>
      </div>

      {/* Amount input */}
      <div>
        <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select
          value={independentToken}
          onChange={(e) => setIndependentToken(e.target.value as 'TOKEN_0' | 'TOKEN_1')}
        >
          <option value="TOKEN_0">Token 0</option>
          <option value="TOKEN_1">Token 1</option>
        </select>
      </div>

      <button onClick={handleCreatePosition}>Create Position</button>
    </div>
  );
}
```

### Best Practices for Custom Range Positions

1. **Start wider, then tighten**: Begin with a wider range to understand the pool's volatility before narrowing

2. **Monitor position health**: Set up alerts when price approaches range boundaries

3. **Consider gas costs**: Frequent rebalancing on mainnet can eat into profits - factor in gas when choosing range width

4. **Use historical volatility**: Check the pool's price history to inform range selection

5. **Tick alignment**: Always ensure ticks are divisible by the pool's `tickSpacing`:
   - 0.01% fee (100 bips) → tickSpacing = 1
   - 0.05% fee (500 bips) → tickSpacing = 10
   - 0.30% fee (3000 bips) → tickSpacing = 60
   - 1.00% fee (10000 bips) → tickSpacing = 200

---

## Position Manager Reference

### V3 NonfungiblePositionManager

**Address**: `0xC36442b4a4522E871399CD717aBDD847Ab11FE88` (all chains)

**Key Functions**:

```solidity
// Create position
function mint(MintParams calldata params) external payable returns (
    uint256 tokenId,
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1
);

struct MintParams {
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint256 amount0Desired;
    uint256 amount1Desired;
    uint256 amount0Min;
    uint256 amount1Min;
    address recipient;
    uint256 deadline;
}

// Add liquidity
function increaseLiquidity(IncreaseLiquidityParams calldata params) external payable returns (
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1
);

// Remove liquidity
function decreaseLiquidity(DecreaseLiquidityParams calldata params) external payable returns (
    uint256 amount0,
    uint256 amount1
);

// Collect fees
function collect(CollectParams calldata params) external payable returns (
    uint256 amount0,
    uint256 amount1
);
```

### V4 PositionManager

**Key Functions**:

```solidity
// Mint new position
function mint(
    PoolKey calldata poolKey,
    int24 tickLower,
    int24 tickUpper,
    uint256 liquidity,
    uint128 amount0Max,
    uint128 amount1Max,
    address owner,
    bytes calldata hookData
) external returns (uint256 tokenId, BalanceDelta delta);

// Increase liquidity
function increaseLiquidity(
    uint256 tokenId,
    uint256 liquidity,
    uint128 amount0Max,
    uint128 amount1Max,
    bytes calldata hookData
) external returns (BalanceDelta delta);

// Decrease liquidity
function decreaseLiquidity(
    uint256 tokenId,
    uint256 liquidity,
    uint128 amount0Min,
    uint128 amount1Min,
    bytes calldata hookData
) external returns (BalanceDelta delta);
```

### SDK Usage (V3)

```typescript
import { NonfungiblePositionManager, Pool, Position } from '@uniswap/v3-sdk';
import { Token, Percent } from '@uniswap/sdk-core';

// Define tokens
const token0 = new Token(1, '0xA0b8...', 6, 'USDC');
const token1 = new Token(1, '0xC02a...', 18, 'WETH');

// Get pool data (from subgraph or on-chain)
const pool = new Pool(
  token0,
  token1,
  3000, // fee tier
  sqrtRatioX96.toString(),
  liquidity.toString(),
  tick
);

// Create position
const position = Position.fromAmounts({
  pool,
  tickLower: -887220,
  tickUpper: 887220,
  amount0: '1000000000', // 1000 USDC
  amount1: '500000000000000000', // 0.5 WETH
  useFullPrecision: true,
});

// Get mint parameters
const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
  slippageTolerance: new Percent(50, 10000), // 0.5%
  deadline: Math.floor(Date.now() / 1000) + 1800,
  recipient: walletAddress,
});

// Execute transaction
const tx = await walletClient.sendTransaction({
  to: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  data: calldata,
  value: BigInt(value),
});
```

---

## Permit2 Integration

Permit2 enables gasless approvals for LP operations.

### How It Works with LP

1. User approves Permit2 contract once (infinite approval)
2. For each LP operation, user signs a message
3. Position Manager uses signature via Permit2 to transfer tokens

### Integration Pattern

```typescript
import {
  AllowanceTransfer,
  MaxAllowanceTransferAmount,
  PERMIT2_ADDRESS,
} from '@uniswap/permit2-sdk';

// Check if Permit2 approval exists for token
const allowance = await permit2Contract.read.allowance([
  userAddress,
  tokenAddress,
  positionManagerAddress,
]);

// If not approved, user must approve Permit2 first
if (allowance.amount < requiredAmount) {
  const approveTx = await tokenContract.write.approve([
    PERMIT2_ADDRESS,
    MaxAllowanceTransferAmount,
  ]);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
}

// Build permit data for LP operation
const permit = {
  details: {
    token: tokenAddress,
    amount: requiredAmount,
    expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    nonce: await permit2Contract.read.nonces([userAddress]),
  },
  spender: positionManagerAddress,
  sigDeadline: Math.floor(Date.now() / 1000) + 3600,
};

// Sign permit
const signature = await walletClient.signTypedData({
  domain: {
    name: 'Permit2',
    chainId: 1,
    verifyingContract: PERMIT2_ADDRESS,
  },
  types: AllowanceTransfer.types,
  primaryType: 'PermitSingle',
  message: permit,
});
```

---

## Common Integration Patterns

### Frontend LP Hook (React)

```typescript
import { useState, useCallback } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';

const API_URL = 'https://trade.api.uniswap.org/v1';

// Native ETH address (only supported in V4)
const NATIVE_ETH = '0x0000000000000000000000000000000000000000';

interface PoolConfig {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  hooks?: string; // V4 only
}

interface PositionConfig {
  tickLower: number;
  tickUpper: number;
  pool: PoolConfig;
}

function useLiquidity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const createPosition = useCallback(
    async (params: {
      protocol: 'V2' | 'V3' | 'V4';
      amount0: string;
      amount1: string;
      independentAmount: string;
      independentToken: 'TOKEN_0' | 'TOKEN_1';
      position: PositionConfig;
    }) => {
      if (!walletClient) throw new Error('Wallet not connected');
      setLoading(true);
      setError(null);

      try {
        const walletAddress = walletClient.account.address;
        const chainId = await walletClient.getChainId();

        // 1. Check approvals (uses flat token/amount structure)
        const approvalRes = await fetch(`${API_URL}/lp/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_UNISWAP_API_KEY!,
          },
          body: JSON.stringify({
            simulateTransaction: false,
            walletAddress,
            chainId,
            protocol: params.protocol,
            token0: params.position.pool.token0,
            token1: params.position.pool.token1,
            amount0: params.amount0,
            amount1: params.amount1,
            generatePermitAsTransaction: true,
          }),
        });
        const { approvals } = await approvalRes.json();

        // Submit approval transactions if needed
        for (const approval of approvals) {
          const hash = await walletClient.sendTransaction(approval);
          await publicClient.waitForTransactionReceipt({ hash });
        }

        // 2. Create position (uses nested position structure)
        const createRes = await fetch(`${API_URL}/lp/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_UNISWAP_API_KEY!,
          },
          body: JSON.stringify({
            simulateTransaction: false,
            protocol: params.protocol,
            walletAddress,
            chainId,
            independentAmount: params.independentAmount,
            independentToken: params.independentToken,
            position: params.position,
          }),
        });
        const { create } = await createRes.json();

        // 3. Submit create transaction
        const hash = await walletClient.sendTransaction(create);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return receipt;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [walletClient, publicClient]
  );

  const removeLiquidity = useCallback(
    async (
      tokenId: number,
      percentage: number,
      positionLiquidity: string,
      position: PositionConfig,
      protocol: 'V3' | 'V4' = 'V4'
    ) => {
      if (!walletClient) throw new Error('Wallet not connected');
      setLoading(true);

      try {
        const walletAddress = walletClient.account.address;
        const chainId = await walletClient.getChainId();

        const decreaseRes = await fetch(`${API_URL}/lp/decrease`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_UNISWAP_API_KEY!,
          },
          body: JSON.stringify({
            simulateTransaction: false,
            protocol,
            walletAddress,
            chainId,
            tokenId,
            liquidityPercentageToDecrease: percentage,
            positionLiquidity,
            position,
          }),
        });
        const { decrease } = await decreaseRes.json();

        const hash = await walletClient.sendTransaction(decrease);
        return await publicClient.waitForTransactionReceipt({ hash });
      } finally {
        setLoading(false);
      }
    },
    [walletClient, publicClient]
  );

  const collectFees = useCallback(
    async (tokenId: number, position: PositionConfig, protocol: 'V3' | 'V4' = 'V4') => {
      if (!walletClient) throw new Error('Wallet not connected');
      setLoading(true);

      try {
        const walletAddress = walletClient.account.address;
        const chainId = await walletClient.getChainId();

        const claimRes = await fetch(`${API_URL}/lp/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_UNISWAP_API_KEY!,
          },
          body: JSON.stringify({
            simulateTransaction: false,
            protocol,
            walletAddress,
            chainId,
            tokenId,
            position,
          }),
        });
        const { claim } = await claimRes.json();

        const hash = await walletClient.sendTransaction(claim);
        return await publicClient.waitForTransactionReceipt({ hash });
      } finally {
        setLoading(false);
      }
    },
    [walletClient, publicClient]
  );

  return { createPosition, removeLiquidity, collectFees, loading, error, NATIVE_ETH };
}

export { useLiquidity };
```

### Backend LP Script (Node.js)

```typescript
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const API_URL = 'https://trade.api.uniswap.org/v1';
const API_KEY = process.env.UNISWAP_API_KEY!;

// Native ETH address (only supported in V4)
const NATIVE_ETH = '0x0000000000000000000000000000000000000000';

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

interface PoolConfig {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  hooks?: string;
}

interface CreatePositionParams {
  protocol: 'V2' | 'V3' | 'V4';
  amount0: string;
  amount1: string;
  independentAmount: string;
  independentToken: 'TOKEN_0' | 'TOKEN_1';
  tickLower: number;
  tickUpper: number;
  pool: PoolConfig;
}

async function createLPPosition(params: CreatePositionParams) {
  // 1. Check approvals (uses flat token/amount structure)
  const approvalRes = await fetch(`${API_URL}/lp/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      simulateTransaction: false,
      walletAddress: account.address,
      chainId: mainnet.id,
      protocol: params.protocol,
      token0: params.pool.token0,
      token1: params.pool.token1,
      amount0: params.amount0,
      amount1: params.amount1,
      generatePermitAsTransaction: true,
    }),
  });
  const { approvals } = await approvalRes.json();

  // Submit approvals
  for (const approval of approvals) {
    const hash = await walletClient.sendTransaction(approval);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Approval confirmed: ${hash}`);
  }

  // 2. Create position (uses nested position structure)
  const createRes = await fetch(`${API_URL}/lp/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      simulateTransaction: false,
      protocol: params.protocol,
      walletAddress: account.address,
      chainId: mainnet.id,
      independentAmount: params.independentAmount,
      independentToken: params.independentToken,
      position: {
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        pool: params.pool,
      },
    }),
  });
  const { create, poolAddress } = await createRes.json();

  const hash = await walletClient.sendTransaction(create);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(`Position created in pool ${poolAddress}`);
  console.log(`Transaction: ${hash}`);

  return receipt;
}

// Example: V4 position with native ETH
createLPPosition({
  protocol: 'V4',
  independentAmount: '1000000', // 1 USDC (6 decimals)
  independentToken: 'TOKEN_1',
  tickLower: -197400,
  tickUpper: -195600,
  pool: {
    token0: NATIVE_ETH, // Native ETH (V4 only!)
    token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    fee: 3000,
    tickSpacing: 60,
  },
}).catch(console.error);

// Example: V3 position with WETH (no native ETH in V3)
createLPPosition({
  protocol: 'V3',
  independentAmount: '1000000000', // 1000 USDC
  independentToken: 'TOKEN_0',
  tickLower: -887220,
  tickUpper: 887220,
  pool: {
    token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH (not native ETH!)
    fee: 3000,
    tickSpacing: 60,
  },
}).catch(console.error);
```

### Smart Contract Integration (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract LPIntegration is IERC721Receiver {
    INonfungiblePositionManager public immutable positionManager;

    struct PositionInfo {
        uint256 tokenId;
        address owner;
    }

    mapping(uint256 => PositionInfo) public positions;

    constructor(address _positionManager) {
        positionManager = INonfungiblePositionManager(_positionManager);
    }

    /// @notice Creates a new liquidity position
    function createPosition(
        address token0,
        address token1,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint256 tokenId) {
        // Transfer tokens from user
        IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);

        // Approve position manager
        IERC20(token0).approve(address(positionManager), amount0Desired);
        IERC20(token1).approve(address(positionManager), amount1Desired);

        // Mint position
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0,
            amount1Min: 0,
            recipient: address(this),
            deadline: block.timestamp + 1 hours
        });

        (tokenId, , , ) = positionManager.mint(params);

        positions[tokenId] = PositionInfo({
            tokenId: tokenId,
            owner: msg.sender
        });

        return tokenId;
    }

    /// @notice Adds liquidity to existing position
    function increaseLiquidity(
        uint256 tokenId,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external {
        require(positions[tokenId].owner == msg.sender, "Not position owner");

        (,,address token0, address token1,,,,,,,,) = positionManager.positions(tokenId);

        IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);

        IERC20(token0).approve(address(positionManager), amount0Desired);
        IERC20(token1).approve(address(positionManager), amount1Desired);

        positionManager.increaseLiquidity(
            INonfungiblePositionManager.IncreaseLiquidityParams({
                tokenId: tokenId,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp + 1 hours
            })
        );
    }

    /// @notice Removes liquidity from position
    function decreaseLiquidity(uint256 tokenId, uint128 liquidity) external {
        require(positions[tokenId].owner == msg.sender, "Not position owner");

        positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidity,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp + 1 hours
            })
        );
    }

    /// @notice Collects fees from position
    function collectFees(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
        require(positions[tokenId].owner == msg.sender, "Not position owner");

        (amount0, amount1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: msg.sender,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
```

---

## Key Contract Addresses

### Position Managers

| Chain    | V3 NonfungiblePositionManager                | V4 PositionManager            |
| -------- | -------------------------------------------- | ----------------------------- |
| Mainnet  | `0xC36442b4a4522E871399CD717aBDD847Ab11FE88` | Check Uniswap docs for latest |
| Arbitrum | `0xC36442b4a4522E871399CD717aBDD847Ab11FE88` | Check Uniswap docs for latest |
| Optimism | `0xC36442b4a4522E871399CD717aBDD847Ab11FE88` | Check Uniswap docs for latest |
| Base     | `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1` | Check Uniswap docs for latest |
| Polygon  | `0xC36442b4a4522E871399CD717aBDD847Ab11FE88` | Check Uniswap docs for latest |

### Permit2

| Chain      | Address                                      |
| ---------- | -------------------------------------------- |
| All chains | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

### V3 Factory

| Chain      | Address                                      |
| ---------- | -------------------------------------------- |
| All chains | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |

---

## Tick Math Reference

### Common Price Ranges

| Description | Tick Lower | Tick Upper | Price Range      |
| ----------- | ---------- | ---------- | ---------------- |
| Full range  | -887220    | 887220     | 0 to ∞           |
| ±50%        | -6932      | 6932       | ~0.5x to ~2x     |
| ±20%        | -2231      | 2231       | ~0.82x to ~1.22x |
| ±10%        | -1054      | 1054       | ~0.9x to ~1.1x   |
| ±5%         | -513       | 513        | ~0.95x to ~1.05x |

### Tick Spacing by Fee Tier

| Fee (bips) | Fee % | Tick Spacing |
| ---------- | ----- | ------------ |
| 100        | 0.01% | 1            |
| 500        | 0.05% | 10           |
| 3000       | 0.30% | 60           |
| 10000      | 1.00% | 200          |

### Tick to Price Formula

```typescript
// Price = 1.0001^tick
function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}

// Tick = log_1.0001(price)
function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

// Round tick to nearest valid tick for fee tier
function roundToValidTick(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing;
}
```

---

## Troubleshooting

### Common Issues

| Issue                     | Solution                                           |
| ------------------------- | -------------------------------------------------- |
| "Insufficient allowance"  | Call /lp/approve and submit approval txs first     |
| "Price slippage check"    | Increase slippageTolerance or adjust amounts       |
| "Tick out of range"       | Ensure ticks are within valid range and aligned    |
| "Invalid tick spacing"    | Ticks must be divisible by fee tier's tick spacing |
| "Position does not exist" | Verify positionId is correct and on right chain    |
| "Insufficient liquidity"  | Check token balances and amounts                   |
| "STF" (SafeTransferFrom)  | Token approval missing or insufficient balance     |

### API Error Codes

| Code | Meaning                         |
| ---- | ------------------------------- |
| 400  | Invalid request parameters      |
| 401  | Invalid or missing API key      |
| 404  | Pool or position not found      |
| 422  | Validation error (check params) |
| 429  | Rate limit exceeded             |
| 500  | Internal server error           |

### Position Troubleshooting

```typescript
// Check if position exists and get details
const position = await positionManagerContract.read.positions([positionId]);
console.log({
  nonce: position[0],
  operator: position[1],
  token0: position[2],
  token1: position[3],
  fee: position[4],
  tickLower: position[5],
  tickUpper: position[6],
  liquidity: position[7],
  feeGrowthInside0LastX128: position[8],
  feeGrowthInside1LastX128: position[9],
  tokensOwed0: position[10],
  tokensOwed1: position[11],
});

// Check if position is in range
const slot0 = await poolContract.read.slot0();
const currentTick = slot0[1];
const inRange = currentTick >= position.tickLower && currentTick < position.tickUpper;
```

---

## Additional Resources

- [Uniswap V3 Docs](https://docs.uniswap.org/contracts/v3/overview)
- [Uniswap V4 Docs](https://docs.uniswap.org/contracts/v4/overview)
- [V3 SDK GitHub](https://github.com/Uniswap/v3-sdk)
- [V4 SDK GitHub](https://github.com/Uniswap/v4-sdk)
- [Trading API Documentation](https://docs.uniswap.org/api/trading-api)
- [Permit2 Patterns](https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/permit2)
- [Position Manager Contract](https://github.com/Uniswap/v3-periphery/blob/main/contracts/NonfungiblePositionManager.sol)
