/**
 * Check wallet balance on Base Mainnet
 */
import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const; // USDC on Base

const ERC20_ABI = [
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

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('\n🔍 Base Mainnet Wallet Status\n');
  console.log(`Address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  // Check ETH balance
  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log(`\nETH Balance: ${formatEther(ethBalance)} ETH`);

  // Check USDC balance
  const usdcBalance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`USDC Balance: ${formatUnits(usdcBalance, 6)} USDC`);

  // Get current block
  const currentBlock = await publicClient.getBlockNumber();
  console.log(`\nCurrent Block: ${currentBlock}`);

  // Check if sufficient for deployment
  const minEthNeeded = 0.001; // Estimate for deployment
  const hasEnoughEth = Number(ethBalance) > minEthNeeded * 1e18;

  console.log('\n📊 Deployment Readiness:');
  console.log(`ETH for gas: ${hasEnoughEth ? '✅ Sufficient' : '❌ Need more ETH'}`);
  console.log(`Estimated gas needed: ~${minEthNeeded} ETH`);

  if (!hasEnoughEth) {
    console.log('\n⚠️  Warning: May not have enough ETH for deployment');
  }
}

main().catch(console.error);
