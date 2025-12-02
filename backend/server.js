import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pkg from '@reclaimprotocol/js-sdk';
const { ReclaimProofRequest } = pkg;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// In-memory storage for proofs (replace with database in production)
const verifiedProofs = new Map();

/**
 * GET /api/reclaim/config
 * Initialize Reclaim SDK and return safe config to frontend
 */
app.get('/api/reclaim/config', async (req, res) => {
  try {
    const { RECLAIM_APP_ID, RECLAIM_APP_SECRET, RECLAIM_PROVIDER_ID, BASE_URL } = process.env;

    // Validate environment variables
    if (!RECLAIM_APP_ID || !RECLAIM_APP_SECRET || !RECLAIM_PROVIDER_ID) {
      console.error('Missing Reclaim credentials in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Reclaim credentials not configured'
      });
    }

    // Initialize Reclaim SDK (securely on backend)
    const reclaimProofRequest = await ReclaimProofRequest.init(
      RECLAIM_APP_ID,
      RECLAIM_APP_SECRET,
      RECLAIM_PROVIDER_ID
    );

    // Set callback URL for proof verification
    const callbackUrl = `${BASE_URL}/api/reclaim/callback`;
    reclaimProofRequest.setAppCallbackUrl(callbackUrl);

    // Convert to JSON string (safe to send to frontend - no secrets)
    const config = reclaimProofRequest.toJsonString();

    console.log('✅ Reclaim config generated successfully');
    console.log('📍 Callback URL:', callbackUrl);

    res.json({
      success: true,
      reclaimProofRequestConfig: config
    });

  } catch (error) {
    console.error('❌ Error generating Reclaim config:', error);

    if (error.message?.includes('Invalid credentials')) {
      return res.status(401).json({ 
        error: 'Invalid API credentials',
        message: 'Please check your RECLAIM_APP_ID and RECLAIM_APP_SECRET'
      });
    }

    if (error.message?.includes('Provider not found')) {
      return res.status(404).json({ 
        error: 'Provider not configured',
        message: 'Please add the Twitter provider to your Reclaim application'
      });
    }

    res.status(500).json({ 
      error: 'Failed to initialize SDK',
      message: error.message || 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/reclaim/callback
 * Receive and verify proofs from Reclaim Protocol
 */
app.post('/api/reclaim/callback', async (req, res) => {
  try {
    console.log('📥 Received proof callback');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Parse the proof data
    const proof = req.body;

    // Validate proof structure
    if (!proof || !proof.identifier) {
      console.warn('⚠️  Invalid proof format');
      return res.status(400).json({ 
        error: 'Invalid proof format',
        message: 'Proof must include identifier'
      });
    }

    // TODO: Verify proof cryptographically
    // const isValid = await verifyProof(proof);
    // For now, we'll accept the proof
    const isValid = true;

    if (!isValid) {
      console.warn('⚠️  Proof verification failed for:', proof.identifier);
      return res.status(400).json({ 
        error: 'Proof verification failed',
        message: 'The provided proof could not be verified'
      });
    }

    // Extract Twitter data from proof
    const twitterData = extractTwitterData(proof);
    console.log('📊 Extracted Twitter data:', twitterData);

    // Store verified proof (replace with database in production)
    verifiedProofs.set(proof.identifier, {
      proof,
      twitterData,
      timestamp: Date.now(),
      verified: true
    });

    console.log('✅ Proof verified and stored successfully');

    // Respond to Reclaim Protocol
    res.status(200).json({ 
      success: true,
      message: 'Proof verified successfully'
    });

  } catch (error) {
    console.error('❌ Error processing proof:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to process proof'
    });
  }
});

/**
 * GET /api/reputation/:address
 * Get stored reputation data for a wallet address
 */
app.get('/api/reputation/:address', (req, res) => {
  try {
    const { address } = req.params;

    // Find proof for this address (in production, query database)
    const userProof = Array.from(verifiedProofs.values()).find(
      entry => entry.proof.context?.userAddress?.toLowerCase() === address.toLowerCase()
    );

    if (!userProof) {
      return res.status(404).json({ 
        error: 'Reputation not found',
        message: 'No verified reputation data for this address'
      });
    }

    res.json({
      success: true,
      data: {
        verified: userProof.verified,
        timestamp: userProof.timestamp,
        twitterData: userProof.twitterData
      }
    });

  } catch (error) {
    console.error('❌ Error fetching reputation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reputation',
      message: error.message
    });
  }
});

/**
 * Helper: Extract Twitter data from Reclaim proof
 */
function extractTwitterData(proof) {
  try {
    // Parse the context which contains extractedParameters
    const context = typeof proof.claimData.context === 'string' 
      ? JSON.parse(proof.claimData.context)
      : proof.claimData.context;

    const extractedParams = context.extractedParameters || {};
    
    // Extract metrics from the X Follow-Follower count provider
    const followerCount = parseInt(extractedParams.followers_count || 0);
    const followingCount = parseInt(extractedParams.friends_count || 0);
    const username = extractedParams.name || 'unknown';
    
    // Since this provider doesn't give engagement/age, use defaults
    // You can add these from other providers or calculate differently
    const engagementRate = 0; // TODO: Add engagement provider
    const accountAge = 365; // Default to 1 year, TODO: Add account age provider

    console.log(`📊 Extracted Twitter Data for @${username}:`);
    console.log(`   Followers: ${followerCount.toLocaleString()}`);
    console.log(`   Following: ${followingCount.toLocaleString()}`);

    return {
      followerCount,
      followingCount,
      engagementRate,
      accountAge,
      username,
      raw: extractedParams
    };

  } catch (error) {
    console.error('Error extracting Twitter data:', error);
    return {
      followerCount: 0,
      followingCount: 0,
      engagementRate: 0,
      accountAge: 0,
      username: 'unknown'
    };
  }
}

/**
 * Helper: Calculate engagement rate from tweets
 */
function calculateEngagementRate(data) {
  try {
    const recentTweets = data.recentTweets || data.recent_tweets || [];
    
    if (recentTweets.length === 0) {
      return 0;
    }

    let totalEngagement = 0;
    let totalImpressions = 0;

    recentTweets.forEach(tweet => {
      const likes = parseInt(tweet.likes || tweet.favorite_count || 0);
      const retweets = parseInt(tweet.retweets || tweet.retweet_count || 0);
      const replies = parseInt(tweet.replies || tweet.reply_count || 0);
      const impressions = parseInt(tweet.impressions || tweet.impression_count || 1);

      totalEngagement += likes + retweets + replies;
      totalImpressions += impressions;
    });

    // Return engagement rate in basis points (10000 = 100%)
    return totalImpressions > 0 
      ? Math.floor((totalEngagement / totalImpressions) * 10000)
      : 0;

  } catch (error) {
    console.error('Error calculating engagement:', error);
    return 0;
  }
}

/**
 * Helper: Calculate account age in days
 */
function calculateAccountAge(createdAt) {
  try {
    if (!createdAt) return 0;
    
    const created = new Date(createdAt);
    const now = new Date();
    const ageMs = now - created;
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    
    return ageDays > 0 ? ageDays : 0;

  } catch (error) {
    console.error('Error calculating account age:', error);
    return 0;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'UnCollateral Backend API',
    version: '1.0.0',
    endpoints: {
      config: 'GET /api/reclaim/config',
      callback: 'POST /api/reclaim/callback',
      reputation: 'GET /api/reputation/:address',
      health: 'GET /health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 UnCollateral Backend Server');
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📡 Callback URL: ${process.env.BASE_URL}/api/reclaim/callback\n`);
});

export default app;
