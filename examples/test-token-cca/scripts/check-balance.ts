import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const ADDRESS = '0x650906cC956f2f44672eAc08986ab9cD3c84556B' as const;

async function checkBalance() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const balance = await client.getBalance({ address: ADDRESS });
  console.log('Address:', ADDRESS);
  console.log('ETH balance:', Number(balance) / 1e18, 'ETH');

  if (balance === 0n) {
    console.log('\n⚠️  No balance! Please fund this address:');
    console.log('1. ETH Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
    console.log('2. USDC Faucet: https://faucet.circle.com/');
  } else {
    console.log('\n✓ Wallet funded! Ready to deploy.');
  }
}

checkBalance().catch(console.error);
