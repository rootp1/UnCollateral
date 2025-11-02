// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InsurancePool
 * @dev Insurance pool to cover losses from defaulted undercollateralized loans
 */
contract InsurancePool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public lendingToken;
    address public loanManager;

    uint256 public totalInsuranceFunds;
    uint256 public totalClaimed;
    uint256 public minimumCoverageRatio = 2000; // 20% of total loans in basis points

    // Events
    event FundsDeposited(address indexed depositor, uint256 amount);
    event DefaultCovered(uint256 principal, uint256 totalOwed, uint256 covered);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

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
     * @dev Deposit funds into insurance pool
     * @param amount Amount to deposit
     */
    function depositFunds(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        lendingToken.safeTransferFrom(msg.sender, address(this), amount);
        totalInsuranceFunds += amount;

        emit FundsDeposited(msg.sender, amount);
    }

    /**
     * @dev Cover a defaulted loan (called by LoanManager)
     * @param principal Principal amount that was not repaid
     * @param totalOwed Total amount owed (principal + interest)
     */
    function coverDefault(uint256 principal, uint256 totalOwed)
        external
        onlyLoanManager
        nonReentrant
    {
        require(totalInsuranceFunds > 0, "Insufficient insurance funds");

        // Calculate how much we can cover from insurance pool
        uint256 coverageAmount = totalOwed < totalInsuranceFunds
            ? totalOwed
            : totalInsuranceFunds;

        if (coverageAmount > 0) {
            totalInsuranceFunds -= coverageAmount;
            totalClaimed += coverageAmount;

            // In a real implementation, we'd transfer this to the lending pool
            // For now, we just track it
        }

        emit DefaultCovered(principal, totalOwed, coverageAmount);
    }

    /**
     * @dev Withdraw excess insurance funds (only owner)
     * @param recipient Address to receive funds
     * @param amount Amount to withdraw
     */
    function withdrawFunds(address recipient, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= totalInsuranceFunds, "Insufficient funds");

        totalInsuranceFunds -= amount;
        lendingToken.safeTransfer(recipient, amount);

        emit FundsWithdrawn(recipient, amount);
    }

    /**
     * @dev Update minimum coverage ratio
     * @param newRatio New ratio in basis points
     */
    function updateMinimumCoverageRatio(uint256 newRatio) external onlyOwner {
        require(newRatio <= 5000, "Ratio too high (max 50%)");
        minimumCoverageRatio = newRatio;
    }

    /**
     * @dev Get insurance pool statistics
     * @return funds Total insurance funds available
     * @return claimed Total amount claimed from insurance
     */
    function getPoolStats() external view returns (uint256 funds, uint256 claimed) {
        return (totalInsuranceFunds, totalClaimed);
    }

    /**
     * @dev Check if insurance pool has sufficient coverage
     * @param totalLoansValue Total value of active loans
     * @return bool True if coverage is sufficient
     */
    function hasSufficientCoverage(uint256 totalLoansValue)
        external
        view
        returns (bool)
    {
        uint256 requiredCoverage = (totalLoansValue * minimumCoverageRatio) / 10000;
        return totalInsuranceFunds >= requiredCoverage;
    }

    /**
     * @dev Receive collateral from liquidated loans
     */
    receive() external payable {}
}
