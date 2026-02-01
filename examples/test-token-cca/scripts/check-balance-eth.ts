/**
 * Check wallet balance on Ethereum Mainnet
 */
import { createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('\n🔍 Ethereum Mainnet Wallet Status\n');
  console.log(`Address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log(`\nETH Balance: ${formatEther(ethBalance)} ETH`);

  const currentBlock = await publicClient.getBlockNumber();
  console.log(`Current Block: ${currentBlock}`);

  const minEthNeeded = 0.01; // Higher for Ethereum mainnet gas
  const hasEnoughEth = Number(ethBalance) > minEthNeeded * 1e18;

  console.log('\n📊 Deployment Readiness:');
  console.log(`ETH for deployment: ${hasEnoughEth ? '✅ Sufficient' : '❌ Need more ETH'}`);
  console.log(`Estimated needed: ~${minEthNeeded} ETH (Ethereum gas is higher)`);

  if (!hasEnoughEth) {
    console.log('\n⚠️  May not have enough ETH for Ethereum mainnet deployment');
    console.log('Ethereum mainnet gas is 10-50x more expensive than Base');
  }
}

main().catch(console.error);
