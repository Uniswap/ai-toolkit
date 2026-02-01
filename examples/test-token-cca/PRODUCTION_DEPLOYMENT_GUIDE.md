# CCA Production Deployment Guide

**Date**: 2026-02-01
**Status**: Work In Progress - Integration Complexity Identified

## Executive Summary

After comprehensive testing, we've definitively proven that **production CCA deployments require Liquidity Launcher integration** and cannot use direct factory calls. This guide documents our findings and provides the path forward.

## What We've Confirmed

### 1. Direct Factory Calls Do NOT Work on Production

**Tested Configurations**:

- ✅ Token deployments successful on 3 networks
- ❌ CCA Factory calls fail on ALL networks with error `0xa9ac5820`

**Factory Addresses Tested**:

1. `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` (skill documentation)
2. `0xcca1101C61cF5cb44C968947985300DF945C3565` (quickstart docs)

**Networks Tested**:

- Base Sepolia (Testnet)
- Base Mainnet (Production)
- Ethereum Mainnet (Production)

**Result**: IDENTICAL error across all combinations.

### 2. Liquidity Launcher is Required

The official deployment method:

```typescript
LiquidityLauncher.distributeToken(
  tokenAddress,
  {
    strategy: strategyFactoryAddress,
    amount: tokenAmount,
    configData: strategyConfig,
  },
  payerIsUser,
  salt
);
```

### 3. Implementation Challenges

**Permit2 Integration** (when `payerIsUser=true`):

- Requires off-chain signature generation
- Signature must include spender (LiquidityLauncher), token, amount, nonce, deadline
- Complex EIP-712 typed data structure
- Time-bound permissions

**Multicall Approach** (when `payerIsUser=false`):

- Create token and distribute in one transaction
- Requires proper encoding of nested structs
- Address resolution for newly created tokens

## Successful Token Deployments

These tokens are ready for CCA integration once we solve the Liquidity Launcher config:

| Network          | Token Address                                | Supply |
| ---------------- | -------------------------------------------- | ------ |
| Base Sepolia     | `0x7a80e28afd69329ab2c6645794a6db67b30c626e` | 1B     |
| Base Mainnet     | `0xE99f3a66d54e4d4E119b1970639768ae13368B0A` | 10M    |
| Ethereum Mainnet | `0x456b2e327B03bbD0fc37E263182F1FB22C69F2E1` | 1M     |

## Current Deployment Wallet

**Address**: `0xe9f8d9e06FD7E0100630d0481E7f79AEFeFaACC8`

**Balances**:

- Base Mainnet: 0.004 ETH, 15.98 USDC
- Ethereum Mainnet: 0.01 ETH

## Next Steps - Production Deployment Options

### Option 1: Complete Permit2 Integration (Recommended for Production)

**Complexity**: High
**Time**: 2-4 hours
**Outcome**: Production-grade deployment

**Requirements**:

1. Implement EIP-712 signature generation
2. Create Permit2 signature with proper nonce/deadline management
3. Pass signed permit to LiquidityLauncher.distributeToken()
4. Handle permit expiry and revocation

**Reference Implementation Needed**:

- Permit2 signature generation (viem or ethers.js)
- Nonce management
- Deadline calculation
- Signature verification

### Option 2: Use Existing Tooling

**Complexity**: Low
**Time**: 1-2 hours
**Outcome**: Faster path using existing infrastructure

**Approaches**:

1. **Use Uniswap CCA Portal**: <https://cca.uniswap.org/>

   - Official UI handles all Permit2 complexity
   - Connect wallet and configure via frontend
   - May lack customization options

2. **Fork Working Examples**:

   - Find production CCA deployments on Basescan/Etherscan
   - Analyze transaction data
   - Replicate exact call structure

3. **Use Foundry Script**:
   - Write Solidity deployment script
   - Use Foundry's cheatcodes for testing
   - Deploy via `forge script`

### Option 3: Anvil Local Testing First

**Complexity**: Medium
**Time**: 1-2 hours
**Outcome**: Working local example before mainnet

**Steps**:

1. Follow quickstart guide for local deployment
2. Deploy on Anvil (local testnet)
3. Verify all components work
4. Extract working config and adapt for mainnet

## Recommended Immediate Action

**Path Forward**: Option 3 → Option 1

1. **Anvil Testing** (1-2 hours):

   - Get working local deployment
   - Understand full flow
   - Validate strategy config encoding

2. **Permit2 Implementation** (2-4 hours):
   - Implement signature generation based on working local example
   - Test on Base Sepolia first
   - Deploy to Base Mainnet

## Key Contract Addresses

### Base Mainnet

```typescript
const ADDRESSES = {
  liquidityLauncher: '0x00000008412db3394C91A5CbD01635c6d140637C',
  permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  ccaFactory: '0xcca1101C61cF5cb44C968947985300DF945C3565',
  fullRangeLBPStrategyFactory: '0x39E5eB34dD2c8082Ee1e556351ae660F33B04252',
  poolManager: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829',
  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};
```

## Documentation Gaps Identified

1. **Permit2 Integration**: No complete TypeScript/viem example for LiquidityLauncher
2. **Strategy Config**: FullRangeLBPStrategy config structure not documented
3. **Error Codes**: `0xa9ac5820` not documented in public repos
4. **Production Examples**: Most docs focus on local Anvil deployment

## Resources

- [LiquidityLauncher GitHub](https://github.com/Uniswap/liquidity-launcher)
- [Permit2 GitHub](https://github.com/Uniswap/permit2)
- [CCA Portal](https://cca.uniswap.org/)
- [CCA Documentation](https://docs.uniswap.org/contracts/liquidity-launchpad/Overview)
- [Deployment Guide](https://github.com/Uniswap/liquidity-launcher/blob/main/docs/DeploymentGuide.md)

---

**Status**: The skill documentation is accurate about how CCAs work conceptually, but production deployment requires solving the Liquidity Launcher integration complexity. The simple "direct factory call" examples shown in documentation only work on local Anvil networks.
