# CLAUDE.md - uniswap-builder

## Overview

This plugin provides skills for building on top of and integrating the Uniswap protocol. It helps developers quickly implement swap functionality in frontends, backends, and smart contracts.

## Plugin Components

### Skills (./skills/)

- **swap-integration**: Comprehensive guide for integrating Uniswap swaps via Trading API, Universal Router, or SDKs. Supports building custom swap frontends, backend scripts, and smart contract integrations.

### Agents (./agents/)

- **swap-integration-expert**: Specialized agent for complex swap integration questions

## File Structure

```text
uniswap-builder/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── swap-integration/
│       ├── swap-integration.md      # Main skill file
│       ├── SKILL.md -> swap-integration.md
│       ├── trading-api.md           # Trading API reference
│       ├── universal-router.md      # Universal Router reference
│       └── sdk-reference.md         # SDK usage patterns
├── agents/
│   └── swap-integration-expert.md
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```

## Integration Methods

The skill covers three primary integration methods:

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

## Supported Chains

Mainnet (1), Optimism (10), Polygon (137), Arbitrum (42161), Base (8453), BNB (56), Blast (81457), Unichain (130)

## Key References

- Trading API: `https://trade.api.uniswap.org/v1`
- Universal Router: `github.com/Uniswap/universal-router`
- SDKs: `@uniswap/universal-router-sdk`, `@uniswap/v3-sdk`, `@uniswap/sdk-core`
- Permit2: Token approval infrastructure
