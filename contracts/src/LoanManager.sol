// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./ReputationManager.sol";
import "./LendingPool.sol";
import "./InsurancePool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LoanManager
 * @dev Manages loan creation, repayment, and liquidation with dynamic collateralization
 */
contract LoanManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    ReputationManager public reputationManager;
    LendingPool public lendingPool;
    InsurancePool public insurancePool;
    IERC20 public lendingToken;
    IERC20 public collateralToken; // e.g., WETH, WBTC

    struct Loan {
        address borrower;
        uint256 principal;
        uint256 collateralAmount;
        uint256 interestRate; // Annual rate in basis points
        uint256 startTime;
        uint256 duration; // Loan duration in seconds
        uint256 reputationScore;
        bool active;
        bool defaulted;
    }

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    uint256 public loanCounter;

    // Loan parameters
    uint256 public constant MIN_LOAN_AMOUNT = 100 * 10**18; // 100 tokens
    uint256 public constant MAX_LOAN_AMOUNT = 100000 * 10**18; // 100k tokens
    uint256 public constant MIN_LOAN_DURATION = 7 days;
    uint256 public constant MAX_LOAN_DURATION = 365 days;
    uint256 public constant BASIS_POINTS = 10000;

    // Interest rates based on reputation (annual rates in basis points)
    uint256 public highRepInterestRate = 500; // 5% for score >= 800
    uint256 public mediumRepInterestRate = 1000; // 10% for score >= 500
    uint256 public lowRepInterestRate = 1500; // 15% for score < 500

    // Events
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principal,
        uint256 collateral,
        uint256 interestRate,
        uint256 duration
    );
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalAmount);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower);
    event CollateralLiquidated(uint256 indexed loanId, uint256 collateralAmount);

    constructor(
        address _reputationManager,
        address _lendingPool,
        address payable _insurancePool,
        address _lendingToken,
        address _collateralToken
    ) Ownable(msg.sender) {
        require(_reputationManager != address(0), "Invalid reputation manager");
        require(_lendingPool != address(0), "Invalid lending pool");
        require(_insurancePool != address(0), "Invalid insurance pool");
        require(_lendingToken != address(0), "Invalid lending token");
        require(_collateralToken != address(0), "Invalid collateral token");

        reputationManager = ReputationManager(_reputationManager);
        lendingPool = LendingPool(_lendingPool);
        insurancePool = InsurancePool(_insurancePool);
        lendingToken = IERC20(_lendingToken);
        collateralToken = IERC20(_collateralToken);
    }

    /**
     * @dev Request a new loan
     * @param principal Loan amount requested
     * @param collateralAmount Amount of collateral to provide
     * @param duration Loan duration in seconds
     */
    function requestLoan(
        uint256 principal,
        uint256 collateralAmount,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(principal >= MIN_LOAN_AMOUNT, "Loan amount too small");
        require(principal <= MAX_LOAN_AMOUNT, "Loan amount too large");
        require(duration >= MIN_LOAN_DURATION, "Duration too short");
        require(duration <= MAX_LOAN_DURATION, "Duration too long");

        // Verify reputation is valid
        require(
            reputationManager.isReputationValid(msg.sender),
            "Invalid or expired reputation"
        );

        // Get required collateral ratio
        uint256 requiredCollateralRatio = reputationManager.getRequiredCollateralRatio(
            msg.sender
        );

        // Calculate minimum collateral required
        uint256 minCollateral = (principal * requiredCollateralRatio) / BASIS_POINTS;
        require(collateralAmount >= minCollateral, "Insufficient collateral");

        // Get user's reputation score for interest rate calculation
        ReputationManager.TwitterReputation memory rep = reputationManager.getUserReputation(
            msg.sender
        );

        // Determine interest rate based on reputation
        uint256 interestRate = _getInterestRate(rep.reputationScore);

        // Transfer collateral from borrower
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralAmount);

        // Create loan
        uint256 loanId = loanCounter++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            principal: principal,
            collateralAmount: collateralAmount,
            interestRate: interestRate,
            startTime: block.timestamp,
            duration: duration,
            reputationScore: rep.reputationScore,
            active: true,
            defaulted: false
        });

        userLoans[msg.sender].push(loanId);

        // Fund loan from lending pool
        lendingPool.fundLoan(msg.sender, principal);

        emit LoanCreated(
            loanId,
            msg.sender,
            principal,
            collateralAmount,
            interestRate,
            duration
        );

        return loanId;
    }

    /**
     * @dev Repay a loan
     * @param loanId ID of the loan to repay
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(loan.borrower == msg.sender, "Not the borrower");
        require(!loan.defaulted, "Loan already defaulted");

        // Calculate total repayment amount
        uint256 interest = calculateInterest(loanId);
        uint256 totalRepayment = loan.principal + interest;

        // Mark loan as inactive
        loan.active = false;

        // Transfer repayment to lending pool
        lendingToken.safeTransferFrom(msg.sender, address(this), totalRepayment);
        lendingToken.approve(address(lendingPool), totalRepayment);
        lendingPool.repayLoan(msg.sender, loan.principal, interest);

        // Return collateral to borrower
        collateralToken.safeTransfer(msg.sender, loan.collateralAmount);

        emit LoanRepaid(loanId, msg.sender, totalRepayment);
    }

    /**
     * @dev Liquidate a defaulted loan
     * @param loanId ID of the loan to liquidate
     */
    function liquidateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(block.timestamp > loan.startTime + loan.duration, "Loan not expired");

        // Mark as defaulted
        loan.active = false;
        loan.defaulted = true;

        // Blacklist the borrower
        reputationManager.blacklistUser(loan.borrower);

        // Liquidate collateral - send to lending pool
        if (loan.collateralAmount > 0) {
            // In a real scenario, we'd swap collateral for lending token
            // For now, we'll send collateral to insurance pool for coverage
            collateralToken.safeTransfer(address(insurancePool), loan.collateralAmount);

            // Request insurance coverage for the difference
            uint256 interest = calculateInterest(loanId);
            uint256 totalOwed = loan.principal + interest;

            // Insurance pool covers the loss
            insurancePool.coverDefault(loan.principal, totalOwed);
        }

        // Notify lending pool of default
        lendingPool.handleDefault(loan.principal);

        emit LoanDefaulted(loanId, loan.borrower);
        emit CollateralLiquidated(loanId, loan.collateralAmount);
    }

    /**
     * @dev Calculate interest for a loan
     * @param loanId ID of the loan
     * @return interest Interest amount owed
     */
    function calculateInterest(uint256 loanId) public view returns (uint256) {
        Loan memory loan = loans[loanId];

        uint256 timeElapsed = block.timestamp - loan.startTime;
        if (timeElapsed > loan.duration) {
            timeElapsed = loan.duration;
        }

        // Interest = Principal * Rate * Time / (365 days * BASIS_POINTS)
        uint256 interest = (loan.principal * loan.interestRate * timeElapsed) /
            (365 days * BASIS_POINTS);

        return interest;
    }

    /**
     * @dev Get interest rate based on reputation score
     * @param score Reputation score
     * @return Annual interest rate in basis points
     */
    function _getInterestRate(uint256 score) internal view returns (uint256) {
        if (score >= 800) {
            return highRepInterestRate;
        } else if (score >= 500) {
            return mediumRepInterestRate;
        } else {
            return lowRepInterestRate;
        }
    }

    /**
     * @dev Get loan details
     * @param loanId ID of the loan
     * @return loan Loan struct
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @dev Get all loans for a user
     * @param user Address of the user
     * @return Array of loan IDs
     */
    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    /**
     * @dev Get total repayment amount for a loan
     * @param loanId ID of the loan
     * @return Total amount to repay (principal + interest)
     */
    function getTotalRepayment(uint256 loanId) external view returns (uint256) {
        Loan memory loan = loans[loanId];
        uint256 interest = calculateInterest(loanId);
        return loan.principal + interest;
    }

    /**
     * @dev Update interest rates
     * @param _highRepRate Rate for high reputation (>= 800)
     * @param _mediumRepRate Rate for medium reputation (>= 500)
     * @param _lowRepRate Rate for low reputation (< 500)
     */
    function updateInterestRates(
        uint256 _highRepRate,
        uint256 _mediumRepRate,
        uint256 _lowRepRate
    ) external onlyOwner {
        require(_highRepRate <= 2000, "High rep rate too high");
        require(_mediumRepRate <= 3000, "Medium rep rate too high");
        require(_lowRepRate <= 5000, "Low rep rate too high");

        highRepInterestRate = _highRepRate;
        mediumRepInterestRate = _mediumRepRate;
        lowRepInterestRate = _lowRepRate;
    }
}
