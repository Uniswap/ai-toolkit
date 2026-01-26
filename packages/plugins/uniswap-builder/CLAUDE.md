# CLAUDE.md - uniswap-builder

## Overview

This plugin provides skills for building on top of and integrating the Uniswap protocol and EVM blockchains. It helps developers quickly implement blockchain interactions, swap functionality, liquidity provisioning, and DeFi integrations in frontends, backends, and smart contracts.

## Plugin Components

### Skills (./skills/)

- **viem-integration**: Foundational skill for EVM blockchain integration using viem. Covers client setup, reading/writing data, accounts, contract interactions, and wagmi React hooks.

- **swap-integration**: Comprehensive guide for integrating Uniswap swaps via Trading API, Universal Router, or SDKs. Supports building custom swap frontends, backend scripts, and smart contract integrations.

- **lp-integration**: Complete guide for integrating Uniswap liquidity provisioning via Trading API, Position Manager SDKs, or direct contract calls. Supports creating pools, managing positions, collecting fees, and V3 to V4 migration.

### Agents (./agents/)

- **viem-integration-expert**: Expert agent for complex viem and wagmi integration questions, debugging, and best practices

- **swap-integration-expert**: Specialized agent for complex swap integration questions

- **lp-integration-expert**: Expert agent for complex LP integration questions, tick math, position management, and gas optimization

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
│   └── lp-integration/
│       ├── lp-integration.md         # Main skill file
│       └── SKILL.md -> lp-integration.md
├── agents/
│   ├── viem-integration-expert.md
│   ├── swap-integration-expert.md
│   └── lp-integration-expert.md
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
    ┌───┴───┐
    ↓       ↓
swap-integration    lp-integration
(builds on viem)    (builds on viem)
```

**viem-integration** provides core blockchain knowledge that both **swap-integration** and **lp-integration** assume.

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

Mainnet (1), Optimism (10), Polygon (137), Arbitrum (42161), Base (8453), BNB (56), Blast (81457), Unichain (130)

## LP Integration Skill

### Integration Methods

1. **Trading API** (Recommended for most use cases)

   - REST API at `https://trade.api.uniswap.org/v1`
   - LP endpoints: /lp/approve, /lp/create, /lp/increase, /lp/decrease, /lp/claim, /lp/migrate
   - Handles approvals and encoding automatically

2. **Position Manager SDKs**

   - V3: `@uniswap/v3-sdk` for NonfungiblePositionManager
   - V4: `@uniswap/v4-sdk` for PositionManager
   - Full control over position management

3. **Direct Smart Contract Integration**
   - Solidity contracts calling Position Manager
   - For vault contracts and automated LP strategies

### Pool Version Comparison

| Feature        | V2              | V3             | V4              |
| -------------- | --------------- | -------------- | --------------- |
| Price Range    | Full range      | Custom ticks   | Custom ticks    |
| Position Token | ERC-20 LP token | NFT (ERC-721)  | NFT (ERC-1155)  |
| Fee Tiers      | 0.3% fixed      | Multiple tiers | Dynamic + hooks |
| Hooks Support  | No              | No             | Yes             |

### Supported Chains

Mainnet (1), Optimism (10), Polygon (137), Arbitrum (42161), Base (8453), BNB (56), Blast (81457), Unichain (130)

## Key References

### viem/wagmi

- viem Documentation: <https://viem.sh>
- wagmi Documentation: <https://wagmi.sh>
- Package: `viem`, `wagmi`, `@tanstack/react-query`

### Uniswap

- Trading API: `https://trade.api.uniswap.org/v1`
- Universal Router: `github.com/Uniswap/universal-router`
- SDKs: `@uniswap/universal-router-sdk`, `@uniswap/v3-sdk`, `@uniswap/v4-sdk`, `@uniswap/sdk-core`
- Permit2: Token approval infrastructure
- V3 Docs: `docs.uniswap.org/contracts/v3/overview`
- V4 Docs: `docs.uniswap.org/contracts/v4/overview`
