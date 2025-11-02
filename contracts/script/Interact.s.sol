// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import "../src/ReputationManager.sol";
import "../src/LendingPool.sol";
import "../src/LoanManager.sol";

/**
 * @title Interact
 * @dev Example scripts for interacting with deployed contracts
 * Usage: forge script script/Interact.s.sol:DepositToPool --rpc-url $RPC_URL --broadcast
 */

contract DepositToPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address lendingPoolAddress = vm.envAddress("LENDING_POOL_ADDRESS");
        address lendingTokenAddress = vm.envAddress("LENDING_TOKEN_ADDRESS");
        uint256 depositAmount = 1000 * 10**6; // 1000 USDC (6 decimals)

        vm.startBroadcast(deployerPrivateKey);

        // Approve lending token
        (bool success, ) = lendingTokenAddress.call(
            abi.encodeWithSignature(
                "approve(address,uint256)",
                lendingPoolAddress,
                depositAmount
            )
        );
        require(success, "Approval failed");

        // Deposit to pool
        LendingPool lendingPool = LendingPool(lendingPoolAddress);
        lendingPool.deposit(depositAmount);

        console.log("Deposited", depositAmount, "to lending pool");

        vm.stopBroadcast();
    }
}

contract RequestLoan is Script {
    function run() external {
        uint256 borrowerPrivateKey = vm.envUint("PRIVATE_KEY");
        address loanManagerAddress = vm.envAddress("LOAN_MANAGER_ADDRESS");
        address collateralTokenAddress = vm.envAddress("COLLATERAL_TOKEN_ADDRESS");

        uint256 loanAmount = 1000 * 10**6; // 1000 USDC
        uint256 collateralAmount = 0.5 * 10**18; // 0.5 ETH
        uint256 duration = 30 days;

        vm.startBroadcast(borrowerPrivateKey);

        // Approve collateral
        (bool success, ) = collateralTokenAddress.call(
            abi.encodeWithSignature(
                "approve(address,uint256)",
                loanManagerAddress,
                collateralAmount
            )
        );
        require(success, "Collateral approval failed");

        // Request loan
        LoanManager loanManager = LoanManager(loanManagerAddress);
        uint256 loanId = loanManager.requestLoan(
            loanAmount,
            collateralAmount,
            duration
        );

        console.log("Loan requested with ID:", loanId);
        console.log("Principal:", loanAmount);
        console.log("Collateral:", collateralAmount);
        console.log("Duration:", duration / 86400, "days");

        vm.stopBroadcast();
    }
}

contract RepayLoan is Script {
    function run() external {
        uint256 borrowerPrivateKey = vm.envUint("PRIVATE_KEY");
        address loanManagerAddress = vm.envAddress("LOAN_MANAGER_ADDRESS");
        address lendingTokenAddress = vm.envAddress("LENDING_TOKEN_ADDRESS");
        uint256 loanId = vm.envUint("LOAN_ID");

        vm.startBroadcast(borrowerPrivateKey);

        LoanManager loanManager = LoanManager(loanManagerAddress);

        // Get total repayment amount
        uint256 totalRepayment = loanManager.getTotalRepayment(loanId);

        // Approve repayment
        (bool success, ) = lendingTokenAddress.call(
            abi.encodeWithSignature(
                "approve(address,uint256)",
                loanManagerAddress,
                totalRepayment
            )
        );
        require(success, "Repayment approval failed");

        // Repay loan
        loanManager.repayLoan(loanId);

        console.log("Loan", loanId, "repaid successfully");
        console.log("Total repayment:", totalRepayment);

        vm.stopBroadcast();
    }
}

contract CheckReputation is Script {
    function run() external view {
        address reputationManagerAddress = vm.envAddress("REPUTATION_MANAGER_ADDRESS");
        address userAddress = vm.envAddress("USER_ADDRESS");

        ReputationManager reputationManager = ReputationManager(reputationManagerAddress);

        ReputationManager.TwitterReputation memory rep = reputationManager.getUserReputation(userAddress);

        console.log("=== Reputation for", userAddress, "===");
        console.log("Score:", rep.reputationScore, "/ 1000");
        console.log("Followers:", rep.followerCount);
        console.log("Following:", rep.followingCount);
        console.log("Engagement:", rep.engagementRate, "basis points");
        console.log("Account Age:", rep.accountAge, "days");
        console.log("Verified:", rep.verified);

        if (reputationManager.isReputationValid(userAddress)) {
            uint256 collateralRatio = reputationManager.getRequiredCollateralRatio(userAddress);
            console.log("Required Collateral:", collateralRatio / 100, "%");
        } else {
            console.log("Reputation: INVALID or EXPIRED");
        }
    }
}

contract PoolStats is Script {
    function run() external view {
        address lendingPoolAddress = vm.envAddress("LENDING_POOL_ADDRESS");

        LendingPool lendingPool = LendingPool(lendingPoolAddress);

        (
            uint256 deposits,
            uint256 loaned,
            uint256 liquidity,
            uint256 interest
        ) = lendingPool.getPoolStats();

        console.log("=== Lending Pool Statistics ===");
        console.log("Total Deposits:", deposits / 10**6, "USDC");
        console.log("Currently Loaned:", loaned / 10**6, "USDC");
        console.log("Available Liquidity:", liquidity / 10**6, "USDC");
        console.log("Total Interest Earned:", interest / 10**6, "USDC");

        uint256 utilizationRate = loaned * 10000 / deposits;
        console.log("Utilization Rate:", utilizationRate / 100, "%");
    }
}
