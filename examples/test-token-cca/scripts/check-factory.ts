import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const CCA_FACTORY = '0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5' as const;

async function main() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Check if contract exists
  const code = await client.getCode({ address: CCA_FACTORY });

  console.log('CCA Factory address:', CCA_FACTORY);
  console.log('Code exists:', code && code !== '0x');
  console.log('Code length:', code ? code.length : 0);

  if (!code || code === '0x') {
    console.log('\n⚠️  CCA Factory NOT deployed on Base Sepolia!');
    console.log('You may need to use a different network or deploy the factory yourself.');
  } else {
    console.log('\n✓ CCA Factory exists on Base Sepolia');
  }
}

main().catch(console.error);
