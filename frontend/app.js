// UnCollateral Frontend Application
// Simple Web3 + Reclaim Protocol Integration

// Configuration (Update these after deployment)
const CONFIG = {
    // Contract addresses - update after deployment
    REPUTATION_MANAGER: '0x0000000000000000000000000000000000000000',
    LENDING_POOL: '0x0000000000000000000000000000000000000000',
    LOAN_MANAGER: '0x0000000000000000000000000000000000000000',
    INSURANCE_POOL: '0x0000000000000000000000000000000000000000',
    LENDING_TOKEN: '0x0000000000000000000000000000000000000000',
    COLLATERAL_TOKEN: '0x0000000000000000000000000000000000000000',

    // Reclaim Protocol
    RECLAIM_APP_ID: 'YOUR_RECLAIM_APP_ID',
    RECLAIM_PROVIDER_ID: 'twitter-analytics'
};

// State
let web3;
let account;
let contracts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkWalletConnection();
});

function initializeEventListeners() {
    // Wallet connection
    document.getElementById('connectWallet').addEventListener('click', connectWallet);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Reputation verification
    document.getElementById('verifyTwitter').addEventListener('click', verifyTwitterReputation);

    // Loan form
    document.getElementById('loanForm').addEventListener('submit', requestLoan);

    // Lending forms
    document.getElementById('depositForm').addEventListener('submit', depositLiquidity);
    document.getElementById('withdrawForm').addEventListener('submit', withdrawLiquidity);

    // Loan amount change - calculate terms
    document.getElementById('loanAmount').addEventListener('input', calculateLoanTerms);
    document.getElementById('loanDuration').addEventListener('change', calculateLoanTerms);
}

// Wallet Functions
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this application');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        account = accounts[0];

        // Update UI
        document.getElementById('walletAddress').textContent =
            `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`;
        document.getElementById('connectWallet').textContent = 'Connected';
        document.getElementById('connectWallet').disabled = true;

        // Initialize Web3 (you would use ethers.js or web3.js in production)
        console.log('Wallet connected:', account);

        // Load user data
        await loadUserData();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet');
    }
}

// Tab Navigation
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Load tab-specific data
    if (tabName === 'loans') {
        loadUserLoans();
    } else if (tabName === 'lend') {
        loadPoolStats();
    }
}

// Reputation Functions
async function verifyTwitterReputation() {
    if (!account) {
        alert('Please connect your wallet first');
        return;
    }

    try {
        document.getElementById('proofStatus').classList.remove('hidden');
        document.getElementById('verifyTwitter').disabled = true;

        // NOTE: In production, you would:
        // 1. Import Reclaim SDK: import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk'
        // 2. Initialize Reclaim client from backend (to keep APP_SECRET secure)
        // 3. Trigger proof generation flow
        // 4. Submit proof to smart contract

        // Simplified flow for demonstration:
        alert('This would open Reclaim Protocol flow to verify your Twitter account.\\n\\n' +
              'Steps:\\n' +
              '1. Connect Twitter via Reclaim\\n' +
              '2. Generate ZK proof of your metrics\\n' +
              '3. Submit proof to smart contract\\n' +
              '4. Get reputation score\\n\\n' +
              'See app.js for integration code.');

        // Simulated proof data (replace with actual Reclaim SDK call)
        const mockProof = {
            followerCount: 1500,
            followingCount: 300,
            engagementRate: 250, // 2.5%
            accountAge: 730 // 2 years in days
        };

        // In production, call smart contract:
        // await reputationManager.verifyAndUpdateReputation(proof, ...);

        // Update UI with mock data
        updateReputationUI(mockProof);

    } catch (error) {
        console.error('Error verifying reputation:', error);
        alert('Failed to verify reputation');
    } finally {
        document.getElementById('proofStatus').classList.add('hidden');
        document.getElementById('verifyTwitter').disabled = false;
    }
}

function updateReputationUI(data) {
    // Calculate mock reputation score
    const score = calculateReputationScore(data);
    const collateralRatio = getCollateralRatio(score);

    document.getElementById('statusText').textContent = 'Verified';
    document.getElementById('scoreText').textContent = `${score}/1000`;
    document.getElementById('collateralText').textContent = `${collateralRatio}%`;

    document.getElementById('statusText').style.color = '#4caf50';
}

function calculateReputationScore(data) {
    // Simplified score calculation (matches smart contract logic)
    let score = 0;

    // Followers (max 300)
    if (data.followerCount >= 10000) score += 300;
    else if (data.followerCount >= 5000) score += 250;
    else if (data.followerCount >= 1000) score += 200;
    else score += Math.floor((data.followerCount * 200) / 1000);

    // Engagement (max 400)
    if (data.engagementRate >= 500) score += 400;
    else if (data.engagementRate >= 300) score += 350;
    else if (data.engagementRate >= 100) score += 250;
    else score += Math.floor((data.engagementRate * 250) / 100);

    // Account age (max 200)
    if (data.accountAge >= 1095) score += 200;
    else if (data.accountAge >= 730) score += 180;
    else if (data.accountAge >= 365) score += 150;
    else score += Math.floor((data.accountAge * 150) / 365);

    // Following ratio (max 100)
    const ratio = (data.followerCount * 100) / data.followingCount;
    if (ratio >= 500) score += 100;
    else if (ratio >= 200) score += 80;
    else score += 60;

    return Math.min(score, 1000);
}

function getCollateralRatio(score) {
    if (score >= 800) return 50 + ((1000 - score) * 0.1);
    if (score >= 500) return 90 + ((800 - score) * 0.1);
    return 130 + ((500 - score) * 0.1);
}

// Loan Functions
async function requestLoan(e) {
    e.preventDefault();

    if (!account) {
        alert('Please connect your wallet first');
        return;
    }

    const loanAmount = document.getElementById('loanAmount').value;
    const duration = document.getElementById('loanDuration').value;
    const collateral = document.getElementById('collateralAmount').value;

    try {
        alert(`Requesting loan:\\n` +
              `Amount: ${loanAmount} USDC\\n` +
              `Duration: ${duration} days\\n` +
              `Collateral: ${collateral} ETH\\n\\n` +
              'This would call LoanManager.requestLoan() in production.');

        // In production:
        // await loanManager.requestLoan(
        //     ethers.utils.parseUnits(loanAmount, 6),
        //     ethers.utils.parseEther(collateral),
        //     duration * 86400
        // );

    } catch (error) {
        console.error('Error requesting loan:', error);
        alert('Failed to request loan');
    }
}

function calculateLoanTerms() {
    const amount = document.getElementById('loanAmount').value;
    const duration = document.getElementById('loanDuration').value;

    if (!amount || !duration) return;

    // Mock interest rate calculation (replace with contract call)
    const mockScore = 750; // Would get from contract
    let interestRate;
    if (mockScore >= 800) interestRate = 5;
    else if (mockScore >= 500) interestRate = 10;
    else interestRate = 15;

    const interest = (amount * interestRate * duration) / (365 * 100);
    const totalRepayment = parseFloat(amount) + interest;
    const requiredCollateral = (amount * getCollateralRatio(mockScore)) / 100;

    document.getElementById('interestRate').textContent = `${interestRate}% APR`;
    document.getElementById('totalRepayment').textContent = `${totalRepayment.toFixed(2)} USDC`;
    document.getElementById('requiredCollateral').textContent = `${requiredCollateral.toFixed(2)} USDC`;
    document.getElementById('loanTerms').classList.remove('hidden');
}

// Lending Pool Functions
async function depositLiquidity(e) {
    e.preventDefault();

    if (!account) {
        alert('Please connect your wallet first');
        return;
    }

    const amount = document.getElementById('depositAmount').value;

    try {
        alert(`Depositing ${amount} USDC to lending pool.\\n\\n` +
              'This would call LendingPool.deposit() in production.');

        // In production:
        // await lendingPool.deposit(ethers.utils.parseUnits(amount, 6));

        await loadPoolStats();
    } catch (error) {
        console.error('Error depositing:', error);
        alert('Failed to deposit');
    }
}

async function withdrawLiquidity(e) {
    e.preventDefault();

    if (!account) {
        alert('Please connect your wallet first');
        return;
    }

    const amount = document.getElementById('withdrawAmount').value;

    try {
        alert(`Withdrawing ${amount || 'all'} from lending pool.\\n\\n` +
              'This would call LendingPool.withdraw() in production.');

        // In production:
        // await lendingPool.withdraw(amount ? ethers.utils.parseUnits(amount, 6) : 0);

        await loadPoolStats();
    } catch (error) {
        console.error('Error withdrawing:', error);
        alert('Failed to withdraw');
    }
}

async function loadPoolStats() {
    // Mock data - replace with contract calls
    document.getElementById('poolSize').textContent = '1,250,000 USDC';
    document.getElementById('availableLiquidity').textContent = '850,000 USDC';
    document.getElementById('yourDeposits').textContent = '5,000 USDC';
    document.getElementById('earnedInterest').textContent = '125 USDC';
}

// Loan Management
async function loadUserLoans() {
    const loansList = document.getElementById('loansList');

    if (!account) {
        loansList.innerHTML = '<p class="info-text">Connect your wallet to view your loans</p>';
        return;
    }

    // Mock data - replace with contract calls
    const mockLoans = [
        {
            id: 1,
            principal: 1000,
            collateral: 0.5,
            interestRate: 10,
            startTime: Date.now() - 86400000 * 5,
            duration: 30,
            active: true
        }
    ];

    if (mockLoans.length === 0) {
        loansList.innerHTML = '<p class="info-text">You have no loans</p>';
        return;
    }

    loansList.innerHTML = mockLoans.map(loan => `
        <div class="loan-item ${loan.active ? 'loan-active' : 'loan-defaulted'}">
            <h3>Loan #${loan.id}</h3>
            <p>Principal: ${loan.principal} USDC</p>
            <p>Collateral: ${loan.collateral} ETH</p>
            <p>Interest Rate: ${loan.interestRate}% APR</p>
            <p>Status: ${loan.active ? 'Active' : 'Repaid'}</p>
            ${loan.active ? '<button class="btn-primary" onclick="repayLoan(' + loan.id + ')">Repay Loan</button>' : ''}
        </div>
    `).join('');
}

async function repayLoan(loanId) {
    try {
        alert(`Repaying loan #${loanId}.\\n\\n` +
              'This would call LoanManager.repayLoan() in production.');

        // In production:
        // await loanManager.repayLoan(loanId);

        await loadUserLoans();
    } catch (error) {
        console.error('Error repaying loan:', error);
        alert('Failed to repay loan');
    }
}

// Load user-specific data
async function loadUserData() {
    // Load reputation status
    // Load user loans
    // Load lender info
    console.log('Loading user data for:', account);
}

// Export for use in HTML
window.repayLoan = repayLoan;
