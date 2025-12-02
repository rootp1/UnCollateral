// Contract configuration
export const CONTRACT_ADDRESSES = {
  REPUTATION_MANAGER: import.meta.env.VITE_REPUTATION_MANAGER_ADDRESS,
  LENDING_POOL: import.meta.env.VITE_LENDING_POOL_ADDRESS,
  LOAN_MANAGER: import.meta.env.VITE_LOAN_MANAGER_ADDRESS,
  INSURANCE_POOL: import.meta.env.VITE_INSURANCE_POOL_ADDRESS,
  LENDING_TOKEN: import.meta.env.VITE_LENDING_TOKEN_ADDRESS,
  COLLATERAL_TOKEN: import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS,
};

// Network configuration
export const NETWORK_CONFIG = {
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '11155111'),
  name: import.meta.env.VITE_NETWORK_NAME || 'Sepolia',
  rpcUrl: 'https://sepolia.infura.io/v3/your-infura-key',
};

// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Contract ABIs (will be populated after forge build)
export const REPUTATION_MANAGER_ABI = [
  "function verifyAndUpdateReputation((tuple(string provider, string parameters, string context) claimInfo, tuple(tuple(string provider, string parameters, string context) claim, bytes[] signatures) signedClaim) proof, uint256 followerCount, uint256 followingCount, uint256 engagementRate, uint256 accountAge) external",
  "function getUserReputation(address user) external view returns (tuple(uint256 followerCount, uint256 followingCount, uint256 engagementRate, uint256 accountAge, uint256 timestamp, uint256 reputationScore, bool verified))",
  "function getRequiredCollateralRatio(address user) external view returns (uint256)",
  "function isReputationValid(address user) external view returns (bool)",
  "function calculateReputationScore(uint256 followers, uint256 following, uint256 engagement, uint256 age) external pure returns (uint256)"
];

export const LOAN_MANAGER_ABI = [
  "function requestLoan(uint256 principal, uint256 collateralAmount, uint256 duration) external returns (uint256)",
  "function repayLoan(uint256 loanId) external",
  "function getUserLoans(address user) external view returns (uint256[])",
  "function loans(uint256 loanId) external view returns (tuple(address borrower, uint256 principal, uint256 collateralAmount, uint256 interestRate, uint256 startTime, uint256 duration, uint256 reputationScore, bool active, bool defaulted))"
];

export const LENDING_POOL_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function getLenderInfo(address lender) external view returns (uint256 deposited, uint256 earned)",
  "function totalDeposits() external view returns (uint256)",
  "function availableLiquidity() external view returns (uint256)"
];

export const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];
