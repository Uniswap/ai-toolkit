/**
 * Request funds from Base Sepolia faucets
 */
const ADDRESS = '0x650906cC956f2f44672eAc08986ab9cD3c84556B';

async function requestCoinbaseFaucet() {
  try {
    console.log('Requesting ETH from Coinbase faucet...');
    const response = await fetch('https://faucet.coinbase.com/api/v1/drips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: ADDRESS,
        network: 'base-sepolia',
      }),
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✓ ETH faucet request successful!');
    } else {
      console.log('⚠️  ETH faucet request failed. You may need to use the web interface:');
      console.log('https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
    }
  } catch (error) {
    console.error('Error requesting faucet:', error);
    console.log('\nPlease use the web interface:');
    console.log('ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
  }
}

async function requestCircleFaucet() {
  try {
    console.log('\nRequesting USDC from Circle faucet...');
    const response = await fetch('https://faucet.circle.com/api/faucet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: ADDRESS,
        blockchain: 'BASE',
        network: 'testnet',
      }),
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✓ USDC faucet request successful!');
    } else {
      console.log('⚠️  USDC faucet request failed. You may need to use the web interface:');
      console.log('https://faucet.circle.com/');
    }
  } catch (error) {
    console.error('Error requesting faucet:', error);
    console.log('\nPlease use the web interface:');
    console.log('USDC: https://faucet.circle.com/');
  }
}

async function main() {
  console.log('Requesting testnet funds for:', ADDRESS);
  console.log('=========================================\n');

  await requestCoinbaseFaucet();
  await requestCircleFaucet();

  console.log('\n=========================================');
  console.log('Waiting 30 seconds for funds to arrive...');
  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log('\nChecking balance...');
}

main().catch(console.error);
