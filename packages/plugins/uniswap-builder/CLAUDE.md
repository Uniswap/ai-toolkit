# CLAUDE.md - uniswap-builder

## Overview

This plugin provides skills for building on top of and integrating the Uniswap protocol and EVM blockchains. It helps developers quickly implement blockchain interactions, swap functionality, and DeFi integrations in frontends, backends, and smart contracts.

## Plugin Components

### Skills (./skills/)

- **viem-integration**: Foundational skill for EVM blockchain integration using viem. Covers client setup, reading/writing data, accounts, contract interactions, and wagmi React hooks.

- **swap-integration**: Comprehensive guide for integrating Uniswap swaps via Trading API, Universal Router, or SDKs. Supports building custom swap frontends, backend scripts, and smart contract integrations.

- **cca-integration**: Configure and deploy CCA (Continuous Clearing Auction) smart contracts for token auctions. Covers auction parameter configuration, Q96 price calculations, supply schedule generation, and Factory deployment patterns.

### Agents (./agents/)

- **viem-integration-expert**: Expert agent for complex viem and wagmi integration questions, debugging, and best practices

- **swap-integration-expert**: Specialized agent for complex swap integration questions

### MCP Servers (./.mcp.json)

| Server                  | Description                                         | Type  |
| ----------------------- | --------------------------------------------------- | ----- |
| **cca-supply-schedule** | Generate supply schedules for CCA auction contracts | stdio |

## File Structure

```text
uniswap-builder/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── viem-integration/
│   │   ├── viem-integration.md       # Main skill file
│   │   ├── SKILL.md -> viem-integration.md
│   │   ├── clients-and-transports.md # Client setup, chains, RPC
│   │   ├── reading-data.md           # readContract, getLogs, events
│   │   ├── writing-transactions.md   # sendTransaction, writeContract
│   │   ├── accounts-and-keys.md      # Private keys, HD wallets
│   │   ├── contract-patterns.md      # ABI, multicall, encoding
│   │   └── wagmi-react.md            # React hooks reference
│   ├── swap-integration/
│   │   ├── swap-integration.md       # Main skill file
│   │   └── SKILL.md -> swap-integration.md
│   └── cca-integration/
│       ├── cca-integration.md        # Main skill file
│       └── SKILL.md -> cca-integration.md
├── agents/
│   ├── viem-integration-expert.md
│   └── swap-integration-expert.md
├── mcp-server/
│   └── supply-schedule/
│       ├── server.py              # CCA supply schedule MCP server
│       ├── requirements.txt       # Python dependencies
│       ├── setup.sh               # Setup script
│       └── README.md
├── .mcp.json
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```

## Skill Relationship

The skills are designed to be used together:

```text
viem-integration (foundation)
        ↓
   ┌────┴────┐
   │         │
swap-integration  cca-integration
```

**viem-integration** provides core blockchain knowledge that both **swap-integration** and **cca-integration** assume.

## viem Integration Skill

### Topics Covered

| Reference File            | Topics                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------- |
| clients-and-transports.md | PublicClient, WalletClient, http/webSocket/custom transports, chain configuration  |
| reading-data.md           | getBalance, readContract, getLogs, watchContractEvent, getTransaction              |
| writing-transactions.md   | sendTransaction, writeContract, simulateContract, gas estimation, nonce management |
| accounts-and-keys.md      | privateKeyToAccount, mnemonicToAccount, HD wallets, message signing                |
| contract-patterns.md      | ABI formats, getContract, multicall, encodeFunctionData, decodeEventLog            |
| wagmi-react.md            | useAccount, useConnect, useReadContract, useWriteContract, useSwitchChain          |

### Supported Chains

All EVM-compatible chains including: Ethereum, Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche, Blast, zkSync, Linea, Scroll, and more.

## Swap Integration Skill

### Integration Methods

1. **Trading API** (Recommended for most use cases)

   - REST API at `https://trade.api.uniswap.org/v1`
   - Handles routing optimization automatically
   - 3-step flow: check_approval -> quote -> swap

2. **Universal Router SDK**

   - Direct SDK usage with `@uniswap/universal-router-sdk`
   - Full control over transaction construction
   - Command-based architecture

3. **Direct Smart Contract Integration**
   - Solidity contracts calling Universal Router
   - For on-chain integrations and DeFi composability

### Supported Chains

Mainnet (1), Unichain (130), Base (8453), Arbitrum (42161), Polygon (137), BNB (56), Blast (81457)

## Key References

### viem/wagmi

- viem Documentation: <https://viem.sh>
- wagmi Documentation: <https://wagmi.sh>
- Package: `viem`, `wagmi`, `@tanstack/react-query`

### Uniswap

- Trading API: `https://trade.api.uniswap.org/v1`
- Universal Router: `github.com/Uniswap/universal-router`
- SDKs: `@uniswap/universal-router-sdk`, `@uniswap/v3-sdk`, `@uniswap/sdk-core`
- Permit2: Token approval infrastructure

## CCA Configuration & Deployment Skill

### What It Does

The CCA skill helps configure and deploy Continuous Clearing Auction contracts through an **interactive bulk form prompting flow**:

1. **Interactive Configuration**: Bulk form prompts (up to 4 questions at once) to efficiently collect all auction parameters
2. **Smart Defaults**: Network-specific defaults for common options (USDC addresses, block times, etc.)
3. **Direct Input**: Efficient prompting that allows direct value entry instead of multi-step confirmations
4. **Q96 Price Calculations**: Automatic conversion of price ratios to Q96 format with validation
5. **Supply Schedule Generation**: Standard exponential distribution using MCP tool
6. **Factory Deployment**: Deploy auctions via `ContinuousClearingAuctionFactory` using CREATE2

### Key Features

- **5-Batch Configuration Flow**: Efficient collection in batches (Task Selection → Basic Config → Timing & Pricing → Recipients & Launch → Optional Hook)
- **Batch Validation**: Input validation after each batch of questions
- **Q96 Price Format**: Fixed-point arithmetic for precise pricing (2^96 base value)
- **Supply Schedule**: Standard distribution with ~30% in final block
- **Multi-chain Support**: Canonical factory addresses on Mainnet, Unichain, Base, Arbitrum, Sepolia
- **Live Block Data**: Fetches current block numbers from public RPCs
- **Configuration Export**: Generates JSON config file ready for Foundry deployment
- **Validation Checklist**: Pre-deployment validation rules

### Configuration File Format

JSON configuration with auction parameters:

- Basic: token, totalSupply, currency, recipients
- Blocks: startBlock, endBlock, claimBlock
- Pricing: floorPrice, tickSpacing (Q96)
- Schedule: supplySchedule array with {mps, blockDelta}

### MCP Tool: generate_supply_schedule

The plugin includes an MCP server that provides the `generate_supply_schedule` tool:

**Input:**

- `auction_blocks`: Total blocks for auction (required)
- `prebid_blocks`: Prebid period blocks (optional, default: 0)

**Output:**

- `schedule`: Array of {mps, blockDelta} objects
- `summary`: Total MPS, target, final block percentage

### Factory Addresses

- v1.1.0 (recommended): `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5`

### Public RPCs

Available for block number queries:

- Mainnet: `https://ethereum-rpc.publicnode.com`
- Unichain: `https://unichain-rpc.publicnode.com`
- Base: `https://mainnet.base.org`
- Arbitrum: `https://arb1.arbitrum.io/rpc`
- Sepolia: `https://ethereum-sepolia-rpc.publicnode.com`

### Interactive Configuration Flow

The skill provides a **bulk form prompting experience** with these improvements:

- **Efficient Collection**: Up to 4 questions per batch, minimizing interaction rounds
- **Direct Input**: Direct custom value entry via "Other" option (no "Do you have X?" confirmations)
- **Smart Defaults**: Network-specific addresses (USDC, USDT) and timing options
- **Batch Validation**: Input validation after each batch of questions
- **Context Preservation**: All answers stored and available for final config generation

### Important Notes

- This skill focuses on **configuration and deployment only**
- Does not cover frontend/backend integration or bidding logic
- Educational disclaimers required before deployment steps
