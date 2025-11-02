// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/ReputationManager.sol";
import "../src/LendingPool.sol";
import "../src/LoanManager.sol";
import "../src/InsurancePool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockReclaim is IReclaim {
    bool public shouldPass = true;

    function setShouldPass(bool _shouldPass) external {
        shouldPass = _shouldPass;
    }

    function verifyProof(Proof memory) external view override {
        require(shouldPass, "Mock proof verification failed");
    }
}

/**
 * @title IntegrationTest
 * @dev Full integration tests for UnCollateral protocol
 */
contract IntegrationTest is Test {
    ReputationManager public reputationManager;
    LendingPool public lendingPool;
    LoanManager public loanManager;
    InsurancePool public insurancePool;
    MockReclaim public mockReclaim;
    MockERC20 public usdc;
    MockERC20 public weth;

    address public owner = address(this);
    address public borrower = address(0x1);
    address public lender = address(0x2);

    uint256 constant INITIAL_USDC = 100000 * 10**6; // 100k USDC
    uint256 constant INITIAL_WETH = 100 * 10**18; // 100 WETH

    function setUp() public {
        // Deploy tokens
        usdc = new MockERC20("USD Coin", "USDC", 6);
        weth = new MockERC20("Wrapped Ether", "WETH", 18);

        // Deploy Reclaim mock
        mockReclaim = new MockReclaim();

        // Deploy protocol contracts
        reputationManager = new ReputationManager(address(mockReclaim));
        lendingPool = new LendingPool(address(usdc));
        insurancePool = new InsurancePool(address(usdc));
        loanManager = new LoanManager(
            address(reputationManager),
            address(lendingPool),
            payable(address(insurancePool)),
            address(usdc),
            address(weth)
        );

        // Connect contracts
        lendingPool.setLoanManager(address(loanManager));
        insurancePool.setLoanManager(address(loanManager));

        // Mint tokens
        usdc.mint(lender, INITIAL_USDC);
        weth.mint(borrower, INITIAL_WETH);

        // Fund insurance pool
        usdc.mint(address(this), 10000 * 10**6);
        usdc.approve(address(insurancePool), 10000 * 10**6);
        insurancePool.depositFunds(10000 * 10**6);
    }

    function testFullBorrowAndRepayFlow() public {
        // 1. Lender deposits liquidity
        vm.startPrank(lender);
        usdc.approve(address(lendingPool), 50000 * 10**6);
        lendingPool.deposit(50000 * 10**6);
        vm.stopPrank();

        // 2. Borrower verifies reputation
        IReclaim.ClaimInfo memory claimInfo;
        IReclaim.SignedClaim memory signedClaim;
        signedClaim.claim = claimInfo;
        IReclaim.Proof memory proof = IReclaim.Proof(claimInfo, signedClaim);

        vm.startPrank(borrower);
        reputationManager.verifyAndUpdateReputation(
            proof,
            10000, // high follower count
            2000,
            300, // high engagement
            1095 // 3 years old
        );
        vm.stopPrank();

        // 3. Check reputation
        assertTrue(reputationManager.isReputationValid(borrower));
        ReputationManager.TwitterReputation memory rep = reputationManager.getUserReputation(borrower);
        assertGe(rep.reputationScore, 800, "Should have high reputation");

        // 4. Request loan
        uint256 loanAmount = 10000 * 10**6; // 10k USDC
        uint256 collateralAmount = 5 * 10**18; // 5 WETH
        uint256 duration = 30 days;

        vm.startPrank(borrower);
        weth.approve(address(loanManager), collateralAmount);
        uint256 loanId = loanManager.requestLoan(loanAmount, collateralAmount, duration);
        vm.stopPrank();

        // 5. Verify loan was created
        LoanManager.Loan memory loan = loanManager.getLoan(loanId);
        assertEq(loan.borrower, borrower);
        assertEq(loan.principal, loanAmount);
        assertEq(loan.collateralAmount, collateralAmount);
        assertTrue(loan.active);

        // 6. Verify borrower received funds
        assertEq(usdc.balanceOf(borrower), loanAmount);

        // 7. Fast forward time
        vm.warp(block.timestamp + 15 days); // Half the loan duration

        // 8. Repay loan
        uint256 totalRepayment = loanManager.getTotalRepayment(loanId);
        assertGt(totalRepayment, loanAmount, "Should include interest");

        vm.startPrank(borrower);
        usdc.approve(address(loanManager), totalRepayment);
        loanManager.repayLoan(loanId);
        vm.stopPrank();

        // 9. Verify loan was repaid
        loan = loanManager.getLoan(loanId);
        assertFalse(loan.active);

        // 10. Verify borrower got collateral back
        assertEq(weth.balanceOf(borrower), INITIAL_WETH);

        // 11. Verify lender can withdraw with interest
        (uint256 deposited, uint256 earned) = lendingPool.getLenderInfo(lender);
        assertGt(earned, 0, "Lender should have earned interest");
    }

    function testLoanLiquidation() public {
        // Setup: Lender deposits, borrower verifies and gets loan
        vm.startPrank(lender);
        usdc.approve(address(lendingPool), 50000 * 10**6);
        lendingPool.deposit(50000 * 10**6);
        vm.stopPrank();

        IReclaim.ClaimInfo memory claimInfo;
        IReclaim.SignedClaim memory signedClaim;
        signedClaim.claim = claimInfo;
        IReclaim.Proof memory proof = IReclaim.Proof(claimInfo, signedClaim);

        vm.startPrank(borrower);
        reputationManager.verifyAndUpdateReputation(proof, 1000, 500, 100, 365);
        weth.approve(address(loanManager), 10 * 10**18);
        uint256 loanId = loanManager.requestLoan(
            5000 * 10**6,
            10 * 10**18,
            30 days
        );
        vm.stopPrank();

        // Fast forward past loan expiry
        vm.warp(block.timestamp + 31 days);

        // Liquidate loan
        loanManager.liquidateLoan(loanId);

        // Verify loan is defaulted
        LoanManager.Loan memory loan = loanManager.getLoan(loanId);
        assertTrue(loan.defaulted);
        assertFalse(loan.active);

        // Verify borrower is blacklisted
        assertTrue(reputationManager.isBlacklisted(borrower));
    }

    function testMultipleLendersEarnProportionally() public {
        address lender2 = address(0x3);

        // Give lender2 some USDC
        usdc.mint(lender2, INITIAL_USDC);

        // Lender 1 deposits 30k
        vm.startPrank(lender);
        usdc.approve(address(lendingPool), 30000 * 10**6);
        lendingPool.deposit(30000 * 10**6);
        vm.stopPrank();

        // Lender 2 deposits 70k (total 100k)
        vm.startPrank(lender2);
        usdc.approve(address(lendingPool), 70000 * 10**6);
        lendingPool.deposit(70000 * 10**6);
        vm.stopPrank();

        // Borrower takes loan and repays
        IReclaim.ClaimInfo memory claimInfo;
        IReclaim.SignedClaim memory signedClaim;
        signedClaim.claim = claimInfo;
        IReclaim.Proof memory proof = IReclaim.Proof(claimInfo, signedClaim);

        vm.startPrank(borrower);
        reputationManager.verifyAndUpdateReputation(proof, 10000, 2000, 300, 1095);
        weth.approve(address(loanManager), 10 * 10**18);
        uint256 loanId = loanManager.requestLoan(
            10000 * 10**6,
            5 * 10**18,
            30 days
        );
        vm.stopPrank();

        // Fast forward and repay
        vm.warp(block.timestamp + 30 days);

        vm.startPrank(borrower);
        uint256 totalRepayment = loanManager.getTotalRepayment(loanId);
        usdc.approve(address(loanManager), totalRepayment);
        loanManager.repayLoan(loanId);
        vm.stopPrank();

        // Check earnings are proportional
        (, uint256 earned1) = lendingPool.getLenderInfo(lender);
        (, uint256 earned2) = lendingPool.getLenderInfo(lender2);

        // Lender2 should earn more (~2.33x since they deposited 2.33x more)
        assertGt(earned2, earned1);

        // Rough proportionality check (allowing for rounding)
        uint256 ratio1 = (earned1 * 10000) / 30000; // earnings per 1k deposited
        uint256 ratio2 = (earned2 * 10000) / 70000;
        assertApproxEqRel(ratio1, ratio2, 0.01e18); // Within 1% due to rounding
    }
}
