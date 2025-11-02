/**
 * UnCollateral Frontend Helper Functions
 */

/**
 * Format address for display
 * @param {string} address - Ethereum address
 * @param {number} start - Characters to show from start
 * @param {number} end - Characters to show from end
 * @returns {string} Formatted address
 */
export function formatAddress(address, start = 6, end = 4) {
    if (!address) return '';
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format token amount with proper decimals
 * @param {string|number} amount - Raw amount
 * @param {number} decimals - Token decimals
 * @param {number} displayDecimals - Decimals to display
 * @returns {string} Formatted amount
 */
export function formatTokenAmount(amount, decimals = 18, displayDecimals = 2) {
    if (!amount) return '0';
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(displayDecimals);
}

/**
 * Parse token amount to wei/smallest unit
 * @param {string|number} amount - Human readable amount
 * @param {number} decimals - Token decimals
 * @returns {string} Amount in smallest unit
 */
export function parseTokenAmount(amount, decimals = 18) {
    if (!amount) return '0';
    return (Number(amount) * Math.pow(10, decimals)).toString();
}

/**
 * Calculate collateral ratio percentage
 * @param {number} score - Reputation score (0-1000)
 * @returns {number} Collateral ratio as percentage
 */
export function calculateCollateralRatio(score) {
    if (score >= 800) {
        return 50 + ((1000 - score) * 0.1);
    }
    if (score >= 500) {
        return 90 + ((800 - score) * 0.1);
    }
    return 130 + ((500 - score) * 0.1);
}

/**
 * Get interest rate based on reputation score
 * @param {number} score - Reputation score (0-1000)
 * @returns {number} Annual interest rate percentage
 */
export function getInterestRate(score) {
    if (score >= 800) return 5;
    if (score >= 500) return 10;
    return 15;
}

/**
 * Calculate total loan repayment
 * @param {number} principal - Loan principal
 * @param {number} rate - Annual interest rate (percentage)
 * @param {number} days - Loan duration in days
 * @returns {number} Total repayment amount
 */
export function calculateRepayment(principal, rate, days) {
    const interest = (principal * rate * days) / (365 * 100);
    return principal + interest;
}

/**
 * Format time remaining
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time
 */
export function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} Is valid
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get reputation score category
 * @param {number} score - Reputation score (0-1000)
 * @returns {string} Category name
 */
export function getReputationCategory(score) {
    if (score >= 800) return 'Excellent';
    if (score >= 600) return 'Good';
    if (score >= 400) return 'Fair';
    if (score >= 300) return 'Poor';
    return 'Insufficient';
}

/**
 * Get reputation score color
 * @param {number} score - Reputation score (0-1000)
 * @returns {string} Color hex code
 */
export function getReputationColor(score) {
    if (score >= 800) return '#4caf50'; // Green
    if (score >= 600) return '#8bc34a'; // Light green
    if (score >= 400) return '#ff9800'; // Orange
    if (score >= 300) return '#ff5722'; // Deep orange
    return '#f44336'; // Red
}

/**
 * Format USD amount
 * @param {number} amount - Amount in USD
 * @returns {string} Formatted USD
 */
export function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate utilization rate
 * @param {number} loaned - Amount loaned out
 * @param {number} total - Total pool size
 * @returns {number} Utilization percentage
 */
export function calculateUtilization(loaned, total) {
    if (total === 0) return 0;
    return (loaned / total) * 100;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copy to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Local storage helpers
 */
export const storage = {
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
};

/**
 * Network helpers
 */
export const networks = {
    1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
    5: { name: 'Goerli', symbol: 'ETH', explorer: 'https://goerli.etherscan.io' },
    11155111: { name: 'Sepolia', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
    137: { name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
    42161: { name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io' },
    8453: { name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org' }
};

export function getNetworkInfo(chainId) {
    return networks[chainId] || { name: 'Unknown', symbol: '', explorer: '' };
}

export function getExplorerUrl(chainId, address, type = 'address') {
    const network = networks[chainId];
    if (!network) return '';
    return `${network.explorer}/${type}/${address}`;
}
