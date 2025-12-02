import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Web3Provider, useWeb3 } from './hooks/useWeb3';
import ReputationVerification from './components/ReputationVerification';
import './index.css';

function AppContent() {
  const { account, connectWallet, disconnectWallet, isConnecting, isCorrectNetwork, error } = useWeb3();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
        },
      }} />
      
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔓</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  UnCollateral
                </h1>
                <p className="text-gray-400 text-sm">Undercollateralized Lending</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!isCorrectNetwork && account && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Wrong Network</span>
                </div>
              )}
              
              {account ? (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800/50 border border-purple-500/30 px-4 py-2 rounded-lg">
                    <p className="text-gray-400 text-xs">Connected</p>
                    <p className="text-white font-mono text-sm">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-6 backdrop-blur-sm">
            <p className="font-semibold flex items-center gap-2">
              <span>❌</span>
              <span>Error</span>
            </p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!account ? (
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-12 shadow-2xl border border-purple-500/20">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl">🚀</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Welcome to UnCollateral
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Get loans with reduced collateral by leveraging your social reputation. 
                Connect your wallet and verify your Twitter account to unlock better loan terms.
              </p>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-10 py-4 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/50"
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>🔐</span>
                    Connect Wallet to Get Started
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Reputation Section */}
            <div className="lg:col-span-1">
              <ReputationVerification />
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-purple-500/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>📖</span>
                  How It Works
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4 group hover:bg-purple-500/10 p-4 rounded-lg transition-all">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xl">
                      1️⃣
                    </div>
                    <div>
                      <p className="font-semibold text-white">Verify Twitter</p>
                      <p className="text-sm text-gray-300">Connect your Twitter account using Reclaim Protocol's zero-knowledge proofs</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group hover:bg-purple-500/10 p-4 rounded-lg transition-all">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xl">
                      2️⃣
                    </div>
                    <div>
                      <p className="font-semibold text-white">Get Reputation Score</p>
                      <p className="text-sm text-gray-300">Your followers, engagement, and account age determine your score (0-1000)</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group hover:bg-purple-500/10 p-4 rounded-lg transition-all">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xl">
                      3️⃣
                    </div>
                    <div>
                      <p className="font-semibold text-white">Borrow with Less Collateral</p>
                      <p className="text-sm text-gray-300">Higher scores = lower collateral (50-150%) and better interest rates (5-15%)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-purple-500/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>🎯</span>
                  Reputation Tiers
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl hover:scale-105 transition-transform">
                    <div>
                      <p className="font-semibold text-green-100 flex items-center gap-2">
                        <span>🌟</span>
                        High (800-1000)
                      </p>
                      <p className="text-sm text-green-200">50-70% collateral • 5% APR</p>
                    </div>
                    <span className="text-3xl">�</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl hover:scale-105 transition-transform">
                    <div>
                      <p className="font-semibold text-blue-100 flex items-center gap-2">
                        <span>⭐</span>
                        Medium (500-799)
                      </p>
                      <p className="text-sm text-blue-200">90-120% collateral • 10% APR</p>
                    </div>
                    <span className="text-3xl">🥈</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl hover:scale-105 transition-transform">
                    <div>
                      <p className="font-semibold text-yellow-100 flex items-center gap-2">
                        <span>✨</span>
                        Low (300-499)
                      </p>
                      <p className="text-sm text-yellow-200">130-150% collateral • 15% APR</p>
                    </div>
                    <span className="text-3xl">🥉</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 backdrop-blur-lg border-t border-purple-500/20 mt-20">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-gray-400">
            UnCollateral - Powered by <span className="text-purple-400 font-semibold">Reclaim Protocol</span> & Social Reputation
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
