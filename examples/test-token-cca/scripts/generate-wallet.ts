/**
 * Generate a new wallet for testing
 */
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('========================================');
console.log('NEW WALLET GENERATED');
console.log('========================================');
console.log('Address:', account.address);
console.log('Private Key:', privateKey);
console.log('========================================');
console.log('\nIMPORTANT: Save this private key securely!');
console.log('\nNext steps:');
console.log(
  '1. Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet'
);
console.log('2. Get Base Sepolia USDC from: https://faucet.circle.com/');
console.log('3. Export the private key: export PRIVATE_KEY=' + privateKey);
