# Aggregator Hook Integration Patterns

Common patterns and solutions for integrating external liquidity sources.

## Pattern 1: Precompiled Contract Integration

**Use Case**: Integrating with chain-native precompiled contracts (e.g., Tempo Exchange)

### Challenge

Precompiled contracts may not respond correctly to `staticcall` during Forge simulations.

### Solution

1. **Validation Pattern**:

```solidity
function _beforeInitialize(...) internal override returns (bytes4) {
    // Use try/catch for precompile validation
    try EXTERNAL_DEX.quoteSwapExactAmountIn(token0, token1, 1) {}
    catch {
        revert TokensNotSupported(token0, token1);
    }

    // Continue with initialization...
}
```

2. **Deployment Pattern**:

```bash
# Use cast send instead of forge script for precompiles
cast send $FACTORY "createPool(...)" --private-key $PK --rpc-url $RPC

# Avoid forge script --broadcast which may fail during simulation
```

### Example: Tempo Exchange

```solidity
contract TempoExchangeAggregator is ExternalLiqSourceHook {
    ITempoExchange public immutable TEMPO_EXCHANGE;

    function quote(...) external payable override returns (uint256) {
        // Tempo uses uint128, convert from uint256
        uint128 amountIn = _safeToUint128(uint256(-amountSpecified));
        uint128 amountOut = TEMPO_EXCHANGE.quoteSwapExactAmountIn(
            tokenIn, tokenOut, amountIn
        );
        return uint256(amountOut); // Convert back
    }
}
```

**Key Takeaways**:

- Handle uint128/uint256 conversions
- Use try/catch for precompile calls
- Deploy with cast send for reliability
- Test quotes directly via cast call first

## Pattern 2: AMM-Style DEX Integration

**Use Case**: Integrating with AMM protocols like Curve, Balancer, or custom AMMs

### Implementation

```solidity
contract AMMStyleAggregator is ExternalLiqSourceHook {
    IAMMPool public immutable EXTERNAL_POOL;

    function quote(
        bool zeroToOne,
        int256 amountSpecified,
        PoolId poolId
    ) external payable override returns (uint256 amountUnspecified) {
        (address tokenIn, address tokenOut) = zeroToOne
            ? (token0, token1)
            : (token1, token0);

        if (amountSpecified < 0) {
            // Exact input
            uint256 amountIn = uint256(-amountSpecified);
            amountUnspecified = EXTERNAL_POOL.getAmountOut(
                tokenIn, tokenOut, amountIn
            );
        } else {
            // Exact output
            uint256 amountOut = uint256(amountSpecified);
            amountUnspecified = EXTERNAL_POOL.getAmountIn(
                tokenIn, tokenOut, amountOut
            );
        }
    }

    function pseudoTotalValueLocked(PoolId poolId)
        external view override
        returns (uint256 amount0, uint256 amount1) {
        // Read reserves from AMM
        (uint256 reserve0, uint256 reserve1,) = EXTERNAL_POOL.getReserves();

        // Match token ordering
        if (EXTERNAL_POOL.token0() == token0) {
            return (reserve0, reserve1);
        } else {
            return (reserve1, reserve0);
        }
    }
}
```

**Key Takeaways**:

- Query reserves for liquidity visibility
- Handle token ordering (AMM may have different order than hook)
- Support both exact-in and exact-out
- Cache storage reads for gas efficiency

## Pattern 3: Order Book DEX Integration

**Use Case**: Integrating with order book-based DEXs (dYdX, Vertex, etc.)

### Challenge

Order books have dynamic pricing and partial fills.

### Solution

```solidity
contract OrderBookAggregator is ExternalLiqSourceHook {
    IOrderBook public immutable ORDER_BOOK;

    function quote(...) external payable override returns (uint256) {
        // Query top of book
        (uint256 bestBid, uint256 bestAsk, uint256 depth) = ORDER_BOOK.getTopOfBook(
            tokenIn, tokenOut
        );

        // Use mid-price or specific side based on direction
        uint256 price = zeroToOne ? bestAsk : bestBid;

        // Check if sufficient depth
        if (depth < uint256(-amountSpecified)) {
            // Not enough liquidity, may need to partial fill
            // or return conservative estimate
        }

        return amountSpecified < 0
            ? uint256(-amountSpecified) * price / 1e18
            : uint256(amountSpecified) * 1e18 / price;
    }
}
```

**Key Takeaways**:

- Check order book depth before routing
- Handle partial fills gracefully
- Use mid-price or specific side for quotes
- Consider slippage on larger orders

## Pattern 4: Oracle-Based Routing

**Use Case**: Route swaps based on off-chain price oracles (Chainlink, Pyth, etc.)

### Implementation

```solidity
contract OracleRoutedAggregator is ExternalLiqSourceHook {
    IChainlinkOracle public immutable ORACLE;
    IExternalDEX public immutable EXTERNAL_DEX;

    function quote(...) external payable override returns (uint256) {
        // Get oracle price
        (, int256 price,,,) = ORACLE.latestRoundData();
        require(price > 0, "Invalid oracle price");

        // Get external DEX price
        uint256 externalPrice = EXTERNAL_DEX.getPrice(tokenIn, tokenOut);

        // Use external DEX if price is better than oracle
        if (_isBetterPrice(externalPrice, uint256(price))) {
            return EXTERNAL_DEX.quote(tokenIn, tokenOut, amount);
        }

        // Fall back to internal Uniswap pool
        revert UseInternalPool();
    }
}
```

## Pattern 5: Multi-Source Aggregation

**Use Case**: Check multiple DEXs and route to best price

### Implementation

```solidity
contract MultiSourceAggregator is ExternalLiqSourceHook {
    IExternalDEX public immutable DEX_A;
    IExternalDEX public immutable DEX_B;

    function quote(...) external payable override returns (uint256) {
        uint256 quoteA = DEX_A.quote(tokenIn, tokenOut, amountIn);
        uint256 quoteB = DEX_B.quote(tokenIn, tokenOut, amountIn);

        // Return best quote
        if (amountSpecified < 0) {
            // Exact in: maximize output
            return quoteA > quoteB ? quoteA : quoteB;
        } else {
            // Exact out: minimize input
            return quoteA < quoteB ? quoteA : quoteB;
        }
    }

    function _conductSwap(...) internal override returns (...) {
        // Determine best source again (price may have changed)
        uint256 quoteA = DEX_A.quote(tokenIn, tokenOut, amountIn);
        uint256 quoteB = DEX_B.quote(tokenIn, tokenOut, amountIn);

        // Route to best source
        if (quoteA > quoteB) {
            return _swapOnDexA(...);
        } else {
            return _swapOnDexB(...);
        }
    }
}
```

**Key Takeaways**:

- Re-check quotes during execution (prices change)
- Consider gas costs in routing decision
- Handle failures gracefully (fallback to other source)

## Pattern 6: Conditional Routing

**Use Case**: Only route to external DEX under certain conditions

### Implementation

```solidity
function quote(...) external payable override returns (uint256) {
    uint256 externalQuote = EXTERNAL_DEX.quote(...);

    // Only use external if it's significantly better
    uint256 minImprovement = 50; // 0.5%
    uint256 threshold = (externalQuote * (10000 + minImprovement)) / 10000;

    if (externalQuote > threshold) {
        return externalQuote;
    }

    // Use internal Uniswap pool
    revert UseInternalPool();
}
```

## Token Handling Patterns

### Pattern A: Different Decimals

```solidity
function _normalizeDecimals(
    uint256 amount,
    uint8 fromDecimals,
    uint8 toDecimals
) internal pure returns (uint256) {
    if (fromDecimals == toDecimals) return amount;

    if (fromDecimals > toDecimals) {
        return amount / (10 ** (fromDecimals - toDecimals));
    } else {
        return amount * (10 ** (toDecimals - fromDecimals));
    }
}
```

### Pattern B: Safe Type Conversions

```solidity
function _safeToUint128(uint256 value) internal pure returns (uint128) {
    if (value > type(uint128).max) revert AmountExceedsUint128();
    return uint128(value);
}

function _safeToInt256(uint256 value) internal pure returns (int256) {
    if (value > uint256(type(int256).max)) revert AmountExceedsInt256();
    return int256(value);
}
```

## Error Handling Patterns

### Pattern A: Graceful Degradation

```solidity
function quote(...) external payable override returns (uint256) {
    try EXTERNAL_DEX.quote(tokenIn, tokenOut, amountIn) returns (uint256 quote) {
        return quote;
    } catch {
        // Fall back to internal Uniswap pool
        revert UseInternalPool();
    }
}
```

### Pattern B: Circuit Breaker

```solidity
bool public paused;

function quote(...) external payable override returns (uint256) {
    if (paused) revert UseInternalPool();
    return EXTERNAL_DEX.quote(...);
}

function pause() external onlyOwner {
    paused = true;
}
```

## Advanced Patterns

### Split Routing

Route part of swap internally, part externally:

```solidity
function _conductSwap(...) internal override returns (...) {
    uint256 externalCapacity = EXTERNAL_DEX.getAvailableLiquidity(...);

    if (amountTake > externalCapacity) {
        // Split: partial on external, rest on internal
        uint256 externalAmount = externalCapacity;
        uint256 internalAmount = amountTake - externalCapacity;

        // Execute on external DEX
        uint256 externalOut = _swapOnExternal(externalAmount);

        // Let remaining amount use internal Uniswap pool
        // by returning hasSettled = false for the remainder
    }
}
```

### Dynamic Fee Adjustment

Adjust effective fee based on external liquidity:

```solidity
function _beforeSwap(...)
    internal override
    returns (bytes4, BeforeSwapDelta, uint24) {
    (uint256 amountIn, uint256 amountOut) = _internalSettle(...);

    // Calculate effective fee based on routing
    uint24 dynamicFee = _calculateDynamicFee(amountIn, amountOut);

    // Return custom delta and fee
    return (selector, delta, dynamicFee);
}
```

## Testing Patterns

### Mock External DEX

```solidity
contract MockExternalDEX {
    mapping(address => mapping(address => uint256)) public prices;

    function setPrice(address tokenIn, address tokenOut, uint256 price) external {
        prices[tokenIn][tokenOut] = price;
    }

    function quote(address tokenIn, address tokenOut, uint256 amountIn)
        external view returns (uint256) {
        return amountIn * prices[tokenIn][tokenOut] / 1e18;
    }
}
```

### Fuzz Testing

```solidity
function testFuzz_swapAmounts(uint128 amount) public {
    amount = uint128(bound(amount, 1e6, 1e12)); // Reasonable bounds

    uint256 quotedOut = hook.quote(true, -int256(uint256(amount)), poolId);

    // Execute swap
    vm.prank(user);
    router.swap(poolKey, params, settings, "");

    // Verify output matches quote
    assertEq(actualOut, quotedOut);
}
```

## Common Gotchas

### 1. Token Ordering

Uniswap V4 requires `currency0 < currency1`. Always enforce ordering:

```solidity
if (address(token0) > address(token1)) {
    (token0, token1) = (token1, token0);
}
```

### 2. Approval Race Conditions

Use `safeIncreaseAllowance` instead of `approve`:

```solidity
// Bad
IERC20(token).approve(spender, type(uint256).max);

// Good
IERC20(token).safeIncreaseAllowance(spender, type(uint256).max);
```

### 3. Sync Before Settle

Always call `sync()` before transferring tokens:

```solidity
poolManager.sync(settleCurrency);
IERC20(tokenOut).safeTransfer(address(poolManager), amountSettle);
poolManager.settle();
```

### 4. Hook Flag Validation

Verify hook address has correct flags:

```solidity
require(
    Hooks.validateHookPermissions(hook, getHookPermissions()),
    "Invalid hook flags"
);
```

## Performance Optimization

### Gas Benchmarks

Typical gas costs for aggregator hooks:

- Hook deployment: ~2-3M gas
- Pool initialization: ~2M gas
- Swap execution: ~150-300k gas (depends on external DEX)

### Optimization Checklist

- [ ] Use immutables for addresses
- [ ] Cache storage reads in memory
- [ ] Minimize external calls
- [ ] Batch token approvals
- [ ] Use unchecked math where safe
- [ ] Optimize struct packing

## Real-World Examples

### Tempo Exchange Integration

**Deployment**: See [TEMPO_PRODUCTION_DEPLOYMENT.md](../../../TEMPO_PRODUCTION_DEPLOYMENT.md)

**Key Features**:

- Integrates with Tempo's precompiled stablecoin DEX
- Handles uint128 amounts
- 1:1 exchange rates for stablecoins
- Deployed on Tempo testnet with 40M+ liquidity

**Production Addresses** (Tempo Testnet):

- Factory: `0x314D6326dd42993b722f732E1E801590D3f40D2b`
- Hook: `0x89Ff626E89d63b4226Ed2d2463166c3755E3E088`
- Pool: pathUSD/AlphaUSD

### Implementation Highlights

```solidity
// Handle uint128 conversion
function _safeToUint128(uint256 value) internal pure returns (uint128) {
    if (value > type(uint128).max) revert AmountExceedsUint128();
    return uint128(value);
}

// Validate during initialization
try TEMPO_EXCHANGE.quoteSwapExactAmountIn(token0, token1, 1) {}
catch {
    revert TokensNotSupported(token0, token1);
}

// Execute swap with proper flow
poolManager.take(takeCurrency, address(this), amountTake);
uint128 amountOut = TEMPO_EXCHANGE.swapExactAmountIn(tokenIn, tokenOut, amountIn, 0);
poolManager.sync(settleCurrency);
IERC20(tokenOut).safeTransfer(address(poolManager), amountSettle);
poolManager.settle();
```

## Best Practices Summary

### Do's

✅ Validate tokens during initialization
✅ Use try/catch for external calls
✅ Handle different decimal formats
✅ Approve tokens during init, not during swaps
✅ Call sync() before settle()
✅ Emit events for indexing
✅ Mine valid hook addresses with HookMiner
✅ Deploy via factory for consistency
✅ Test with mock implementations first
✅ Verify on testnet before mainnet

### Don'ts

❌ Don't skip token validation
❌ Don't assume external DEX is always available
❌ Don't forget to handle uint128/uint256 conversions
❌ Don't use approve() in swap paths (gas waste)
❌ Don't hardcode token addresses
❌ Don't deploy without mining correct salt
❌ Don't forget about reentrancy protection
❌ Don't ignore slippage protection
❌ Don't skip testing both swap directions

## Debugging Guide

### Issue: Hook Deployment Fails

**Check**: Hook address has correct flags

```bash
# Verify flags in address
cast call $HOOK "getHookPermissions()(uint160)" --rpc-url $RPC
```

**Solution**: Re-mine salt with HookMiner

### Issue: Pool Initialization Reverts

**Check**: Token validation in beforeInitialize

```bash
# Test quote on external DEX directly
cast call $EXTERNAL_DEX "quote(...)" --rpc-url $RPC
```

**Solution**: Ensure tokens are supported by external DEX

### Issue: Swap Reverts

**Check**: Token approvals and balances

```bash
# Check hook's allowance to external DEX
cast call $TOKEN "allowance(address,address)" $HOOK $EXTERNAL_DEX --rpc-url $RPC

# Check external DEX balance
cast call $TOKEN "balanceOf(address)" $EXTERNAL_DEX --rpc-url $RPC
```

**Solution**: Verify approvals in beforeInitialize, check external DEX has liquidity

### Issue: Quote Returns 0

**Check**: External DEX liquidity

```bash
cast call $EXTERNAL_DEX "getReserves(...)" --rpc-url $RPC
```

**Solution**: Ensure external DEX has liquidity for the pair

## Resources

- [Main Aggregator Hook Guide](./aggregator-hook.md)
- [Deployment Guide](./deployment-guide.md)
- [ExternalLiqSourceHook Base Contract](../../ExternalLiqSourceHook.sol)
- [Tempo Reference Implementation](../../../src/aggregator-hooks/implementations/TempoExchange/)
- [Uniswap V4 Hooks Documentation](https://docs.uniswap.org/contracts/v4/overview)
