/**
 * Deploy CCA on ETHEREUM MAINNET
 * Testing if CCA Factory works on Ethereum vs Base
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeAbiParameters,
  parseEther,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS as `0x${string}`;

// Ethereum Mainnet addresses
const CCA_FACTORY = '0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5' as const;

// Use ETH as currency (simpler than USDC)
const CONFIG = {
  tokenAmount: 1_000_000n * 10n ** 18n, // 1M tokens
  durationBlocks: 300, // ~1 hour on Ethereum (12s blocks)
  claimDelay: 10,
  requiredRaise: parseEther('0.001'), // 0.001 ETH reserve (very low)
  floorPriceQ96: 79228162514264337593543950336n, // ~0.00001 ETH/token
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
  console.log('\n🧪 ETHEREUM MAINNET CCA TEST');
  console.log('Testing if CCA Factory works on Ethereum\n');

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Deployer: ${account.address}`);

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log(`Amount: ${formatEther(CONFIG.tokenAmount)} tokens\n`);

  const currentBlock = await publicClient.getBlockNumber();
  const startBlock = Number(currentBlock) + 5;
  const endBlock = startBlock + CONFIG.durationBlocks;
  const claimBlock = endBlock + CONFIG.claimDelay;

  console.log('Auction Configuration:');
  console.log(`  Currency: ETH (native)`);
  console.log(
    `  Duration: ${CONFIG.durationBlocks} blocks (~${(CONFIG.durationBlocks * 12) / 60} min)`
  );
  console.log(`  Reserve: ${formatEther(CONFIG.requiredRaise)} ETH\n`);

  const auctionSteps = encodeAuctionSteps([
    { rateInMps: 10000000, blocks: CONFIG.durationBlocks }, // 100% over duration
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
        currency: '0x0000000000000000000000000000000000000000', // ETH
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

  console.log('═══════════════════════════════════════');
  console.log('Testing CCA Factory on Ethereum');
  console.log('═══════════════════════════════════════\n');

  // Pre-calculate
  const auctionAddress = await publicClient.readContract({
    address: CCA_FACTORY,
    abi: CCA_FACTORY_ABI,
    functionName: 'getAuctionAddress',
    args: [TOKEN_ADDRESS, CONFIG.tokenAmount, configData, salt, account.address],
  });
  console.log(`Pre-calculated Auction: ${auctionAddress}\n`);

  // Try deployment
  console.log('Attempting CCA deployment...');
  try {
    const { request } = await publicClient.simulateContract({
      address: CCA_FACTORY,
      abi: CCA_FACTORY_ABI,
      functionName: 'initializeDistribution',
      args: [TOKEN_ADDRESS, CONFIG.tokenAmount, configData, salt],
      account,
    });

    console.log('✅ Simulation successful! Deploying...\n');

    const deployHash = await walletClient.writeContract(request);
    console.log(`Transaction: ${deployHash}`);
    console.log(`View: https://etherscan.io/tx/${deployHash}\n`);

    console.log('Waiting for confirmation...');
    await publicClient.waitForTransactionReceipt({ hash: deployHash });
    console.log(`✅ CCA Deployed: ${auctionAddress}\n`);

    // Transfer tokens
    console.log('Transferring tokens...');
    const transferHash = await walletClient.writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [auctionAddress, CONFIG.tokenAmount],
    });

    await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log(`✅ Tokens transferred\n`);

    // Notify
    console.log('Notifying auction...');
    const notifyHash = await walletClient.writeContract({
      address: auctionAddress,
      abi: CCA_ABI,
      functionName: 'onTokensReceived',
    });

    await publicClient.waitForTransactionReceipt({ hash: notifyHash });
    console.log('✅ Auction notified\n');

    console.log('\n🎉 SUCCESS! CCA Factory works on Ethereum Mainnet!');
    console.log(`\nAuction Address: ${auctionAddress}`);
    console.log(`View: https://etherscan.io/address/${auctionAddress}`);
  } catch (error) {
    const err = error as { message?: string; cause?: { data?: string } };
    console.error('\n❌ Failed on Ethereum too!');
    console.error('Error:', err.message);

    if (err.message?.includes('0xa9ac5820')) {
      console.error('\n🔴 SAME ERROR 0xa9ac5820 on Ethereum!');
      console.error('This confirms CCA Factory requires LiquidityLauncher on ALL networks.');
    }
  }
}

main().catch(console.error);
