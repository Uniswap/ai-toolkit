/**
 * Deploy CCA with minimal configuration for testing
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

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS as `0x${string}`;

const CCA_FACTORY = '0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5' as const;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

// Very short test - 100 blocks (~3 minutes on Base Sepolia)
const TEST_CONFIG = {
  durationBlocks: 100,
  claimDelay: 10,
  requiredRaise: parseUnits('10', 6), // 10 USDC (minimum enforced)
  floorPriceQ96: 4294967296n, // MIN_FLOOR_PRICE constant
  tickSpacing: 200, // Wider spacing for testing
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
  const account = privateKeyToAccount(PRIVATE_KEY);
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

  const currentBlock = await publicClient.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);

  // Use SMALLER token amount for testing (100 million tokens instead of 1 billion)
  const tokenAmount = 100_000_000n * 10n ** 18n;

  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log(`Token amount: ${tokenAmount.toString()} (100M tokens)`);

  const startBlock = Number(currentBlock) + 10;
  const endBlock = startBlock + TEST_CONFIG.durationBlocks;
  const claimBlock = endBlock + TEST_CONFIG.claimDelay;

  console.log(`\nShort Test Auction Configuration:`);
  console.log(`  Start block: ${startBlock}`);
  console.log(`  End block: ${endBlock}`);
  console.log(`  Claim block: ${claimBlock}`);
  console.log(
    `  Duration: ${TEST_CONFIG.durationBlocks} blocks (~${Math.round(
      (TEST_CONFIG.durationBlocks * 2) / 60
    )} minutes)`
  );
  console.log(`  Reserve: 10 USDC`);

  // Single step - distribute all tokens evenly
  const auctionSteps = encodeAuctionSteps([
    { rateInMps: 10000000, blocks: TEST_CONFIG.durationBlocks }, // 100% over duration
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
        tickSpacing: TEST_CONFIG.tickSpacing,
        validationHook: '0x0000000000000000000000000000000000000000',
        floorPrice: TEST_CONFIG.floorPriceQ96,
        requiredCurrencyRaised: TEST_CONFIG.requiredRaise,
        auctionStepsData: auctionSteps,
      },
    ]
  );

  const salt = `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`;

  console.log('\nStep 1: Deploying CCA...');
  try {
    const hash = await walletClient.writeContract({
      address: CCA_FACTORY,
      abi: CCA_FACTORY_ABI,
      functionName: 'initializeDistribution',
      args: [TOKEN_ADDRESS, tokenAmount, configData, salt],
    });

    console.log(`Deploy tx: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Get auction address from event logs
    const auctionAddress = `0x${receipt.logs[0]?.topics[2]?.slice(-40)}` as `0x${string}`;
    console.log(`Auction deployed at: ${auctionAddress}`);

    // Step 2: Transfer tokens
    console.log('\nStep 2: Transferring tokens to auction...');
    const transferHash = await walletClient.writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [auctionAddress, tokenAmount],
    });

    console.log(`Transfer tx: ${transferHash}`);
    await publicClient.waitForTransactionReceipt({ hash: transferHash });

    // Step 3: Notify
    console.log('\nStep 3: Notifying auction...');
    const notifyHash = await walletClient.writeContract({
      address: auctionAddress,
      abi: CCA_ABI,
      functionName: 'onTokensReceived',
    });

    console.log(`Notify tx: ${notifyHash}`);
    await publicClient.waitForTransactionReceipt({ hash: notifyHash });

    console.log('\n========================================');
    console.log('CCA DEPLOYED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Auction Address: ${auctionAddress}`);
    console.log(`\nUpdate src/constants.ts with:`);
    console.log(`export const AUCTION_ADDRESS = '${auctionAddress}' as const;`);
  } catch (error: unknown) {
    console.error('\nDeployment failed:');
    const errorObj = error as { message?: string; cause?: { raw?: unknown } };
    console.error('Error:', errorObj.message || String(error));
    if (errorObj.cause?.raw) {
      console.error('Raw error data:', errorObj.cause.raw);
    }
  }
}

main().catch(console.error);
