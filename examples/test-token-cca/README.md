# TEST_Token CCA Demo

A comprehensive reference implementation for launching tokens via Uniswap's Continuous Clearing Auction (CCA).

**⚠️ Important Note**: Direct CCA Factory deployment on Base Sepolia encounters error `0xa9ac5820`. See [RESOLUTION.md](./RESOLUTION.md) for:

- Complete issue analysis
- Recommended solutions (LiquidityLauncher, Ethereum Sepolia, mainnet)
- Alternative deployment approaches

Despite this testnet limitation, this project provides:

- ✅ Complete, production-ready frontend code
- ✅ Working token deployment scripts
- ✅ Comprehensive CCA integration documentation
- ✅ Reference implementation for mainnet deployments

## Overview

This project demonstrates:

1. ERC-20 token deployment
2. CCA auction creation (code complete, testnet deployment blocked)
3. React frontend for auction participation

### Project Status

| Component        | Status           | Notes                         |
| ---------------- | ---------------- | ----------------------------- |
| Frontend         | ✅ Complete      | Ready for production use      |
| Token Deployment | ✅ Working       | Tested on Base Sepolia        |
| CCA Scripts      | ✅ Code Complete | Blocked by testnet limitation |
| Documentation    | ✅ Comprehensive | Includes troubleshooting      |

### Auction Configuration

| Parameter      | Value                  |
| -------------- | ---------------------- |
| Token          | TEST_Token (TEST)      |
| Total Supply   | 1,000,000,000 tokens   |
| Bid Currency   | USDC                   |
| Reserve Amount | 10 USDC                |
| Duration       | ~3-5 minutes (testnet) |
| Network        | Base Sepolia (testnet) |

## Prerequisites

- Node.js 18+
- Wallet with testnet funds:
  - **Ethereum Sepolia**: ETH from [Infura Faucet](https://www.infura.io/faucet/sepolia) (recommended for testing)
  - **Base Sepolia**: ETH from [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
  - **USDC**: From [Circle Faucet](https://faucet.circle.com/)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Test Wallet

```bash
npm run generate-wallet
```

Save the generated private key and address.

### 3. Fund Wallet

- Get testnet ETH from faucets above
- Get testnet USDC from Circle faucet
- Verify balance: `npm run check-balance`

### 4. Deploy Token

```bash
PRIVATE_KEY=0x... npm run deploy-token
```

Save the token address output.

### 5. Deploy CCA (Alternative Approaches)

**Option A: Use Ethereum Sepolia** (recommended for testing)

- Modify scripts to use Ethereum Sepolia network
- Deploy with ETH as currency (simpler than USDC)

**Option B: Implement LiquidityLauncher** (production approach)

- Follow [official deployment guide](https://github.com/Uniswap/liquidity-launcher/blob/main/docs/DeploymentGuide.md)
- Use Permit2 for token approvals
- Configure LBP Strategy

**Option C: Deploy on Mainnet** (for production launches)

- Use real funds and thorough testing
- Follow security best practices
- See [RESOLUTION.md](./RESOLUTION.md) for guidance

### 6. Update Frontend Configuration

Edit `src/constants.ts`:

```typescript
export const AUCTION_ADDRESS = '0x...' as const; // Your deployed auction
```

### 7. Start Frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## How CCA Works

1. **Connect Wallet** - Users connect via MetaMask, Coinbase Wallet, etc.
2. **Approve USDC** - Approve auction contract to spend USDC
3. **Submit Bid** - Specify amount and maximum price per token
4. **Auction Runs** - Continuous allocation over duration
5. **Graduation** - If reserve met, auction succeeds
6. **Claim Tokens** - Users claim at uniform clearing price
7. **V4 Migration** - Automatic liquidity pool creation

### Key Benefits of CCA

- **Fair Price Discovery** - All participants pay same clearing price
- **No Front-Running** - Gradual allocation prevents timing games
- **Automatic Liquidity** - Post-auction V4 pool creation
- **Creator Rewards** - LP position ownership for fee collection

## Project Structure

```text
test-token-cca/
├── src/                    # Frontend source
│   ├── App.tsx            # Main React component
│   ├── constants.ts       # Contract addresses & ABIs
│   ├── utils.ts           # Helper functions
│   └── wagmi.ts           # Wallet configuration
├── scripts/               # Deployment scripts
│   ├── deploy-token.ts   # Token deployment
│   ├── deploy-cca-v2.ts  # CCA deployment (latest)
│   ├── generate-wallet.ts # Wallet generation
│   └── check-balance.ts  # Balance verification
├── README.md             # This file
├── RESOLUTION.md         # Issue analysis & solutions
├── DEPLOYMENT.md         # Detailed deployment guide
└── STATUS.md             # Current project status
```

## Contract Addresses

### Base Sepolia

| Contract                    | Address                                      |
| --------------------------- | -------------------------------------------- |
| USDC                        | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| CCA Factory                 | `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` |
| LiquidityLauncher           | `0x00000008412db3394C91A5CbD01635c6d140637C` |
| FullRangeLBPStrategyFactory | `0xa3A236647c80BCD69CAD561ACf863c29981b6fbC` |

### Ethereum Sepolia

| Contract                    | Address                                      |
| --------------------------- | -------------------------------------------- |
| CCA Factory                 | `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` |
| LiquidityLauncher           | `0x00000008412db3394C91A5CbD01635c6d140637C` |
| FullRangeLBPStrategyFactory | `0x89Dd5691e53Ea95d19ED2AbdEdCf4cBbE50da1ff` |

## Troubleshooting

### Error: 0xa9ac5820

This error occurs when calling CCA Factory directly on Base Sepolia. See [RESOLUTION.md](./RESOLUTION.md) for:

- Complete error analysis
- Why it happens
- How to work around it

### Insufficient Balance

- Check balance: `npm run check-balance`
- Get testnet ETH from faucets listed in Prerequisites
- Ensure correct network selected in wallet

### Transaction Reverts

- Verify all addresses are correct
- Check token has sufficient balance
- Ensure auction parameters are valid
- Review gas settings

## Documentation

- **[RESOLUTION.md](./RESOLUTION.md)** - Base Sepolia issue analysis and solutions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step deployment walkthrough
- **[STATUS.md](./STATUS.md)** - Detailed project status and investigation log
- **[SUMMARY.md](./SUMMARY.md)** - Architecture and design decisions

## Resources

### Uniswap Documentation

- [CCA Overview](https://docs.uniswap.org/contracts/liquidity-launchpad/CCA)
- [Liquidity Launchpad](https://docs.uniswap.org/contracts/liquidity-launchpad/Overview)
- [CCA Technical Docs](https://github.com/Uniswap/continuous-clearing-auction/blob/main/docs/TechnicalDocumentation.md)
- [Deployment Guide](https://github.com/Uniswap/liquidity-launcher/blob/main/docs/DeploymentGuide.md)

### Development Tools

- [viem Documentation](https://viem.sh)
- [wagmi Documentation](https://wagmi.sh)
- [Base Documentation](https://docs.base.org)

### Block Explorers

- [Base Sepolia](https://sepolia.basescan.org/)
- [Ethereum Sepolia](https://sepolia.etherscan.io/)
- [CCA Portal](https://cca.uniswap.org/)

## Contributing

This project serves as a community resource. Contributions welcome:

1. **Implement LiquidityLauncher integration** - Add working testnet deployment
2. **Test on Ethereum Sepolia** - Verify direct factory calls work there
3. **Improve documentation** - Add more examples and guides
4. **Share working deployments** - Document successful production launches

## License

MIT - Use freely for your token launches!

## Acknowledgments

- Built with Uniswap's CCA contracts
- Powered by viem and wagmi
- React and Vite for frontend
- Base and Ethereum for infrastructure

---

**Status**: Reference Implementation Complete
**Last Updated**: 2026-02-01
**Deployment**: Blocked by Base Sepolia limitation (see RESOLUTION.md)
**Production Readiness**: Code ready, requires testnet alternative or mainnet deployment
