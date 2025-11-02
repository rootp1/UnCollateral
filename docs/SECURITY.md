# Security Documentation

## Overview

This document outlines security considerations, risks, and best practices for UnCollateral protocol.

## Security Model

### Trust Assumptions

1. **Reclaim Protocol**: We trust Reclaim's zero-knowledge proof verification
2. **Oracle Data**: Twitter data is assumed to be accurately represented in proofs
3. **Token Contracts**: We assume lending and collateral tokens are not malicious
4. **Admin**: Contract owners are trusted (should use multi-sig in production)

### Attack Vectors & Mitigations

#### 1. Reputation Manipulation

**Risk**: Users could fake high reputation scores

**Mitigations**:
- Reclaim Protocol's ZK proofs prevent fake data
- On-chain verification of proofs
- Provider hash validation
- Reputation expiry (30 days)

#### 2. Flash Loan Attacks

**Risk**: Attackers use flash loans to manipulate collateral prices

**Mitigations**:
- Reputation can't be instantly created
- 30-day validity period requires sustained reputation
- Collateral liquidation uses time-weighted oracles (recommended)

#### 3. Collateral Price Manipulation

**Risk**: Rapid collateral price drops leave loans under-collateralized

**Mitigations**:
- Insurance pool coverage
- Liquidation mechanisms
- Recommended: Add price oracles (Chainlink) for dynamic monitoring
- Recommended: Implement liquidation bots

#### 4. Reentrancy Attacks

**Mitigations**:
- `ReentrancyGuard` on all state-changing functions
- Checks-Effects-Interactions pattern
- OpenZeppelin's `SafeERC20` for token transfers

#### 5. Front-Running

**Risk**: Miners/bots front-run reputation updates or liquidations

**Mitigations**:
- Minimal value extractable from reputation updates
- Liquidation is public good (anyone can call)
- Consider commit-reveal schemes for sensitive operations

#### 6. Reputation Expiry Bypass

**Risk**: Users submit loans right before expiry

**Mitigations**:
- Expiry check on loan creation
- Grace period consideration
- Reputation must be valid throughout loan

#### 7. Insurance Pool Depletion

**Risk**: Multiple defaults drain insurance pool

**Mitigations**:
- Minimum coverage ratio tracking
- Protocol fees replenish pool
- Partial collateral requirement
- Recommended: Circuit breakers if coverage drops below threshold

## Smart Contract Risks

### Known Limitations

1. **No Price Oracles**: Contract doesn't dynamically track collateral value
   - **Impact**: Collateral could lose value during loan period
   - **Mitigation**: Use conservative collateral ratios

2. **Single Reputation Source**: Only Twitter is supported
   - **Impact**: Limited attack surface but also limited data
   - **Mitigation**: Future: Add GitHub, LinkedIn, on-chain history

3. **No Emergency Pause**: Contracts lack pause functionality
   - **Impact**: Cannot stop in case of critical bug
   - **Mitigation**: Add Pausable from OpenZeppelin

4. **Admin Centralization**: Single owner control
   - **Impact**: Admin could abuse privileges
   - **Mitigation**: Use multi-sig wallet (Gnosis Safe)

5. **Interest Calculation**: Simple time-based calculation
   - **Impact**: No compounding, no variable rates
   - **Mitigation**: Acceptable for MVP

## Audit Status

⚠️ **NOT AUDITED** - This code has not been professionally audited.

**Before mainnet deployment:**
1. Get professional smart contract audit (recommended firms):
   - Trail of Bits
   - OpenZeppelin
   - Consensys Diligence
   - Certora

2. Bug bounty program
3. Formal verification of critical functions
4. Testnet deployment for community testing

## Operational Security

### For Protocol Operators

1. **Use Multi-Sig Wallet**:
   - Minimum 3-of-5 for ownership
   - Timelock for critical parameter changes

2. **Set Up Monitoring**:
   ```javascript
   // Monitor these events
   - LoanCreated (large loans)
   - LoanDefaulted
   - ReputationUpdated (suspicious scores)
   - Low insurance pool balance
   ```

3. **Rate Limiting**:
   - Consider adding rate limits on loan creation
   - Limit maximum loan size initially

4. **Emergency Procedures**:
   - Document emergency response process
   - Have kill-switch plan
   - Maintain emergency contact list

### For Users

1. **Borrowers**:
   - Never share private keys
   - Double-check transaction details
   - Understand liquidation terms
   - Set repayment reminders

2. **Lenders**:
   - Understand risk of defaults
   - Don't deposit more than you can afford to lose
   - Monitor pool utilization rate
   - Diversify across protocols

## Recommended Improvements

### High Priority

1. **Add Emergency Pause**:
   ```solidity
   import "@openzeppelin/contracts/security/Pausable.sol";

   contract LoanManager is Pausable {
       function requestLoan(...) external whenNotPaused {
           // ...
       }
   }
   ```

2. **Implement Price Oracles**:
   ```solidity
   // Use Chainlink for collateral price feeds
   AggregatorV3Interface priceFeed = AggregatorV3Interface(0x...);
   int price = priceFeed.latestAnswer();
   ```

3. **Add Timelock to Admin Functions**:
   ```solidity
   import "@openzeppelin/contracts/governance/TimelockController.sol";
   ```

4. **Implement Circuit Breakers**:
   ```solidity
   require(
       insurancePool.hasSufficientCoverage(totalLoaned),
       "Insufficient insurance coverage"
   );
   ```

### Medium Priority

1. **Multi-collateral Support**: Allow WBTC, other tokens
2. **Variable Interest Rates**: Based on utilization
3. **Liquidation Incentives**: Reward liquidators
4. **Governance Token**: Decentralize protocol control

### Low Priority

1. **NFT Receipt Tokens**: For lenders
2. **Credit Delegation**: Allow reputation transfer
3. **Cross-chain Support**: Deploy on multiple chains
4. **Mobile Notifications**: Alert users of liquidations

## Incident Response

### If a Vulnerability is Discovered

1. **Do NOT** publicly disclose immediately
2. Contact team via security@[domain].com
3. Provide detailed description and PoC if possible
4. Allow reasonable time for fix
5. Coordinate disclosure timeline

### Bug Bounty

Consider implementing bug bounty program with rewards:
- Critical: $10,000 - $50,000
- High: $5,000 - $10,000
- Medium: $1,000 - $5,000
- Low: $100 - $1,000

## Security Checklist

Before mainnet deployment:

- [ ] Professional security audit completed
- [ ] All audit issues resolved or documented
- [ ] Multi-sig wallet configured for ownership
- [ ] Emergency pause mechanism implemented
- [ ] Price oracles integrated
- [ ] Insurance pool seeded adequately
- [ ] Monitoring and alerting set up
- [ ] Bug bounty program launched
- [ ] Testnet testing completed (minimum 30 days)
- [ ] Documentation reviewed
- [ ] Incident response plan documented
- [ ] Team security training completed

## Contact

For security concerns, contact:
- Security Email: security@[domain].com
- Emergency: [Discord/Telegram link]

## References

- [Consensys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/security)
- [Rekt News](https://rekt.news/) - Learn from past exploits
- [DeFi Safety](https://defisafety.com/) - Protocol safety ratings
