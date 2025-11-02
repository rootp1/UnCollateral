# Integration Guide

How to integrate UnCollateral into your application.

## Frontend Integration

### 1. Install Dependencies

```bash
npm install ethers @reclaimprotocol/js-sdk
```

### 2. Import Contract ABIs

```javascript
import { ethers } from 'ethers';
import ReputationManagerABI from './abis/ReputationManager.json';
import LoanManagerABI from './abis/LoanManager.json';
import LendingPoolABI from './abis/LendingPool.json';
```

### 3. Connect to Contracts

```javascript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const reputationManager = new ethers.Contract(
    REPUTATION_MANAGER_ADDRESS,
    ReputationManagerABI,
    signer
);

const loanManager = new ethers.Contract(
    LOAN_MANAGER_ADDRESS,
    LoanManagerABI,
    signer
);

const lendingPool = new ethers.Contract(
    LENDING_POOL_ADDRESS,
    LendingPoolABI,
    signer
);
```

### 4. Implement Reclaim Integration

```javascript
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

async function verifyTwitterReputation() {
    // Initialize Reclaim (get config from backend for security)
    const config = await fetch('/api/reclaim/config').then(r => r.json());

    const proofRequest = await ReclaimProofRequest.init(
        config.appId,
        config.providerId,
        config.requestUrl
    );

    // Start verification flow
    await proofRequest.startSession({
        onSuccess: async (proofs) => {
            // Extract Twitter data from proofs
            const twitterData = parseTwitterData(proofs);

            // Submit to smart contract
            const tx = await reputationManager.verifyAndUpdateReputation(
                proofs.proof,
                twitterData.followers,
                twitterData.following,
                twitterData.engagement,
                twitterData.accountAge
            );

            await tx.wait();
            console.log('Reputation verified!');
        },
        onFailure: (error) => {
            console.error('Verification failed:', error);
        }
    });
}
```

### 5. Request a Loan

```javascript
async function requestLoan(amount, collateral, duration) {
    // Check reputation first
    const isValid = await reputationManager.isReputationValid(userAddress);
    if (!isValid) {
        throw new Error('Please verify your reputation first');
    }

    // Get required collateral
    const requiredRatio = await reputationManager.getRequiredCollateralRatio(userAddress);
    const minCollateral = amount.mul(requiredRatio).div(10000);

    if (collateral.lt(minCollateral)) {
        throw new Error(`Insufficient collateral. Need at least ${ethers.utils.formatUnits(minCollateral, 6)} USDC worth`);
    }

    // Approve collateral
    const collateralToken = new ethers.Contract(
        COLLATERAL_TOKEN_ADDRESS,
        ERC20_ABI,
        signer
    );

    const approveTx = await collateralToken.approve(
        LOAN_MANAGER_ADDRESS,
        collateral
    );
    await approveTx.wait();

    // Request loan
    const loanTx = await loanManager.requestLoan(amount, collateral, duration);
    const receipt = await loanTx.wait();

    // Get loan ID from events
    const event = receipt.events.find(e => e.event === 'LoanCreated');
    const loanId = event.args.loanId;

    return loanId;
}
```

### 6. Listen to Events

```javascript
// Listen for new loans
loanManager.on('LoanCreated', (loanId, borrower, principal, collateral, rate, duration) => {
    console.log('New loan:', {
        loanId: loanId.toString(),
        borrower,
        principal: ethers.utils.formatUnits(principal, 6),
        collateral: ethers.utils.formatEther(collateral)
    });
});

// Listen for reputation updates
reputationManager.on('ReputationUpdated', (user, score, followers, engagement) => {
    console.log('Reputation updated:', {
        user,
        score: score.toString(),
        followers: followers.toString()
    });
});
```

## Backend Integration

### 1. Secure Reclaim Configuration

```javascript
// backend/routes/reclaim.js
const express = require('express');
const { ReclaimProofRequest } = require('@reclaimprotocol/js-sdk');

const router = express.Router();

router.get('/config', async (req, res) => {
    // Initialize Reclaim on backend to keep APP_SECRET secure
    const proofRequest = await ReclaimProofRequest.init(
        process.env.RECLAIM_APP_ID,
        process.env.RECLAIM_APP_SECRET,
        process.env.RECLAIM_PROVIDER_ID
    );

    // Generate request URL
    const requestUrl = await proofRequest.getRequestUrl();

    res.json({
        appId: process.env.RECLAIM_APP_ID,
        providerId: process.env.RECLAIM_PROVIDER_ID,
        requestUrl
    });
});

module.exports = router;
```

### 2. Monitor Contract Events

```javascript
const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const loanManager = new ethers.Contract(
    LOAN_MANAGER_ADDRESS,
    LOAN_MANAGER_ABI,
    provider
);

// Monitor for defaults
loanManager.on('LoanDefaulted', async (loanId, borrower) => {
    console.log(`Loan ${loanId} defaulted by ${borrower}`);

    // Send notifications
    await sendEmail(borrower, 'Loan Defaulted');
    await sendDiscordAlert(`Loan ${loanId} defaulted`);

    // Update analytics
    await analytics.trackDefault(loanId, borrower);
});
```

### 3. Liquidation Bot

```javascript
const { ethers } = require('ethers');

async function checkForLiquidations() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const loanManager = new ethers.Contract(
        LOAN_MANAGER_ADDRESS,
        LOAN_MANAGER_ABI,
        wallet
    );

    // Get all active loans (you'd need to implement this)
    const activeLoans = await getAllActiveLoans();

    for (const loanId of activeLoans) {
        const loan = await loanManager.getLoan(loanId);

        // Check if expired
        if (loan.active &&
            block.timestamp > loan.startTime.add(loan.duration)) {

            console.log(`Liquidating loan ${loanId}...`);

            try {
                const tx = await loanManager.liquidateLoan(loanId);
                await tx.wait();
                console.log(`Loan ${loanId} liquidated successfully`);
            } catch (error) {
                console.error(`Failed to liquidate loan ${loanId}:`, error);
            }
        }
    }
}

// Run every hour
setInterval(checkForLiquidations, 3600000);
```

## Analytics Integration

### Track Protocol Metrics

```javascript
async function getProtocolStats() {
    const [deposits, loaned, liquidity, interest] =
        await lendingPool.getPoolStats();

    const utilizationRate = loaned.mul(10000).div(deposits);

    return {
        totalDeposits: ethers.utils.formatUnits(deposits, 6),
        totalLoaned: ethers.utils.formatUnits(loaned, 6),
        availableLiquidity: ethers.utils.formatUnits(liquidity, 6),
        interestEarned: ethers.utils.formatUnits(interest, 6),
        utilizationRate: utilizationRate.toNumber() / 100 + '%'
    };
}

// Send to analytics service
const stats = await getProtocolStats();
await analytics.track('protocol_stats', stats);
```

## Testing Integration

### Mock Contracts for Testing

```javascript
// test/mocks/MockReclaim.js
const { ethers } = require('hardhat');

async function deployMockReclaim() {
    const MockReclaim = await ethers.getContractFactory('MockReclaim');
    const mockReclaim = await MockReclaim.deploy();
    await mockReclaim.deployed();
    return mockReclaim;
}

// In your tests
const mockReclaim = await deployMockReclaim();
await mockReclaim.setShouldPass(true); // All proofs pass

const reputationManager = await ReputationManager.deploy(mockReclaim.address);
```

### Integration Test Example

```javascript
describe('UnCollateral Integration', () => {
    it('should allow full borrow and repay flow', async () => {
        // Deploy all contracts
        const { reputationManager, loanManager, lendingPool } =
            await deployProtocol();

        // Setup lender
        await lendingPool.connect(lender).deposit(DEPOSIT_AMOUNT);

        // Verify borrower reputation
        await reputationManager.connect(borrower)
            .verifyAndUpdateReputation(mockProof, 1000, 500, 100, 365);

        // Request loan
        const loanId = await loanManager.connect(borrower)
            .requestLoan(LOAN_AMOUNT, COLLATERAL, DURATION);

        // Repay loan
        await loanManager.connect(borrower).repayLoan(loanId);

        // Verify success
        const loan = await loanManager.getLoan(loanId);
        expect(loan.active).to.be.false;
    });
});
```

## Mobile App Integration

### React Native Example

```javascript
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';

async function connectWallet() {
    const provider = new WalletConnectProvider({
        rpc: {
            1: RPC_URL
        }
    });

    await provider.enable();

    const web3Provider = new ethers.providers.Web3Provider(provider);
    return web3Provider;
}
```

## GraphQL API (Optional)

### Subgraph for Querying

```graphql
query GetUserLoans($user: String!) {
    loans(where: { borrower: $user }) {
        id
        principal
        collateralAmount
        interestRate
        startTime
        duration
        active
        defaulted
    }
}

query GetPoolStats {
    lendingPool(id: "1") {
        totalDeposits
        totalLoaned
        availableLiquidity
        interestEarned
    }
}
```

## Webhooks

### Event Notifications

```javascript
// Send webhook on loan creation
loanManager.on('LoanCreated', async (loanId, borrower, ...args) => {
    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'loan.created',
            loanId: loanId.toString(),
            borrower,
            timestamp: new Date().toISOString()
        })
    });
});
```

## Best Practices

1. **Error Handling**: Always wrap contract calls in try-catch
2. **Gas Estimation**: Estimate gas before transactions
3. **Transaction Monitoring**: Track transaction status
4. **State Management**: Use Redux/Context for contract state
5. **Security**: Validate all inputs, use rate limiting
6. **Caching**: Cache blockchain data where appropriate
7. **Monitoring**: Set up alerts for critical events

## Support

For integration help:
- Documentation: See `/docs` folder
- Examples: See `/examples` folder (when available)
- Issues: GitHub Issues
- Community: Discord/Telegram
