# Smart Contract API Reference

Complete reference for interacting with UnCollateral smart contracts.

## Table of Contents

1. [ReputationManager](#reputationmanager)
2. [LendingPool](#lendingpool)
3. [LoanManager](#loanmanager)
4. [InsurancePool](#insurancepool)

---

## ReputationManager

Manages user reputation scores based on verified Twitter data.

### Read Functions

#### `getUserReputation(address user) → TwitterReputation`

Get complete reputation data for a user.

**Returns:**
- `followerCount`: Number of Twitter followers
- `followingCount`: Number of accounts following
- `engagementRate`: Engagement rate in basis points
- `accountAge`: Account age in days
- `timestamp`: When reputation was verified
- `reputationScore`: Calculated score (0-1000)
- `verified`: Whether user has verified reputation

**Example:**
```javascript
const reputation = await reputationManager.getUserReputation(userAddress);
console.log(`Score: ${reputation.reputationScore}/1000`);
```

#### `isReputationValid(address user) → bool`

Check if user's reputation is still valid (not expired or blacklisted).

#### `getRequiredCollateralRatio(address user) → uint256`

Get required collateral ratio in basis points (10000 = 100%).

**Returns:** Collateral ratio (5000-15000 basis points = 50-150%)

**Example:**
```javascript
const ratio = await reputationManager.getRequiredCollateralRatio(userAddress);
const collateralPercent = ratio / 100; // Convert basis points to percentage
```

#### `calculateReputationScore(uint256 followers, uint256 following, uint256 engagement, uint256 age) → uint256`

Calculate reputation score from metrics (public/view function).

### Write Functions

#### `verifyAndUpdateReputation(Proof calldata proof, uint256 followerCount, uint256 followingCount, uint256 engagementRate, uint256 accountAge)`

Verify Reclaim proof and update user reputation.

**Parameters:**
- `proof`: Reclaim Protocol proof structure
- `followerCount`: Twitter follower count
- `followingCount`: Following count
- `engagementRate`: Engagement rate in basis points (100 = 1%)
- `accountAge`: Account age in days

**Events Emitted:**
- `ReputationUpdated(address user, uint256 score, uint256 followers, uint256 engagement)`

**Example:**
```javascript
const tx = await reputationManager.verifyAndUpdateReputation(
    proof,
    1500,  // 1500 followers
    300,   // 300 following
    250,   // 2.5% engagement
    730    // 2 years old
);
```

---

## LendingPool

Manages liquidity deposits and withdrawals from lenders.

### Read Functions

#### `getLenderInfo(address lender) → (uint256 deposited, uint256 earned)`

Get lender's deposit and earned interest.

#### `getPoolStats() → (uint256 deposits, uint256 loaned, uint256 liquidity, uint256 interest)`

Get overall pool statistics.

**Returns:**
- `deposits`: Total deposits
- `loaned`: Amount currently loaned out
- `liquidity`: Available liquidity
- `interest`: Total interest earned

### Write Functions

#### `deposit(uint256 amount)`

Deposit tokens into lending pool.

**Requirements:**
- Must approve tokens first
- Amount > 0

**Example:**
```javascript
// Approve first
await lendingToken.approve(lendingPoolAddress, amount);

// Then deposit
await lendingPool.deposit(ethers.utils.parseUnits("1000", 6)); // 1000 USDC
```

#### `withdraw(uint256 amount)`

Withdraw deposited funds plus interest.

**Parameters:**
- `amount`: Amount to withdraw (0 = withdraw all)

**Example:**
```javascript
await lendingPool.withdraw(ethers.utils.parseUnits("500", 6)); // Withdraw 500
// OR
await lendingPool.withdraw(0); // Withdraw everything
```

---

## LoanManager

Manages loan creation, repayment, and liquidation.

### Read Functions

#### `getLoan(uint256 loanId) → Loan`

Get complete loan details.

**Returns:**
- `borrower`: Borrower address
- `principal`: Loan amount
- `collateralAmount`: Collateral deposited
- `interestRate`: Annual rate in basis points
- `startTime`: When loan was created
- `duration`: Loan duration in seconds
- `reputationScore`: Borrower's score at creation
- `active`: Whether loan is active
- `defaulted`: Whether loan defaulted

#### `getUserLoans(address user) → uint256[]`

Get array of loan IDs for a user.

#### `getTotalRepayment(uint256 loanId) → uint256`

Calculate total repayment amount (principal + interest) for a loan.

#### `calculateInterest(uint256 loanId) → uint256`

Calculate current interest owed on a loan.

### Write Functions

#### `requestLoan(uint256 principal, uint256 collateralAmount, uint256 duration) → uint256`

Request a new loan.

**Parameters:**
- `principal`: Loan amount (in lending token decimals)
- `collateralAmount`: Collateral to deposit (in collateral token decimals)
- `duration`: Loan duration in seconds

**Returns:** `loanId`

**Requirements:**
- Valid reputation
- Sufficient collateral
- Amount within limits (100 - 100,000 tokens)
- Duration within limits (7 - 365 days)

**Example:**
```javascript
// Approve collateral first
await collateralToken.approve(loanManagerAddress, collateralAmount);

const tx = await loanManager.requestLoan(
    ethers.utils.parseUnits("1000", 6),    // 1000 USDC
    ethers.utils.parseEther("0.5"),        // 0.5 ETH collateral
    30 * 86400                              // 30 days
);

const receipt = await tx.wait();
const loanId = receipt.events[0].args.loanId;
```

#### `repayLoan(uint256 loanId)`

Repay a loan and get collateral back.

**Requirements:**
- Must be the borrower
- Loan must be active
- Must approve repayment amount first

**Example:**
```javascript
const totalRepayment = await loanManager.getTotalRepayment(loanId);

// Approve repayment
await lendingToken.approve(loanManagerAddress, totalRepayment);

// Repay
await loanManager.repayLoan(loanId);
```

#### `liquidateLoan(uint256 loanId)`

Liquidate an expired, unpaid loan (anyone can call).

**Requirements:**
- Loan must be expired (past duration)
- Loan must still be active

---

## InsurancePool

Provides insurance coverage for defaults.

### Read Functions

#### `getPoolStats() → (uint256 funds, uint256 claimed)`

Get insurance pool statistics.

**Returns:**
- `funds`: Available insurance funds
- `claimed`: Total claimed from insurance

#### `hasSufficientCoverage(uint256 totalLoansValue) → bool`

Check if pool has sufficient coverage for total active loans.

### Write Functions

#### `depositFunds(uint256 amount)`

Deposit funds into insurance pool (anyone can contribute).

**Example:**
```javascript
await lendingToken.approve(insurancePoolAddress, amount);
await insurancePool.depositFunds(ethers.utils.parseUnits("10000", 6));
```

---

## Events

### ReputationManager Events

```solidity
event ReputationUpdated(address indexed user, uint256 score, uint256 followerCount, uint256 engagementRate);
event UserBlacklisted(address indexed user, uint256 timestamp);
event UserRemovedFromBlacklist(address indexed user);
```

### LendingPool Events

```solidity
event Deposited(address indexed lender, uint256 amount, uint256 timestamp);
event Withdrawn(address indexed lender, uint256 amount, uint256 interest);
event LoanFunded(address indexed borrower, uint256 amount);
event LoanRepaid(address indexed borrower, uint256 principal, uint256 interest);
```

### LoanManager Events

```solidity
event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 principal, uint256 collateral, uint256 interestRate, uint256 duration);
event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalAmount);
event LoanDefaulted(uint256 indexed loanId, address indexed borrower);
event CollateralLiquidated(uint256 indexed loanId, uint256 collateralAmount);
```

---

## Common Workflows

### For Borrowers

1. **Verify Reputation**:
   ```javascript
   await reputationManager.verifyAndUpdateReputation(proof, followers, following, engagement, age);
   ```

2. **Check Required Collateral**:
   ```javascript
   const ratio = await reputationManager.getRequiredCollateralRatio(userAddress);
   const required = loanAmount * ratio / 10000;
   ```

3. **Request Loan**:
   ```javascript
   await collateralToken.approve(loanManager, collateralAmount);
   await loanManager.requestLoan(loanAmount, collateralAmount, duration);
   ```

4. **Repay Loan**:
   ```javascript
   const total = await loanManager.getTotalRepayment(loanId);
   await lendingToken.approve(loanManager, total);
   await loanManager.repayLoan(loanId);
   ```

### For Lenders

1. **Deposit**:
   ```javascript
   await lendingToken.approve(lendingPool, amount);
   await lendingPool.deposit(amount);
   ```

2. **Check Earnings**:
   ```javascript
   const [deposited, earned] = await lendingPool.getLenderInfo(userAddress);
   ```

3. **Withdraw**:
   ```javascript
   await lendingPool.withdraw(0); // 0 = withdraw all
   ```
