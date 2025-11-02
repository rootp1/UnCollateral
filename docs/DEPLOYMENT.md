# Deployment Guide

This guide walks through deploying UnCollateral contracts to Ethereum or any EVM-compatible chain.

## Prerequisites

- Foundry installed
- RPC endpoint (Alchemy, Infura, or local node)
- Deployer wallet with ETH for gas
- Reclaim Protocol contract address for your network
- Token addresses (lending token and collateral token)

## Step 1: Configure Environment

Create a `.env` file in the `contracts/` directory:

```bash
cd contracts
cp .env.example .env
```

Edit `.env` with your values:

```bash
PRIVATE_KEY=your_deployer_private_key_here
RECLAIM_CONTRACT_ADDRESS=0xA2bFF333d2E5468cF4dc6194EB4B5DdeFA2625C0
LENDING_TOKEN_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48  # USDC
COLLATERAL_TOKEN_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2  # WETH
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Step 2: Get Reclaim Contract Address

Find the Reclaim Protocol contract for your target network:

- **Ethereum Mainnet**: `0xA2bFF333d2E5468cF4dc6194EB4B5DdeFA2625C0`
- **Arbitrum**: Check [Reclaim Docs](https://docs.reclaimprotocol.org/onchain/solidity/supported-networks)
- **Polygon**: Check [Reclaim Docs](https://docs.reclaimprotocol.org/onchain/solidity/supported-networks)
- **Base**: Check [Reclaim Docs](https://docs.reclaimprotocol.org/onchain/solidity/supported-networks)

## Step 3: Compile Contracts

```bash
forge build
```

Ensure all contracts compile without errors.

## Step 4: Test Locally (Optional but Recommended)

Run tests on a local fork:

```bash
forge test --fork-url $RPC_URL -vv
```

## Step 5: Deploy to Testnet First

Deploy to Sepolia or other testnet:

```bash
forge script script/Deploy.s.sol --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY --broadcast --verify
```

Test the deployment:
1. Verify contracts on Etherscan
2. Test reputation verification
3. Test loan creation
4. Test deposits and withdrawals

## Step 6: Deploy to Mainnet

**⚠️ IMPORTANT**: Triple-check all addresses and test thoroughly on testnet first!

```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify --slow
```

The `--slow` flag adds delays between transactions to avoid nonce issues.

## Step 7: Verify Contracts

If auto-verification fails, manually verify each contract:

```bash
forge verify-contract \
  --chain-id 1 \
  --compiler-version v0.8.20 \
  --constructor-args $(cast abi-encode "constructor(address)" $RECLAIM_ADDRESS) \
  $CONTRACT_ADDRESS \
  src/ReputationManager.sol:ReputationManager \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

Repeat for each contract: `LendingPool`, `InsurancePool`, `LoanManager`

## Step 8: Post-Deployment Configuration

After deployment, you need to:

1. **Set up LoanManager connections**:
   ```bash
   cast send $LENDING_POOL_ADDRESS "setLoanManager(address)" $LOAN_MANAGER_ADDRESS --private-key $PRIVATE_KEY --rpc-url $RPC_URL
   cast send $INSURANCE_POOL_ADDRESS "setLoanManager(address)" $LOAN_MANAGER_ADDRESS --private-key $PRIVATE_KEY --rpc-url $RPC_URL
   ```

2. **Seed Insurance Pool** (optional):
   ```bash
   # First approve tokens
   cast send $LENDING_TOKEN_ADDRESS "approve(address,uint256)" $INSURANCE_POOL_ADDRESS 100000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL

   # Then deposit
   cast send $INSURANCE_POOL_ADDRESS "depositFunds(uint256)" 100000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL
   ```

3. **Update Frontend Configuration**:
   - Copy deployed addresses to `frontend/.env`
   - Update `app.js` CONFIG object

## Step 9: Security Setup

1. **Transfer Ownership** (if using multi-sig):
   ```bash
   cast send $REPUTATION_MANAGER "transferOwnership(address)" $MULTISIG_ADDRESS --private-key $PRIVATE_KEY --rpc-url $RPC_URL
   ```

2. **Set up monitoring** for:
   - Large loans
   - Defaults
   - Insurance pool balance
   - Unusual reputation updates

3. **Configure alerts** for protocol health metrics

## Deployed Contract Addresses

After deployment, record addresses here:

```
Network: [Ethereum Mainnet / Arbitrum / etc]
Deployed: [Date]

ReputationManager: 0x...
LendingPool: 0x...
LoanManager: 0x...
InsurancePool: 0x...

Lending Token: 0x... (USDC)
Collateral Token: 0x... (WETH)
Reclaim Contract: 0x...
```

## Troubleshooting

### "Insufficient funds" error
- Ensure deployer wallet has enough ETH for gas
- Estimate gas: `forge script script/Deploy.s.sol --rpc-url $RPC_URL`

### "Nonce too low" error
- Add `--slow` flag to deployment command
- Or manually specify: `--legacy --slow`

### Verification fails
- Wait a few minutes and try again
- Check Etherscan API key is correct
- Manually verify via Etherscan UI

### Constructor arguments mismatch
- Ensure all addresses in `.env` are correct
- Double-check token decimals match expectations

## Gas Estimates

Approximate gas costs (at 20 gwei):

- ReputationManager: ~2.5M gas (~0.05 ETH)
- LendingPool: ~3M gas (~0.06 ETH)
- InsurancePool: ~1.5M gas (~0.03 ETH)
- LoanManager: ~4M gas (~0.08 ETH)

**Total**: ~11M gas (~0.22 ETH)

## Next Steps

After successful deployment:

1. Integrate with frontend
2. Test all user flows
3. Set up analytics/monitoring
4. Prepare documentation for users
5. Consider getting a security audit
6. Launch marketing campaign
