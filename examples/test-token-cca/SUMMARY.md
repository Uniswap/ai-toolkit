# TEST_Token CCA Project Summary

## What We Built

A complete end-to-end solution for launching a memecoin via Uniswap's Continuous Clearing Auction (CCA) on Base Sepolia testnet.

## Project Components

### 1. Smart Contract Deployment Scripts

**`scripts/deploy-token.ts`**

- Deploys a simple ERC-20 token (TEST_Token)
- 1 billion token supply
- Includes comprehensive logging and error handling
- Outputs token address for next step

**`scripts/deploy-cca.ts`**

- Creates CCA via factory at `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5`
- Configures auction parameters (duration, reserve, floor price)
- Transfers tokens to auction contract
- Notifies auction of token receipt
- Outputs auction address for frontend

**`scripts/generate-wallet.ts`**

- Generates a new test wallet with private key
- Displays faucet links for funding
- For testnet use only

**`scripts/check-balance.ts`**

- Checks ETH balance on Base Sepolia
- Verifies wallet is ready for deployment
- Provides faucet links if unfunded

### 2. React Frontend (`src/`)

**`src/App.tsx`**

- Main application component
- Wallet connection UI (MetaMask, Coinbase Wallet)
- Bid submission form with USDC approval flow
- Real-time auction status display
- Balance monitoring
- Educational "How CCA Works" section

**`src/wagmi.ts`**

- Wallet configuration using wagmi v2
- Base Sepolia network setup
- Multiple wallet connector support

**`src/constants.ts`**

- Contract addresses (USDC, CCA Factory, Auction)
- ABIs for contract interactions
- Auction configuration parameters
- Q96 constant for price calculations

**`src/utils.ts`**

- Price conversion helpers (Q96 format)
- USDC formatting and parsing
- Address truncation utilities

**`src/index.css`**

- Modern gradient design
- Card-based layout
- Responsive styling
- Status indicators and animations

### 3. Documentation

**`README.md`**

- Quick start guide
- Project overview
- Installation instructions
- Contract addresses reference

**`DEPLOYMENT.md`**

- Step-by-step deployment walkthrough
- Wallet setup with generated keys
- Faucet instructions
- Configuration guidelines
- Troubleshooting section

**`SUMMARY.md`** (this file)

- Complete project overview
- Technology stack
- Architecture decisions

## Technology Stack

| Layer              | Technology            | Purpose                     |
| ------------------ | --------------------- | --------------------------- |
| Blockchain         | Base Sepolia          | Testnet for EVM deployment  |
| Smart Contracts    | Solidity + viem       | ERC-20, CCA Factory         |
| Frontend Framework | React 18 + TypeScript | UI development              |
| Build Tool         | Vite                  | Fast development & bundling |
| Wallet Integration | wagmi v2              | React hooks for wallets     |
| Blockchain Client  | viem v2               | Type-safe Ethereum library  |
| State Management   | @tanstack/react-query | Async state & caching       |

## Architecture Decisions

### Why Base Sepolia?

- **Fast blocks**: 2-second block time (vs 12s on Ethereum)
- **Free faucets**: Coinbase and Circle provide test tokens
- **Real-world simulation**: Same L2 architecture as Base mainnet
- **Lower gas costs**: Cheaper to test auction mechanics

### Why CCA over Bonding Curves?

| Feature         | CCA                 | Bonding Curve (Pump.fun) |
| --------------- | ------------------- | ------------------------ |
| Price Discovery | Gradual, fair       | Immediate, volatile      |
| Front-running   | Protected           | Vulnerable               |
| Creator Revenue | 100% LP fees        | 0% (platform takes fees) |
| Liquidity       | Auto-migrates to V4 | Manual migration         |

### Why USDC as Bid Currency?

- **Stable pricing**: Easy to reason about token valuation
- **Testnet availability**: Circle provides free testnet USDC
- **Real-world relevance**: Most auctions use stablecoins
- **6 decimals**: Different from ETH (18), demonstrates flexibility

## Auction Configuration Explained

```typescript
const AUCTION_CONFIG = {
  tokenName: 'TEST_Token',
  tokenSymbol: 'TEST',
  totalSupply: 1_000_000_000n * 10n ** 18n, // 1B tokens
  reserveAmount: 5_000_000n, // 5 USDC (6 decimals)
  floorPricePerToken: 0.000001, // $0.000001/token
  durationBlocks: 1800, // ~1 hour (2s blocks)
};
```

**Key Parameters:**

- **Total Supply**: 1 billion tokens (standard for memecoins)
- **Reserve**: 5 USDC minimum to "graduate" (low for testing)
- **Floor Price**: Very low to allow easy participation
- **Duration**: 1 hour for quick testing (vs days for production)

## Auction Lifecycle

```
1. Deploy Token
   ↓
2. Deploy CCA (transfers all tokens)
   ↓
3. Auction Opens (users can bid)
   ↓
4. Auction Runs (~1 hour)
   ↓
5. Check Graduation (≥5 USDC raised?)
   ├─ Yes → Can claim tokens
   └─ No → Auction failed
   ↓
6. Migration to V4 (after claimBlock + 100)
   ↓
7. Trading begins (Uniswap V4 pool)
```

## Generated Wallet (Testnet Only!)

```
Address: 0x650906cC956f2f44672eAc08986ab9cD3c84556B
Private Key: 0xaeefabc02784bb39dce3077f699566c1119b7286b535068d24d5ff4069100339
```

**⚠️ NEVER use this wallet for mainnet!**

## npm Scripts Reference

| Script                    | Command              | Purpose                            |
| ------------------------- | -------------------- | ---------------------------------- |
| `npm run generate-wallet` | Generate test wallet | Create new private key for testing |
| `npm run check-balance`   | Check wallet balance | Verify funds before deployment     |
| `npm run deploy-token`    | Deploy TEST_Token    | Step 1: Create ERC-20 token        |
| `npm run deploy-cca`      | Deploy CCA           | Step 2: Create auction for token   |
| `npm run dev`             | Start frontend       | Run React app locally              |
| `npm run build`           | Build for production | Create optimized build             |

## Contract Addresses (Base Sepolia)

| Contract             | Address                                      | Purpose             |
| -------------------- | -------------------------------------------- | ------------------- |
| USDC                 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Bid currency        |
| CCA Factory          | `0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5` | Auction creation    |
| LBP Strategy Factory | `0xa3A236647c80BCD69CAD561ACf863c29981b6fbC` | V4 pool migration   |
| Liquidity Launcher   | `0x00000008412db3394C91A5CbD01635c6d140637C` | Full launchpad flow |

## Frontend Features

### Wallet Management

- Multi-wallet support (MetaMask, Coinbase Wallet, WalletConnect)
- Auto-detect connected wallet
- Display address and balances
- One-click disconnect

### Bidding Interface

- Enter USDC amount to bid
- Set maximum price per token
- Two-step approval flow (approve + bid)
- Real-time balance checks
- Clear error messages

### Status Display

- Auction details (token, reserve, currency)
- Current graduation status
- User balances (USDC, approval amount)
- Transaction feedback (success/error/pending)

### Educational Content

- "How CCA Works" explainer
- Step-by-step instructions
- Link to testnet faucets

## Testing Workflow

1. **Generate wallet**: `npm run generate-wallet`
2. **Fund wallet**: Visit faucets for ETH and USDC
3. **Check balance**: `npm run check-balance`
4. **Deploy token**: `npm run deploy-token`
5. **Deploy CCA**: `npm run deploy-cca`
6. **Update constants**: Edit `src/constants.ts`
7. **Start frontend**: `npm run dev`
8. **Connect wallet**: Import private key to MetaMask
9. **Place bids**: Test the auction flow
10. **Monitor status**: Check graduation and claims

## Next Steps for Production

### Before Mainnet Deployment

- [ ] Audit smart contracts thoroughly
- [ ] Test with multiple wallets and scenarios
- [ ] Increase auction duration (3-7 days typical)
- [ ] Raise reserve amount (based on funding goals)
- [ ] Add validation hooks if needed (KYC, allowlist)
- [ ] Set up monitoring and analytics
- [ ] Prepare marketing materials
- [ ] Plan migration to V4 pool
- [ ] Consider timelock on LP position
- [ ] Set up keeper bot for migration

### Configuration Changes for Production

```typescript
// Production configuration example
const PRODUCTION_CONFIG = {
  // Mainnet or Base
  network: 'base',

  // Longer auction
  durationBlocks: 43200, // ~1 day on Base (2s blocks)

  // Higher reserve
  requiredRaise: parseUnits('10000', 6), // $10k minimum

  // Meaningful floor price
  floorPricePerToken: 0.01, // $0.01/token

  // Validation hook for compliance
  validationHook: KYC_HOOK_ADDRESS,
};
```

## Resources

### Uniswap Documentation

- [CCA Whitepaper](https://docs.uniswap.org/whitepaper_cca.pdf)
- [Liquidity Launchpad](https://docs.uniswap.org/contracts/liquidity-launchpad/Overview)
- [CCA Technical Docs](https://github.com/Uniswap/continuous-clearing-auction/blob/main/docs/TechnicalDocumentation.md)

### Development Tools

- [viem Documentation](https://viem.sh)
- [wagmi Documentation](https://wagmi.sh)
- [Base Documentation](https://docs.base.org)

### Block Explorers

- [BaseScan Sepolia](https://sepolia.basescan.org/)
- [CCA Portal](https://cca.uniswap.org/)

### Faucets

- [Coinbase Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Circle USDC Faucet](https://faucet.circle.com/)

## Code Quality

This project follows best practices:

- ✓ TypeScript for type safety
- ✓ ESLint and Prettier configured
- ✓ Modern React patterns (hooks, functional components)
- ✓ Comprehensive error handling
- ✓ Clear code comments and documentation
- ✓ Responsive design
- ✓ Security-first approach (no hardcoded keys in code)

## Project Structure

```
test-token-cca/
├── src/                    # Frontend source code
│   ├── App.tsx            # Main React component
│   ├── main.tsx           # App entry point
│   ├── wagmi.ts           # Wallet configuration
│   ├── constants.ts       # Contract addresses & ABIs
│   ├── utils.ts           # Helper functions
│   └── index.css          # Styling
├── scripts/               # Deployment scripts
│   ├── deploy-token.ts   # Token deployment
│   ├── deploy-cca.ts     # CCA deployment
│   ├── generate-wallet.ts # Wallet generation
│   └── check-balance.ts  # Balance checker
├── public/                # Static assets
├── index.html            # HTML entry point
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
├── README.md             # Project overview
├── DEPLOYMENT.md         # Deployment guide
├── SUMMARY.md            # This file
└── .gitignore            # Git exclusions
```

## License

MIT - Use freely for your own token launches!

## Acknowledgments

Built using:

- Uniswap's CCA contracts and documentation
- viem and wagmi by Paradigm/Wevm
- React and Vite by respective maintainers
- Base Sepolia testnet by Coinbase

---

**Happy launching! 🚀**
