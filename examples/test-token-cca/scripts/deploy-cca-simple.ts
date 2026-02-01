/**
 * Simple CCA deployment: Create token + distribute in one transaction
 * This bypasses Permit2 complexity by using multicall with payerIsUser=false
 */
import 'dotenv/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeAbiParameters,
  encodeFunctionData,
  parseUnits,
  formatUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

// Addresses
const LIQUIDITY_LAUNCHER = '0x00000008412db3394C91A5CbD01635c6d140637C' as const;
const UERC20_FACTORY = '0x00000008fD50b70fC8bc8f7D4095167f9aD89E78' as const;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const FULL_RANGE_LBP_STRATEGY_FACTORY = '0x39E5eB34dD2c8082Ee1e556351ae660F33B04252' as const;

// Token parameters
const TOKEN_CONFIG = {
  name: 'CCA_Test',
  symbol: 'CCAT',
  decimals: 18,
  initialSupply: 10_000_000n * 10n ** 18n, // 10M tokens (uint128 compatible)
};

// Auction parameters
const CONFIG = {
  durationBlocks: 1800,
  migrationDelay: 100,
  requiredRaise: parseUnits('5', 6),
  floorPriceQ96: 79228162514264337593543950336n,
  tickSpacing: 60,
};

function encodeAuctionSteps(steps: { rateInMps: number; blocks: number }[]): `0x${string}` {
  let result = '0x';
  for (const step of steps) {
    const packed = BigInt(step.rateInMps) | (BigInt(step.blocks) << 24n);
    result += packed.toString(16).padStart(16, '0');
  }
  return result as `0x${string}`;
}

const LIQUIDITY_LAUNCHER_ABI = [
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
  {
    name: 'createToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'factory', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'decimals', type: 'uint8' },
      { name: 'initialSupply', type: 'uint128' },
      { name: 'recipient', type: 'address' },
      { name: 'tokenData', type: 'bytes' },
    ],
    outputs: [{ name: 'tokenAddress', type: 'address' }],
  },
  {
    name: 'distributeToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      {
        name: 'distribution',
        type: 'tuple',
        components: [
          { name: 'strategy', type: 'address' },
          { name: 'amount', type: 'uint128' },
          { name: 'configData', type: 'bytes' },
        ],
      },
      { name: 'payerIsUser', type: 'bool' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'distributionContract', type: 'address' }],
  },
] as const;

async function main() {
  console.log('\n🚀 SIMPLE CCA DEPLOYMENT');
  console.log('Creating token + auction in one transaction\n');

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Deployer: ${account.address}`);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });

  const currentBlock = await publicClient.getBlockNumber();
  const startBlock = Number(currentBlock) + 100; // ~3 minutes
  const endBlock = startBlock + CONFIG.durationBlocks;
  const claimBlock = endBlock + 50;
  const migrationBlock = endBlock + CONFIG.migrationDelay;

  console.log('Token Configuration:');
  console.log(`  Name: ${TOKEN_CONFIG.name}`);
  console.log(`  Symbol: ${TOKEN_CONFIG.symbol}`);
  console.log(`  Supply: ${formatUnits(TOKEN_CONFIG.initialSupply, 18)}\n`);

  console.log('Auction Configuration:');
  console.log(`  Start: Block ${startBlock} (~3 minutes)`);
  console.log(`  End: Block ${endBlock}`);
  console.log(`  Duration: ${CONFIG.durationBlocks} blocks (~1 hour)`);
  console.log(`  Reserve: ${formatUnits(CONFIG.requiredRaise, 6)} USDC\n`);

  // Encode auction steps
  const auctionSteps = encodeAuctionSteps([
    { rateInMps: 5000000, blocks: CONFIG.durationBlocks / 2 },
    { rateInMps: 5000000, blocks: CONFIG.durationBlocks / 2 },
  ]);

  // Encode auction parameters
  const auctionParams = encodeAbiParameters(
    [
      {
        type: 'tuple',
        components: [
          { name: 'currency', type: 'address' },
          { name: 'tokensRecipient', type: 'address' },
          { name: 'fundsRecipient', type: 'address' },
          { name: 'startBlock', type: 'uint40' },
          { name: 'endBlock', type: 'uint40' },
          { name: 'claimBlock', type: 'uint40' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'validationHook', type: 'address' },
          { name: 'floorPrice', type: 'uint160' },
          { name: 'requiredCurrencyRaised', type: 'uint128' },
          { name: 'auctionStepsData', type: 'bytes' },
        ],
      },
    ],
    [
      {
        currency: USDC_ADDRESS,
        tokensRecipient: account.address,
        fundsRecipient: account.address,
        startBlock,
        endBlock,
        claimBlock,
        tickSpacing: CONFIG.tickSpacing,
        validationHook: '0x0000000000000000000000000000000000000000',
        floorPrice: CONFIG.floorPriceQ96,
        requiredCurrencyRaised: CONFIG.requiredRaise,
        auctionStepsData: auctionSteps,
      },
    ]
  );

  // Encode strategy config
  const strategyConfig = encodeAbiParameters(
    [
      {
        type: 'tuple',
        components: [
          { name: 'auctionParams', type: 'bytes' },
          { name: 'poolManager', type: 'address' },
          { name: 'migrationBlock', type: 'uint40' },
          { name: 'positionRecipient', type: 'address' },
        ],
      },
    ],
    [
      {
        auctionParams,
        poolManager: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829', // Base PoolManager
        migrationBlock,
        positionRecipient: account.address,
      },
    ]
  );

  // Encode createToken call
  const createTokenData = encodeFunctionData({
    abi: LIQUIDITY_LAUNCHER_ABI,
    functionName: 'createToken',
    args: [
      UERC20_FACTORY,
      TOKEN_CONFIG.name,
      TOKEN_CONFIG.symbol,
      TOKEN_CONFIG.decimals,
      TOKEN_CONFIG.initialSupply,
      LIQUIDITY_LAUNCHER, // recipient = LiquidityLauncher (so it can distribute)
      '0x', // tokenData (empty for basic UERC20)
    ],
  });

  // Encode distributeToken call (token address will be deterministic)
  // We need to predict the token address or use address(0) sentinel
  const distributeTokenData = encodeFunctionData({
    abi: LIQUIDITY_LAUNCHER_ABI,
    functionName: 'distributeToken',
    args: [
      '0x0000000000000000000000000000000000000000', // tokenAddress = address(0) (created in same tx)
      {
        strategy: FULL_RANGE_LBP_STRATEGY_FACTORY,
        amount: TOKEN_CONFIG.initialSupply,
        configData: strategyConfig,
      },
      false, // payerIsUser = false (token created in same tx)
      `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`,
    ],
  });

  console.log('═══════════════════════════════════════');
  console.log('Deploying Token + CCA via Multicall');
  console.log('═══════════════════════════════════════\n');

  const multicallHash = await walletClient.writeContract({
    address: LIQUIDITY_LAUNCHER,
    abi: LIQUIDITY_LAUNCHER_ABI,
    functionName: 'multicall',
    args: [[createTokenData, distributeTokenData]],
  });

  console.log(`Transaction: ${multicallHash}`);
  console.log(`View: https://basescan.org/tx/${multicallHash}\n`);

  console.log('Waiting for confirmation...');
  await publicClient.waitForTransactionReceipt({ hash: multicallHash });

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 CCA AUCTION DEPLOYED!');
  console.log('═══════════════════════════════════════\n');
  console.log(`Transaction: https://basescan.org/tx/${multicallHash}`);
  console.log(`\nCheck transaction logs for:`);
  console.log(`  - Token address`);
  console.log(`  - Auction address`);
  console.log(`  - Strategy address`);
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message || error);
  console.error(error);
  process.exit(1);
});
