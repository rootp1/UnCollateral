// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LendingPool
 * @dev Manages liquidity pool for lenders to provide funds for loans
 */
contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public lendingToken; // Token used for lending (e.g., USDC, DAI)
    address public loanManager;

    struct LenderInfo {
        uint256 depositedAmount;
        uint256 earnedInterest;
        uint256 lastUpdateTime;
    }

    mapping(address => LenderInfo) public lenders;

    uint256 public totalDeposits;
    uint256 public totalLoaned;
    uint256 public totalInterestEarned;
    uint256 public availableLiquidity;

    // Interest distribution
    uint256 public protocolFeeRate = 1000; // 10% in basis points
    uint256 public constant BASIS_POINTS = 10000;

    // Events
    event Deposited(address indexed lender, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed lender, uint256 amount, uint256 interest);
    event LoanFunded(address indexed borrower, uint256 amount);
    event LoanRepaid(address indexed borrower, uint256 principal, uint256 interest);
    event InterestDistributed(uint256 amount, uint256 timestamp);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);

    modifier onlyLoanManager() {
        require(msg.sender == loanManager, "Only LoanManager can call");
        _;
    }

    constructor(address _lendingToken) Ownable(msg.sender) {
        require(_lendingToken != address(0), "Invalid token address");
        lendingToken = IERC20(_lendingToken);
    }

    /**
     * @dev Set the LoanManager contract address
     * @param _loanManager Address of LoanManager contract
     */
    function setLoanManager(address _loanManager) external onlyOwner {
        require(_loanManager != address(0), "Invalid address");
        loanManager = _loanManager;
    }

    /**
     * @dev Deposit funds into the lending pool
     * @param amount Amount of tokens to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Update lender interest before deposit
        _updateLenderInterest(msg.sender);

        // Transfer tokens from lender
        lendingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update lender info
        lenders[msg.sender].depositedAmount += amount;
        totalDeposits += amount;
        availableLiquidity += amount;

        emit Deposited(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Withdraw funds and earned interest from the pool
     * @param amount Amount to withdraw (0 = withdraw all)
     */
    function withdraw(uint256 amount) external nonReentrant {
        LenderInfo storage lender = lenders[msg.sender];
        require(lender.depositedAmount > 0, "No deposits found");

        // Update interest before withdrawal
        _updateLenderInterest(msg.sender);

        uint256 withdrawAmount = amount == 0 ? lender.depositedAmount : amount;
        require(withdrawAmount <= lender.depositedAmount, "Insufficient balance");
        require(withdrawAmount <= availableLiquidity, "Insufficient liquidity");

        uint256 interest = lender.earnedInterest;

        // Update state
        lender.depositedAmount -= withdrawAmount;
        lender.earnedInterest = 0;
        totalDeposits -= withdrawAmount;
        availableLiquidity -= withdrawAmount;

        // Transfer principal + interest
        uint256 totalWithdraw = withdrawAmount + interest;
        lendingToken.safeTransfer(msg.sender, totalWithdraw);

        emit Withdrawn(msg.sender, withdrawAmount, interest);
    }

    /**
     * @dev Fund a loan (called by LoanManager)
     * @param borrower Address of borrower
     * @param amount Loan amount
     */
    function fundLoan(address borrower, uint256 amount)
        external
        onlyLoanManager
        nonReentrant
    {
        require(amount <= availableLiquidity, "Insufficient liquidity");

        availableLiquidity -= amount;
        totalLoaned += amount;

        lendingToken.safeTransfer(borrower, amount);

        emit LoanFunded(borrower, amount);
    }

    /**
     * @dev Repay a loan (called by LoanManager)
     * @param borrower Address of borrower
     * @param principal Principal amount
     * @param interest Interest amount
     */
    function repayLoan(
        address borrower,
        uint256 principal,
        uint256 interest
    ) external onlyLoanManager nonReentrant {
        // Receive repayment
        lendingToken.safeTransferFrom(borrower, address(this), principal + interest);

        // Calculate protocol fee
        uint256 protocolFee = (interest * protocolFeeRate) / BASIS_POINTS;
        uint256 lenderInterest = interest - protocolFee;

        // Update state
        totalLoaned -= principal;
        availableLiquidity += principal;
        totalInterestEarned += lenderInterest;

        // Distribute interest to lenders proportionally
        _distributeInterest(lenderInterest);

        emit LoanRepaid(borrower, principal, interest);
        emit InterestDistributed(lenderInterest, block.timestamp);
    }

    /**
     * @dev Handle loan default (called by LoanManager)
     * @param principal Principal amount that was not repaid
     */
    function handleDefault(uint256 principal) external onlyLoanManager {
        totalLoaned -= principal;
        // Loss is absorbed by the pool (and covered by collateral + insurance)
    }

    /**
     * @dev Update lender's earned interest
     * @param lenderAddress Address of the lender
     */
    function _updateLenderInterest(address lenderAddress) internal {
        LenderInfo storage lender = lenders[lenderAddress];

        if (lender.depositedAmount > 0 && totalDeposits > 0) {
            // Calculate proportional share of interest earned since last update
            uint256 share = (lender.depositedAmount * totalInterestEarned) / totalDeposits;
            if (share > lender.earnedInterest) {
                lender.earnedInterest = share;
            }
        }

        lender.lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Distribute interest proportionally to all lenders
     * @param interest Total interest to distribute
     */
    function _distributeInterest(uint256 interest) internal {
        if (totalDeposits > 0) {
            totalInterestEarned += interest;
        }
    }

    /**
     * @dev Get lender information
     * @param lenderAddress Address of the lender
     * @return deposited Total deposited amount
     * @return earned Earned interest
     */
    function getLenderInfo(address lenderAddress)
        external
        view
        returns (uint256 deposited, uint256 earned)
    {
        LenderInfo memory lender = lenders[lenderAddress];

        uint256 currentEarned = lender.earnedInterest;
        if (lender.depositedAmount > 0 && totalDeposits > 0) {
            uint256 share = (lender.depositedAmount * totalInterestEarned) / totalDeposits;
            if (share > currentEarned) {
                currentEarned = share;
            }
        }

        return (lender.depositedAmount, currentEarned);
    }

    /**
     * @dev Update protocol fee rate
     * @param newFeeRate New fee rate in basis points
     */
    function updateProtocolFee(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 2000, "Fee too high (max 20%)");
        uint256 oldFee = protocolFeeRate;
        protocolFeeRate = newFeeRate;
        emit ProtocolFeeUpdated(oldFee, newFeeRate);
    }

    /**
     * @dev Withdraw protocol fees (accumulated fees)
     * @param recipient Address to receive fees
     */
    function withdrawProtocolFees(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        // Protocol fees are the interest that wasn't distributed to lenders
        uint256 balance = lendingToken.balanceOf(address(this));
        uint256 allocatedFunds = totalDeposits + availableLiquidity;

        if (balance > allocatedFunds) {
            uint256 fees = balance - allocatedFunds;
            lendingToken.safeTransfer(recipient, fees);
        }
    }

    /**
     * @dev Get pool statistics
     * @return deposits Total deposits in pool
     * @return loaned Total amount currently loaned
     * @return liquidity Available liquidity
     * @return interest Total interest earned
     */
    function getPoolStats()
        external
        view
        returns (
            uint256 deposits,
            uint256 loaned,
            uint256 liquidity,
            uint256 interest
        )
    {
        return (totalDeposits, totalLoaned, availableLiquidity, totalInterestEarned);
    }
}
