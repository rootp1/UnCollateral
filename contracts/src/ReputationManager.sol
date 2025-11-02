// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IReclaim.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationManager
 * @dev Manages user reputation scores based on Twitter data verified via Reclaim Protocol
 */
contract ReputationManager is Ownable {
    IReclaim public reclaimContract;

    struct TwitterReputation {
        uint256 followerCount;
        uint256 followingCount;
        uint256 engagementRate; // in basis points (10000 = 100%)
        uint256 accountAge; // in days
        uint256 timestamp;
        uint256 reputationScore; // 0-1000 scale
        bool verified;
    }

    mapping(address => TwitterReputation) public userReputation;
    mapping(address => bool) public isBlacklisted; // Defaulters

    // Constants for reputation calculation
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant REPUTATION_VALIDITY_PERIOD = 30 days;
    uint256 public constant MIN_SCORE_FOR_LOAN = 300;

    // Events
    event ReputationUpdated(
        address indexed user,
        uint256 score,
        uint256 followerCount,
        uint256 engagementRate
    );
    event UserBlacklisted(address indexed user, uint256 timestamp);
    event UserRemovedFromBlacklist(address indexed user);

    constructor(address _reclaimContract) Ownable(msg.sender) {
        require(_reclaimContract != address(0), "Invalid Reclaim address");
        reclaimContract = IReclaim(_reclaimContract);
    }

    /**
     * @dev Verify Twitter data proof and update reputation
     * @param proof The Reclaim proof containing Twitter data
     * @param followerCount Number of Twitter followers
     * @param followingCount Number of accounts following
     * @param engagementRate Engagement rate in basis points
     * @param accountAge Account age in days
     */
    function verifyAndUpdateReputation(
        IReclaim.Proof calldata proof,
        uint256 followerCount,
        uint256 followingCount,
        uint256 engagementRate,
        uint256 accountAge
    ) external {
        require(!isBlacklisted[msg.sender], "User is blacklisted");

        // Verify the Reclaim proof
        reclaimContract.verifyProof(proof);

        // Calculate reputation score
        uint256 score = calculateReputationScore(
            followerCount,
            followingCount,
            engagementRate,
            accountAge
        );

        // Store reputation data
        userReputation[msg.sender] = TwitterReputation({
            followerCount: followerCount,
            followingCount: followingCount,
            engagementRate: engagementRate,
            accountAge: accountAge,
            timestamp: block.timestamp,
            reputationScore: score,
            verified: true
        });

        emit ReputationUpdated(msg.sender, score, followerCount, engagementRate);
    }

    /**
     * @dev Calculate reputation score based on Twitter metrics
     * @param followers Number of followers
     * @param following Number of following
     * @param engagement Engagement rate in basis points
     * @param age Account age in days
     * @return score Reputation score (0-1000)
     */
    function calculateReputationScore(
        uint256 followers,
        uint256 following,
        uint256 engagement,
        uint256 age
    ) public pure returns (uint256 score) {
        // Follower score (max 300 points)
        uint256 followerScore;
        if (followers >= 10000) {
            followerScore = 300;
        } else if (followers >= 5000) {
            followerScore = 250;
        } else if (followers >= 1000) {
            followerScore = 200;
        } else if (followers >= 500) {
            followerScore = 150;
        } else if (followers >= 100) {
            followerScore = 100;
        } else {
            followerScore = (followers * 100) / 100; // Linear up to 100
        }

        // Following ratio score (max 100 points)
        uint256 ratioScore;
        if (following > 0) {
            uint256 ratio = (followers * 100) / following;
            if (ratio >= 500) {
                ratioScore = 100;
            } else if (ratio >= 200) {
                ratioScore = 80;
            } else if (ratio >= 100) {
                ratioScore = 60;
            } else if (ratio >= 50) {
                ratioScore = 40;
            } else {
                ratioScore = 20;
            }
        } else {
            ratioScore = 100; // No following, all followers
        }

        // Engagement score (max 400 points)
        // engagement is in basis points (100 = 1%)
        uint256 engagementScore;
        if (engagement >= 500) { // >5%
            engagementScore = 400;
        } else if (engagement >= 300) { // >3%
            engagementScore = 350;
        } else if (engagement >= 100) { // >1%
            engagementScore = 250;
        } else if (engagement >= 50) { // >0.5%
            engagementScore = 150;
        } else if (engagement > 0) {
            engagementScore = (engagement * 150) / 50; // Linear up to 0.5%
        }

        // Account age score (max 200 points)
        uint256 ageScore;
        if (age >= 365 * 3) { // 3+ years
            ageScore = 200;
        } else if (age >= 365 * 2) { // 2+ years
            ageScore = 180;
        } else if (age >= 365) { // 1+ year
            ageScore = 150;
        } else if (age >= 180) { // 6+ months
            ageScore = 100;
        } else if (age >= 90) { // 3+ months
            ageScore = 60;
        } else {
            ageScore = (age * 60) / 90; // Linear up to 90 days
        }

        score = followerScore + ratioScore + engagementScore + ageScore;
        if (score > MAX_SCORE) {
            score = MAX_SCORE;
        }

        return score;
    }

    /**
     * @dev Check if user's reputation is valid
     * @param user Address of the user
     * @return valid True if reputation is valid and not expired
     */
    function isReputationValid(address user) public view returns (bool) {
        if (isBlacklisted[user] || !userReputation[user].verified) {
            return false;
        }
        return block.timestamp - userReputation[user].timestamp < REPUTATION_VALIDITY_PERIOD;
    }

    /**
     * @dev Get required collateral ratio based on reputation
     * @param user Address of the user
     * @return collateralRatio Required collateral in basis points (10000 = 100%)
     */
    function getRequiredCollateralRatio(address user)
        external
        view
        returns (uint256 collateralRatio)
    {
        require(isReputationValid(user), "Invalid or expired reputation");

        uint256 score = userReputation[user].reputationScore;

        // High reputation (800-1000): 50-70% collateral
        if (score >= 800) {
            collateralRatio = 5000 + ((1000 - score) * 100); // 5000-7000 basis points
        }
        // Medium reputation (500-799): 90-120% collateral
        else if (score >= 500) {
            collateralRatio = 9000 + ((800 - score) * 100); // 9000-12000 basis points
        }
        // Low reputation (300-499): 130-150% collateral
        else if (score >= MIN_SCORE_FOR_LOAN) {
            collateralRatio = 13000 + ((500 - score) * 100); // 13000-15000 basis points
        }
        // Below minimum score: Rejected
        else {
            revert("Reputation score too low for loan");
        }

        return collateralRatio;
    }

    /**
     * @dev Blacklist a user (called by LoanManager on default)
     * @param user Address to blacklist
     */
    function blacklistUser(address user) external onlyOwner {
        isBlacklisted[user] = true;
        emit UserBlacklisted(user, block.timestamp);
    }

    /**
     * @dev Remove user from blacklist
     * @param user Address to remove from blacklist
     */
    function removeFromBlacklist(address user) external onlyOwner {
        isBlacklisted[user] = false;
        emit UserRemovedFromBlacklist(user);
    }

    /**
     * @dev Update Reclaim contract address
     * @param _reclaimContract New Reclaim contract address
     */
    function updateReclaimContract(address _reclaimContract) external onlyOwner {
        require(_reclaimContract != address(0), "Invalid address");
        reclaimContract = IReclaim(_reclaimContract);
    }

    /**
     * @dev Get user reputation details
     * @param user Address of the user
     * @return Twitter reputation struct
     */
    function getUserReputation(address user)
        external
        view
        returns (TwitterReputation memory)
    {
        return userReputation[user];
    }
}
