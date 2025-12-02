import { useState } from 'react';
import pkg from '@reclaimprotocol/js-sdk';
const { ReclaimProofRequest } = pkg;
import { useWeb3 } from '../hooks/useWeb3';
import { API_URL } from '../config/constants';
import toast from 'react-hot-toast';

const ReputationVerification = () => {
  const { account, contracts, isCorrectNetwork } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('not-verified');
  const [reputationData, setReputationData] = useState(null);
  const [twitterData, setTwitterData] = useState(null);

  /**
   * Start Twitter verification process
   */
  const handleVerifyTwitter = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network');
      return;
    }

    try {
      setLoading(true);
      setVerificationStatus('fetching-config');
      toast.loading('Initializing verification...');

      // Step 1: Fetch config from backend
      const configResponse = await fetch(`${API_URL}/api/reclaim/config`);
      if (!configResponse.ok) {
        throw new Error('Failed to fetch Reclaim configuration');
      }

      const { reclaimProofRequestConfig } = await configResponse.json();
      
      // Step 2: Reconstruct proof request from config
      const proofRequest = await ReclaimProofRequest.fromJsonString(reclaimProofRequestConfig);

      setVerificationStatus('awaiting-proof');
      toast.dismiss();
      toast.loading('Opening verification flow...');

      // Step 3: Trigger Reclaim flow (auto-detects platform)
      await proofRequest.triggerReclaimFlow();

      // Step 4: Start session and wait for proof
      await proofRequest.startSession({
        onSuccess: async (proofs) => {
          console.log('✅ Verification successful:', proofs);
          toast.dismiss();
          toast.success('Twitter verification successful!');
          
          setVerificationStatus('proof-received');
          
          // Parse Twitter data from proof
          const parsedData = parseTwitterData(proofs);
          setTwitterData(parsedData);

          // Submit to smart contract
          await submitToContract(proofs, parsedData);
        },
        onFailure: (error) => {
          console.error('❌ Verification failed:', error);
          toast.dismiss();
          toast.error('Verification failed: ' + (error.message || 'Unknown error'));
          setVerificationStatus('failed');
          setLoading(false);
        },
      });

    } catch (error) {
      console.error('Error during verification:', error);
      toast.dismiss();
      toast.error('Failed to start verification');
      setVerificationStatus('failed');
      setLoading(false);
    }
  };

  /**
   * Parse Twitter data from Reclaim proof
   */
  const parseTwitterData = (proofs) => {
    try {
      const claimData = JSON.parse(proofs.claimData || '{}');
      
      const followerCount = parseInt(claimData.followerCount || claimData.followers_count || 0);
      const followingCount = parseInt(claimData.followingCount || claimData.following_count || 0);
      const engagementRate = calculateEngagement(claimData);
      const accountAge = calculateAccountAge(claimData.createdAt || claimData.created_at);

      return {
        followerCount,
        followingCount,
        engagementRate,
        accountAge
      };
    } catch (error) {
      console.error('Error parsing Twitter data:', error);
      return {
        followerCount: 0,
        followingCount: 0,
        engagementRate: 0,
        accountAge: 0
      };
    }
  };

  /**
   * Calculate engagement rate
   */
  const calculateEngagement = (data) => {
    const recentTweets = data.recentTweets || data.recent_tweets || [];
    if (recentTweets.length === 0) return 0;

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

    return totalImpressions > 0 
      ? Math.floor((totalEngagement / totalImpressions) * 10000)
      : 0;
  };

  /**
   * Calculate account age in days
   */
  const calculateAccountAge = (createdAt) => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    const ageMs = now - created;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  };

  /**
   * Submit proof to smart contract
   */
  const submitToContract = async (proofs, twitterData) => {
    try {
      setVerificationStatus('submitting-contract');
      toast.loading('Submitting to blockchain...');

      const { reputationManager } = contracts;
      if (!reputationManager) {
        throw new Error('Reputation Manager contract not initialized');
      }

      // Format proof for smart contract
      const proof = {
        claimInfo: proofs.claimInfo,
        signedClaim: proofs.signedClaim
      };

      // Call smart contract
      const tx = await reputationManager.verifyAndUpdateReputation(
        proof,
        twitterData.followerCount,
        twitterData.followingCount,
        twitterData.engagementRate,
        twitterData.accountAge
      );

      toast.dismiss();
      toast.loading('Waiting for confirmation...');

      await tx.wait();

      toast.dismiss();
      toast.success('Reputation verified on-chain!');

      // Fetch updated reputation
      await fetchReputation();

      setVerificationStatus('verified');
      setLoading(false);

    } catch (error) {
      console.error('Error submitting to contract:', error);
      toast.dismiss();
      toast.error('Failed to submit to blockchain: ' + error.message);
      setVerificationStatus('failed');
      setLoading(false);
    }
  };

  /**
   * Fetch reputation from contract
   */
  const fetchReputation = async () => {
    try {
      const { reputationManager } = contracts;
      if (!reputationManager || !account) return;

      const reputation = await reputationManager.getUserReputation(account);
      const collateralRatio = await reputationManager.getRequiredCollateralRatio(account);

      setReputationData({
        followerCount: Number(reputation.followerCount),
        followingCount: Number(reputation.followingCount),
        engagementRate: Number(reputation.engagementRate),
        accountAge: Number(reputation.accountAge),
        score: Number(reputation.reputationScore),
        collateralRatio: Number(collateralRatio),
        verified: reputation.verified,
        timestamp: Number(reputation.timestamp)
      });
    } catch (error) {
      console.error('Error fetching reputation:', error);
    }
  };

  /**
   * Calculate interest rate based on score
   */
  const getInterestRate = (score) => {
    if (score >= 800) return 5;
    if (score >= 500) return 10;
    return 15;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-purple-500/20">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>🐦</span>
        Twitter Reputation
      </h2>
      
      <div className="space-y-6">
        {/* Verification Button */}
        {(!reputationData || !reputationData.verified) && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-5 rounded-xl">
              <p className="text-gray-200 mb-4 leading-relaxed">
                Verify your Twitter account to establish your social reputation and unlock better loan terms.
              </p>
              <div className="space-y-2">
                <div className="flex gap-3 text-sm text-purple-200">
                  <span className="text-lg">🔐</span>
                  <span>Secure & Private using Reclaim Protocol</span>
                </div>
                <div className="flex gap-3 text-sm text-purple-200">
                  <span className="text-lg">🛡️</span>
                  <span>Zero-knowledge proofs protect your data</span>
                </div>
                <div className="flex gap-3 text-sm text-purple-200">
                  <span className="text-lg">⚡</span>
                  <span>Instant verification in seconds</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleVerifyTwitter}
              disabled={loading || !account || !isCorrectNetwork}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-6 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-xl">⏳</span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🐦</span>
                  <span>Verify Twitter Account</span>
                </>
              )}
            </button>

            {!account && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                <p className="text-sm text-yellow-200 text-center flex items-center justify-center gap-2">
                  <span>⚠️</span>
                  Please connect your wallet first
                </p>
              </div>
            )}
            {!isCorrectNetwork && account && (
              <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg">
                <p className="text-sm text-orange-200 text-center flex items-center justify-center gap-2">
                  <span>🔄</span>
                  Please switch to Sepolia network
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Display */}
        {loading && (
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-xl p-4 animate-pulse">
            <p className="text-blue-100 flex items-center gap-3">
              {verificationStatus === 'fetching-config' && (
                <>
                  <span className="text-xl">🔄</span>
                  <span>Initializing Reclaim Protocol...</span>
                </>
              )}
              {verificationStatus === 'awaiting-proof' && (
                <>
                  <span className="text-xl">📱</span>
                  <span>Complete verification on your device...</span>
                </>
              )}
              {verificationStatus === 'proof-received' && (
                <>
                  <span className="text-xl">✅</span>
                  <span>Proof received, processing...</span>
                </>
              )}
              {verificationStatus === 'submitting-contract' && (
                <>
                  <span className="text-xl">⛓️</span>
                  <span>Submitting to blockchain...</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Reputation Display */}
        {reputationData && reputationData.verified && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">✅</span>
                <div>
                  <span className="font-semibold text-green-100 text-lg">Verified Account</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-5 rounded-xl hover:scale-105 transition-transform">
                <p className="text-blue-200 text-sm mb-1 flex items-center gap-2">
                  <span>👥</span>
                  Followers
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  {reputationData.followerCount.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-5 rounded-xl hover:scale-105 transition-transform">
                <p className="text-purple-200 text-sm mb-1 flex items-center gap-2">
                  <span>🔗</span>
                  Following
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {reputationData.followingCount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-400/50 p-6 rounded-xl shadow-lg">
              <p className="text-purple-100 text-sm mb-2 flex items-center gap-2">
                <span>⭐</span>
                Reputation Score
              </p>
              <p className="text-6xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-3">
                {reputationData.score}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 h-3 rounded-full transition-all duration-500 animate-pulse"
                    style={{ width: `${(reputationData.score / 1000) * 100}%` }}
                  />
                </div>
                <span className="text-purple-200 text-sm font-semibold min-w-[3rem]">
                  {Math.round((reputationData.score / 1000) * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-slate-700/50 border border-slate-600 p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-600/30 rounded-lg hover:bg-slate-600/50 transition-colors">
                <span className="text-gray-300 flex items-center gap-2">
                  <span>📊</span>
                  Engagement Rate
                </span>
                <span className="text-white font-bold text-lg">{(reputationData.engagementRate / 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-600/30 rounded-lg hover:bg-slate-600/50 transition-colors">
                <span className="text-gray-300 flex items-center gap-2">
                  <span>📅</span>
                  Account Age
                </span>
                <span className="text-white font-bold text-lg">{Math.floor(reputationData.accountAge / 365)} years</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-600/30 rounded-lg hover:bg-slate-600/50 transition-colors">
                <span className="text-gray-300 flex items-center gap-2">
                  <span>💰</span>
                  Collateral Required
                </span>
                <span className="text-green-400 font-bold text-lg">{(reputationData.collateralRatio / 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-600/30 rounded-lg hover:bg-slate-600/50 transition-colors">
                <span className="text-gray-300 flex items-center gap-2">
                  <span>📈</span>
                  Interest Rate
                </span>
                <span className="text-blue-400 font-bold text-lg">{getInterestRate(reputationData.score)}% APR</span>
              </div>
            </div>

            <button
              onClick={handleVerifyTwitter}
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-6 py-3 rounded-xl disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 border border-slate-500"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Update Reputation</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReputationVerification;
