# UnCollateral

**Undercollateralized Lending Protocol powered by Social Reputation**

UnCollateral is a decentralized lending platform that enables borrowers to get loans with reduced collateral requirements by leveraging their verified social reputation on Twitter. Using Reclaim Protocol's zero-knowledge proofs, users can prove their social metrics without exposing private data.

## Overview

Traditional DeFi lending requires 150%+ collateralization, making it capital-inefficient. UnCollateral solves this by:

- **Dynamic Collateralization**: Borrow with 50-150% collateral based on your reputation score
- **Privacy-Preserving Verification**: Use Reclaim Protocol to prove Twitter metrics via ZK proofs
- **Reputation-Based Interest Rates**: Better reputation = lower interest rates (5-15% APR)
- **Lender Protection**: Partial collateral + insurance pool coverage
- **Social Consequences**: Defaulters get blacklisted, protecting the protocol

## Architecture

### Smart Contracts

1. **ReputationManager** (`contracts/src/ReputationManager.sol`)
   - Verifies Reclaim Protocol proofs of Twitter data
   - Calculates reputation scores (0-1000 scale) based on:
     - Follower count (max 300 points)
     - Engagement rate (max 400 points)
     - Account age (max 200 points)
     - Following ratio (max 100 points)
   - Determines required collateral ratios
   - Manages blacklist for defaulters

2. **LendingPool** (`contracts/src/LendingPool.sol`)
   - Manages liquidity pool for lenders
   - Handles deposits and withdrawals
   - Distributes interest to lenders
   - Tracks available liquidity

3. **LoanManager** (`contracts/src/LoanManager.sol`)
   - Creates and manages loans
   - Calculates interest based on reputation
   - Handles repayments
   - Liquidates defaulted loans

4. **InsurancePool** (`contracts/src/InsurancePool.sol`)
   - Provides coverage for under-collateralized defaults
   - Funded by protocol fees
   - Protects lenders from losses

### Reputation Scoring Formula

```
Score = Follower Score (300) + Engagement Score (400) + Age Score (200) + Ratio Score (100)

Collateral Required:
- Score 800-1000: 50-70% collateral
- Score 500-799: 90-120% collateral
- Score 300-499: 130-150% collateral
- Score < 300: Loan rejected
```

### Interest Rates

- **High Reputation (≥800)**: 5% APR
- **Medium Reputation (500-799)**: 10% APR
- **Low Reputation (300-499)**: 15% APR

## Project Structure

```
UnCollateral/
├── contracts/              # Foundry smart contracts
│   ├── src/
│   │   ├── ReputationManager.sol
│   │   ├── LendingPool.sol
│   │   ├── LoanManager.sol
│   │   ├── InsurancePool.sol
│   │   └── interfaces/
│   │       └── IReclaim.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   ├── test/
│   ├── foundry.toml
│   └── .env.example
├── frontend/              # Basic HTML/CSS/JS frontend
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── package.json
│   └── .env.example
├── docs/                  # Documentation
└── README.md
```

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js and npm (for frontend)
- MetaMask or compatible Web3 wallet

### Smart Contract Setup

1. **Navigate to contracts directory**:
   ```bash
   cd contracts
   ```

2. **Install dependencies**:
   ```bash
   forge install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Compile contracts**:
   ```bash
   forge build
   ```

5. **Run tests** (when available):
   ```bash
   forge test
   ```

6. **Deploy contracts**:
   ```bash
   forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Add your Reclaim App ID and deployed contract addresses
   ```

3. **Install dependencies** (optional, for Reclaim SDK):
   ```bash
   npm install
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   ```
   http://localhost:8000
   ```

## Reclaim Protocol Integration

### Getting Started with Reclaim

1. **Register your app**: Visit [Reclaim Developer Dashboard](https://dev.reclaimprotocol.org)

2. **Get credentials**:
   - APP_ID
   - APP_SECRET (keep secure, backend only)
   - PROVIDER_ID for Twitter analytics

3. **Configure Twitter provider**:
   - Set up Twitter API data extraction
   - Define metrics: followers, following, engagement
   - Get provider hash for smart contract verification

4. **Integration flow**:
   ```
   User → Generate Proof (Reclaim SDK) → Submit to Contract → Verify & Score
   ```

### Supported Networks

Reclaim Protocol is deployed on:
- Ethereum Mainnet: `0xA2bFF333d2E5468cF4dc6194EB4B5DdeFA2625C0`
- Arbitrum, Polygon, Optimism, Base, and more

See [Reclaim Docs](https://docs.reclaimprotocol.org/onchain/solidity/supported-networks) for full list.

## Usage Guide

### For Borrowers

1. **Verify Reputation**:
   - Connect wallet
   - Click "Verify Twitter Account"
   - Generate Reclaim proof of your Twitter data
   - Submit proof on-chain
   - Receive reputation score

2. **Request Loan**:
   - Navigate to "Borrow" tab
   - Enter loan amount and duration
   - See required collateral (reduced based on reputation)
   - Approve collateral token
   - Request loan

3. **Repay Loan**:
   - Go to "My Loans"
   - Select active loan
   - Approve repayment amount
   - Repay to get collateral back

### For Lenders

1. **Deposit Liquidity**:
   - Navigate to "Lend" tab
   - Enter deposit amount
   - Approve lending token
   - Deposit to pool

2. **Earn Interest**:
   - Interest is distributed proportionally
   - View earned interest in dashboard

3. **Withdraw**:
   - Enter withdraw amount (0 = all)
   - Withdraw principal + interest

## Security Considerations

### Smart Contract Security

- OpenZeppelin contracts for standard implementations
- ReentrancyGuard on all state-changing functions
- Ownable for admin functions
- Proper access control on sensitive operations

### Recommendations

- Audit contracts before mainnet deployment
- Test thoroughly on testnets
- Implement emergency pause functionality
- Set up monitoring and alerts
- Use multi-sig for admin functions

### Known Limitations

- Reputation data needs periodic refresh (30-day validity)
- Oracle dependency on Reclaim Protocol
- Market risk for collateral value changes
- Smart contract risks (audit recommended)

## Development Roadmap

- [ ] Unit tests for all contracts
- [ ] Integration tests with Reclaim Protocol
- [ ] Gas optimization
- [ ] Frontend enhancement with React/Vue
- [ ] Additional reputation sources (GitHub, LinkedIn)
- [ ] Credit scoring algorithm improvements
- [ ] Multi-collateral support
- [ ] Liquidation bot implementation
- [ ] Governance token and DAO
- [ ] Mobile app

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Resources

- [Reclaim Protocol Documentation](https://docs.reclaimprotocol.org)
- [Foundry Book](https://book.getfoundry.sh)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum Developer Resources](https://ethereum.org/en/developers/)

## Support

For questions and support:
- Open an issue on GitHub
- Contact the Reclaim Protocol team on [Telegram](https://t.me/reclaimprotocol)

## Disclaimer

This is experimental software. Use at your own risk. Not audited. Not financial advice.
