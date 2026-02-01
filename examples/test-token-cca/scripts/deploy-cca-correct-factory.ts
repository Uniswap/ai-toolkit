/**
 * Deploy CCA on BASE MAINNET using CORRECT factory address
 * Factory: 0xcca1101C61cF5cb44C968947985300DF945C3565 (v1.1.0 from official docs)
 * Previous attempts used: 0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5 (WRONG!)
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
const TOKEN_ADDRESS = '0xE99f3a66d54e4d4E119b1970639768ae13368B0A' as const; // Already deployed

// CORRECT factory address from official quickstart docs
const CCA_FACTORY = '0xcca1101C61cF5cb44C968947985300DF945C3565' as const;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Conservative mainnet parameters
const CONFIG = {
  tokenAmount: 10_000_000n * 10n ** 18n, // All 10M tokens
  durationBlocks: 1800, // ~1 hour
  claimDelay: 50,
  requiredRaise: parseUnits('5', 6), // 5 USDC reserve
  floorPriceQ96: 79228162514264337593543950336n, // ~0.00001 USDC/token
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

const CCA_FACTORY_ABI = [
  {
    name: 'initializeDistribution',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'configData', type: 'bytes' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'distributionContract', type: 'address' }],
  },
  {
    name: 'getAuctionAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'configData', type: 'bytes' },
      { name: 'salt', type: 'bytes32' },
      { name: 'deployer', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const CCA_ABI = [
  {
    name: 'onTokensReceived',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

async function main() {
  console.log('\n🚀 BASE MAINNET CCA DEPLOYMENT');
  console.log('✅ Using CORRECT factory from official docs');
  console.log(`Factory: ${CCA_FACTORY}\n`);

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
  console.log(`Token Amount: ${formatUnits(CONFIG.tokenAmount, 18)} tokens\n`);

  const currentBlock = await publicClient.getBlockNumber();
  const startBlock = Number(currentBlock) + 20; // ~40 seconds
  const endBlock = startBlock + CONFIG.durationBlocks;
  const claimBlock = endBlock + CONFIG.claimDelay;

  console.log('Auction Configuration:');
  console.log(`  Start: Block ${startBlock} (~40 seconds)`);
  console.log(`  End: Block ${endBlock}`);
  console.log(`  Claim: Block ${claimBlock}`);
  console.log(
    `  Duration: ${CONFIG.durationBlocks} blocks (~${(CONFIG.durationBlocks * 2) / 60} min)`
  );
  console.log(`  Reserve: ${formatUnits(CONFIG.requiredRaise, 6)} USDC\n`);

  // Even 50/50 distribution
  const auctionSteps = encodeAuctionSteps([
    { rateInMps: 5000000, blocks: CONFIG.durationBlocks / 2 },
    { rateInMps: 5000000, blocks: CONFIG.durationBlocks / 2 },
  ]);

  const configData = encodeAbiParameters(
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

  const salt = `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`;

  // Pre-calculate auction address
  console.log('═══════════════════════════════════════');
  console.log('STEP 1: Calculate Auction Address');
  console.log('═══════════════════════════════════════\n');

  const auctionAddress = await publicClient.readContract({
    address: CCA_FACTORY,
    abi: CCA_FACTORY_ABI,
    functionName: 'getAuctionAddress',
    args: [TOKEN_ADDRESS, CONFIG.tokenAmount, configData, salt, account.address],
  });
  console.log(`Auction Address: ${auctionAddress}\n`);

  // Deploy CCA
  console.log('═══════════════════════════════════════');
  console.log('STEP 2: Deploy CCA');
  console.log('═══════════════════════════════════════\n');

  console.log('Calling CCA Factory...');
  const deployHash = await walletClient.writeContract({
    address: CCA_FACTORY,
    abi: CCA_FACTORY_ABI,
    functionName: 'initializeDistribution',
    args: [TOKEN_ADDRESS, CONFIG.tokenAmount, configData, salt],
  });

  console.log(`Transaction: ${deployHash}`);
  console.log(`View: https://basescan.org/tx/${deployHash}\n`);

  console.log('Waiting for confirmation...');
  await publicClient.waitForTransactionReceipt({ hash: deployHash });
  console.log(`✅ CCA Deployed: ${auctionAddress}\n`);

  // Transfer tokens
  console.log('═══════════════════════════════════════');
  console.log('STEP 3: Transfer Tokens');
  console.log('═══════════════════════════════════════\n');

  console.log(`Transferring ${formatUnits(CONFIG.tokenAmount, 18)} tokens...`);
  const transferHash = await walletClient.writeContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [auctionAddress, CONFIG.tokenAmount],
  });

  console.log(`Transaction: ${transferHash}`);
  await publicClient.waitForTransactionReceipt({ hash: transferHash });
  console.log('✅ Tokens Transferred\n');

  // Notify auction
  console.log('═══════════════════════════════════════');
  console.log('STEP 4: Notify Auction');
  console.log('═══════════════════════════════════════\n');

  console.log('Calling onTokensReceived()...');
  const notifyHash = await walletClient.writeContract({
    address: auctionAddress,
    abi: CCA_ABI,
    functionName: 'onTokensReceived',
  });

  console.log(`Transaction: ${notifyHash}`);
  await publicClient.waitForTransactionReceipt({ hash: notifyHash });
  console.log('✅ Auction Notified\n');

  // Success!
  console.log('\n═══════════════════════════════════════');
  console.log('🎉 CCA AUCTION LIVE ON BASE MAINNET!');
  console.log('═══════════════════════════════════════\n');
  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log(`Auction: ${auctionAddress}`);
  console.log(`\nAuction Status:`);
  console.log(`  Starts: Block ${startBlock}`);
  console.log(`  Ends: Block ${endBlock}`);
  console.log(`  Duration: ~${(CONFIG.durationBlocks * 2) / 60} minutes`);
  console.log(`  Reserve: ${formatUnits(CONFIG.requiredRaise, 6)} USDC`);
  console.log(`\n🔗 Explorer Links:`);
  console.log(`  Token: https://basescan.org/address/${TOKEN_ADDRESS}`);
  console.log(`  Auction: https://basescan.org/address/${auctionAddress}`);
  console.log(`\n📝 Update src/constants.ts:`);
  console.log(`export const TOKEN_ADDRESS = '${TOKEN_ADDRESS}' as const;`);
  console.log(`export const AUCTION_ADDRESS = '${auctionAddress}' as const;`);
  console.log(`\n💡 Users can now bid with USDC!`);
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message || error);
  process.exit(1);
});
