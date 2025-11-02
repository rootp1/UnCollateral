// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/LendingPool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USDC", "MUSDC") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract LendingPoolTest is Test {
    LendingPool public lendingPool;
    MockERC20 public token;
    address public lender = address(0x1);
    address public loanManager = address(0x2);

    function setUp() public {
        token = new MockERC20();
        lendingPool = new LendingPool(address(token));
        lendingPool.setLoanManager(loanManager);

        // Give lender some tokens
        token.mint(lender, 10000 * 10**18);
    }

    function testDeposit() public {
        uint256 depositAmount = 1000 * 10**18;

        vm.startPrank(lender);
        token.approve(address(lendingPool), depositAmount);
        lendingPool.deposit(depositAmount);
        vm.stopPrank();

        (uint256 deposited, ) = lendingPool.getLenderInfo(lender);
        assertEq(deposited, depositAmount);
    }

    function testWithdraw() public {
        uint256 depositAmount = 1000 * 10**18;

        vm.startPrank(lender);
        token.approve(address(lendingPool), depositAmount);
        lendingPool.deposit(depositAmount);

        uint256 balanceBefore = token.balanceOf(lender);
        lendingPool.withdraw(depositAmount);
        uint256 balanceAfter = token.balanceOf(lender);
        vm.stopPrank();

        assertEq(balanceAfter - balanceBefore, depositAmount);
    }

    function testFundLoan() public {
        uint256 depositAmount = 1000 * 10**18;
        uint256 loanAmount = 500 * 10**18;

        vm.startPrank(lender);
        token.approve(address(lendingPool), depositAmount);
        lendingPool.deposit(depositAmount);
        vm.stopPrank();

        address borrower = address(0x3);
        vm.prank(loanManager);
        lendingPool.fundLoan(borrower, loanAmount);

        assertEq(token.balanceOf(borrower), loanAmount);
    }

    function testCannotFundLoanWithoutLiquidity() public {
        address borrower = address(0x3);
        uint256 loanAmount = 1000 * 10**18;

        vm.prank(loanManager);
        vm.expectRevert("Insufficient liquidity");
        lendingPool.fundLoan(borrower, loanAmount);
    }

    function testOnlyLoanManagerCanFundLoan() public {
        vm.expectRevert("Only LoanManager can call");
        lendingPool.fundLoan(address(0x3), 100);
    }
}
