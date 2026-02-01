# CLAUDE.md - uniswap-builder

## Overview

This plugin provides skills for building on top of and integrating the Uniswap protocol and EVM blockchains. It helps developers quickly implement blockchain interactions, swap functionality, token launches via CCA (Continuous Clearing Auctions), and DeFi integrations in frontends, backends, and smart contracts.

## Plugin Components

### Skills (./skills/)

- **viem-integration**: Foundational skill for EVM blockchain integration using viem. Covers client setup, reading/writing data, accounts, contract interactions, and wagmi React hooks.

- **swap-integration**: Comprehensive guide for integrating Uniswap swaps via Trading API, Universal Router, or SDKs. Supports building custom swap frontends, backend scripts, and smart contract integrations.

- **cca-integration**: Guide for creating and managing Continuous Clearing Auctions (CCA) for fair token launches via the Uniswap Liquidity Launchpad. Covers CCA deployment, auction parameters, bidding, and V4 pool migration.

### Agents (./agents/)

- **viem-integration-expert**: Expert agent for complex viem and wagmi integration questions, debugging, and best practices

- **swap-integration-expert**: Specialized agent for complex swap integration questions

- **cca-integration-expert**: Expert agent for complex CCA and Liquidity Launchpad integration questions, auction parameter optimization, and debugging

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
│       ├── SKILL.md -> cca-integration.md
│       ├── personas-and-examples.md  # Use case configurations
│       └── helpers.md                # Utility functions
├── agents/
│   ├── viem-integration-expert.md
│   ├── swap-integration-expert.md
│   └── cca-integration-expert.md
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
swap-integration    cca-integration
(swaps)             (token launches)
```

**viem-integration** provides core blockchain knowledge that **swap-integration** and **cca-integration** both assume.

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

## CCA Integration Skill

### Overview

The CCA (Continuous Clearing Auction) skill enables fair token launches through the Uniswap Liquidity Launchpad. It combines price discovery, liquidity bootstrapping, and optional token creation.

### Supported Use Cases

| Persona                  | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| Memecoin Launcher        | Creator fees via LP ownership (like Clanker)                |
| Prediction Market        | Outcome token distribution with implied probability pricing |
| ICO/Token Sale           | Large-scale distribution (Aztec raised $59M via CCA)        |
| DAO Bootstrap            | Governance token + treasury funding                         |
| Protocol Owned Liquidity | Permanent LP via burn address                               |
| Gaming/IGO               | In-game utility token distribution                          |
| Airdrop Distribution     | Committed community distribution                            |

### Integration Methods

1. **Full Launchpad Flow** (Recommended for new tokens)

   - Token creation via UERC20Factory or USUPERC20Factory
   - CCA deployment via LBP Strategy
   - Automatic V4 pool migration after auction

2. **CCA Factory Direct**

   - Deploy CCA for existing tokens
   - Direct control over auction parameters
   - Factory address: `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5`

3. **Custom Strategy**
   - Implement custom LBPStrategyBase
   - Advanced distribution logic

### Key Contracts

| Contract                          | Address                                      |
| --------------------------------- | -------------------------------------------- |
| ContinuousClearingAuctionFactory  | `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` |
| LiquidityLauncher                 | `0x00000008412db3394C91A5CbD01635c6d140637C` |
| FullRangeLBPStrategyFactory (ETH) | `0x65aF3B62EE79763c704f04238080fBADD005B332` |

### Supported Chains

Mainnet (1), Unichain (130), Base (8453), Sepolia (11155111), Base Sepolia (84532)

## Key References

### viem/wagmi

- viem Documentation: <https://viem.sh>
- wagmi Documentation: <https://wagmi.sh>
- Package: `viem`, `wagmi`, `@tanstack/react-query`

### Uniswap Swaps

- Trading API: `https://trade.api.uniswap.org/v1`
- Universal Router: `github.com/Uniswap/universal-router`
- SDKs: `@uniswap/universal-router-sdk`, `@uniswap/v3-sdk`, `@uniswap/sdk-core`
- Permit2: Token approval infrastructure

### CCA / Liquidity Launchpad

- CCA Portal: <https://cca.uniswap.org/>
- CCA Docs: <https://docs.uniswap.org/contracts/liquidity-launchpad/CCA>
- Launchpad Overview: <https://docs.uniswap.org/contracts/liquidity-launchpad/Overview>
- CCA GitHub: <https://github.com/Uniswap/continuous-clearing-auction>
- Liquidity Launcher GitHub: <https://github.com/Uniswap/liquidity-launcher>
