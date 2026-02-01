/**
 * Deploy CCA via LiquidityLauncher (THE CORRECT WAY)
 * This is the ONLY supported method for production CCA deployments
 */
import 'dotenv/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeAbiParameters,
  parseUnits,
  formatUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const TOKEN_ADDRESS = '0xE99f3a66d54e4d4E119b1970639768ae13368B0A' as const;

// LiquidityLauncher addresses (same across all networks)
const LIQUIDITY_LAUNCHER = '0x00000008412db3394C91A5CbD01635c6d140637C' as const;
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Base Mainnet LBP Strategy Factory
const FULL_RANGE_LBP_STRATEGY_FACTORY = '0x39E5eB34dD2c8082Ee1e556351ae660F33B04252' as const;

const CONFIG = {
  tokenAmount: 10_000_000n * 10n ** 18n,
  durationBlocks: 1800,
  migrationDelay: 100, // Blocks after auction ends before V4 migration
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

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const LIQUIDITY_LAUNCHER_ABI = [
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
  console.log('\n🚀 LIQUIDITY LAUNCHER CCA DEPLOYMENT');
  console.log('✅ Using official LiquidityLauncher integration\n');

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

  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log(`Amount: ${formatUnits(CONFIG.tokenAmount, 18)} tokens\n`);

  const currentBlock = await publicClient.getBlockNumber();
  const startBlock = Number(currentBlock) + 20;
  const endBlock = startBlock + CONFIG.durationBlocks;
  const claimBlock = endBlock + 50;
  const migrationBlock = endBlock + CONFIG.migrationDelay;

  console.log('Configuration:');
  console.log(`  Start: Block ${startBlock}`);
  console.log(`  End: Block ${endBlock}`);
  console.log(`  Claim: Block ${claimBlock}`);
  console.log(`  Migration: Block ${migrationBlock}`);
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

  // Encode strategy config (includes auction params + migration settings)
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

  // Step 1: Approve Permit2 to spend tokens
  console.log('═══════════════════════════════════════');
  console.log('STEP 1: Approve Permit2');
  console.log('═══════════════════════════════════════\n');

  const currentAllowance = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, PERMIT2],
  });

  if (currentAllowance < CONFIG.tokenAmount) {
    console.log('Approving Permit2 to spend tokens...');
    const approveHash = await walletClient.writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [PERMIT2, CONFIG.tokenAmount],
    });
    console.log(`Transaction: ${approveHash}`);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log('✅ Permit2 approved\n');
  } else {
    console.log('✅ Permit2 already approved\n');
  }

  // Step 2: Call LiquidityLauncher.distributeToken
  console.log('═══════════════════════════════════════');
  console.log('STEP 2: Deploy via LiquidityLauncher');
  console.log('═══════════════════════════════════════\n');

  const salt = `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`;

  console.log('Calling LiquidityLauncher.distributeToken()...');
  const distributeHash = await walletClient.writeContract({
    address: LIQUIDITY_LAUNCHER,
    abi: LIQUIDITY_LAUNCHER_ABI,
    functionName: 'distributeToken',
    args: [
      TOKEN_ADDRESS,
      {
        strategy: FULL_RANGE_LBP_STRATEGY_FACTORY,
        amount: CONFIG.tokenAmount,
        configData: strategyConfig,
      },
      true, // payerIsUser = true (we're providing tokens via Permit2)
      salt,
    ],
  });

  console.log(`Transaction: ${distributeHash}`);
  console.log(`View: https://basescan.org/tx/${distributeHash}\n`);

  console.log('Waiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash: distributeHash });

  // Extract strategy address from logs
  const strategyAddress = receipt.logs[0]?.address;

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 CCA AUCTION DEPLOYED!');
  console.log('═══════════════════════════════════════\n');
  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log(`Strategy: ${strategyAddress}`);
  console.log(`\n🔗 Explorer:`);
  console.log(`  Transaction: https://basescan.org/tx/${distributeHash}`);
  console.log(`  Strategy: https://basescan.org/address/${strategyAddress}`);
  console.log(`\n📝 Next Steps:`);
  console.log(`1. Wait until block ${startBlock} for auction to start`);
  console.log(`2. Users bid with USDC`);
  console.log(`3. After block ${endBlock}, auction ends`);
  console.log(`4. After block ${migrationBlock}, anyone can call migrate() to create V4 pool`);
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message || error);
  console.error(error);
  process.exit(1);
});
