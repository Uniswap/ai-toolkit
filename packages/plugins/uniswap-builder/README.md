# Uniswap Builder Plugin

Skills for building on top of and integrating the Uniswap protocol.

## Installation

```bash
claude-code plugin add uniswap-builder
```

### MCP Server Setup

The plugin includes an MCP server for generating CCA supply schedules. To set it up:

```bash
cd ~/.claude/plugins/uniswap-builder/mcp-server/supply-schedule
./setup.sh
```

Or manually:

```bash
cd ~/.claude/plugins/uniswap-builder/mcp-server/supply-schedule
pip3 install -r requirements.txt
```

**Requirements:**

- Python 3.10 or later
- pip3

## Skills

| Skill              | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `viem-integration` | EVM blockchain integration using viem and wagmi                    |
| `swap-integration` | Integrate Uniswap swaps via Trading API, Universal Router, or SDKs |
| `cca-integration`  | Configure and deploy CCA (Continuous Clearing Auction) contracts   |

## MCP Servers

| Server                | Description                                         |
| --------------------- | --------------------------------------------------- |
| `cca-supply-schedule` | Generate supply schedules for CCA auction contracts |

## Use Cases

This plugin helps developers build:

- **Custom Swap Frontends** - React/TypeScript applications with swap functionality
- **Swap Scripts/Backends** - Node.js scripts for programmatic swaps
- **Smart Contract Integrations** - Solidity contracts calling Universal Router
- **Token Auction Deployment** - Configure parameters and deploy CCA auction contracts

## Quick Start

### Using the Skills

The skills activate automatically when you mention related topics:

**Swap Integration:**

```text
"Help me integrate Uniswap swaps into my frontend"
"Build a swap script that trades USDC for ETH"
"Create a smart contract that executes swaps via Universal Router"
```

**CCA Integration:**

```text
"Configure a CCA auction for my token"
"Help me deploy a token auction on Base"
"Generate supply schedule for my auction"
```

The CCA skill provides an **interactive configuration flow** that guides you through 18 steps to collect all auction parameters, validates input at each step, and generates a ready-to-deploy JSON configuration file.

### Slash Commands

```text
/swap-integration
/cca-integration
```

## Supported Protocols

- Uniswap V2
- Uniswap V3
- Uniswap V4
- Universal Router (unified interface for all versions)

## Integration Methods

| Method                    | Best For                                               |
| ------------------------- | ------------------------------------------------------ |
| **Trading API**           | Frontends, backends - handles routing and optimization |
| **Universal Router SDK**  | Direct contract interaction with full control          |
| **Direct Contract Calls** | Smart contract integrations                            |

## License

MIT
