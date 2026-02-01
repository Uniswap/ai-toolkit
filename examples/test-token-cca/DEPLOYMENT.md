# TEST_Token CCA Deployment Guide

Complete step-by-step guide for deploying your TEST_Token CCA on Base Sepolia.

## Generated Wallet

A test wallet has been generated for this deployment:

```
Address: 0x650906cC956f2f44672eAc08986ab9cD3c84556B
Private Key: 0xaeefabc02784bb39dce3077f699566c1119b7286b535068d24d5ff4069100339
```

**⚠️ TESTNET ONLY**: This wallet is for testnet use only. Never use it for mainnet!

## Step 1: Fund Your Wallet

### Get Base Sepolia ETH (for gas)

1. Visit [Coinbase Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Enter address: `0x650906cC956f2f44672eAc08986ab9cD3c84556B`
3. Complete CAPTCHA and request funds
4. Wait ~30 seconds for ETH to arrive

### Get Base Sepolia USDC (for auction bids)

1. Visit [Circle USDC Faucet](https://faucet.circle.com/)
2. Select **Base Sepolia** network
3. Enter address: `0x650906cC956f2f44672eAc08986ab9cD3c84556B`
4. Request funds
5. You'll receive ~10 USDC for testing

## Step 2: Verify Balance

Check your wallet has funds before deploying:

```bash
npx tsx scripts/check-balance.ts
```

You should see:

- ETH balance > 0 (minimum 0.01 ETH recommended)
- Ready to deploy message

## Step 3: Deploy TEST_Token

Deploy the ERC-20 token:

```bash
export PRIVATE_KEY=0xaeefabc02784bb39dce3077f699566c1119b7286b535068d24d5ff4069100339
npm run deploy-token
```

**Expected Output:**

```
========================================
TOKEN DEPLOYED SUCCESSFULLY!
========================================
Token Address: 0x...
Name: TEST_Token
Symbol: TEST
Decimals: 18
Total Supply: 1000000000 TEST
========================================
```

**Save the token address!** You'll need it for the next step.

## Step 4: Deploy CCA

Create the Continuous Clearing Auction:

```bash
export PRIVATE_KEY=0xaeefabc02784bb39dce3077f699566c1119b7286b535068d24d5ff4069100339
export TOKEN_ADDRESS=0x...  # Use the address from Step 3
npm run deploy-cca
```

**Expected Output:**

```
========================================
CCA DEPLOYED SUCCESSFULLY!
========================================
Auction Address: 0x...
Token: TEST (0x...)
Bid Currency: USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
Reserve: 5 USDC
Start Block: ...
End Block: ...
========================================
```

**Save the auction address!** You'll need it for the frontend.

## Step 5: Update Frontend Configuration

Edit `src/constants.ts` and update the `AUCTION_ADDRESS`:

```typescript
// Replace the placeholder with your deployed auction address
export const AUCTION_ADDRESS = '0x...' as const; // Your auction address from Step 4
```

## Step 6: Start the Frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Step 7: Test the Auction

### Connect Wallet

1. Click "Connect with MetaMask" (or your preferred wallet)
2. Add Base Sepolia network if prompted
3. Import the test private key to your wallet (for testing only!)

### Place a Bid

1. Ensure you have USDC in your wallet (from Step 1)
2. Enter bid amount (e.g., 2 USDC)
3. Set max price per token (e.g., 0.001 USDC)
4. Click "Approve USDC" (first transaction)
5. Wait for approval, then click "Submit Bid" (second transaction)

### Check Auction Status

The frontend will show:

- Your USDC balance
- Current auction status
- Whether the auction has "graduated" (reached 5 USDC reserve)

## Auction Timeline

- **Duration**: ~1 hour (1800 blocks × 2 seconds/block)
- **Reserve**: 5 USDC minimum to graduate
- **Claims**: Available 100 blocks after auction ends

## View on Block Explorer

After deployment, view your contracts on BaseScan:

- **Token**: `https://sepolia.basescan.org/token/<TOKEN_ADDRESS>`
- **Auction**: `https://sepolia.basescan.org/address/<AUCTION_ADDRESS>`

## Troubleshooting

### "No ETH balance" Error

- Revisit the Coinbase faucet and request more ETH
- Each request gives ~0.1 ETH (enough for several deployments)

### "Transaction failed" During Deployment

- Check your ETH balance: `npx tsx scripts/check-balance.ts`
- Ensure you're connected to Base Sepolia (chain ID: 84532)
- Gas prices may spike - try again in a few minutes

### "Insufficient USDC balance" in Frontend

- Visit Circle faucet and request USDC
- Ensure you selected **Base Sepolia** network
- Each request gives ~10 USDC

### Auction Won't Graduate

- Need at least 5 USDC total in bids
- Try placing additional bids from different addresses
- Or lower the reserve amount in deploy script

## Advanced: Custom Configuration

Edit deployment scripts to customize:

**Token Configuration** (`scripts/deploy-token.ts`):

```typescript
const TOKEN_CONFIG = {
  name: 'My Token', // Token name
  symbol: 'MTK', // Token symbol
  decimals: 18, // Usually 18
  totalSupply: 1000000000n, // Adjust supply
};
```

**Auction Configuration** (`scripts/deploy-cca.ts`):

```typescript
const AUCTION_CONFIG = {
  durationBlocks: 1800, // Auction length
  requiredRaise: parseUnits('5', 6), // Minimum USDC
  floorPricePerToken: 0.000001, // Starting price
  tickSpacing: 60, // Price granularity
};
```

## Next Steps

After testing on testnet:

1. **Review** the auction parameters and adjust as needed
2. **Test** with multiple wallets to simulate real users
3. **Monitor** the auction progress and graduation
4. **Deploy** to mainnet when ready (with real funds!)

## Security Reminders

- This is a TESTNET deployment with TEST funds
- NEVER use the provided private key for mainnet
- NEVER send real funds to test addresses
- Always audit contracts before mainnet deployment
