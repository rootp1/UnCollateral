# Gas Optimization Guide

Strategies and techniques used to minimize gas costs in UnCollateral.

## Current Gas Costs

### Deployment Costs

| Contract | Approximate Gas | Cost @ 20 gwei |
|----------|----------------|----------------|
| ReputationManager | ~2,500,000 | ~0.05 ETH |
| LendingPool | ~3,000,000 | ~0.06 ETH |
| LoanManager | ~4,000,000 | ~0.08 ETH |
| InsurancePool | ~1,500,000 | ~0.03 ETH |
| **Total** | **~11,000,000** | **~0.22 ETH** |

### Transaction Costs

| Operation | Approximate Gas | Cost @ 20 gwei |
|-----------|----------------|----------------|
| Verify Reputation | ~150,000 | ~0.003 ETH |
| Deposit to Pool | ~80,000 | ~0.0016 ETH |
| Request Loan | ~200,000 | ~0.004 ETH |
| Repay Loan | ~120,000 | ~0.0024 ETH |
| Withdraw from Pool | ~90,000 | ~0.0018 ETH |
| Liquidate Loan | ~130,000 | ~0.0026 ETH |

## Optimization Techniques Used

### 1. Storage Optimization

**Pack Variables**:
```solidity
// ❌ Bad: Each variable uses full slot
uint256 timestamp;
bool verified;
uint256 score;

// ✅ Good: Packed into fewer slots
struct TwitterReputation {
    uint256 followerCount;      // Slot 1
    uint256 followingCount;     // Slot 2
    uint256 engagementRate;     // Slot 3
    uint256 accountAge;         // Slot 4
    uint256 timestamp;          // Slot 5
    uint256 reputationScore;    // Slot 6
    bool verified;              // Slot 6 (packed)
}
```

**Use `uint256` for counters** (cheaper than smaller uints in most cases):
```solidity
uint256 public loanCounter; // ✅ Cheaper than uint128
```

### 2. Function Optimization

**Use `calldata` for read-only arrays**:
```solidity
// ❌ Expensive: Copies to memory
function verifyProof(Proof memory proof) external

// ✅ Cheaper: Read directly from calldata
function verifyProof(Proof calldata proof) external
```

**Mark functions as `external` instead of `public`**:
```solidity
// ❌ More expensive
function deposit(uint256 amount) public

// ✅ Cheaper (if only called externally)
function deposit(uint256 amount) external
```

### 3. Loop Optimization

**Cache array length**:
```solidity
// ❌ Reads length every iteration
for (uint256 i = 0; i < array.length; i++)

// ✅ Caches length
uint256 length = array.length;
for (uint256 i = 0; i < length; i++)
```

**Use `unchecked` for safe operations**:
```solidity
for (uint256 i = 0; i < length;) {
    // ... loop body
    unchecked { ++i; } // ✅ Saves gas (no overflow check)
}
```

### 4. Error Handling

**Use custom errors instead of strings**:
```solidity
// ❌ Expensive string storage
require(amount > 0, "Amount must be greater than zero");

// ✅ Cheaper custom error (future improvement)
error AmountTooLow();
if (amount == 0) revert AmountTooLow();
```

### 5. State Changes

**Batch state updates**:
```solidity
// ❌ Multiple SSTORE operations
function updateMultiple() {
    value1 = newValue1;
    value2 = newValue2;
    value3 = newValue3;
}

// ✅ Consider using a struct for related data
function updateMultiple() {
    Config memory config = Config(newValue1, newValue2, newValue3);
    currentConfig = config; // Single SSTORE
}
```

**Use events instead of storage for historical data**:
```solidity
// ✅ Events are cheaper than storage
event ReputationUpdated(address user, uint256 score, uint256 timestamp);
```

### 6. OpenZeppelin Optimizations

**Use SafeERC20 efficiently**:
```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20; // ✅ Safer and gas-efficient
```

## Potential Improvements

### High Priority

1. **Custom Errors** (Solidity 0.8.4+):
   ```solidity
   error InsufficientFunds(uint256 available, uint256 required);

   function withdraw(uint256 amount) external {
       if (amount > balance) {
           revert InsufficientFunds(balance, amount);
       }
   }
   ```
   *Savings: ~50-100 gas per revert*

2. **Bitmap for Boolean Flags**:
   ```solidity
   // Instead of multiple bools
   mapping(address => uint256) userFlags;

   uint256 constant VERIFIED = 1;
   uint256 constant BLACKLISTED = 2;

   function setVerified(address user) {
       userFlags[user] |= VERIFIED;
   }
   ```
   *Savings: ~20,000 gas per additional boolean*

3. **Immutable Variables**:
   ```solidity
   address public immutable lendingToken; // ✅ vs address public lendingToken
   ```
   *Savings: ~2,100 gas per read*

### Medium Priority

4. **Unchecked Math** (where safe):
   ```solidity
   unchecked {
       totalLoaned -= principal; // Safe: checked earlier
   }
   ```

5. **Short-Circuit Evaluation**:
   ```solidity
   // ❌ Both functions always called
   require(isValid(user) && hasBalance(user));

   // ✅ Second check skipped if first fails
   if (!isValid(user)) revert();
   if (!hasBalance(user)) revert();
   ```

6. **Minimize Storage Reads**:
   ```solidity
   // ❌ Reads storage 3 times
   function bad() {
       if (totalDeposits > 0) {
           value = totalDeposits * 2;
           otherValue = totalDeposits / 2;
       }
   }

   // ✅ Reads storage once
   function good() {
       uint256 deposits = totalDeposits; // Cache
       if (deposits > 0) {
           value = deposits * 2;
           otherValue = deposits / 2;
       }
   }
   ```

### Low Priority

7. **Use `bytes32` instead of `string` for fixed-length data**

8. **Prefer `!=` over `>` for `uint` comparisons**:
   ```solidity
   if (value != 0) // Slightly cheaper than if (value > 0)
   ```

9. **Delete unused storage**:
   ```solidity
   delete userReputation[user]; // Refunds gas
   ```

## L2 Deployment

For even lower costs, deploy on L2:

| Network | Gas Cost Reduction |
|---------|-------------------|
| Arbitrum | ~95% cheaper |
| Optimism | ~90% cheaper |
| Base | ~90% cheaper |
| Polygon | ~99% cheaper |

## Gas Profiling

### Using Foundry

```bash
# Run tests with gas reporting
forge test --gas-report

# Snapshot gas usage
forge snapshot

# Compare snapshots
forge snapshot --diff .gas-snapshot
```

### Example Output

```
| Function              | Gas     | % of Block |
|-----------------------|---------|------------|
| deposit               | 82,431  | 0.27%      |
| requestLoan           | 198,245 | 0.66%      |
| repayLoan             | 118,932 | 0.40%      |
| verifyReputation      | 152,109 | 0.51%      |
```

## Benchmarking

### Current vs Optimized

| Operation | Current | After Custom Errors | Savings |
|-----------|---------|-------------------|---------|
| Verify Reputation | 150K | 148K | 2K (1.3%) |
| Request Loan | 200K | 195K | 5K (2.5%) |
| Repay Loan | 120K | 117K | 3K (2.5%) |

## Best Practices Checklist

- [ ] Use `calldata` for read-only function parameters
- [ ] Mark view/pure functions appropriately
- [ ] Use custom errors instead of string reverts
- [ ] Cache storage reads in memory
- [ ] Use unchecked for safe arithmetic
- [ ] Minimize storage writes
- [ ] Pack storage variables efficiently
- [ ] Use events for historical data
- [ ] Use `external` instead of `public` where possible
- [ ] Delete unused storage for gas refunds
- [ ] Profile gas usage regularly
- [ ] Consider L2 deployment

## Monitoring

Set up gas monitoring:

```javascript
// Track average gas costs
const avgGasCost = await loanManager.estimateGas.requestLoan(
    amount,
    collateral,
    duration
);

// Alert if gas spikes
if (avgGasCost > THRESHOLD) {
    sendAlert('High gas detected');
}
```

## References

- [Solidity Gas Optimization Tips](https://gist.github.com/hrkrshnn/ee8fabd532058307229d65dcd5836ddc)
- [OpenZeppelin Gas Optimization Guide](https://blog.openzeppelin.com/gas-optimization-in-solidity)
- [Foundry Gas Snapshots](https://book.getfoundry.sh/forge/gas-snapshots)
