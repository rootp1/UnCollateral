# Reclaim Protocol Setup Guide

Complete guide to setting up Reclaim Protocol for UnCollateral.

## Overview

Reclaim Protocol allows users to generate zero-knowledge proofs of their Twitter data (followers, engagement, etc.) without exposing private information. This data is used to calculate reputation scores for undercollateralized lending.

## Step 1: Create Reclaim Account

1. **Visit Reclaim Developer Dashboard**
   - Go to https://dev.reclaimprotocol.org
   - Sign up or log in

2. **Complete Registration**
   - Verify your email
   - Set up your developer account

## Step 2: Create Your Application

1. **Create New Application**
   - Click "Create New App"
   - Name: "UnCollateral" (or your preferred name)
   - Description: "Undercollateralized lending platform"
   - Website: Your app URL (optional)

2. **Save Your Credentials**
   ```
   APP_ID: app_xxxxxxxxxxxxxxxxx
   APP_SECRET: secret_xxxxxxxxxxxxxxxxx
   ```

   ⚠️ **IMPORTANT**: Keep `APP_SECRET` secure! Never commit it to Git or expose it in frontend code.

## Step 3: Configure Twitter Provider

### Option A: Use Pre-built Provider (Recommended)

1. **Find Twitter Provider**
   - Go to "Providers" section
   - Search for "Twitter" or "Twitter Analytics"
   - Select the official Twitter provider

2. **Configure Provider**
   - Provider ID: `twitter-analytics` (or similar)
   - Enable the provider for your app
   - Configure which data to fetch:
     - Follower count ✅
     - Following count ✅
     - Tweet engagement rate ✅
     - Account creation date ✅

3. **Get Provider Hash**
   ```
   Provider ID: twitter-analytics
   Provider Hash: 0x... (automatically generated)
   ```

### Option B: Create Custom Provider

If you need custom Twitter data:

1. **Create Custom Provider**
   - Click "Create Provider"
   - Name: "Twitter Reputation Data"
   - Type: "API Provider"

2. **Configure API Endpoint**
   ```json
   {
     "url": "https://api.twitter.com/2/users/:id",
     "method": "GET",
     "headers": {
       "Authorization": "Bearer {{user_token}}"
     },
     "responseMapping": {
       "followerCount": "$.public_metrics.followers_count",
       "followingCount": "$.public_metrics.following_count",
       "tweetCount": "$.public_metrics.tweet_count",
       "createdAt": "$.created_at"
     }
   }
   ```

3. **Calculate Engagement**
   - Add endpoint for recent tweets
   - Calculate average engagement rate
   - Map to proof structure

## Step 4: Update Smart Contract

Update your deployed `ReputationManager` with the correct Reclaim contract address:

### Testnet Addresses

**Sepolia:**
```
Reclaim Contract: 0x... (check docs.reclaimprotocol.org/onchain/solidity/supported-networks)
```

**Other Testnets:**
- Check official Reclaim docs for addresses

### Update Contract (if needed)

If you deployed with wrong address:

```solidity
// In ReputationManager.sol
function updateReclaimContract(address _reclaimContract) external onlyOwner {
    reclaimContract = IReclaim(_reclaimContract);
}
```

## Step 5: Frontend Integration

### A. Backend Setup (Secure - Recommended)

Create a backend API to keep `APP_SECRET` secure:

**backend/server.js:**
```javascript
const express = require('express');
const { ReclaimProofRequest } = require('@reclaimprotocol/js-sdk');

const app = express();

// Environment variables
const RECLAIM_APP_ID = process.env.RECLAIM_APP_ID;
const RECLAIM_APP_SECRET = process.env.RECLAIM_APP_SECRET;
const RECLAIM_PROVIDER_ID = 'twitter-analytics';

// Endpoint to generate proof request
app.get('/api/reclaim/init', async (req, res) => {
    try {
        // Initialize Reclaim on backend (keeps secret secure)
        const proofRequest = await ReclaimProofRequest.init(
            RECLAIM_APP_ID,
            RECLAIM_APP_SECRET,
            RECLAIM_PROVIDER_ID
        );

        // Generate request URL
        const requestUrl = await proofRequest.getRequestUrl();

        res.json({
            success: true,
            data: {
                appId: RECLAIM_APP_ID,
                providerId: RECLAIM_PROVIDER_ID,
                requestUrl: requestUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log('Backend running on port 3000');
});
```

**backend/.env:**
```bash
RECLAIM_APP_ID=your_app_id_here
RECLAIM_APP_SECRET=your_secret_here
```

### B. Frontend Integration

**frontend/reclaim-integration.js:**
```javascript
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

async function verifyTwitterReputation() {
    try {
        // Step 1: Get configuration from backend (secure)
        const response = await fetch('http://localhost:3000/api/reclaim/init');
        const { data } = await response.json();

        // Step 2: Initialize Reclaim client
        const proofRequest = await ReclaimProofRequest.fromUrl(data.requestUrl);

        // Step 3: Start verification flow
        await proofRequest.startSession({
            onSuccess: async (proofs) => {
                console.log('Verification successful!', proofs);

                // Step 4: Extract Twitter data from proofs
                const twitterData = parseTwitterData(proofs);

                // Step 5: Submit to smart contract
                await submitToContract(proofs, twitterData);
            },
            onFailure: (error) => {
                console.error('Verification failed:', error);
                alert('Failed to verify Twitter account. Please try again.');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

// Parse Twitter data from Reclaim proof
function parseTwitterData(proofs) {
    // Reclaim returns structured proof data
    const claimData = JSON.parse(proofs.claimData);

    return {
        followerCount: claimData.followerCount || 0,
        followingCount: claimData.followingCount || 0,
        engagementRate: calculateEngagement(claimData) || 0,
        accountAge: calculateAccountAge(claimData.createdAt) || 0
    };
}

// Calculate engagement rate from tweet data
function calculateEngagement(data) {
    if (!data.recentTweets || data.recentTweets.length === 0) {
        return 0;
    }

    const totalEngagement = data.recentTweets.reduce((sum, tweet) => {
        return sum + (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies || 0);
    }, 0);

    const totalImpressions = data.recentTweets.reduce((sum, tweet) => {
        return sum + (tweet.impressions || 1); // Avoid division by zero
    }, 0);

    // Engagement rate in basis points (10000 = 100%)
    return Math.floor((totalEngagement / totalImpressions) * 10000);
}

// Calculate account age in days
function calculateAccountAge(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const ageMs = now - created;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

// Submit proof to smart contract
async function submitToContract(proofs, twitterData) {
    // Connect to contract
    const reputationManager = new ethers.Contract(
        REPUTATION_MANAGER_ADDRESS,
        REPUTATION_MANAGER_ABI,
        signer
    );

    // Submit verification
    const tx = await reputationManager.verifyAndUpdateReputation(
        proofs.proof, // Reclaim proof structure
        twitterData.followerCount,
        twitterData.followingCount,
        twitterData.engagementRate,
        twitterData.accountAge
    );

    await tx.wait();
    console.log('Reputation updated on-chain!');
}
```

## Step 6: Environment Configuration

### Backend .env
```bash
# Reclaim Protocol
RECLAIM_APP_ID=app_xxxxxxxxxxxxx
RECLAIM_APP_SECRET=secret_xxxxxxxxxxxxx

# Server
PORT=3000
NODE_ENV=development
```

### Frontend .env
```bash
# Backend API
VITE_API_URL=http://localhost:3000

# Or for client-side (DEV ONLY - not secure)
VITE_RECLAIM_APP_ID=app_xxxxxxxxxxxxx
# DO NOT PUT APP_SECRET IN FRONTEND!
```

### Contracts .env
```bash
# Reclaim Contract Address (Sepolia)
RECLAIM_CONTRACT_ADDRESS=0x... # Get from Reclaim docs
```

## Step 7: Testing

### Test on Development

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   node server.js
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow:**
   - Click "Verify Twitter"
   - Complete Reclaim OAuth flow
   - Verify proof submitted to contract
   - Check reputation score updated

### Test Proof Verification

```javascript
// In browser console
console.log('Testing Reclaim verification...');

// Trigger verification
await verifyTwitterReputation();

// Check proof structure
console.log(proofs);
```

## Step 8: Production Deployment

### Security Checklist

- [ ] `APP_SECRET` stored in backend only
- [ ] HTTPS enabled on backend
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Logging configured

### Production Backend

```javascript
// Add security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

app.use(helmet());
app.use(cors({
    origin: 'https://your-frontend-domain.com'
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Step 9: Monitoring

### Track Verifications

```javascript
// Log successful verifications
app.post('/api/reclaim/verify', async (req, res) => {
    const { walletAddress, proofData } = req.body;

    // Log to analytics
    analytics.track({
        event: 'reputation_verified',
        userId: walletAddress,
        properties: {
            followerCount: proofData.followerCount,
            score: calculateScore(proofData),
            timestamp: new Date()
        }
    });
});
```

### Monitor Failures

```javascript
proofRequest.startSession({
    onFailure: (error) => {
        // Log failure
        console.error('Verification failed:', error);

        // Track in monitoring
        errorTracking.captureException(error, {
            tags: {
                feature: 'reclaim-verification'
            }
        });
    }
});
```

## Common Issues & Solutions

### Issue: "Invalid APP_ID"
**Solution:** Check APP_ID is correct in .env file

### Issue: "Proof verification failed"
**Solutions:**
- Check Reclaim contract address is correct
- Verify provider hash matches
- Ensure proof hasn't expired (24h validity)

### Issue: "OAuth flow not opening"
**Solutions:**
- Check popup blockers
- Try different browser
- Enable third-party cookies
- Use Chrome (recommended)

### Issue: "Data not extracting correctly"
**Solution:** Verify response mapping in provider configuration

### Issue: "Rate limited"
**Solution:** Implement caching, reduce verification frequency

## Best Practices

1. **Never expose APP_SECRET in frontend**
2. **Use backend proxy for proof generation**
3. **Validate proofs on-chain AND backend**
4. **Cache proof configurations**
5. **Handle errors gracefully**
6. **Provide clear user feedback**
7. **Test on testnet first**
8. **Monitor verification success rates**

## Support

### Reclaim Protocol Support

- Documentation: https://docs.reclaimprotocol.org
- Telegram: https://t.me/reclaimprotocol
- Discord: Check Reclaim website
- Email: support@reclaimprotocol.org

### Common Resources

- SDK Docs: https://docs.reclaimprotocol.org/js-sdk
- Solidity Integration: https://docs.reclaimprotocol.org/onchain/solidity
- Supported Networks: https://docs.reclaimprotocol.org/onchain/solidity/supported-networks
- GitHub: https://github.com/reclaimprotocol

## Next Steps

1. ✅ Set up Reclaim account
2. ✅ Get API credentials
3. ✅ Configure Twitter provider
4. ✅ Implement backend proxy
5. ✅ Integrate in frontend
6. ✅ Test thoroughly
7. ✅ Deploy to production
8. ✅ Monitor usage

---

**Need help?** The Reclaim team offers integration support. "If you face any issue at all, hit us up on Telegram and we will write the integration for you."
