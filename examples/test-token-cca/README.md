# TEST_Token CCA Demo

A simple demo application for launching a meme-coin via Uniswap's Continuous Clearing Auction (CCA) on Base Sepolia testnet.

## Overview

This project demonstrates how to:

1. Deploy an ERC-20 token (TEST_Token)
2. Create a CCA (Continuous Clearing Auction) for fair price discovery
3. Build a React frontend for wallet participation

### Auction Configuration

| Parameter      | Value                  |
| -------------- | ---------------------- |
| Token          | TEST_Token (TEST)      |
| Total Supply   | 1,000,000,000 tokens   |
| Bid Currency   | USDC                   |
| Reserve Amount | 5 USDC                 |
| Duration       | ~1 hour                |
| Network        | Base Sepolia (testnet) |

## Prerequisites

- Node.js 18+
- A wallet with:
  - Base Sepolia ETH for gas ([Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))
  - Base Sepolia USDC for bidding ([Circle Faucet](https://faucet.circle.com/))

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Deploy TEST_Token

```bash
PRIVATE_KEY=0x... npm run deploy-token
```

This will output the token address. Save it for the next step.

### 3. Deploy CCA

```bash
PRIVATE_KEY=0x... TOKEN_ADDRESS=0x... npm run deploy-cca
```

This will:

- Create a CCA auction for your token
- Transfer all tokens to the auction
- Output the auction address

### 4. Update Configuration

Edit `src/constants.ts` and update `AUCTION_ADDRESS`:

```typescript
export const AUCTION_ADDRESS = '0x...' as const; // Your deployed auction address
```

### 5. Start the Frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How CCA Works

1. **Connect Wallet** - Users connect their wallet (MetaMask, Coinbase Wallet, etc.)
2. **Approve USDC** - Users approve the auction contract to spend their USDC
3. **Submit Bid** - Users submit a bid with:
   - **Amount**: How much USDC to bid
   - **Max Price**: Maximum price per token they're willing to pay
4. **Wait for Auction** - The auction runs for ~1 hour
5. **Graduation** - If 5+ USDC is raised, the auction "graduates"
6. **Claim Tokens** - Users can claim their tokens at the clearing price

### Key Benefits of CCA

- **Fair Price Discovery** - All participants pay the same clearing price
- **No Front-Running** - Gradual allocation prevents timing games
- **Automatic Liquidity** - After graduation, a Uniswap V4 pool is created

## Project Structure

```text
test-token-cca/
├── src/
│   ├── App.tsx          # Main React component
│   ├── constants.ts     # Contract addresses & ABIs
│   ├── utils.ts         # Helper functions
│   ├── wagmi.ts         # Wallet configuration
│   └── index.css        # Styles
├── scripts/
│   ├── deploy-token.ts  # Token deployment script
│   └── deploy-cca.ts    # CCA deployment script
└── README.md
```

## Contract Addresses (Base Sepolia)

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| USDC                 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| CCA Factory          | `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` |
| LBP Strategy Factory | `0xa3A236647c80BCD69CAD561ACf863c29981b6fbC` |

## Resources

- [CCA Documentation](https://docs.uniswap.org/contracts/liquidity-launchpad/CCA)
- [Liquidity Launchpad Overview](https://docs.uniswap.org/contracts/liquidity-launchpad/Overview)
- [CCA Portal](https://cca.uniswap.org/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
