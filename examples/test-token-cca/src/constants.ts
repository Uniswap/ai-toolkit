// Base Sepolia USDC address
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

// CCA Factory (same on all chains)
export const CCA_FACTORY_ADDRESS = '0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5' as const;

// Base Sepolia FullRangeLBPStrategyFactory
export const LBP_STRATEGY_FACTORY = '0xa3A236647c80BCD69CAD561ACf863c29981b6fbC' as const;

// LiquidityLauncher (same on all chains)
export const LIQUIDITY_LAUNCHER = '0x00000008412db3394C91A5CbD01635c6d140637C' as const;

// PLACEHOLDER: Replace with your deployed auction address after running deploy script
export const AUCTION_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Q96 constant for price calculations
export const Q96 = 2n ** 96n;

// USDC has 6 decimals
export const USDC_DECIMALS = 6;

// Auction configuration for TEST_Token
export const AUCTION_CONFIG = {
  tokenName: 'TEST_Token',
  tokenSymbol: 'TEST',
  totalSupply: 1_000_000_000n * 10n ** 18n, // 1 billion tokens
  reserveAmount: 5_000_000n, // 5 USDC (in 6 decimal units)
  floorPricePerToken: 0.000001, // Very low floor price for testing
  durationBlocks: 1800, // ~1 hour on Base Sepolia (2s blocks)
};

// CCA ABI for interacting with the auction
export const CCA_ABI = [
  {
    name: 'submitBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'maxPrice', type: 'uint256' },
      { name: 'amount', type: 'uint128' },
      { name: 'owner', type: 'address' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [{ name: 'bidId', type: 'uint256' }],
  },
  {
    name: 'exitBid',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'bidId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'bidId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'isGraduated',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'checkpoint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

// ERC20 ABI for USDC approval
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;
