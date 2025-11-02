// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IReclaim
 * @dev Interface for Reclaim Protocol proof verification
 * Based on Reclaim Protocol documentation
 */
interface IReclaim {
    struct ClaimInfo {
        string provider;
        string parameters;
        string context;
    }

    struct SignedClaim {
        ClaimInfo claim;
        bytes[] signatures;
    }

    struct Proof {
        ClaimInfo claimInfo;
        SignedClaim signedClaim;
    }

    /**
     * @dev Verifies a Reclaim proof
     * @param proof The proof to verify
     * Reverts if proof is invalid
     */
    function verifyProof(Proof memory proof) external view;
}
