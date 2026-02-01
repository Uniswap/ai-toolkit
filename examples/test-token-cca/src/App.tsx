import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract } from 'wagmi';
import { USDC_ADDRESS, AUCTION_ADDRESS, CCA_ABI, ERC20_ABI, AUCTION_CONFIG } from './constants';
import { formatUSDC, parseUSDC, truncateAddress, priceToQ96 } from './utils';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  const [bidAmount, setBidAmount] = useState('');
  const [maxPrice, setMaxPrice] = useState('0.001'); // Max price per token in USDC

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read USDC allowance for the auction
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, AUCTION_ADDRESS] : undefined,
  });

  // Check if auction is graduated
  const { data: isGraduated } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: CCA_ABI,
    functionName: 'isGraduated',
  });

  const handleApprove = () => {
    const amount = parseUSDC(bidAmount);
    if (amount === 0n) return;

    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [AUCTION_ADDRESS, amount],
    });
  };

  const handleBid = () => {
    const amount = parseUSDC(bidAmount);
    if (amount === 0n || !address) return;

    // Convert max price to Q96 format (USDC has 6 decimals)
    const maxPriceQ96 = priceToQ96(parseFloat(maxPrice), 6);

    writeContract({
      address: AUCTION_ADDRESS,
      abi: CCA_ABI,
      functionName: 'submitBid',
      args: [maxPriceQ96, amount, address, '0x'],
    });
  };

  const bidAmountBigInt = parseUSDC(bidAmount);
  const hasEnoughBalance = usdcBalance !== undefined && bidAmountBigInt <= usdcBalance;
  const hasApproval = allowance !== undefined && bidAmountBigInt <= allowance;

  // Check if auction address is set
  const isAuctionConfigured = AUCTION_ADDRESS !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="container">
      <header className="header">
        <h1>{AUCTION_CONFIG.tokenName}</h1>
        <p>Continuous Clearing Auction on Base Sepolia</p>
      </header>

      <div className="testnet-notice">
        This is a testnet demo. Get testnet USDC from{' '}
        <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">
          Circle Faucet
        </a>
      </div>

      {!isAuctionConfigured && (
        <div className="card">
          <h2>Setup Required</h2>
          <p style={{ color: '#a0a0a0', marginBottom: '1rem' }}>
            The auction contract has not been deployed yet. Run the deployment scripts first:
          </p>
          <code
            style={{
              display: 'block',
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            npm run deploy-token
            <br />
            npm run deploy-cca
          </code>
          <p style={{ color: '#a0a0a0', marginTop: '1rem', fontSize: '0.9rem' }}>
            Then update AUCTION_ADDRESS in src/constants.ts with the deployed address.
          </p>
        </div>
      )}

      {/* Wallet Connection */}
      <div className="card">
        <h2>Wallet</h2>
        {isConnected && address ? (
          <div className="wallet-info">
            <span className="wallet-address">{truncateAddress(address)}</span>
            <button className="disconnect-btn" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        ) : (
          <div>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                className="btn btn-secondary"
                onClick={() => connect({ connector })}
                style={{ marginBottom: '0.5rem' }}
              >
                Connect with {connector.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Auction Info */}
      <div className="card">
        <h2>Auction Details</h2>
        <div className="stat-row">
          <span className="stat-label">Token</span>
          <span className="stat-value">
            {AUCTION_CONFIG.tokenSymbol} ({AUCTION_CONFIG.tokenName})
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Total Supply</span>
          <span className="stat-value">1,000,000,000 {AUCTION_CONFIG.tokenSymbol}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Bid Currency</span>
          <span className="stat-value">USDC</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Reserve Amount</span>
          <span className="stat-value">5 USDC</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Status</span>
          <span className="stat-value">
            {isGraduated ? (
              <span className="auction-phase phase-ended">Graduated</span>
            ) : (
              <span className="auction-phase phase-active">Active</span>
            )}
          </span>
        </div>
      </div>

      {/* User Balance */}
      {isConnected && (
        <div className="card">
          <h2>Your Balance</h2>
          <div className="stat-row">
            <span className="stat-label">USDC Balance</span>
            <span className="stat-value">
              {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '...'} USDC
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Approved for Auction</span>
            <span className="stat-value">
              {allowance !== undefined ? formatUSDC(allowance) : '...'} USDC
            </span>
          </div>
        </div>
      )}

      {/* Bid Form */}
      {isConnected && isAuctionConfigured && (
        <div className="card">
          <h2>Place a Bid</h2>
          <div className="input-group">
            <label>Bid Amount (USDC)</label>
            <input
              type="number"
              placeholder="Enter USDC amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="input-group">
            <label>Max Price per Token (USDC)</label>
            <input
              type="number"
              placeholder="Max price you'll pay per token"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
              step="0.000001"
            />
            <small style={{ color: '#a0a0a0', marginTop: '0.25rem', display: 'block' }}>
              Your bid will be included if clearing price is at or below this
            </small>
          </div>

          {!hasApproval && bidAmountBigInt > 0n ? (
            <button
              className="btn btn-primary"
              onClick={handleApprove}
              disabled={isPending || !hasEnoughBalance}
            >
              {isPending ? 'Approving...' : 'Approve USDC'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleBid}
              disabled={isPending || bidAmountBigInt === 0n || !hasEnoughBalance}
            >
              {isPending ? 'Submitting Bid...' : 'Submit Bid'}
            </button>
          )}

          {!hasEnoughBalance && bidAmountBigInt > 0n && (
            <div className="status error">Insufficient USDC balance</div>
          )}

          {isSuccess && <div className="status success">Transaction submitted successfully!</div>}

          {isError && (
            <div className="status error">Error: {error?.message || 'Transaction failed'}</div>
          )}
        </div>
      )}

      {/* How It Works */}
      <div className="card">
        <h2>How CCA Works</h2>
        <ol style={{ paddingLeft: '1.5rem', color: '#a0a0a0', lineHeight: '1.8' }}>
          <li>Connect your wallet and ensure you have testnet USDC</li>
          <li>Enter the amount of USDC you want to bid</li>
          <li>Set your maximum price per token (you may pay less)</li>
          <li>Approve USDC spending, then submit your bid</li>
          <li>If the auction graduates (reaches 5 USDC), claim your tokens</li>
          <li>All participants pay the same clearing price - no front-running!</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
