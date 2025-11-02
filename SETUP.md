# Quick Setup Guide

Get UnCollateral running in 5 minutes.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Node.js & npm (optional, for frontend)
- MetaMask wallet
- Some test ETH (for testnet deployment)

## 1. Clone & Install

```bash
# If not already cloned
git clone <your-repo-url>
cd UnCollateral

# Install contract dependencies
cd contracts
forge install
```

## 2. Configure Contracts

```bash
# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required variables:**
```bash
# Your deployer private key (testnet)
PRIVATE_KEY=0x...

# Reclaim Protocol contract (Sepolia)
RECLAIM_CONTRACT_ADDRESS=0x...

# Token addresses (Sepolia testnet)
LENDING_TOKEN_ADDRESS=0x...      # USDC or mock token
COLLATERAL_TOKEN_ADDRESS=0x...   # WETH or mock token

# RPC URL
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Etherscan API (for verification)
ETHERSCAN_API_KEY=your-key-here
```

## 3. Build & Test

```bash
# Build contracts
forge build

# Run tests
forge test -vv

# Check everything works
forge test --gas-report
```

## 4. Deploy to Testnet

```bash
# Deploy to Sepolia
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify

# Save the deployed addresses!
```

**Copy deployment output:**
```
ReputationManager: 0x...
LendingPool: 0x...
InsurancePool: 0x...
LoanManager: 0x...
```

## 5. Setup Frontend

```bash
# Navigate to frontend
cd ../frontend

# Create environment file
cp .env.example .env

# Edit with your deployed addresses
nano .env
```

**Update frontend/.env:**
```bash
# Reclaim Protocol
VITE_RECLAIM_APP_ID=your-reclaim-app-id
VITE_RECLAIM_PROVIDER_ID=twitter-analytics

# Deployed contract addresses (from step 4)
VITE_REPUTATION_MANAGER_ADDRESS=0x...
VITE_LENDING_POOL_ADDRESS=0x...
VITE_LOAN_MANAGER_ADDRESS=0x...
VITE_INSURANCE_POOL_ADDRESS=0x...
VITE_LENDING_TOKEN_ADDRESS=0x...
VITE_COLLATERAL_TOKEN_ADDRESS=0x...

# Network
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
```

**Update frontend/app.js** (lines 6-12):
```javascript
const CONFIG = {
    REPUTATION_MANAGER: '0x...', // Your deployed address
    LENDING_POOL: '0x...',       // Your deployed address
    LOAN_MANAGER: '0x...',       // Your deployed address
    // ... etc
};
```

## 6. Run Frontend

```bash
# Option 1: Using npm
npm install
npm run dev

# Option 2: Using Python
python3 -m http.server 8000

# Option 3: Using Node
npx http-server -p 8000
```

Open http://localhost:8000

## 7. Get Test Tokens

### Get Sepolia ETH
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

### Get Test USDC & WETH
- Deploy mock tokens OR
- Use existing testnet tokens OR
- Contact team for test tokens

## 8. Test the Platform

### As a Borrower:
1. Connect MetaMask to Sepolia
2. Go to "Verify Reputation" tab
3. Verify your Twitter (requires Reclaim setup)
4. Go to "Borrow" tab
5. Request a small test loan

### As a Lender:
1. Go to "Lend" tab
2. Approve USDC
3. Deposit some USDC
4. See it appear in pool stats

## Quick Commands (Using Makefile)

```bash
# Complete setup
make setup

# Build contracts
make build

# Run tests
make test

# Deploy to testnet
make deploy-sepolia

# Start frontend
make frontend

# Run everything
make dev
```

## Troubleshooting

### "Compiler not found"
```bash
foundryup  # Update Foundry
```

### "Insufficient funds"
```bash
# Get testnet ETH from faucet
# Check you're on Sepolia network
```

### "MetaMask not connecting"
```bash
# Add Sepolia network to MetaMask
Network: Sepolia
RPC: https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY
Chain ID: 11155111
```

### "Contracts not deploying"
```bash
# Check .env has correct values
# Verify you have ETH for gas
# Check RPC_URL is accessible
```

## Reclaim Protocol Setup

1. Go to https://dev.reclaimprotocol.org
2. Create account & get API key
3. Create Twitter provider
4. Copy APP_ID and APP_SECRET
5. Add to frontend/.env

**Note:** For testing, you can mock Reclaim verification in contracts/test/

## Local Development (No Deployment)

```bash
# Terminal 1: Start local chain
anvil

# Terminal 2: Deploy locally
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Terminal 3: Start frontend
cd frontend
npm run dev
```

## Production Deployment

**⚠️ DO NOT deploy to mainnet without:**
1. ✅ Professional security audit
2. ✅ Extensive testnet testing
3. ✅ Multi-sig wallet setup
4. ✅ Insurance pool funded
5. ✅ Monitoring in place

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

## Next Steps

- ✅ Read [README.md](README.md) for full overview
- ✅ Check [docs/API.md](docs/API.md) for contract API
- ✅ Review [docs/SECURITY.md](docs/SECURITY.md)
- ✅ Join Discord/Telegram for support
- ✅ Star the repo ⭐

## Support

- Documentation: `/docs` folder
- Issues: GitHub Issues
- Community: Discord/Telegram
- Email: support@uncollateral.app

---

**Estimated setup time: 5-10 minutes** ⏱️
