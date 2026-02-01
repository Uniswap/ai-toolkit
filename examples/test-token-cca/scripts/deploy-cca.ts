/**
 * Deploy a CCA (Continuous Clearing Auction) for TEST_Token on Base Sepolia
 *
 * Prerequisites:
 * 1. Set PRIVATE_KEY environment variable with your deployer wallet private key
 * 2. Ensure you have testnet ETH on Base Sepolia for gas
 * 3. Deploy TEST_Token first using deploy-token.ts OR use an existing ERC20 token
 *
 * Usage:
 *   PRIVATE_KEY=0x... TOKEN_ADDRESS=0x... npm run deploy-cca
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  encodeAbiParameters,
  parseUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Constants
const CCA_FACTORY = '0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5' as const;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
const Q96 = 2n ** 96n;

// Auction configuration
const AUCTION_CONFIG = {
  // Duration: ~1 hour on Base Sepolia (2s blocks)
  durationBlocks: 1800,
  // Claim delay after auction ends
  claimDelay: 100,
  // Reserve: 5 USDC minimum to graduate
  requiredRaise: parseUnits('5', 6), // 5 USDC
  // Very low floor price for testing
  floorPricePerToken: 0.000001, // $0.000001 per token
  // Tick spacing (60 is standard)
  tickSpacing: 60,
};

// Helper: Convert price to Q96 format
function priceToQ96(priceInUSDC: number): bigint {
  // USDC has 6 decimals, token has 18 decimals
  const priceInSmallestUnit = BigInt(Math.floor(priceInUSDC * 10 ** 6));
  const decimalAdjustment = BigInt(10 ** 18);
  return (priceInSmallestUnit * Q96) / decimalAdjustment;
}

// Helper: Encode auction steps
function encodeAuctionSteps(steps: { rateInMps: number; blocks: number }[]): `0x${string}` {
  let result = '0x';
  for (const step of steps) {
    const packed = BigInt(step.rateInMps) | (BigInt(step.blocks) << 24n);
    result += packed.toString(16).padStart(16, '0');
  }
  return result as `0x${string}`;
}

// CCA Factory ABI
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
      { name: 'sender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

// ERC20 ABI for token transfer
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
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

// CCA onTokensReceived ABI
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
  // Validate environment
  const privateKey = process.env.PRIVATE_KEY;
  const tokenAddress = process.env.TOKEN_ADDRESS as `0x${string}`;

  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable is required');
    console.error('Usage: PRIVATE_KEY=0x... TOKEN_ADDRESS=0x... npm run deploy-cca');
    process.exit(1);
  }

  if (!tokenAddress) {
    console.error('Error: TOKEN_ADDRESS environment variable is required');
    console.error('Usage: PRIVATE_KEY=0x... TOKEN_ADDRESS=0x... npm run deploy-cca');
    process.exit(1);
  }

  // Setup clients
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`Deployer address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  // Get current block
  const currentBlock = await publicClient.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);

  // Check token balance
  const tokenBalance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  const tokenSymbol = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  console.log(`Token: ${tokenSymbol} (${tokenAddress})`);
  console.log(`Token balance: ${tokenBalance.toString()}`);

  if (tokenBalance === 0n) {
    console.error('Error: No token balance. Deploy token first with deploy-token.ts');
    process.exit(1);
  }

  // Use entire balance for auction
  const tokenAmount = tokenBalance;

  // Calculate auction timing
  const startBlock = Number(currentBlock) + 10; // Start in ~20 seconds
  const endBlock = startBlock + AUCTION_CONFIG.durationBlocks;
  const claimBlock = endBlock + AUCTION_CONFIG.claimDelay;

  console.log(`\nAuction Configuration:`);
  console.log(`  Start block: ${startBlock}`);
  console.log(`  End block: ${endBlock}`);
  console.log(`  Claim block: ${claimBlock}`);
  console.log(`  Duration: ~${Math.round((AUCTION_CONFIG.durationBlocks * 2) / 60)} minutes`);
  console.log(`  Reserve: 5 USDC`);
  console.log(`  Token amount: ${tokenAmount.toString()}`);

  // Create auction steps - even distribution
  const auctionSteps = encodeAuctionSteps([
    { rateInMps: 5000, blocks: Math.floor(AUCTION_CONFIG.durationBlocks / 2) }, // 50% first half
    { rateInMps: 5000, blocks: Math.ceil(AUCTION_CONFIG.durationBlocks / 2) }, // 50% second half
  ]);

  // Encode auction parameters
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
        tokensRecipient: account.address, // Unsold tokens go back to deployer
        fundsRecipient: account.address, // Raised USDC goes to deployer
        startBlock,
        endBlock,
        claimBlock,
        tickSpacing: AUCTION_CONFIG.tickSpacing,
        validationHook: '0x0000000000000000000000000000000000000000', // No validation
        floorPrice: priceToQ96(AUCTION_CONFIG.floorPricePerToken),
        requiredCurrencyRaised: AUCTION_CONFIG.requiredRaise,
        auctionStepsData: auctionSteps,
      },
    ]
  );

  // Generate salt for deterministic address
  const salt = `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`;

  // Predict auction address
  const predictedAddress = await publicClient.readContract({
    address: CCA_FACTORY,
    abi: CCA_FACTORY_ABI,
    functionName: 'getAuctionAddress',
    args: [tokenAddress, tokenAmount, configData, salt, account.address],
  });

  console.log(`\nPredicted auction address: ${predictedAddress}`);

  // Step 1: Deploy CCA via factory
  console.log('\nStep 1: Deploying CCA...');
  const deployHash = await walletClient.writeContract({
    address: CCA_FACTORY,
    abi: CCA_FACTORY_ABI,
    functionName: 'initializeDistribution',
    args: [tokenAddress, tokenAmount, configData, salt],
  });

  console.log(`Deploy tx: ${deployHash}`);
  const deployReceipt = await publicClient.waitForTransactionReceipt({
    hash: deployHash,
  });
  console.log(`Deploy confirmed in block ${deployReceipt.blockNumber}`);

  // Step 2: Transfer tokens to auction
  console.log('\nStep 2: Transferring tokens to auction...');
  const transferHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [predictedAddress, tokenAmount],
  });

  console.log(`Transfer tx: ${transferHash}`);
  const transferReceipt = await publicClient.waitForTransactionReceipt({
    hash: transferHash,
  });
  console.log(`Transfer confirmed in block ${transferReceipt.blockNumber}`);

  // Step 3: Notify auction of tokens received
  console.log('\nStep 3: Notifying auction of tokens...');
  const notifyHash = await walletClient.writeContract({
    address: predictedAddress,
    abi: CCA_ABI,
    functionName: 'onTokensReceived',
  });

  console.log(`Notify tx: ${notifyHash}`);
  const notifyReceipt = await publicClient.waitForTransactionReceipt({
    hash: notifyHash,
  });
  console.log(`Notify confirmed in block ${notifyReceipt.blockNumber}`);

  console.log('\n========================================');
  console.log('CCA DEPLOYED SUCCESSFULLY!');
  console.log('========================================');
  console.log(`Auction Address: ${predictedAddress}`);
  console.log(`Token: ${tokenSymbol} (${tokenAddress})`);
  console.log(`Bid Currency: USDC (${USDC_ADDRESS})`);
  console.log(`Reserve: 5 USDC`);
  console.log(`Start Block: ${startBlock}`);
  console.log(`End Block: ${endBlock}`);
  console.log('========================================');
  console.log('\nNext steps:');
  console.log(`1. Update AUCTION_ADDRESS in src/constants.ts to: ${predictedAddress}`);
  console.log('2. Run: npm run dev');
  console.log('3. Connect wallet and place bids!');
  console.log('\nView on BaseScan:');
  console.log(`https://sepolia.basescan.org/address/${predictedAddress}`);
}

main().catch(console.error);
