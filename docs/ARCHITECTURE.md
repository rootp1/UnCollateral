# System Architecture

Complete technical architecture of UnCollateral protocol.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Reputation│  │  Borrow  │  │   Lend   │  │  Loans   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Web3 / ethers.js
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Reclaim Protocol                          │
│         ┌───────────────────────────────┐                   │
│         │   ZK Proof Verification       │                   │
│         └───────────────────────────────┘                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Smart Contracts Layer                      │
│                                                              │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │ ReputationManager  │◄────►│    LoanManager     │        │
│  │                    │      │                    │        │
│  │ - Verify Proofs    │      │ - Create Loans     │        │
│  │ - Calculate Scores │      │ - Repay Loans      │        │
│  │ - Manage Blacklist │      │ - Liquidate Loans  │        │
│  └────────────────────┘      └─────────┬──────────┘        │
│                                        │                    │
│  ┌────────────────────┐      ┌─────────▼──────────┐        │
│  │   LendingPool      │◄────►│  InsurancePool     │        │
│  │                    │      │                    │        │
│  │ - Manage Liquidity │      │ - Cover Defaults   │        │
│  │ - Distribute Interest      │ - Track Coverage   │        │
│  └────────────────────┘      └────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ERC20 Token Contracts                       │
│   ┌─────────┐              ┌─────────┐                     │
│   │  USDC   │              │  WETH   │                     │
│   │(Lending)│              │(Collateral)                   │
│   └─────────┘              └─────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Contract Architecture

### 1. ReputationManager

**Purpose**: Manages user reputation scores based on verified social data

**Dependencies**:
- Reclaim Protocol (external)
- Ownable (OpenZeppelin)

**Key Functions**:
```solidity
- verifyAndUpdateReputation(): Verify Reclaim proof & update score
- calculateReputationScore(): Calculate score from metrics
- getRequiredCollateralRatio(): Get collateral requirement
- isReputationValid(): Check if reputation is current
- blacklistUser(): Add defaulter to blacklist
```

**State Variables**:
```solidity
- userReputation: mapping(address => TwitterReputation)
- isBlacklisted: mapping(address => bool)
- reclaimContract: IReclaim
```

**Events**:
- ReputationUpdated
- UserBlacklisted
- UserRemovedFromBlacklist

### 2. LendingPool

**Purpose**: Manages liquidity from lenders

**Dependencies**:
- IERC20 (lending token)
- SafeERC20 (OpenZeppelin)
- Ownable (OpenZeppelin)
- ReentrancyGuard (OpenZeppelin)

**Key Functions**:
```solidity
- deposit(): Lenders add liquidity
- withdraw(): Lenders remove liquidity
- fundLoan(): Transfer funds to borrower (LoanManager only)
- repayLoan(): Receive repayment (LoanManager only)
- handleDefault(): Process defaulted loan (LoanManager only)
```

**State Variables**:
```solidity
- lenders: mapping(address => LenderInfo)
- totalDeposits: uint256
- totalLoaned: uint256
- availableLiquidity: uint256
- totalInterestEarned: uint256
- loanManager: address
```

**Access Control**:
- Owner: Set loan manager, update fees
- LoanManager: Fund/repay loans, handle defaults
- Public: Deposit, withdraw

### 3. LoanManager

**Purpose**: Core loan lifecycle management

**Dependencies**:
- ReputationManager
- LendingPool
- InsurancePool
- IERC20 (lending & collateral tokens)
- SafeERC20
- Ownable
- ReentrancyGuard

**Key Functions**:
```solidity
- requestLoan(): Create new loan
- repayLoan(): Repay active loan
- liquidateLoan(): Liquidate expired loan
- calculateInterest(): Calculate current interest
- getTotalRepayment(): Get total amount to repay
```

**State Variables**:
```solidity
- loans: mapping(uint256 => Loan)
- userLoans: mapping(address => uint256[])
- loanCounter: uint256
- interest rates (high/medium/low)
```

**Loan Flow**:
```
1. Check reputation validity
2. Calculate required collateral
3. Transfer collateral from borrower
4. Create loan record
5. Request funds from LendingPool
6. Transfer funds to borrower
```

### 4. InsurancePool

**Purpose**: Provide coverage for under-collateralized defaults

**Dependencies**:
- IERC20 (lending token)
- SafeERC20
- Ownable
- ReentrancyGuard

**Key Functions**:
```solidity
- depositFunds(): Anyone can contribute
- coverDefault(): Cover defaulted loan (LoanManager only)
- withdrawFunds(): Owner can withdraw excess (owner only)
```

**State Variables**:
```solidity
- totalInsuranceFunds: uint256
- totalClaimed: uint256
- minimumCoverageRatio: uint256
```

## Data Flow

### Borrowing Flow

```
1. User → Frontend: Request loan
2. Frontend → ReputationManager: Check reputation
3. ReputationManager → Frontend: Return score & collateral requirement
4. Frontend → User: Display terms
5. User → Frontend: Approve collateral
6. Frontend → LoanManager: requestLoan()
7. LoanManager → ReputationManager: Verify reputation valid
8. LoanManager → User: Transfer collateral
9. LoanManager → LendingPool: fundLoan()
10. LendingPool → User: Transfer loan funds
11. LoanManager → User: Emit LoanCreated event
```

### Repayment Flow

```
1. User → Frontend: Initiate repayment
2. Frontend → LoanManager: getTotalRepayment()
3. LoanManager → Frontend: Return amount
4. User → Frontend: Approve repayment
5. Frontend → LoanManager: repayLoan()
6. LoanManager → User: Transfer repayment amount
7. LoanManager → LendingPool: repayLoan()
8. LendingPool → Lenders: Distribute interest
9. LoanManager → User: Return collateral
10. LoanManager → Frontend: Emit LoanRepaid event
```

### Default/Liquidation Flow

```
1. Liquidator → LoanManager: liquidateLoan()
2. LoanManager: Check loan expired
3. LoanManager → ReputationManager: blacklistUser()
4. LoanManager → InsurancePool: Transfer collateral
5. LoanManager → InsurancePool: coverDefault()
6. InsurancePool → LendingPool: Compensate (if possible)
7. LoanManager → LendingPool: handleDefault()
8. LoanManager: Emit LoanDefaulted event
```

## Security Model

### Access Control Matrix

| Function | Public | Lender | Borrower | Owner | LoanManager |
|----------|--------|--------|----------|-------|-------------|
| Deposit | ✓ | ✓ | ✓ | ✓ | - |
| Withdraw | - | ✓ | - | - | - |
| Request Loan | - | - | ✓ | - | - |
| Repay Loan | - | - | ✓ | - | - |
| Fund Loan | - | - | - | - | ✓ |
| Liquidate | ✓ | ✓ | ✓ | ✓ | ✓ |
| Blacklist | - | - | - | ✓ | - |
| Set Params | - | - | - | ✓ | - |

### Trust Assumptions

1. **Reclaim Protocol**: Proofs are valid and cannot be forged
2. **Owner**: Acts in protocol's best interest (mitigate with multi-sig)
3. **LoanManager**: Correctly implements loan logic
4. **Token Contracts**: Are not malicious
5. **Oracles** (future): Provide accurate price data

### Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|------------|
| Reentrancy | ReentrancyGuard on all external calls |
| Integer Overflow | Solidity 0.8.x built-in checks |
| Front-running | Limited value extractable |
| Flash loans | Reputation cannot be instant |
| Fake proofs | Reclaim verification |
| Oracle manipulation | Multiple sources (future) |
| Admin abuse | Multi-sig + timelock |

## Upgrade Path

Current contracts are **not upgradeable** for security.

Future upgrades require:
1. Deploy new contracts
2. Migrate liquidity (with user consent)
3. Deprecate old contracts
4. Update frontend

OR implement proxy pattern (adds complexity):
- TransparentUpgradeableProxy
- TimelockController
- Multi-sig admin

## Gas Optimization

See [GAS_OPTIMIZATION.md](GAS_OPTIMIZATION.md) for details.

Key optimizations:
- Use `calldata` for parameters
- Pack storage variables
- Cache storage reads
- Use events for history
- Custom errors (future)

## Testing Strategy

### Unit Tests
- Test each contract function individually
- Mock external dependencies
- Test edge cases and failures

### Integration Tests
- Test contract interactions
- End-to-end workflows
- Multi-user scenarios

### Fuzzing
- Use Foundry's fuzzing
- Test with random inputs
- Find edge cases

### Mainnet Fork Testing
- Test against real contracts
- Use Alchemy/Infura fork
- Verify gas costs

## Monitoring & Observability

### Events to Monitor

```solidity
// Critical events
- LoanCreated
- LoanDefaulted
- UserBlacklisted

// Important events
- ReputationUpdated
- LoanRepaid
- Deposited
- Withdrawn

// Operational events
- FundsDeposited (Insurance)
- DefaultCovered
```

### Metrics to Track

- Total Value Locked (TVL)
- Pool utilization rate
- Default rate
- Average loan size
- Average reputation score
- Insurance pool coverage ratio
- Interest earned (lenders)
- Gas costs per operation

### Alerts

Set up alerts for:
- Large loans (>$10k)
- Defaults
- Low insurance coverage (<20%)
- High utilization (>95%)
- Contract errors/reverts
- Unusual gas costs

## Deployment Architecture

### Testnet Deployment

```
1. Deploy Reclaim mock (or use existing)
2. Deploy tokens (mock USDC, WETH)
3. Deploy ReputationManager
4. Deploy LendingPool
5. Deploy InsurancePool
6. Deploy LoanManager
7. Connect contracts
8. Seed insurance pool
9. Test workflows
```

### Mainnet Deployment

```
1. Audit contracts
2. Deploy to mainnet
3. Verify on Etherscan
4. Transfer to multi-sig
5. Seed insurance pool
6. Gradual rollout (caps)
7. Monitor closely
8. Remove caps after stability
```

## Future Architecture

### Multi-Chain

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Ethereum │     │ Arbitrum │     │ Polygon  │
│  UnCol   │◄───►│  UnCol   │◄───►│  UnCol   │
└──────────┘     └──────────┘     └──────────┘
      │                │                │
      └────────────────┴────────────────┘
                       │
                  ┌────▼────┐
                  │  Bridge │
                  └─────────┘
```

### Modular Reputation

```
┌────────────────────────────────────┐
│      Reputation Aggregator         │
├────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌───────┐     │
│  │Twitter│ │GitHub│ │On-chain│    │
│  └──────┘ └──────┘ └───────┘     │
│  ┌──────┐ ┌──────┐ ┌───────┐     │
│  │LinkedIn│ │EAS  │ │Credit │     │
│  └──────┘ └──────┘ └───────┘     │
└────────────────────────────────────┘
```

## References

- [Solidity Patterns](https://fravoll.github.io/solidity-patterns/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
