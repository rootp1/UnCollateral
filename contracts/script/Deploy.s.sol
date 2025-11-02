// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import "../src/ReputationManager.sol";
import "../src/LendingPool.sol";
import "../src/LoanManager.sol";
import "../src/InsurancePool.sol";

/**
 * @title Deploy
 * @dev Deployment script for UnCollateral lending platform
 */
contract Deploy is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address reclaimAddress = vm.envAddress("RECLAIM_CONTRACT_ADDRESS");
        address lendingTokenAddress = vm.envAddress("LENDING_TOKEN_ADDRESS");
        address collateralTokenAddress = vm.envAddress("COLLATERAL_TOKEN_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ReputationManager
        console.log("Deploying ReputationManager...");
        ReputationManager reputationManager = new ReputationManager(reclaimAddress);
        console.log("ReputationManager deployed at:", address(reputationManager));

        // 2. Deploy LendingPool
        console.log("Deploying LendingPool...");
        LendingPool lendingPool = new LendingPool(lendingTokenAddress);
        console.log("LendingPool deployed at:", address(lendingPool));

        // 3. Deploy InsurancePool
        console.log("Deploying InsurancePool...");
        InsurancePool insurancePool = new InsurancePool(lendingTokenAddress);
        console.log("InsurancePool deployed at:", address(insurancePool));

        // 4. Deploy LoanManager
        console.log("Deploying LoanManager...");
        LoanManager loanManager = new LoanManager(
            address(reputationManager),
            address(lendingPool),
            payable(address(insurancePool)),
            lendingTokenAddress,
            collateralTokenAddress
        );
        console.log("LoanManager deployed at:", address(loanManager));

        // 5. Set up connections
        console.log("Setting up contract connections...");
        lendingPool.setLoanManager(address(loanManager));
        insurancePool.setLoanManager(address(loanManager));

        console.log("\n=== Deployment Complete ===");
        console.log("ReputationManager:", address(reputationManager));
        console.log("LendingPool:", address(lendingPool));
        console.log("InsurancePool:", address(insurancePool));
        console.log("LoanManager:", address(loanManager));
        console.log("=========================\n");

        vm.stopBroadcast();
    }
}
