---
description: Configure and deploy CCA (Continuous Clearing Auction) smart contracts for token auctions. Use when user says "configure auction", "cca auction", "setup token auction", "auction configuration", "continuous auction", "deploy auction", or mentions CCA contracts.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(forge:*), Bash(curl:*), WebFetch, AskUserQuestion, cca-supply-schedule__generate_supply_schedule
model: opus
---

# CCA Configuration & Deployment

Configure and deploy Continuous Clearing Auction (CCA) smart contracts for fair and transparent token distribution.

## Instructions for Claude Code

When the user invokes this skill, guide them through a **bulk interactive form configuration flow** using AskUserQuestion. Collect parameters in batches to minimize user interaction rounds.

### Bulk Interactive Form Rules

1. **Batch questions** - Ask up to 4 questions at once using a single AskUserQuestion call
2. **Allow direct input** - For fields requiring custom values (addresses, numbers):
   - Provide a "Not available yet" or "Skip for now" option
   - The "Other" option (automatically provided) allows direct custom input
   - **NEVER** ask "Do you have X?" as a separate question
3. **Store answers** - Keep track of all collected values in a configuration object
4. **Validate after collection** - After each batch, validate all inputs before proceeding
5. **Show progress** - After each batch, show which parameters are collected and which remain

### Configuration Flow

Collect parameters in these batches:

#### Batch 1: Task Selection (1 question)

**Question 1: Task Type**

- Prompt: "What would you like to do with CCA?"
- Options: "Configure auction parameters", "Generate supply schedule only", "Review existing config", "Deploy existing config"

**After collection:** If not "Configure auction parameters", skip to appropriate section.

---

#### Batch 2: Basic Configuration (4 questions)

**Question 1: Network**

- Prompt: "Which network to deploy on?"
- Options: "Ethereum Mainnet", "Unichain", "Base", "Arbitrum", "Sepolia"
- Store: `chainId`, `blockTime`, `rpcUrl`, `currencyDecimals` (for selected currency)

**Question 2: Token Address**

- Prompt: "Token to be auctioned?"
- Options: "Token not deployed yet" (placeholder), Custom address (via "Other")
- Validation: Must be 42 chars starting with 0x
- Store: `token`

**Question 3: Total Supply**

- Prompt: "How many tokens to auction?"
- Options: "100 million tokens (18 decimals)", "1 billion tokens (18 decimals)", "10 billion tokens (18 decimals)", Custom (via "Other")
- Validation: Must be <= 1e30 wei
- Store: `totalSupply`

**Question 4: Currency**

- Prompt: "What currency should bidders use?"
- Options: "ETH (Native)", "USDC on [network]", "USDT on [network]", Custom ERC20 (via "Other")
- Validation: Must be 42 chars starting with 0x or address(0)
- Store: `currency`

**After collection:** Validate all inputs, show summary of basic configuration.

---

#### Batch 3: Timing & Pricing (4 questions)

**Question 1: Auction Duration**

- Prompt: "How long should the auction run?"
- Options: "1 day", "2 days", "3 days", "7 days", Custom blocks (via "Other")
- Calculate blocks based on network block time
- Store: `auctionBlocks`

**Question 2: Prebid Period**

- Prompt: "Include a prebid period? (time when no tokens are sold)"
- Options: "No prebid period (0 blocks)", "12 hours", "1 day", Custom blocks (via "Other")
- Calculate blocks based on network block time
- Store: `prebidBlocks`

**Question 3: Floor Price**

- Prompt: "Starting floor price? (ratio of currency per token)"
- Options: "0.10x (10% of 1:1 ratio)", "0.01x (1% of 1:1 ratio)", "0.001x (0.1% of 1:1 ratio)", Custom ratio (via "Other")
- Calculate Q96 value accounting for decimal differences: `Q96 * ratio / 10^(tokenDecimals - currencyDecimals)`
- For USDC (6 decimals) and 18-decimal token: `Q96 * ratio / 10^12`
- For native ETH (18 decimals) and 18-decimal token: `Q96 * ratio / 10^0 = Q96 * ratio`
- Store: `floorPriceRatio`, `floorPrice` (Q96), `tokenDecimals`, `currencyDecimals`

**Question 4: Tick Spacing**

- Prompt: "Tick spacing as percentage of floor price?"
- Options: "1% of floor price (Recommended)", "10% of floor price", "0.1% of floor price", Custom percentage (via "Other")
- Calculate: `tickSpacing = int(floorPrice * percentage)`
- **CRITICAL**: Round floor price DOWN to be evenly divisible by tick spacing:
  - `roundedFloorPrice = (floorPrice // tickSpacing) * tickSpacing`
  - Verify: `roundedFloorPrice % tickSpacing == 0` must be true
- Validate: Tick spacing must be >= 1 basis point of floor price
- Store: `tickSpacingPercentage`, `tickSpacing` (Q96), `roundedFloorPrice`

**After collection:** Validate inputs, verify floor price divisibility, calculate and display Q96 values, show timing summary.

---

#### Batch 4: Recipients & Launch (4 questions)

**Question 1: Tokens Recipient**

- Prompt: "Where should unsold tokens be sent?"
- Options: "Same as funds recipient", Custom address (via "Other")
- Validation: Must be 42 chars starting with 0x
- Store: `tokensRecipient`

**Question 2: Funds Recipient**

- Prompt: "Where should raised funds be sent?"
- Options: "Same as tokens recipient", Custom address (via "Other")
- Validation: Must be 42 chars starting with 0x
- Store: `fundsRecipient`

**Question 3: Start Time**

- Prompt: "When should the auction start?"
- Options: "In 1 hour", "In 6 hours", "In 24 hours", Custom block number (via "Other")
- Fetch current block number from RPC and calculate
- Store: `startBlock`
- Calculate: `endBlock = startBlock + prebidBlocks + auctionBlocks`, `claimBlock = endBlock`

**Question 4: Minimum Funds Required**

- Prompt: "Require minimum currency raised for graduation?"
- Options: "No minimum (0)", "100 ETH", "1000 ETH", Custom amount in wei (via "Other")
- Store: `requiredCurrencyRaised`

**After collection:** Validate addresses, fetch current block from RPC, calculate full block timeline.

---

#### Batch 5: Optional Hook (1 question)

**Question 1: Validation Hook**

- Prompt: "Use a validation hook contract?"
- Options: "No validation hook", Custom hook address (via "Other")
- Validation: Must be 42 chars starting with 0x (if provided)
- Store: `validationHook`

**After collection:** Validate hook address if provided.

---

#### Step 6: Generate Supply Schedule

**If MCP server is not running**, provide instructions to start it:

```bash
# Navigate to MCP server directory
cd packages/plugins/uniswap-builder/mcp-server/supply-schedule

# Run setup script (first time only)
chmod +x setup.sh
./setup.sh

# Start the MCP server
python3 server.py
```

Once the MCP server is running, use the collected `auctionBlocks` and `prebidBlocks` to call the MCP tool:

```typescript
cca -
  supply -
  schedule__generate_supply_schedule({
    auction_blocks: auctionBlocks,
    prebid_blocks: prebidBlocks,
  });
```

If the MCP tool is unavailable, use the fallback Python algorithm directly (see Supply Schedule Configuration section).

Store: `supplySchedule`

#### Step 7: Generate and Display Configuration

After collecting all parameters and generating the supply schedule, display the complete JSON configuration in the CLI output:

```json
{
  "[chainId]": {
    "token": "...",
    "totalSupply": ...,
    "currency": "...",
    "tokensRecipient": "...",
    "fundsRecipient": "...",
    "startBlock": ...,
    "endBlock": ...,
    "claimBlock": ...,
    "tickSpacing": ...,
    "validationHook": "...",
    "floorPrice": ...,
    "requiredCurrencyRaised": ...,
    "supplySchedule": [...]
  }
}
```

**Do NOT automatically create a file.** Let the user copy the JSON or specify a filepath to save it.

#### Step 8: Display Summary

Show the user a comprehensive formatted summary including:

- Network and chain ID
- Token and currency details
- Block timeline (start, end, claim) with human-readable times
- Pricing (floor price, tick spacing) in both Q96 and ratio formats
- Recipients (tokens, funds)
- Supply schedule summary (total phases, final block percentage)
- Validation checklist (all validation rules passed/failed)

#### Step 9: Next Steps

Ask the user what they want to do:

- "Save to file" (ask for filepath, default: `script/auction-config.json`)
- "View deployment instructions"
- "Modify configuration"
- "Exit" (just end, they can copy the JSON from CLI output)

### Important Notes

- **Validate in batches** - Validate all inputs after each batch collection
- **Fetch current block number** from RPC when calculating start/end blocks
- **Calculate Q96 values** correctly for floor price and tick spacing:
  - **CRITICAL**: Account for decimal differences: `Q96 * ratio / 10^(tokenDecimals - currencyDecimals)`
  - USDC is 6 decimals on all networks - divide by 10^12 for 18-decimal tokens
  - Native ETH is 18 decimals - no adjustment needed for 18-decimal tokens
- **Round floor price** to be evenly divisible by tick spacing:
  - `roundedFloorPrice = (floorPrice // tickSpacing) * tickSpacing`
  - **MUST verify**: `roundedFloorPrice % tickSpacing == 0`
- **Use the MCP tool** for supply schedule generation (provide setup instructions if not running)
- **Show educational disclaimer** before deployment steps
- **Minimize interaction rounds** - Collect as many params as reasonable per batch

### Network-Specific Constants

Store these for quick reference:

```typescript
const NETWORKS = {
  1: {
    name: 'Mainnet',
    blockTime: 12,
    rpc: 'https://ethereum-rpc.publicnode.com',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  1301: {
    name: 'Unichain',
    blockTime: 2,
    rpc: 'https://unichain-rpc.publicnode.com',
    usdc: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
  },
  8453: {
    name: 'Base',
    blockTime: 2,
    rpc: 'https://mainnet.base.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  42161: {
    name: 'Arbitrum',
    blockTime: 2,
    rpc: 'https://arb1.arbitrum.io/rpc',
    usdc: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  },
  11155111: {
    name: 'Sepolia',
    blockTime: 12,
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
};

const Q96 = 79228162514264337593543950336n;
```

## Overview

CCA (Continuous Clearing Auction) is a novel auction mechanism that generalizes the uniform-price auction into continuous time. It provides fair price discovery for bootstrapping initial liquidity while eliminating timing games and encouraging early participation.

Key features:

- **Fair price discovery**: Continuous clearing with no timing games
- **Transparent distribution**: Supply released on a predetermined schedule
- **Flexible configuration**: Customizable auction parameters and schedules
- **Multi-chain support**: Canonical deployment across EVM chains
- **Factory deployment**: Consistent addresses via CREATE2

## Quick Decision Guide

| Task...                      | Use This Section              |
| ---------------------------- | ----------------------------- |
| Configure auction parameters | Configuration Guide           |
| Generate supply schedule     | Supply Schedule Configuration |
| Deploy auction contract      | Deployment Guide              |
| Understand auction mechanics | Technical Overview            |

---

## Configuration Guide

### Auction Parameters

CCA auctions are configured through the `AuctionParameters` struct:

```solidity
struct AuctionParameters {
    address currency;              // Token to raise funds in (address(0) for ETH)
    address tokensRecipient;       // Address to receive leftover tokens
    address fundsRecipient;        // Address to receive all raised funds
    uint64 startBlock;             // Block when auction starts
    uint64 endBlock;               // Block when auction ends
    uint64 claimBlock;             // Block when tokens can be claimed
    uint256 tickSpacing;           // Fixed granularity for prices (Q96)
    address validationHook;        // Optional hook (use 0x0 if none)
    uint256 floorPrice;            // Starting floor price (Q96)
    uint128 requiredCurrencyRaised; // Minimum funds to graduate
    bytes auctionStepsData;        // Packed supply issuance schedule
}
```

### Configuration File Format

Create a JSON configuration file (e.g., `script/auction-config.json`):

```json
{
  "1": {
    "token": "0x...",
    "totalSupply": 1e29,
    "currency": "0x0000000000000000000000000000000000000000",
    "tokensRecipient": "0x...",
    "fundsRecipient": "0x...",
    "startBlock": 24321000,
    "endBlock": 24327001,
    "claimBlock": 24327001,
    "tickSpacing": 79228162514264337593543950,
    "validationHook": "0x0000000000000000000000000000000000000000",
    "floorPrice": 7922816251426433759354395000,
    "requiredCurrencyRaised": 0,
    "supplySchedule": [
      { "mps": 1000, "blockDelta": 6000 },
      { "mps": 4000000, "blockDelta": 1 }
    ]
  }
}
```

### Parameter Details

#### Basic Configuration

| Parameter         | Type    | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| `token`           | address | Token being auctioned                             |
| `totalSupply`     | number  | Total tokens to auction (wei/smallest unit)       |
| `currency`        | address | Purchase token (USDC, etc.) or address(0) for ETH |
| `tokensRecipient` | address | Where unsold tokens go                            |
| `fundsRecipient`  | address | Where raised funds go                             |

#### Block Configuration

| Parameter    | Type   | Description                | Constraint             |
| ------------ | ------ | -------------------------- | ---------------------- |
| `startBlock` | number | When auction starts        | startBlock < endBlock  |
| `endBlock`   | number | When auction ends          | endBlock <= claimBlock |
| `claimBlock` | number | When tokens can be claimed | claimBlock >= endBlock |

**Block times by network:**

- Mainnet, Sepolia: 12s per block
- Unichain, Base, Arbitrum: 2s per block

#### Pricing Parameters

| Parameter                | Type    | Description                                    |
| ------------------------ | ------- | ---------------------------------------------- |
| `floorPrice`             | number  | Minimum price (Q96 format)                     |
| `tickSpacing`            | number  | Price tick increment (Q96 format)              |
| `validationHook`         | address | Optional validation contract (use 0x0 if none) |
| `requiredCurrencyRaised` | number  | Minimum funds needed (0 if no minimum)         |

#### Supply Schedule

| Parameter        | Type  | Description                        |
| ---------------- | ----- | ---------------------------------- |
| `supplySchedule` | array | Array of {mps, blockDelta} objects |

---

## Price Calculations (Q96 Format)

CCA uses Q96 fixed-point format for precise pricing. The base value `2^96` (79228162514264337593543950336) represents a 1:1 price ratio.

### Floor Price Calculation

**CRITICAL: Account for decimal differences between token and currency.**

```python
# Base value for 1:1 ratio
Q96 = 79228162514264337593543950336

# Formula: Q96 * (human price ratio) / 10^(token_decimals - currency_decimals)

# Example 1: USDC (6 decimals) per 18-decimal token at $0.10 ratio
token_decimals = 18
currency_decimals = 6  # USDC has 6 decimals
decimal_adjustment = 10 ** (token_decimals - currency_decimals)  # 10^12

floorPrice = Q96 * 0.1 / decimal_adjustment
# Result: 7922816251426433759354395 (approximately)

# Example 2: Native ETH (18 decimals) per 18-decimal token at 0.1 ratio
token_decimals = 18
currency_decimals = 18  # Native ETH has 18 decimals
decimal_adjustment = 10 ** (18 - 18)  # 10^0 = 1

floorPrice = Q96 * 0.1 / 1
# Result: 7922816251426433759354395034
```

**Key Point:** USDC has 6 decimals on all networks, so you must divide by 10^12 when using USDC with 18-decimal tokens.

### Tick Spacing Calculation

Tick spacing governs where bids can be placed. Choose **AT LEAST 1 basis point of the floor price**. 1% or 10% is also reasonable.

```python
# Example: 1% of floor price
tickSpacing = int(floorPrice * 0.01)

# For floorPrice = 7922816251426433759354395000
# Result: 79228162514264337593543950
```

### Rounding Floor Price (CRITICAL)

**Floor price MUST be evenly divisible by tick spacing.** Round DOWN to ensure exact divisibility:

```python
# Calculate tick spacing first
tickSpacing = int(floorPrice * 0.01)  # 1% of floor price

# Round floor price DOWN to be evenly divisible
roundedFloorPrice = (floorPrice // tickSpacing) * tickSpacing

# VERIFY divisibility (must be True)
assert roundedFloorPrice % tickSpacing == 0, "Floor price must be divisible by tick spacing!"
```

**Example:**

```python
Q96 = 79228162514264337593543950336
raw_floor_price = int(Q96 * 0.0001)  # 0.0001 ETH per token
# Result: 7922816251426434139029504

tick_spacing = int(raw_floor_price * 0.01)  # 1%
# Result: 79228162514264350785536

rounded_floor_price = (raw_floor_price // tick_spacing) * tick_spacing
# Result: 7843588088912170727768064

# Verify: 7843588088912170727768064 / 79228162514264350785536 = 99 (exact)
# Remainder: 0 ✓
```

**Warning**: Setting too small of a tick spacing will make the auction extremely gas inefficient and can result in DoS attacks.

---

## Supply Schedule Configuration

### Understanding MPS (Milli-Basis Points)

Supply schedules use **MPS = 1e7** (10 million), where each unit represents one thousandth of a basis point.

The supply schedule defines the token issuance rate over time. Each step contains:

- `mps`: Tokens released per block (in mps units)
- `blockDelta`: Number of blocks this rate applies

### Standard Schedule Generator

The standard supply schedule uses an **exponential distribution** with the following properties:

- **10 segments** for the first 70% of supply
- **Block durations** grow by **1.2x** each segment (exponential growth)
- **Token distribution** follows cumulative exponential curve: `(t/T)^1.2 * 0.7`
- **Final block** receives remaining ~30% of tokens
- **Total**: Always exactly 10,000,000 MPS

Use the MCP tool `generate_supply_schedule` to generate this standard distribution:

**MCP Tool Call:**

```json
{
  "auction_blocks": 86400,
  "prebid_blocks": 0
}
```

The algorithm automatically calculates:

1. Block durations using geometric series: `b₀ * 1.2^i` for segment i
2. Token amounts using exponential curve: tokens from `(t₁/T)^1.2` to `(t₂/T)^1.2`
3. Final block adjustment to hit exactly 10,000,000 MPS total

### Example: 2-day auction on Base

Base uses 2s blocks, so 2 days = 86400 blocks.

Call `generate_supply_schedule` with:

```json
{
  "auction_blocks": 86400,
  "prebid_blocks": 0
}
```

**Output (exponential distribution):**

```json
{
  "schedule": [
    { "mps": 42, "blockDelta": 3328 },
    { "mps": 55, "blockDelta": 3994 },
    { "mps": 63, "blockDelta": 4793 },
    { "mps": 68, "blockDelta": 5751 },
    { "mps": 73, "blockDelta": 6902 },
    { "mps": 78, "blockDelta": 8282 },
    { "mps": 82, "blockDelta": 9938 },
    { "mps": 87, "blockDelta": 11926 },
    { "mps": 91, "blockDelta": 14311 },
    { "mps": 95, "blockDelta": 17174 },
    { "mps": 3011376, "blockDelta": 1 }
  ],
  "auction_blocks": 86400,
  "prebid_blocks": 0,
  "total_phases": 11,
  "summary": {
    "total_mps": 10000000,
    "target_mps": 10000000,
    "final_block_mps": 3011376,
    "final_block_percentage": 30.11,
    "num_segments": 10,
    "growth_exponent": 1.2
  }
}
```

**Notice:**

- Block durations grow by exactly 1.2x: 3328 → 3994 → 4793 → ...
- MPS increases gradually following the exponential curve
- Final block contains 30.11% of all tokens
- Total is exactly 10,000,000 MPS

### Example: With prebid period

Add a prebid period where no tokens are released (mps=0). The prebid is prepended to the schedule and does NOT affect the exponential distribution calculation.

Call `generate_supply_schedule` with:

```json
{
  "auction_blocks": 86400,
  "prebid_blocks": 43200
}
```

**Output:**

```json
{
  "schedule": [
    { "mps": 0, "blockDelta": 43200 },
    { "mps": 42, "blockDelta": 3328 },
    { "mps": 55, "blockDelta": 3994 },
    ...
    { "mps": 3011376, "blockDelta": 1 }
  ],
  "auction_blocks": 86400,
  "prebid_blocks": 43200,
  "total_phases": 12,
  "summary": {
    "total_mps": 10000000,
    "target_mps": 10000000,
    "final_block_mps": 3011376,
    "final_block_percentage": 30.11,
    "num_segments": 10,
    "growth_exponent": 1.2
  }
}
```

**Notice:** The prebid phase is simply prepended with `mps: 0`. The auction portion still uses the same exponential distribution.

### Custom Schedule

For custom distribution, manually define the schedule:

```json
{
  "supplySchedule": [
    { "mps": 100, "blockDelta": 5000 },
    { "mps": 200, "blockDelta": 5000 },
    { "mps": 500, "blockDelta": 4400 }
  ]
}
```

**Important**: The last block should sell a significant amount of tokens (typically 30%+) to prevent price manipulation.

---

## ⚠️ Educational Use Disclaimer

**IMPORTANT: Before proceeding with configuration or deployment, you must acknowledge:**

This tool and all generated configurations are provided **for educational purposes only**. AI-generated content may contain errors, inaccuracies, or suboptimal settings.

**You must:**

1. ✅ **Review all generated configurations carefully** before using them
2. ✅ **Verify all parameters** (addresses, pricing, schedules) are correct for your use case
3. ✅ **Test on testnets first** before deploying to mainnet
4. ✅ **Audit your contracts** before deploying with real funds

**Use AskUserQuestion to confirm the user acknowledges these warnings before proceeding with deployment steps.**

---

## Getting Current Block Number

Use public RPCs to fetch current block for `startBlock` configuration:

### Available Public RPCs

| Network  | RPC URL                                       |
| -------- | --------------------------------------------- |
| Mainnet  | <https://ethereum-rpc.publicnode.com>         |
| Unichain | <https://unichain-rpc.publicnode.com>         |
| Base     | <https://mainnet.base.org>                    |
| Arbitrum | <https://arb1.arbitrum.io/rpc>                |
| Sepolia  | <https://ethereum-sepolia-rpc.publicnode.com> |

### Fetch Block Number

```bash
curl -X POST "https://mainnet.base.org" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x123abc"
}
```

Convert hex to decimal for block number.

---

## Deployment Guide

### ⚠️ Pre-Deployment Acknowledgment Required

**STOP: Before proceeding with deployment, you must confirm:**

This deployment guide is provided **for educational purposes only**. AI-generated deployment instructions may contain errors or security vulnerabilities.

**Required Acknowledgments:**

- [ ] I understand this is educational content and may contain errors
- [ ] I understand that AI-generated parameters may contain errors that may result in loss of funds

**Use AskUserQuestion to have the user explicitly confirm they acknowledge these risks and accept responsibility before providing deployment commands.**

**If the user does not acknowledge, stop and do not provide deployment instructions.**

---

### Factory Deployment

CCA instances are deployed via the `ContinuousClearingAuctionFactory` contract, which uses CREATE2 for consistent addresses across chains.

#### Factory Addresses

| Version | Address                                      | Status          |
| ------- | -------------------------------------------- | --------------- |
| v1.1.0  | `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` | **Recommended** |

### Deploying an Auction Instance

#### Step 1: Prepare Configuration

Create your configuration file (see [Configuration Guide](#configuration-guide)).

#### Step 2: Deploy via Factory

The factory has a simple interface:

```solidity
function initializeDistribution(
    address token,
    uint256 amount,
    bytes calldata configData,
    bytes32 salt
) external returns (IDistributionContract);
```

Where:

- `token`: Address of the token to be sold
- `amount`: Amount of tokens to sell in the auction
- `configData`: ABI-encoded `AuctionParameters` struct
- `salt`: Optional bytes32 value for vanity address mining

#### Step 3: Using Foundry Script

```bash
# Deploy factory (if needed)
forge script script/deploy/DeployContinuousAuctionFactory.s.sol:DeployContinuousAuctionFactoryScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY

# Deploy auction instance
forge script script/Example.s.sol:ExampleScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

#### Step 4: Post-Deployment

After deployment, you **must** call `onTokensReceived()` to notify the auction that tokens have been transferred:

```bash
cast send $AUCTION_ADDRESS "onTokensReceived()" --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

This is a required prerequisite before the auction can accept bids.

### Alternative: Deploy via Constructor

You can also deploy directly via the constructor:

```solidity
constructor(
    address token,
    uint128 amount,
    AuctionParameters memory parameters
) {}
```

This approach doesn't require a salt parameter but won't benefit from CREATE2's deterministic addressing.

### Verification on Block Explorers

Generate standard JSON input for verification:

```bash
forge verify-contract $AUCTION_ADDRESS \
  src/ContinuousClearingAuction.sol:ContinuousClearingAuction \
  --rpc-url $RPC_URL \
  --show-standard-json-input > standard-json-input.json
```

Upload this file to block explorers for verification.

---

## Validation Rules

Before deployment, ensure:

1. **Block constraints**: `startBlock < endBlock <= claimBlock`
2. **Valid addresses**: All addresses are valid Ethereum addresses (0x + 40 hex chars)
3. **Non-negative values**: All numeric values >= 0
4. **Floor price alignment**: Floor price must be a multiple of tick spacing
5. **Tick spacing**: At least 1 basis point of floor price (1%, 10% recommended)
6. **Supply schedule**: Last block sells significant tokens (~30%+)
7. **Total supply bounds**: Max 1e30 wei (1 trillion 18-decimal tokens)
8. **No FoT tokens**: Fee-on-transfer tokens not supported
9. **Minimum decimals**: Do not use tokens with < 6 decimals

---

## Technical Overview

### Q96 Fixed-Point Math

The auction uses Q96 fixed-point arithmetic:

```solidity
library FixedPoint96 {
    uint8 internal constant RESOLUTION = 96;
    uint256 internal constant Q96 = 0x1000000000000000000000000; // 2^96
}
```

- **Price**: Q96 fixed-point number for fractional price ratios
- **Demand**: Currency amounts scaled by Q96

### Auction Steps (Supply Issuance)

Steps are packed into bytes, where each step is a `uint64`:

- First 24 bits: `mps` (per-block issuance rate in MPS)
- Last 40 bits: `blockDelta` (number of blocks)

```solidity
function parse(bytes8 data) internal pure returns (uint24 mps, uint40 blockDelta) {
    mps = uint24(bytes3(data));
    blockDelta = uint40(uint64(data));
}
```

The data is deployed to an external SSTORE2 contract for cheaper reads.

### Key Contract Functions

#### submitBid()

Users submit bids with:

- `maxPrice`: Maximum price willing to pay (Q96)
- `amount`: Currency amount to bid
- `owner`: Address to receive tokens/refunds
- `prevTickPrice`: Hint for gas optimization
- `hookData`: Optional data for validation hooks

#### checkpoint()

Auction is checkpointed once per block with a new bid. Checkpoints determine token allocations.

#### exitBid() / exitPartiallyFilledBid()

Bids can be exited when outbid or when auction ends (only after graduation).

#### isGraduated()

Returns true if `currencyRaised >= requiredCurrencyRaised`. No bids can exit before graduation.

#### claimTokens()

Users claim purchased tokens after `claimBlock` (only for graduated auctions).

#### sweepCurrency() / sweepUnsoldTokens()

After auction ends:

- `sweepCurrency()`: Withdraw raised currency (graduated only)
- `sweepUnsoldTokens()`: Withdraw unsold tokens

---

## Supported Chains

CCA is deployed to canonical addresses across select EVM chains:

| Chain ID | Network  | Block Time |
| -------- | -------- | ---------- |
| 1        | Mainnet  | 12s        |
| 1301     | Unichain | 2s         |
| 8453     | Base     | 2s         |
| 42161    | Arbitrum | 2s         |
| 11155111 | Sepolia  | 12s        |

---

## Troubleshooting

### Common Issues

| Issue                     | Solution                                            |
| ------------------------- | --------------------------------------------------- |
| "Invalid block sequence"  | Ensure startBlock < endBlock <= claimBlock          |
| "Floor price not aligned" | Round floor price to multiple of tick spacing       |
| "Tick spacing too small"  | Use at least 1% of floor price                      |
| "Total supply too large"  | Max 1e30 wei (1 trillion 18-decimal tokens)         |
| "Gas inefficiency"        | Increase tick spacing                               |
| "Invalid address"         | Verify addresses are 42 characters starting with 0x |

### Validation Checklist

Before deployment:

- [ ] Block sequence is valid (start < end <= claim)
- [ ] Floor price is multiple of tick spacing
- [ ] Tick spacing >= 1% of floor price
- [ ] All addresses are valid Ethereum addresses
- [ ] Total supply <= 1e30 wei
- [ ] Currency is more valuable than token
- [ ] Block times match network (12s mainnet, 2s L2s)
- [ ] Recipients addresses are set (not placeholders)
- [ ] Currency address is correct for network
- [ ] Last supply step sells ~30%+ of tokens
- [ ] No fee-on-transfer tokens used
- [ ] Token decimals >= 6
- [ ] `onTokensReceived()` called post-deployment

---

## Additional Resources

- **CCA Repository**: <https://github.com/Uniswap/continuous-clearing-auction>
- **Technical Documentation**: See `docs/TechnicalDocumentation.md` in repo
- **Deployment Guide**: See `docs/DeploymentGuide.md` in repo
- **Whitepaper**: See `docs/assets/whitepaper.pdf` in repo
- **Audits**: See `docs/audits/README.md` in repo
- **Uniswap Docs**: <https://docs.uniswap.org/contracts/liquidity-launchpad/CCA>
- **Bug Bounty**: <https://cantina.xyz/code/f9df94db-c7b1-434b-bb06-d1360abdd1be/overview>

---

## Interactive Configuration

For an interactive bulk form configuration experience, use the `configure-auction` skill which collects all parameters in efficient batches (up to 4 questions at once) and generates the JSON configuration file automatically.
