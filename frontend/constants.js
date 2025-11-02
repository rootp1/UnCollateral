/**
 * UnCollateral Frontend Constants
 */

// Contract Addresses (Update after deployment)
export const CONTRACTS = {
    REPUTATION_MANAGER: '0x0000000000000000000000000000000000000000',
    LENDING_POOL: '0x0000000000000000000000000000000000000000',
    LOAN_MANAGER: '0x0000000000000000000000000000000000000000',
    INSURANCE_POOL: '0x0000000000000000000000000000000000000000',
    LENDING_TOKEN: '0x0000000000000000000000000000000000000000', // USDC
    COLLATERAL_TOKEN: '0x0000000000000000000000000000000000000000', // WETH
};

// Reclaim Protocol Configuration
export const RECLAIM_CONFIG = {
    APP_ID: process.env.VITE_RECLAIM_APP_ID || 'YOUR_APP_ID',
    PROVIDER_ID: process.env.VITE_RECLAIM_PROVIDER_ID || 'twitter-analytics',
};

// Network Configuration
export const NETWORKS = {
    1: {
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
        explorer: 'https://etherscan.io',
        chainId: '0x1'
    },
    11155111: {
        name: 'Sepolia Testnet',
        symbol: 'ETH',
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY',
        explorer: 'https://sepolia.etherscan.io',
        chainId: '0xaa36a7'
    },
    137: {
        name: 'Polygon',
        symbol: 'MATIC',
        rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
        explorer: 'https://polygonscan.com',
        chainId: '0x89'
    },
    42161: {
        name: 'Arbitrum',
        symbol: 'ETH',
        rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
        explorer: 'https://arbiscan.io',
        chainId: '0xa4b1'
    },
    8453: {
        name: 'Base',
        symbol: 'ETH',
        rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
        explorer: 'https://basescan.org',
        chainId: '0x2105'
    }
};

// Default Network
export const DEFAULT_NETWORK = 11155111; // Sepolia

// Token Configuration
export const TOKENS = {
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        icon: '💵'
    },
    WETH: {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        icon: '🔷'
    },
    DAI: {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        icon: '💰'
    },
    WBTC: {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        icon: '₿'
    }
};

// Loan Parameters
export const LOAN_PARAMS = {
    MIN_AMOUNT: 100, // Minimum loan in USDC
    MAX_AMOUNT: 100000, // Maximum loan in USDC
    MIN_DURATION_DAYS: 7,
    MAX_DURATION_DAYS: 365,
    DEFAULT_DURATION_DAYS: 30
};

// Reputation Thresholds
export const REPUTATION = {
    MIN_SCORE: 300, // Minimum score to borrow
    EXCELLENT_THRESHOLD: 800,
    GOOD_THRESHOLD: 600,
    FAIR_THRESHOLD: 400,
    VALIDITY_PERIOD_DAYS: 30
};

// Interest Rates (Annual %)
export const INTEREST_RATES = {
    HIGH_REPUTATION: 5, // Score >= 800
    MEDIUM_REPUTATION: 10, // Score >= 500
    LOW_REPUTATION: 15 // Score < 500
};

// Collateral Ratios (%)
export const COLLATERAL_RATIOS = {
    MIN: 50, // High reputation
    MAX: 150 // Low reputation
};

// UI Constants
export const UI = {
    ITEMS_PER_PAGE: 10,
    DEBOUNCE_DELAY: 300, // ms
    TOAST_DURATION: 5000, // ms
    TX_CONFIRMATION_BLOCKS: 2
};

// Transaction Status
export const TX_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed'
};

// Loan Status
export const LOAN_STATUS = {
    ACTIVE: 'active',
    REPAID: 'repaid',
    DEFAULTED: 'defaulted',
    LIQUIDATED: 'liquidated'
};

// Error Messages
export const ERRORS = {
    WALLET_NOT_CONNECTED: 'Please connect your wallet',
    WRONG_NETWORK: 'Please switch to the correct network',
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    REPUTATION_EXPIRED: 'Your reputation has expired. Please verify again.',
    REPUTATION_TOO_LOW: 'Your reputation score is too low to borrow',
    INSUFFICIENT_COLLATERAL: 'Insufficient collateral for this loan',
    INSUFFICIENT_LIQUIDITY: 'Pool has insufficient liquidity',
    TRANSACTION_FAILED: 'Transaction failed. Please try again.',
    UNKNOWN_ERROR: 'An unknown error occurred'
};

// Success Messages
export const SUCCESS = {
    WALLET_CONNECTED: 'Wallet connected successfully',
    REPUTATION_VERIFIED: 'Reputation verified successfully',
    LOAN_REQUESTED: 'Loan requested successfully',
    LOAN_REPAID: 'Loan repaid successfully',
    DEPOSIT_SUCCESS: 'Deposit successful',
    WITHDRAWAL_SUCCESS: 'Withdrawal successful'
};

// API Endpoints (if using backend)
export const API = {
    BASE_URL: process.env.VITE_API_URL || 'http://localhost:3000',
    ENDPOINTS: {
        RECLAIM_CONFIG: '/api/reclaim/config',
        USER_STATS: '/api/users/:address/stats',
        POOL_STATS: '/api/pool/stats',
        LOANS: '/api/loans'
    }
};

// Local Storage Keys
export const STORAGE_KEYS = {
    WALLET_ADDRESS: 'uncollateral_wallet',
    PREFERRED_NETWORK: 'uncollateral_network',
    THEME: 'uncollateral_theme',
    USER_SETTINGS: 'uncollateral_settings'
};

// Social Links
export const SOCIAL = {
    TWITTER: 'https://twitter.com/uncollateral',
    DISCORD: 'https://discord.gg/uncollateral',
    TELEGRAM: 'https://t.me/uncollateral',
    GITHUB: 'https://github.com/uncollateral/uncollateral',
    DOCS: 'https://docs.uncollateral.app'
};

// Feature Flags
export const FEATURES = {
    ENABLE_MOBILE_APP: false,
    ENABLE_MULTI_COLLATERAL: false,
    ENABLE_GOVERNANCE: false,
    ENABLE_ANALYTICS: true,
    ENABLE_NOTIFICATIONS: true
};

// Gas Limits (for transaction estimation)
export const GAS_LIMITS = {
    VERIFY_REPUTATION: 200000,
    REQUEST_LOAN: 250000,
    REPAY_LOAN: 150000,
    DEPOSIT: 100000,
    WITHDRAW: 120000,
    APPROVE: 50000
};

// Polling Intervals (ms)
export const POLL_INTERVALS = {
    BALANCE: 30000, // 30s
    LOANS: 60000, // 1min
    POOL_STATS: 60000, // 1min
    REPUTATION: 300000 // 5min
};

// Chart Colors
export const COLORS = {
    PRIMARY: '#667eea',
    SECONDARY: '#764ba2',
    SUCCESS: '#4caf50',
    WARNING: '#ff9800',
    ERROR: '#f44336',
    INFO: '#2196f3'
};

// Export all constants as default
export default {
    CONTRACTS,
    RECLAIM_CONFIG,
    NETWORKS,
    DEFAULT_NETWORK,
    TOKENS,
    LOAN_PARAMS,
    REPUTATION,
    INTEREST_RATES,
    COLLATERAL_RATIOS,
    UI,
    TX_STATUS,
    LOAN_STATUS,
    ERRORS,
    SUCCESS,
    API,
    STORAGE_KEYS,
    SOCIAL,
    FEATURES,
    GAS_LIMITS,
    POLL_INTERVALS,
    COLORS
};
