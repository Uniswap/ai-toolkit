# Aggregator Hook Deployment Guide

Step-by-step guide for deploying aggregator hooks to production.

## Pre-Deployment Checklist

- [ ] External DEX address confirmed
- [ ] PoolManager address for target network
- [ ] Test tokens/stablecoins identified
- [ ] Deployer wallet funded with native gas token
- [ ] RPC endpoint added to foundry.toml
- [ ] Unit tests passing locally
- [ ] Factory contract ready

## Deployment Workflow

### 1. Network Configuration

Add the target network to `foundry.toml`:

```toml
[rpc_endpoints]
your_network = "https://rpc.your-network.xyz"
```

### 2. Environment Setup

Create a `.env` file (never commit this):

```bash
# Deployment
PRIVATE_KEY=0x...
DEPLOYER_ADDRESS=0x...

# Network addresses
POOL_MANAGER=0x...
EXTERNAL_DEX=0x...

# Test tokens
TOKEN0=0x...
TOKEN1=0x...
```

### 3. Deploy Factory

Script template:

```solidity
// script/DeployFactory.s.sol
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {YourDEXAggregatorFactory} from "../src/aggregator-hooks/implementations/YourDEX/YourDEXAggregatorFactory.sol";

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

Deploy:

```bash
forge script script/DeployFactory.s.sol \
  --rpc-url your_network \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 4. Mine Hook Salt

Script template:

```solidity
// script/MineHookSalt.s.sol
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";

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

        console.log("Mining salt...");
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

Run:

```bash
export FACTORY=<factory_address>
export POOL_MANAGER=<pool_manager_address>
export EXTERNAL_DEX=<external_dex_address>

forge script script/MineHookSalt.s.sol --rpc-url your_network
```

### 5. Create Pool

Using cast for direct deployment (recommended for precompiles):

```bash
export SALT=<mined_salt>
export TOKEN0=<token0_address>
export TOKEN1=<token1_address>

cast send $FACTORY \
  "createPool(bytes32,address,address,uint24,int24,uint160)(address)" \
  $SALT \
  $TOKEN0 \
  $TOKEN1 \
  500 \
  10 \
  79228162514264337593543950336 \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC
```

Parameters:

- `salt`: Mined salt from step 4
- `token0`, `token1`: Token addresses (token0 < token1)
- `500`: Fee (0.05%)
- `10`: Tick spacing
- `79228162514264337593543950336`: sqrt price (1:1 ratio)

### 6. Verify Deployment

Check hook configuration:

```bash
export HOOK=<deployed_hook_address>

# Verify token configuration
cast call $HOOK "token0()(address)" --rpc-url $RPC
cast call $HOOK "token1()(address)" --rpc-url $RPC

# Get pool ID
POOL_ID=$(cast call $HOOK "localPoolId()(bytes32)" --rpc-url $RPC)
echo "Pool ID: $POOL_ID"

# Check liquidity visibility
cast call $HOOK "pseudoTotalValueLocked(bytes32)(uint256,uint256)" \
  $POOL_ID --rpc-url $RPC

# Test quote
cast call $HOOK "quote(bool,int256,bytes32)(uint256)" \
  true -1000000000 $POOL_ID --rpc-url $RPC
```

## Testing on Testnet

### Deploy Test Router

For executing actual swaps during testing:

```solidity
// script/DeploySwapRouter.s.sol
import {SafePoolSwapTest} from "../test/shared/SafePoolSwapTest.sol";

contract DeploySwapRouter is Script {
    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envAddress("POOL_MANAGER");

        vm.startBroadcast(pk);
        SafePoolSwapTest router = new SafePoolSwapTest(IPoolManager(poolManager));
        console.log("Router deployed at:", address(router));
        vm.stopBroadcast();
    }
}
```

### Execute Test Swap

Create a test script:

```bash
#!/bin/bash
# test_hook.sh

export HOOK=<hook_address>
export POOL_ID=<pool_id>
export RPC=<rpc_url>

echo "=== TESTING AGGREGATOR HOOK ==="

# 1. Check configuration
echo "1. Hook configuration:"
cast call $HOOK "token0()(address)" --rpc-url $RPC
cast call $HOOK "token1()(address)" --rpc-url $RPC

# 2. Check liquidity
echo "2. External liquidity:"
cast call $HOOK "pseudoTotalValueLocked(bytes32)(uint256,uint256)" \
  $POOL_ID --rpc-url $RPC

# 3. Test quotes
echo "3. Quote test (1000 tokens):"
cast call $HOOK "quote(bool,int256,bytes32)(uint256)" \
  true -1000000000 $POOL_ID --rpc-url $RPC

echo "Hook verified and operational!"
```

## Production Checklist

Before mainnet deployment:

- [ ] **Audit**: Security audit completed
- [ ] **Testing**: All unit tests passing
- [ ] **Testnet**: Deployed and tested on testnet
- [ ] **Swaps**: Executed test swaps successfully
- [ ] **Liquidity**: Verified external DEX has sufficient liquidity
- [ ] **Gas**: Measured gas costs for swaps
- [ ] **Monitoring**: Set up indexing and monitoring
- [ ] **Documentation**: Deployment addresses documented
- [ ] **Verification**: Contracts verified on block explorer

## Gas Optimization Tips

1. **Cache Storage Reads**:

```solidity
address tokenInCached = token0; // Cache instead of multiple SLOADs
```

2. **Minimize External Calls**:

```solidity
// Bad: Multiple calls
uint256 quote1 = DEX.quote(...);
uint256 reserve = DEX.getReserve(...);

// Good: Single call if possible
(uint256 quote, uint256 reserve) = DEX.quoteAndReserves(...);
```

3. **Use Immutables**:

```solidity
IYourDEX public immutable EXTERNAL_DEX; // Cheaper than storage
```

## Monitoring and Maintenance

### Key Metrics to Track

1. **Swap Volume**: Track swaps routed through the hook
2. **Liquidity Utilization**: Monitor external DEX liquidity usage
3. **Price Deviation**: Compare Uniswap vs external DEX pricing
4. **Gas Costs**: Measure gas for aggregated swaps
5. **Failed Swaps**: Monitor reverts and failures

### Indexing Events

Index these events for monitoring:

```solidity
event AggregatorPoolRegistered(PoolId indexed poolId);
event HookDeployed(address indexed hook, PoolKey poolKey);
```

### Health Checks

Regular checks to perform:

```bash
# Check liquidity is available
cast call $EXTERNAL_DEX "getReserves(...)" --rpc-url $RPC

# Verify quote accuracy
cast call $HOOK "quote(...)" --rpc-url $RPC

# Check token approvals
cast call $TOKEN "allowance(address,address)" $HOOK $EXTERNAL_DEX --rpc-url $RPC
```

## Upgradeability Considerations

Aggregator hooks are immutable once deployed. For upgradeability:

1. **Deploy New Version**: Create new factory and hook
2. **Migrate Liquidity**: Users move to new pool
3. **Deprecate Old Hook**: Mark as deprecated in UI
4. **Governance**: Use multisig for factory ownership

## Example Networks

### Tempo Testnet

- Chain ID: 42431
- RPC: <https://rpc.moderato.tempo.xyz>
- PoolManager: 0xE2e105d3F7209A9DA11f83cCf3E7398a753823F1
- TempoExchange: 0xDEc0000000000000000000000000000000000000

### Ethereum Sepolia

- Chain ID: 11155111
- PoolManager: [Check Uniswap docs]

### Base Sepolia

- Chain ID: 84532
- PoolManager: [Check Uniswap docs]

---

For questions or issues, refer to the main [Aggregator Hook Guide](./aggregator-hook.md) or the [TempoExchange Reference Implementation](../../../TEMPO_PRODUCTION_DEPLOYMENT.md).
