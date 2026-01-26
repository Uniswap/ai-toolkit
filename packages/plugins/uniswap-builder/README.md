# Uniswap Builder Plugin

Skills for building on top of and integrating the Uniswap protocol.

## Installation

```bash
claude-code plugin add uniswap-builder
```

## Skills

| Skill              | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `viem-integration` | EVM blockchain integration using viem and wagmi                    |
| `swap-integration` | Integrate Uniswap swaps via Trading API, Universal Router, or SDKs |
| `lp-integration`   | Integrate Uniswap LP via Trading API, Position Manager, or SDKs    |

## Use Cases

This plugin helps developers build:

- **Custom Swap Frontends** - React/TypeScript applications with swap functionality
- **Swap Scripts/Backends** - Node.js scripts for programmatic swaps
- **LP Interfaces** - Position management UIs for creating and managing liquidity
- **LP Automation** - Backend scripts for automated liquidity provisioning
- **Smart Contract Integrations** - Solidity contracts calling Universal Router or Position Manager

## Quick Start

### Using the Skills

The skills activate when you mention relevant topics:

```text
"Help me integrate Uniswap swaps into my frontend"
"Build a swap script that trades USDC for ETH"
"Create a smart contract that executes swaps via Universal Router"
"Help me create an LP position on Uniswap V3"
"Build a script to manage my liquidity positions"
"Create a vault contract that provides liquidity"
```

### Slash Commands

```text
/swap-integration
/lp-integration
```

## Supported Protocols

- Uniswap V2
- Uniswap V3
- Uniswap V4
- Universal Router (unified swap interface for all versions)
- Position Manager (V3/V4 LP management)

## Swap Integration Methods

| Method                    | Best For                                               |
| ------------------------- | ------------------------------------------------------ |
| **Trading API**           | Frontends, backends - handles routing and optimization |
| **Universal Router SDK**  | Direct contract interaction with full control          |
| **Direct Contract Calls** | Smart contract integrations                            |

## LP Integration Methods

| Method                    | Best For                                             |
| ------------------------- | ---------------------------------------------------- |
| **Trading API**           | Frontends, backends - handles approvals and encoding |
| **Position Manager SDKs** | Direct position management with full control         |
| **Direct Contract Calls** | Vault contracts and automated LP strategies          |

## Pool Version Comparison

| Feature        | V2              | V3             | V4              |
| -------------- | --------------- | -------------- | --------------- |
| Price Range    | Full range      | Custom ticks   | Custom ticks    |
| Position Token | ERC-20 LP token | NFT (ERC-721)  | NFT (ERC-1155)  |
| Fee Tiers      | 0.3% fixed      | Multiple tiers | Dynamic + hooks |
| Hooks Support  | No              | No             | Yes             |

## License

MIT
