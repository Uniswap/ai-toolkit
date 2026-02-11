# CLAUDE.md - uniswap-builder

## Overview

This plugin provides skills for building on top of and integrating the Uniswap protocol and EVM blockchains. It helps developers quickly implement blockchain interactions, swap functionality, and DeFi integrations in frontends, backends, and smart contracts.

## Plugin Components

### Skills (./skills/)

- **viem-integration**: Foundational skill for EVM blockchain integration using viem. Covers client setup, reading/writing data, accounts, contract interactions, and wagmi React hooks.

- **swap-integration**: Comprehensive guide for integrating Uniswap swaps via Trading API, Universal Router, or SDKs. Supports building custom swap frontends, backend scripts, and smart contract integrations.

### Agents (./agents/)

- **viem-integration-expert-agent**: Expert agent for complex viem and wagmi integration questions, debugging, and best practices

- **swap-integration-expert-agent**: Specialized agent for complex swap integration questions

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
│   └── swap-integration/
│       ├── swap-integration.md       # Main skill file
│       └── SKILL.md -> swap-integration.md
├── agents/
│   ├── viem-integration-expert.md
│   └── swap-integration-expert.md
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
swap-integration (builds on viem basics)
```

**viem-integration** provides core blockchain knowledge that **swap-integration** assumes.

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

   - REST API at `https://trade-api.gateway.uniswap.org/v1`
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

## Key References

### viem/wagmi

- viem Documentation: <https://viem.sh>
- wagmi Documentation: <https://wagmi.sh>
- Package: `viem`, `wagmi`, `@tanstack/react-query`

### Uniswap

- Trading API: `https://trade-api.gateway.uniswap.org/v1`
- Universal Router: `github.com/Uniswap/universal-router`
- SDKs: `@uniswap/universal-router-sdk`, `@uniswap/v3-sdk`, `@uniswap/sdk-core`
- Permit2: Token approval infrastructure
