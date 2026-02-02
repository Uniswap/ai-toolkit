---
description: Integrate Uniswap swaps into applications. Use when user says "integrate swaps", "uniswap", "trading api", "add swap functionality", "build a swap frontend", "create a swap script", "smart contract swap integration", "use Universal Router", "Trading API", or mentions swapping tokens via Uniswap.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), Bash(npx:*), Bash(yarn:*), Bash(curl:*), WebFetch, Task(subagent_type:swap-integration-expert)
model: opus
---

# Swap Integration

Integrate Uniswap swaps into frontends, backends, and smart contracts.

## Prerequisites

This skill assumes familiarity with viem basics. If you're new to viem, see the [viem Integration Skill](../viem-integration/viem-integration.md) for:

- Setting up PublicClient and WalletClient
- Account and key management
- Basic contract interactions
- Transaction signing and sending

## Quick Decision Guide

| Building...                    | Use This Method               |
| ------------------------------ | ----------------------------- |
| Frontend with React/Next.js    | Trading API                   |
| Backend script or bot          | Trading API                   |
| Smart contract integration     | Universal Router direct calls |
| Need full control over routing | Universal Router SDK          |

## Integration Methods

### 1. Trading API (Recommended)

Best for: Frontends, backends, scripts. Handles routing optimization automatically.

**Base URL**: `https://trade.api.uniswap.org/v1`

**Authentication**: `x-api-key: <your-api-key>` header required

**3-Step Flow**:

```text
1. POST /check_approval  -> Check if token is approved
2. POST /quote           -> Get executable quote with routing
3. POST /swap            -> Get transaction to sign and submit
```

See [Trading API Reference](./trading-api.md) for complete documentation.

### 2. Universal Router SDK

Best for: Direct control over transaction construction.

**Installation**:

```bash
npm install @uniswap/universal-router-sdk @uniswap/sdk-core @uniswap/v3-sdk
```

**Key Pattern**:

```typescript
import { SwapRouter } from '@uniswap/universal-router-sdk';

const { calldata, value } = SwapRouter.swapCallParameters(trade, options);
```

See [Universal Router Reference](./universal-router.md) for complete documentation.

### 3. Smart Contract Integration

Best for: On-chain integrations, DeFi composability.

**Interface**: Call `execute()` on Universal Router with encoded commands.

See [Universal Router Reference](./universal-router.md) for command encoding.

---

## Trading API Reference

### Step 1: Check Token Approval

```bash
POST /check_approval
```

**Request**:

```json
{
  "walletAddress": "0x...",
  "token": "0x...",
  "amount": "1000000000",
  "chainId": 1
}
```

**Response**:

```json
{
  "approval": {
    "to": "0x...",
    "from": "0x...",
    "data": "0x...",
    "value": "0",
    "chainId": 1
  }
}
```

If `approval` is `null`, token is already approved.

### Step 2: Get Quote

```bash
POST /quote
```

**Request**:

```json
{
  "swapper": "0x...",
  "tokenIn": "0x...",
  "tokenOut": "0x...",
  "tokenInChainId": 1,
  "tokenOutChainId": 1,
  "amount": "1000000000000000000",
  "type": "EXACT_INPUT",
  "slippageTolerance": 0.5
}
```

**Key Parameters**:

| Parameter           | Description                        |
| ------------------- | ---------------------------------- |
| `type`              | `EXACT_INPUT` or `EXACT_OUTPUT`    |
| `slippageTolerance` | 0-100 percentage                   |
| `protocols`         | Optional: `["V2", "V3", "V4"]`     |
| `routingPreference` | `BEST_PRICE`, `FASTEST`, `CLASSIC` |

**Response**:

```json
{
  "routing": "CLASSIC",
  "quote": {
    "input": { "token": "0x...", "amount": "1000000000000000000" },
    "output": { "token": "0x...", "amount": "999000000" },
    "slippage": 0.5,
    "route": [...],
    "gasFee": "5000000000000000"
  },
  "permitData": {...}
}
```

### Step 3: Execute Swap

```bash
POST /swap
```

**Request**:

```json
{
  "quote": {
    /* full quote object from step 2 */
  },
  "signature": "0x...",
  "deadline": 1704067200
}
```

**Response** (ready-to-sign transaction):

```json
{
  "swap": {
    "to": "0x...",
    "from": "0x...",
    "data": "0x...",
    "value": "0",
    "chainId": 1,
    "gasLimit": "250000"
  }
}
```

### Supported Chains

| ID  | Chain    | ID    | Chain    |
| --- | -------- | ----- | -------- |
| 1   | Mainnet  | 8453  | Base     |
| 130 | Unichain | 42161 | Arbitrum |
| 137 | Polygon  | 81457 | Blast    |
| 56  | BNB      |       |          |

### Swap Types

| Value | Type     | Description         |
| ----- | -------- | ------------------- |
| 0     | CLASSIC  | Standard AMM swap   |
| 2     | DUTCH_V2 | Dutch auction order |
| 4     | WRAP     | ETH to WETH         |
| 5     | UNWRAP   | WETH to ETH         |
| 6     | BRIDGE   | Cross-chain bridge  |

---

## Universal Router Reference

The Universal Router is a unified interface for swapping across Uniswap V2, V3, and V4.

### Core Function

```solidity
function execute(
    bytes calldata commands,
    bytes[] calldata inputs,
    uint256 deadline
) external payable;
```

### Command Encoding

Each command is a single byte:

| Bits | Name     | Purpose                             |
| ---- | -------- | ----------------------------------- |
| 0    | flag     | Allow revert (1 = continue on fail) |
| 1-2  | reserved | Use 0                               |
| 3-7  | command  | Operation identifier                |

### Swap Commands

| Code | Command           | Description               |
| ---- | ----------------- | ------------------------- |
| 0x00 | V3_SWAP_EXACT_IN  | V3 swap with exact input  |
| 0x01 | V3_SWAP_EXACT_OUT | V3 swap with exact output |
| 0x08 | V2_SWAP_EXACT_IN  | V2 swap with exact input  |
| 0x09 | V2_SWAP_EXACT_OUT | V2 swap with exact output |
| 0x10 | V4_SWAP           | V4 swap                   |

### Token Operations

| Code | Command     | Description                |
| ---- | ----------- | -------------------------- |
| 0x04 | SWEEP       | Clear router token balance |
| 0x05 | TRANSFER    | Send specific amount       |
| 0x0b | WRAP_ETH    | ETH to WETH                |
| 0x0c | UNWRAP_WETH | WETH to ETH                |

### Permit2 Commands

| Code | Command               | Description           |
| ---- | --------------------- | --------------------- |
| 0x02 | PERMIT2_TRANSFER_FROM | Single token transfer |
| 0x03 | PERMIT2_PERMIT_BATCH  | Batch approval        |
| 0x0a | PERMIT2_PERMIT        | Single approval       |

### SDK Usage

```typescript
import { SwapRouter, UniswapTrade } from '@uniswap/universal-router-sdk'
import { TradeType } from '@uniswap/sdk-core'

// Build trade using v3-sdk or router-sdk
const trade = new RouterTrade({
  v3Routes: [...],
  tradeType: TradeType.EXACT_INPUT
})

// Get calldata for Universal Router
const { calldata, value } = SwapRouter.swapCallParameters(trade, {
  slippageTolerance: new Percent(50, 10000), // 0.5%
  recipient: walletAddress,
  deadline: Math.floor(Date.now() / 1000) + 1200 // 20 min
})

// Send transaction
const tx = await wallet.sendTransaction({
  to: UNIVERSAL_ROUTER_ADDRESS,
  data: calldata,
  value
})
```

---

## Permit2 Integration

Permit2 enables signature-based token approvals instead of on-chain approve() calls.

### How It Works

1. User approves Permit2 contract once (infinite approval)
2. For each swap, user signs a message authorizing the transfer
3. Universal Router uses signature to transfer tokens via Permit2

### Two Modes

| Mode              | Description                                |
| ----------------- | ------------------------------------------ |
| SignatureTransfer | One-time signature, no on-chain state      |
| AllowanceTransfer | Time-limited allowance with on-chain state |

### Integration Pattern

```typescript
// Check if Permit2 approval exists
const allowance = await permit2Contract.allowance(
  userAddress,
  tokenAddress,
  spenderAddress
)

// If not approved, user must approve Permit2 first
if (allowance.amount < requiredAmount) {
  await token.approve(PERMIT2_ADDRESS, ethers.MaxUint256)
}

// Then sign permit for the swap
const permitSignature = await signPermit(...)
```

---

## Direct Universal Router Integration (SDK)

For direct Universal Router integration without the Trading API, use the SDK's high-level API.

### Installation

```bash
npm install @uniswap/universal-router-sdk @uniswap/router-sdk @uniswap/sdk-core @uniswap/v3-sdk viem
```

### High-Level Approach (Recommended)

Use `RouterTrade` + `SwapRouter.swapCallParameters()` for automatic command building:

```typescript
import { SwapRouter } from '@uniswap/universal-router-sdk';
import { Trade as RouterTrade } from '@uniswap/router-sdk';
import { TradeType, Percent } from '@uniswap/sdk-core';
import { Route as V3Route, Pool } from '@uniswap/v3-sdk';

// 1. Build route and trade (you need pool data from on-chain or subgraph)
const route = new V3Route([pool], tokenIn, tokenOut);
const trade = RouterTrade.createUncheckedTrade({
  route,
  inputAmount: amountIn,
  outputAmount: expectedOut,
  tradeType: TradeType.EXACT_INPUT,
});

// 2. Get calldata
const { calldata, value } = SwapRouter.swapCallParameters(trade, {
  slippageTolerance: new Percent(50, 10000), // 0.5%
  recipient: walletAddress,
  deadline: Math.floor(Date.now() / 1000) + 1800,
});

// 3. Execute with viem
const hash = await walletClient.sendTransaction({
  to: UNIVERSAL_ROUTER_ADDRESS,
  data: calldata,
  value: BigInt(value),
});
```

### Low-Level Approach (Manual Commands)

For custom flows (fee collection, complex routing), use `RoutePlanner` directly:

```typescript
import { RoutePlanner, CommandType, ROUTER_AS_RECIPIENT } from '@uniswap/universal-router-sdk';
import { encodeRouteToPath } from '@uniswap/v3-sdk';

// Special addresses
const MSG_SENDER = '0x0000000000000000000000000000000000000001';
const ADDRESS_THIS = '0x0000000000000000000000000000000000000002';
```

### Example: V3 Swap with Manual Commands

```typescript
import { RoutePlanner, CommandType } from '@uniswap/universal-router-sdk';
import { encodeRouteToPath, Route } from '@uniswap/v3-sdk';

async function swapV3Manual(route: Route, amountIn: bigint, amountOutMin: bigint) {
  const planner = new RoutePlanner();

  // Encode V3 path from route
  const path = encodeRouteToPath(route, false); // false = exactInput

  planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
    MSG_SENDER, // recipient
    amountIn, // amountIn
    amountOutMin, // amountOutMin
    path, // encoded path
    true, // payerIsUser
  ]);

  return executeRoute(planner);
}
```

### Example: ETH to Token (Wrap + Swap)

```typescript
async function swapEthToToken(route: Route, amountIn: bigint, amountOutMin: bigint) {
  const planner = new RoutePlanner();
  const path = encodeRouteToPath(route, false);

  // 1. Wrap ETH to WETH (keep in router)
  planner.addCommand(CommandType.WRAP_ETH, [ADDRESS_THIS, amountIn]);

  // 2. Swap WETH → Token (payerIsUser = false since using router's WETH)
  planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
    MSG_SENDER,
    amountIn,
    amountOutMin,
    path,
    false,
  ]);

  return executeRoute(planner, { value: amountIn });
}
```

### Example: Token to ETH (Swap + Unwrap)

```typescript
async function swapTokenToEth(route: Route, amountIn: bigint, amountOutMin: bigint) {
  const planner = new RoutePlanner();
  const path = encodeRouteToPath(route, false);

  // 1. Swap Token → WETH (output to router)
  planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
    ADDRESS_THIS,
    amountIn,
    amountOutMin,
    path,
    true,
  ]);

  // 2. Unwrap WETH to ETH
  planner.addCommand(CommandType.UNWRAP_WETH, [MSG_SENDER, amountOutMin]);

  return executeRoute(planner);
}
```

### Example: Fee Collection with PAY_PORTION

```typescript
async function swapWithFee(route: Route, amountIn: bigint, feeRecipient: Address, feeBips: number) {
  const planner = new RoutePlanner();
  const path = encodeRouteToPath(route, false);
  const outputToken = route.output.wrapped.address;

  // Swap to router (ADDRESS_THIS)
  planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [ADDRESS_THIS, amountIn, 0n, path, true]);

  // Pay fee portion (e.g., 30 bips = 0.3%)
  planner.addCommand(CommandType.PAY_PORTION, [outputToken, feeRecipient, feeBips]);

  // Sweep remainder to user
  planner.addCommand(CommandType.SWEEP, [outputToken, MSG_SENDER, 0n]);

  return executeRoute(planner);
}
```

### Execute Route Helper

```typescript
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk';

const ROUTER_ABI = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

async function executeRoute(planner: RoutePlanner, options?: { value?: bigint }) {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
  const routerAddress = UNIVERSAL_ROUTER_ADDRESS(1); // chainId 1 = mainnet

  const { request } = await publicClient.simulateContract({
    address: routerAddress,
    abi: ROUTER_ABI,
    functionName: 'execute',
    args: [planner.commands, planner.inputs, deadline],
    account,
    value: options?.value ?? 0n,
  });

  return walletClient.writeContract(request);
}
```

### Command Cheat Sheet

| Command           | Parameters                                               |
| ----------------- | -------------------------------------------------------- |
| V3_SWAP_EXACT_IN  | (recipient, amountIn, amountOutMin, path, payerIsUser)   |
| V3_SWAP_EXACT_OUT | (recipient, amountOut, amountInMax, path, payerIsUser)   |
| V2_SWAP_EXACT_IN  | (recipient, amountIn, amountOutMin, path[], payerIsUser) |
| V2_SWAP_EXACT_OUT | (recipient, amountOut, amountInMax, path[], payerIsUser) |
| WRAP_ETH          | (recipient, amount)                                      |
| UNWRAP_WETH       | (recipient, amountMin)                                   |
| SWEEP             | (token, recipient, amountMin)                            |
| TRANSFER          | (token, recipient, amount)                               |
| PAY_PORTION       | (token, recipient, bips)                                 |

### Fee Tiers

| Tier   | Value | Percentage |
| ------ | ----- | ---------- |
| LOWEST | 100   | 0.01%      |
| LOW    | 500   | 0.05%      |
| MEDIUM | 3000  | 0.30%      |
| HIGH   | 10000 | 1.00%      |

---

## Common Integration Patterns

### Frontend Swap Hook (React)

```typescript
function useSwap() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  const getQuote = async (params) => {
    setLoading(true);
    const response = await fetch('https://trade.api.uniswap.org/v1/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    setQuote(data.quote);
    setLoading(false);
  };

  const executeSwap = async () => {
    // Get swap transaction
    const swapResponse = await fetch('https://trade.api.uniswap.org/v1/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        quote,
        deadline: Math.floor(Date.now() / 1000) + 1200,
      }),
    });
    const { swap } = await swapResponse.json();

    // Send transaction via wallet
    const tx = await signer.sendTransaction(swap);
    return tx;
  };

  return { quote, loading, getQuote, executeSwap };
}
```

### Backend Swap Script (Node.js)

```typescript
import { ethers } from 'ethers';

const API_URL = 'https://trade.api.uniswap.org/v1';
const API_KEY = process.env.UNISWAP_API_KEY;

async function executeSwap(
  wallet: ethers.Wallet,
  tokenIn: string,
  tokenOut: string,
  amount: string,
  chainId: number
) {
  // 1. Check approval
  const approvalRes = await fetch(`${API_URL}/check_approval`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: wallet.address,
      token: tokenIn,
      amount,
      chainId,
    }),
  });
  const { approval } = await approvalRes.json();

  if (approval) {
    const approveTx = await wallet.sendTransaction(approval);
    await approveTx.wait();
  }

  // 2. Get quote
  const quoteRes = await fetch(`${API_URL}/quote`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      swapper: wallet.address,
      tokenIn,
      tokenOut,
      tokenInChainId: chainId,
      tokenOutChainId: chainId,
      amount,
      type: 'EXACT_INPUT',
      slippageTolerance: 0.5,
    }),
  });
  const { quote } = await quoteRes.json();

  // 3. Execute swap
  const swapRes = await fetch(`${API_URL}/swap`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quote,
      deadline: Math.floor(Date.now() / 1000) + 1200,
    }),
  });
  const { swap } = await swapRes.json();

  const tx = await wallet.sendTransaction(swap);
  return tx.wait();
}
```

### Smart Contract Integration (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniversalRouter {
    function execute(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable;
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract SwapIntegration {
    IUniversalRouter public immutable router;
    address public constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    constructor(address _router) {
        router = IUniversalRouter(_router);
    }

    function swap(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable {
        router.execute{value: msg.value}(commands, inputs, deadline);
    }

    // Approve token for Permit2 (one-time setup)
    function approveToken(address token) external {
        IERC20(token).approve(PERMIT2, type(uint256).max);
    }
}
```

---

## Key Contract Addresses

### Universal Router

| Chain      | Address                                      |
| ---------- | -------------------------------------------- |
| All chains | `0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD` |

### Permit2

| Chain      | Address                                      |
| ---------- | -------------------------------------------- |
| All chains | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

---

## Troubleshooting

### Common Issues

| Issue                    | Solution                                          |
| ------------------------ | ------------------------------------------------- |
| "Insufficient allowance" | Call /check_approval first and submit approval tx |
| "Quote expired"          | Increase deadline or re-fetch quote               |
| "Slippage exceeded"      | Increase slippageTolerance or retry               |
| "Insufficient liquidity" | Try smaller amount or different route             |

### API Error Codes

| Code | Meaning                    |
| ---- | -------------------------- |
| 401  | Invalid or missing API key |
| 400  | Invalid request parameters |
| 404  | No route found for pair    |
| 429  | Rate limit exceeded        |

---

## Additional Resources

- [Universal Router GitHub](https://github.com/Uniswap/universal-router)
- [Uniswap Docs](https://docs.uniswap.org)
- [SDK Monorepo](https://github.com/Uniswap/sdks)
- [Permit2 Patterns](https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/permit2)
