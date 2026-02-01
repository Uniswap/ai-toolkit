---
description: Build Uniswap V4 aggregator hooks that integrate external liquidity sources. Use when user says "build aggregator hook", "integrate external DEX", "liquidity aggregation", "route through external AMM", "combine Uniswap with other DEX", or wants to aggregate liquidity from multiple sources.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(forge:*), Bash(cast:*), Bash(git:*), Task(subagent_type:viem-integration-expert)
model: opus
---

# Aggregator Hook Builder

Build Uniswap V4 hooks that aggregate liquidity from external sources like other DEXs, liquidity pools, or trading protocols.

## Overview

Aggregator hooks intercept swaps in Uniswap V4 and route them through external liquidity sources when beneficial. This enables:

- **Better pricing** by accessing liquidity beyond Uniswap pools
- **Reduced slippage** through liquidity aggregation
- **MEV opportunities** via arbitrage between venues
- **Protocol integrations** connecting Uniswap to specialized DEXs

## Quick Start Decision Guide

| Building...                              | Implementation Pattern           |
| ---------------------------------------- | -------------------------------- |
| External DEX integration                 | ExternalLiqSourceHook base       |
| Off-chain price oracle routing           | Custom beforeSwap implementation |
| Multi-venue aggregation                  | ExternalLiqSourceHook + router   |
| Precompiled contract integration (Tempo) | ExternalLiqSourceHook + uint128  |

## Architecture Overview

### Base Contract: ExternalLiqSourceHook

All aggregator hooks extend `ExternalLiqSourceHook` which provides:

```solidity
abstract contract ExternalLiqSourceHook is BaseHook, DeltaResolver {
    // Quote external liquidity source
    function quote(bool zeroToOne, int256 amountSpecified, PoolId poolId)
        external payable virtual returns (uint256 amountUnspecified);

    // Get external liquidity depth
    function pseudoTotalValueLocked(PoolId poolId)
        external view virtual returns (uint256 amount0, uint256 amount1);

    // Execute the actual swap
    function _conductSwap(...) internal virtual returns (...);

    // Validate tokens during pool initialization
    function _beforeInitialize(...) internal virtual returns (bytes4);
}
```

### Required Hook Flags

Aggregator hooks MUST have these address flags:

- `BEFORE_SWAP_FLAG` - Intercept swaps
- `BEFORE_SWAP_RETURNS_DELTA_FLAG` - Return custom amounts
- `BEFORE_INITIALIZE_FLAG` - Validate during pool creation

## Step-by-Step Implementation

### Step 1: Define External Liquidity Interface

Create an interface for the external liquidity source:

```solidity
// src/aggregator-hooks/implementations/YourDEX/interfaces/IYourDEX.sol
interface IYourDEX {
    function quoteSwapExactAmountIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut);

    function swapExactAmountIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);
}
```

**Key Considerations**:

- Match the external DEX's exact function signatures
- Handle different decimal formats (uint128 vs uint256)
- Support both exact-input and exact-output if available

### Step 2: Implement Aggregator Hook

Create your hook contract:

```solidity
// src/aggregator-hooks/implementations/YourDEX/YourDEXAggregator.sol
import {ExternalLiqSourceHook} from "../../ExternalLiqSourceHook.sol";
import {IYourDEX} from "./interfaces/IYourDEX.sol";

contract YourDEXAggregator is ExternalLiqSourceHook {
    IYourDEX public immutable EXTERNAL_DEX;
    PoolId public localPoolId;
    address public token0;
    address public token1;

    constructor(IPoolManager _manager, IYourDEX _dex)
        ExternalLiqSourceHook(_manager) {
        EXTERNAL_DEX = _dex;
    }

    // Implement abstract functions...
}
```

### Step 3: Implement Quote Function

The quote function provides pricing from the external source:

```solidity
function quote(
    bool zeroToOne,
    int256 amountSpecified,
    PoolId poolId
) external payable override returns (uint256 amountUnspecified) {
    if (PoolId.unwrap(poolId) != PoolId.unwrap(localPoolId))
        revert PoolDoesNotExist();

    address tokenIn = zeroToOne ? token0 : token1;
    address tokenOut = zeroToOne ? token1 : token0;

    if (amountSpecified < 0) {
        // Exact input
        uint256 amountIn = uint256(-amountSpecified);
        amountUnspecified = EXTERNAL_DEX.quoteSwapExactAmountIn(
            tokenIn, tokenOut, amountIn
        );
    } else {
        // Exact output (if supported)
        uint256 amountOut = uint256(amountSpecified);
        amountUnspecified = EXTERNAL_DEX.quoteSwapExactAmountOut(
            tokenIn, tokenOut, amountOut
        );
    }
}
```

**Critical Details**:

- Negative `amountSpecified` = exact input
- Positive `amountSpecified` = exact output
- Return value is always positive
- Must handle uint128/uint256 conversions if needed

### Step 4: Implement Liquidity Visibility

Help arbitrageurs by exposing external liquidity:

```solidity
function pseudoTotalValueLocked(PoolId poolId)
    external view override
    returns (uint256 amount0, uint256 amount1) {
    if (PoolId.unwrap(poolId) != PoolId.unwrap(localPoolId))
        revert PoolDoesNotExist();

    // Option 1: Query balances directly
    amount0 = IERC20(token0).balanceOf(address(EXTERNAL_DEX));
    amount1 = IERC20(token1).balanceOf(address(EXTERNAL_DEX));

    // Option 2: Call external DEX's reserves function
    (amount0, amount1) = EXTERNAL_DEX.getReserves(token0, token1);
}
```

### Step 5: Implement Token Validation

Validate tokens during pool initialization:

```solidity
function _beforeInitialize(
    address,
    PoolKey calldata key,
    uint160
) internal override returns (bytes4) {
    token0 = Currency.unwrap(key.currency0);
    token1 = Currency.unwrap(key.currency1);

    // Validate tokens are supported by querying a small quote
    try EXTERNAL_DEX.quoteSwapExactAmountIn(token0, token1, 1) {}
    catch {
        revert TokensNotSupported(token0, token1);
    }

    localPoolId = key.toId();

    // Approve external DEX to spend tokens
    IERC20(token0).safeIncreaseAllowance(address(EXTERNAL_DEX), type(uint256).max);
    IERC20(token1).safeIncreaseAllowance(address(EXTERNAL_DEX), type(uint256).max);

    emit AggregatorPoolRegistered(key.toId());
    return IHooks.beforeInitialize.selector;
}
```

**Important**:

- Approve external DEX during initialization
- Store poolId and token addresses
- Validate tokens early to fail fast
- Emit events for indexing

### Step 6: Implement Swap Execution

Execute the actual swap through the external DEX:

```solidity
function _conductSwap(
    Currency settleCurrency,
    Currency takeCurrency,
    SwapParams calldata params,
    PoolId
) internal override returns (
    uint256 amountSettle,
    uint256 amountTake,
    bool hasSettled
) {
    address tokenIn = Currency.unwrap(takeCurrency);
    address tokenOut = Currency.unwrap(settleCurrency);

    if (params.amountSpecified < 0) {
        // Exact input swap
        amountTake = uint256(-params.amountSpecified);

        // Take tokens from PoolManager
        poolManager.take(takeCurrency, address(this), amountTake);

        // Execute swap on external DEX
        amountSettle = EXTERNAL_DEX.swapExactAmountIn(
            tokenIn, tokenOut, amountTake, 0
        );

        // Sync and settle with PoolManager
        poolManager.sync(settleCurrency);
        IERC20(tokenOut).safeTransfer(address(poolManager), amountSettle);
        poolManager.settle();
        hasSettled = true;
    } else {
        // Exact output swap (similar pattern)
        amountSettle = uint256(params.amountSpecified);

        // Get required input from quote
        amountTake = EXTERNAL_DEX.quoteSwapExactAmountOut(
            tokenIn, tokenOut, amountSettle
        );

        poolManager.take(takeCurrency, address(this), amountTake);
        EXTERNAL_DEX.swapExactAmountOut(tokenIn, tokenOut, amountSettle, type(uint256).max);

        poolManager.sync(settleCurrency);
        IERC20(tokenOut).safeTransfer(address(poolManager), amountSettle);
        poolManager.settle();
        hasSettled = true;
    }

    return (amountSettle, amountTake, hasSettled);
}
```

**Critical Flow**:

1. Take input tokens from PoolManager to hook
2. Execute swap on external DEX (output comes to hook)
3. Sync output currency in PoolManager
4. Transfer output tokens to PoolManager
5. Call settle() to finalize

### Step 7: Create Factory Contract

Deploy hooks deterministically via CREATE2:

```solidity
// src/aggregator-hooks/implementations/YourDEX/YourDEXAggregatorFactory.sol
contract YourDEXAggregatorFactory {
    IPoolManager public immutable POOL_MANAGER;
    IYourDEX public immutable EXTERNAL_DEX;

    event HookDeployed(address indexed hook, PoolKey poolKey);

    constructor(IPoolManager _poolManager, IYourDEX _dex) {
        POOL_MANAGER = _poolManager;
        EXTERNAL_DEX = _dex;
    }

    function createPool(
        bytes32 salt,
        Currency currency0,
        Currency currency1,
        uint24 fee,
        int24 tickSpacing,
        uint160 sqrtPriceX96
    ) external returns (address hook) {
        // Deploy hook via CREATE2
        hook = address(new YourDEXAggregator{salt: salt}(
            POOL_MANAGER, EXTERNAL_DEX
        ));

        // Initialize pool
        PoolKey memory poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });

        POOL_MANAGER.initialize(poolKey, sqrtPriceX96);
        emit HookDeployed(hook, poolKey);
    }

    function computeAddress(bytes32 salt) external view returns (address) {
        bytes32 bytecodeHash = keccak256(abi.encodePacked(
            type(YourDEXAggregator).creationCode,
            abi.encode(POOL_MANAGER, EXTERNAL_DEX)
        ));
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff), address(this), salt, bytecodeHash
        )))));
    }
}
```

**Why Factory?**:

- Ensures correct hook address (flags in address)
- Atomic deployment + initialization
- Consistent deployment across chains
- Pre-compute hook addresses

## Testing Strategy

### Unit Tests

Create comprehensive unit tests:

```solidity
// test/aggregator-hooks/YourDEX/YourDEXTest.t.sol
contract YourDEXTest is Test {
    YourDEXAggregator hook;
    MockYourDEX mockDex;
    PoolManager manager;
    SafePoolSwapTest swapRouter;

    function setUp() public {
        // Deploy infrastructure
        manager = new PoolManager(address(0));
        mockDex = new MockYourDEX();

        // Mine valid hook address
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG |
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG |
            Hooks.BEFORE_INITIALIZE_FLAG
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this), flags,
            type(YourDEXAggregator).creationCode,
            abi.encode(manager, mockDex)
        );

        hook = new YourDEXAggregator{salt: salt}(manager, mockDex);

        // Initialize pool, fund liquidity, etc.
    }

    function test_swapExactInput_ZeroForOne() public {
        // Test exact input swap
    }

    function test_swapExactOutput() public {
        // Test exact output swap
    }

    function test_quote() public {
        // Verify quote accuracy
    }

    function testFuzz_swapAmounts(uint128 amount) public {
        // Fuzz test various amounts
    }
}
```

### Mock External DEX

For testing, create a mock of the external DEX:

```solidity
// test/aggregator-hooks/YourDEX/mocks/MockYourDEX.sol
contract MockYourDEX is IYourDEX {
    uint256 public constant FEE_BPS = 10; // 0.1% fee

    function quoteSwapExactAmountIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        // Simple 1:1 exchange with fee
        amountOut = amountIn * (10000 - FEE_BPS) / 10000;
    }

    function swapExactAmountIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        amountOut = this.quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn);
        require(amountOut >= minAmountOut, "Slippage");

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
    }
}
```

## Deployment Guide

### Step 1: Mine Valid Hook Salt

Use HookMiner to find a salt that produces a valid hook address:

```solidity
// script/MineHookSalt.s.sol
contract MineHookSalt is Script {
    function run() public view {
        address factory = vm.envAddress("FACTORY");
        address poolManager = vm.envAddress("POOL_MANAGER");
        address externalDex = vm.envAddress("EXTERNAL_DEX");

        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG |
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG |
            Hooks.BEFORE_INITIALIZE_FLAG
        );

        bytes memory constructorArgs = abi.encode(poolManager, externalDex);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            factory, flags,
            type(YourDEXAggregator).creationCode,
            constructorArgs
        );

        console.log("Hook Address:", hookAddress);
        console.log("Salt:", vm.toString(salt));
    }
}
```

Run with:

```bash
forge script script/MineHookSalt.s.sol --rpc-url <network>
```

### Step 2: Deploy Factory

```solidity
// script/DeployFactory.s.sol
contract DeployFactory is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envAddress("POOL_MANAGER");
        address externalDex = vm.envAddress("EXTERNAL_DEX");

        vm.startBroadcast(deployerPrivateKey);

        YourDEXAggregatorFactory factory = new YourDEXAggregatorFactory(
            IPoolManager(poolManager),
            IYourDEX(externalDex)
        );

        console.log("Factory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
```

### Step 3: Create Pool

```bash
cast send $FACTORY \
  "createPool(bytes32,address,address,uint24,int24,uint160)(address)" \
  $SALT $TOKEN0 $TOKEN1 500 10 79228162514264337593543950336 \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC
```

## Common Patterns

### Pattern 1: Handling Different Decimal Formats

When integrating with protocols that use uint128 or different decimals:

```solidity
function _safeToUint128(uint256 value) internal pure returns (uint128) {
    if (value > type(uint128).max) revert AmountExceedsUint128();
    return uint128(value);
}

function quote(...) external payable override returns (uint256) {
    if (amountSpecified < 0) {
        uint128 amountIn = _safeToUint128(uint256(-amountSpecified));
        uint128 amountOut = EXTERNAL_DEX.quote(tokenIn, tokenOut, amountIn);
        return uint256(amountOut); // Convert back to uint256
    }
}
```

### Pattern 2: Precompiled Contract Integration

When integrating with precompiled contracts (e.g., Tempo Exchange):

```solidity
// Precompiles may not respond to staticcall during Forge simulation
// Validate tokens with try/catch:
try EXTERNAL_DEX.quoteSwapExactAmountIn(token0, token1, 1) {}
catch {
    revert TokensNotSupported(token0, token1);
}

// For deployment, use cast send directly instead of forge script
// to avoid simulation issues with precompiles
```

### Pattern 3: Multi-Source Routing

For hooks that check multiple sources:

```solidity
function quote(...) external payable override returns (uint256) {
    uint256 uniswapQuote = _getUniswapQuote(amountSpecified);
    uint256 externalQuote = EXTERNAL_DEX.quote(...);

    // Return better price
    return amountSpecified < 0
        ? max(uniswapQuote, externalQuote)  // Exact in: maximize output
        : min(uniswapQuote, externalQuote); // Exact out: minimize input
}
```

## Security Considerations

### Critical Checks

1. **Reentrancy Protection**: ExternalLiqSourceHook inherits from DeltaResolver which has reentrancy guards

2. **Token Validation**: Always validate tokens during initialization:

```solidity
try EXTERNAL_DEX.quote(token0, token1, 1) {} catch {
    revert TokensNotSupported(token0, token1);
}
```

3. **Amount Overflow**: Use safe casting for uint128 conversions:

```solidity
function _safeToUint128(uint256 value) internal pure returns (uint128) {
    if (value > type(uint128).max) revert AmountExceedsUint128();
    return uint128(value);
}
```

4. **Slippage Protection**: External DEX should enforce slippage limits:

```solidity
EXTERNAL_DEX.swap(tokenIn, tokenOut, amountIn, minAmountOut);
```

5. **Approval Management**: Use increaseAllowance instead of approve:

```solidity
IERC20(token).safeIncreaseAllowance(address(EXTERNAL_DEX), type(uint256).max);
```

### Audit Checklist

- [ ] Hook flags are correct (BEFORE_SWAP, BEFORE_SWAP_RETURNS_DELTA, BEFORE_INITIALIZE)
- [ ] Token validation in beforeInitialize
- [ ] Proper amount conversions (uint128/uint256)
- [ ] Slippage protection in external calls
- [ ] Safe token approvals
- [ ] Correct sync() and settle() flow
- [ ] No reentrancy vulnerabilities
- [ ] Proper error handling
- [ ] Event emissions for indexing

## Troubleshooting

### Issue: Hook address doesn't have correct flags

**Solution**: Use HookMiner to find a valid salt:

```solidity
(address hookAddress, bytes32 salt) = HookMiner.find(
    deployer, flags, creationCode, constructorArgs
);
```

### Issue: "TokensNotSupported" error

**Solution**: Ensure tokens are registered with external DEX and quote function works:

```solidity
// Test quote first
uint256 testQuote = EXTERNAL_DEX.quote(token0, token1, 1);
require(testQuote > 0, "Tokens not supported");
```

### Issue: Forge simulation fails with precompiles

**Solution**: Use cast send directly instead of forge script --broadcast:

```bash
cast send $FACTORY "createPool(...)" --private-key $PK --rpc-url $RPC
```

### Issue: Swap reverts with "InsufficientLiquidity"

**Solution**: Check external DEX has liquidity for the trading pair:

```solidity
(uint256 reserve0, uint256 reserve1) = EXTERNAL_DEX.getReserves(token0, token1);
```

## Reference Implementation

See the TempoExchange aggregator hook as a complete reference:

- Source: `src/aggregator-hooks/implementations/TempoExchange/`
- Tests: `test/aggregator-hooks/TempoExchange/`
- Deployment scripts: `script/DeployTempoAggregator.s.sol`

## Additional Resources

- [Uniswap V4 Hooks Documentation](https://docs.uniswap.org/contracts/v4/overview)
- [ExternalLiqSourceHook Base Contract](../../ExternalLiqSourceHook.sol)
- [HookMiner Utility](https://github.com/Uniswap/v4-periphery/blob/main/src/utils/HookMiner.sol)
- [Tempo Integration Example](../../../TEMPO_PRODUCTION_DEPLOYMENT.md)

---

## Quick Reference

### Required Hook Flags

```solidity
Hooks.BEFORE_SWAP_FLAG |
Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG |
Hooks.BEFORE_INITIALIZE_FLAG
```

### Swap Flow

```
1. PoolManager initiates swap
2. Hook intercepts in beforeSwap
3. Hook calls quote() on external DEX
4. Hook executes swap via _conductSwap
5. Hook takes tokens from PoolManager
6. Hook swaps on external DEX
7. Hook transfers output to PoolManager
8. Hook calls settle()
9. Returns delta to cancel pool swap
```

### Testing Commands

```bash
# Run tests
forge test --match-contract YourDEXTest

# Mine hook salt
forge script script/MineHookSalt.s.sol --rpc-url <network>

# Deploy factory
forge script script/DeployFactory.s.sol --rpc-url <network> --broadcast

# Create pool
cast send $FACTORY "createPool(...)" --private-key $PK --rpc-url $RPC
```
