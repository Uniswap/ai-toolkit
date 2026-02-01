# Uniswap Builder Plugin

Skills for building on top of and integrating the Uniswap protocol.

## Installation

```bash
claude-code plugin add uniswap-builder
```

## Skills

| Skill              | Description                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `viem-integration` | EVM blockchain integration using viem and wagmi                                                 |
| `swap-integration` | Integrate Uniswap swaps via Trading API, Universal Router, or SDKs                              |
| `cca-integration`  | Create and manage Continuous Clearing Auctions (CCA) for token launches via Liquidity Launchpad |
| `aggregator-hook`  | Build Uniswap V4 hooks that aggregate liquidity from external DEXs and liquidity sources        |

## Use Cases

This plugin helps developers build:

- **Custom Swap Frontends** - React/TypeScript applications with swap functionality
- **Swap Scripts/Backends** - Node.js scripts for programmatic swaps
- **Smart Contract Integrations** - Solidity contracts calling Universal Router
- **Token Launches** - Fair token distribution via Continuous Clearing Auctions
- **Liquidity Bootstrapping** - Automatic V4 pool creation with auction proceeds
- **Aggregator Hooks** - Uniswap V4 hooks that integrate external liquidity sources
- **Multi-Venue Routing** - Route swaps through external DEXs for better pricing

## Quick Start

### Using the Skills

The skills activate based on context:

```text
# swap-integration
"Help me integrate Uniswap swaps into my frontend"
"Build a swap script that trades USDC for ETH"

# cca-integration
"Launch a token using CCA"
"Create a continuous clearing auction for my token"
"Bootstrap liquidity with Liquidity Launchpad"

# aggregator-hook
"Build an aggregator hook for Uniswap V4"
"Integrate Curve liquidity into Uniswap"
"Route swaps through an external DEX"
```

### Slash Commands

```text
/swap-integration
/cca-integration
/aggregator-hook
```

## Supported Protocols

- Uniswap V2
- Uniswap V3
- Uniswap V4
- Universal Router (unified interface for all versions)
- Continuous Clearing Auction (CCA)
- Liquidity Launchpad

## Integration Methods

### Swaps

| Method                    | Best For                                               |
| ------------------------- | ------------------------------------------------------ |
| **Trading API**           | Frontends, backends - handles routing and optimization |
| **Universal Router SDK**  | Direct contract interaction with full control          |
| **Direct Contract Calls** | Smart contract integrations                            |

### Token Launches

| Method                  | Best For                               |
| ----------------------- | -------------------------------------- |
| **Full Launchpad Flow** | New token with CCA + automatic V4 pool |
| **CCA Factory Direct**  | Existing token liquidity bootstrap     |
| **Custom Strategy**     | Advanced distribution logic            |

## Examples

### Complete CCA Token Launch

See `examples/test-token-cca/` for a complete working example of a memecoin launch using CCA on Base Sepolia:

- **Token Deployment**: Simple ERC-20 deployment script
- **CCA Creation**: Auction with USDC bids and 5 USDC reserve
- **React Frontend**: Full bidding interface with wallet integration
- **Documentation**: Step-by-step deployment guide

```bash
cd examples/test-token-cca
npm install
npm run generate-wallet  # Generate test wallet
# Follow DEPLOYMENT.md for complete walkthrough
```

Key Features:

- Wallet generation and funding instructions
- Automated deployment scripts
- React + wagmi integration
- USDC approval flow
- Real-time auction status

## License

MIT
