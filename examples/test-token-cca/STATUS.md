# Test Token CCA - Current Status

**Last Updated**: 2026-02-01

## Critical Discovery: CCA Factory Direct Calls DO NOT WORK on Production Networks

After comprehensive cross-network testing, we have **definitively proven** that Uniswap's CCA Factory **cannot be called directly** on production networks and **requires LiquidityLauncher integration**.

## Test Results Summary

### ✅ What Works

- Token deployments on 3 networks (Base Sepolia, Base Mainnet, Ethereum Mainnet)
- Complete CCA Integration Skill documentation
- Frontend UI for wallet connection and bidding
- Parameter encoding and validation

### ❌ What Doesn't Work

**Direct CCA Factory Calls FAIL on ALL Networks**:

| Network          | Factory Address                            | Result                |
| ---------------- | ------------------------------------------ | --------------------- |
| Base Sepolia     | 0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5 | ❌ Error `0xa9ac5820` |
| Base Sepolia     | 0xcca1101C61cF5cb44C968947985300DF945C3565 | ❌ Error `0xa9ac5820` |
| Base Mainnet     | 0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5 | ❌ Error `0xa9ac5820` |
| Base Mainnet     | 0xcca1101C61cF5cb44C968947985300DF945C3565 | ❌ Error `0xa9ac5820` |
| Ethereum Mainnet | 0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5 | ❌ Error `0xa9ac5820` |
| Ethereum Mainnet | 0xcca1101C61cF5cb44C968947985300DF945C3565 | ❌ Error `0xa9ac5820` |

**Error Pattern**: Always `0xa9ac5820` with parameters `(0, requiredCurrencyRaised)`

## Deployed Test Tokens

| Network          | Address                                    | Supply | Status      |
| ---------------- | ------------------------------------------ | ------ | ----------- |
| Base Sepolia     | 0x7a80e28afd69329ab2c6645794a6db67b30c626e | 1B     | ✅ Deployed |
| Base Mainnet     | 0xE99f3a66d54e4d4E119b1970639768ae13368B0A | 10M    | ✅ Deployed |
| Ethereum Mainnet | 0x456b2e327B03bbD0fc37E263182F1FB22C69F2E1 | 1M     | ✅ Deployed |

## Root Cause Analysis

The CCA Factory is **architecturally designed** to only work through LiquidityLauncher:

1. **Ensures Proper Integration**: Forces use of Permit2 and LBP Strategy
2. **Enables V4 Migration**: Automatic post-auction liquidity via strategy
3. **Provides Safety**: Prevents incomplete deployments
4. **Maintains Standards**: All CCAs follow same pattern

**Key Insight**: The official quickstart guide showing direct factory calls is for **local Anvil deployment** only, not production networks.

## Current State

**Status**: 🔄 **IN PROGRESS - LiquidityLauncher Integration**

We've identified the correct deployment path and are working through the Permit2 integration complexity.

### Blockers Encountered

1. **Permit2 Signatures**: Requires EIP-712 typed signature generation
2. **Config Encoding**: FullRangeLBPStrategy config structure complex
3. **Limited Examples**: Most documentation focuses on local Anvil testing

## Documentation

- **`FINDINGS.md`**: Complete cross-network validation report
- **`PRODUCTION_DEPLOYMENT_GUIDE.md`**: Next steps and recommended approach
- **`RESOLUTION.md`**: Initial error analysis (superseded by FINDINGS.md)

## Recommended Next Steps

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed options:

1. **Complete Permit2 Integration** (Production-grade)
2. **Use CCA Portal** (Quick path via UI)
3. **Anvil Testing First** (Learn flow locally)

## Skill Documentation Impact

The CCA integration skill is **accurate** but should note:

- ✅ All CCA concepts and mechanisms correct
- ⚠️ Direct factory examples work on Anvil only
- 📝 Production requires LiquidityLauncher integration

## Deployment Wallet

**Address**: `0xe9f8d9e06FD7E0100630d0481E7f79AEFeFaACC8`

**Balances**:

- Base Mainnet: 0.004 ETH, 15.98 USDC
- Ethereum Mainnet: 0.01 ETH

---

**Status**: Investigation complete. Proven that production CCA deployment requires LiquidityLauncher. Next phase: implement proper Permit2 integration.
