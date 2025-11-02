// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/ReputationManager.sol";
import "../src/interfaces/IReclaim.sol";

contract MockReclaim is IReclaim {
    bool public shouldPass = true;

    function setShouldPass(bool _shouldPass) external {
        shouldPass = _shouldPass;
    }

    function verifyProof(Proof memory) external view override {
        require(shouldPass, "Mock proof verification failed");
    }
}

contract ReputationManagerTest is Test {
    ReputationManager public reputationManager;
    MockReclaim public mockReclaim;
    address public user = address(0x1);

    function setUp() public {
        mockReclaim = new MockReclaim();
        reputationManager = new ReputationManager(address(mockReclaim));
    }

    function testCalculateReputationScore() public {
        // Test high reputation scenario
        uint256 score = reputationManager.calculateReputationScore(
            10000, // 10k followers
            2000, // 2k following
            300, // 3% engagement
            1095 // 3 years
        );
        assertGe(score, 800, "High metrics should give score >= 800");

        // Test medium reputation scenario
        score = reputationManager.calculateReputationScore(
            1000, // 1k followers
            500, // 500 following
            100, // 1% engagement
            365 // 1 year
        );
        assertGe(score, 500, "Medium metrics should give score >= 500");
        assertLt(score, 800, "Medium metrics should give score < 800");

        // Test low reputation scenario
        score = reputationManager.calculateReputationScore(
            200, // 200 followers
            300, // 300 following
            50, // 0.5% engagement
            90 // 90 days
        );
        assertGe(score, 300, "Low metrics should give score >= 300");
        assertLt(score, 500, "Low metrics should give score < 500");
    }

    function testGetRequiredCollateralRatio() public {
        // Setup: Create a verified reputation
        IReclaim.ClaimInfo memory claimInfo;
        IReclaim.SignedClaim memory signedClaim;
        signedClaim.claim = claimInfo;
        IReclaim.Proof memory proof = IReclaim.Proof(claimInfo, signedClaim);

        vm.prank(user);
        reputationManager.verifyAndUpdateReputation(
            proof,
            10000, // followers
            2000, // following
            300, // engagement
            1095 // age
        );

        // Test collateral ratio for high reputation
        uint256 ratio = reputationManager.getRequiredCollateralRatio(user);
        assertLe(ratio, 7000, "High rep should require <= 70% collateral");
        assertGe(ratio, 5000, "High rep should require >= 50% collateral");
    }

    function testBlacklist() public {
        assertFalse(reputationManager.isBlacklisted(user));

        reputationManager.blacklistUser(user);
        assertTrue(reputationManager.isBlacklisted(user));

        reputationManager.removeFromBlacklist(user);
        assertFalse(reputationManager.isBlacklisted(user));
    }

    function testCannotGetCollateralRatioWithoutReputation() public {
        vm.expectRevert("Invalid or expired reputation");
        reputationManager.getRequiredCollateralRatio(user);
    }

    function testReputationExpiry() public {
        IReclaim.ClaimInfo memory claimInfo;
        IReclaim.SignedClaim memory signedClaim;
        signedClaim.claim = claimInfo;
        IReclaim.Proof memory proof = IReclaim.Proof(claimInfo, signedClaim);

        vm.prank(user);
        reputationManager.verifyAndUpdateReputation(proof, 1000, 500, 100, 365);

        assertTrue(reputationManager.isReputationValid(user));

        // Fast forward 31 days
        vm.warp(block.timestamp + 31 days);

        assertFalse(reputationManager.isReputationValid(user));
    }
}
