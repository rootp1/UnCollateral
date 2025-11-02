# Frequently Asked Questions (FAQ)

## General Questions

### What is UnCollateral?

UnCollateral is a decentralized lending protocol that allows users to borrow crypto with reduced collateral requirements by using their verified social reputation as additional collateral.

### How does it work?

1. Users verify their Twitter reputation via Reclaim Protocol (ZK proofs)
2. The protocol calculates a reputation score (0-1000)
3. Higher scores = lower collateral requirements (50-150%)
4. Users can borrow with less capital locked up

### Why would I use this instead of Aave or Compound?

Traditional DeFi lending requires 150%+ collateralization. With UnCollateral, if you have good social reputation, you might only need 50-70% collateral, making your capital more efficient.

### Is this safe?

The protocol uses:
- Reclaim Protocol's ZK proofs (no private data exposed)
- OpenZeppelin audited contracts
- Insurance pool for lender protection
- Blacklist system to deter defaults

However, it's experimental software. Start with small amounts.

## For Borrowers

### What do I need to borrow?

1. Verified Twitter account
2. Sufficient reputation score (≥300)
3. Collateral tokens (ETH, WBTC, etc.)
4. Wallet with ETH for gas fees

### How is my reputation score calculated?

Based on:
- **Follower count** (max 300 points)
- **Engagement rate** (max 400 points)
- **Account age** (max 200 points)
- **Following ratio** (max 100 points)

### How often do I need to verify my reputation?

Every 30 days. Reputation expires to ensure data freshness.

### What happens if I don't repay my loan?

1. Your collateral is liquidated
2. You get blacklisted (can't borrow again)
3. Your reputation damage is public
4. Insurance pool covers lender losses

### Can I repay early?

Yes! You can repay anytime. Interest is calculated based on actual loan duration, not the full term.

### What's the maximum loan size?

Currently 100,000 USDC per loan. This may be adjusted based on pool liquidity.

### Why was my loan rejected?

Possible reasons:
- Reputation score too low (<300)
- Insufficient collateral
- Reputation expired
- You're blacklisted
- Pool has insufficient liquidity

## For Lenders

### How do I earn interest?

1. Deposit USDC into the lending pool
2. Interest accrues automatically as loans are made
3. Withdraw anytime (if liquidity available)

### What are the risks?

1. **Default risk**: Borrowers may not repay
   - *Mitigation*: Partial collateral + insurance pool

2. **Smart contract risk**: Bugs or exploits
   - *Mitigation*: Use audited code, start small

3. **Liquidity risk**: Can't withdraw if all funds are loaned
   - *Mitigation*: Diversify across protocols

### What's the expected return?

Depends on:
- Pool utilization rate
- Average borrower interest rate
- Protocol fees

Example: 70% utilization at 10% APR = ~7% effective APR for lenders

### Can I lose money?

Yes, if:
- Borrowers default and insurance pool is depleted
- Smart contract bug/exploit
- Extreme market conditions

Never deposit more than you can afford to lose.

### When can I withdraw?

Anytime, as long as there's available liquidity in the pool. If utilization is 100%, you'll need to wait for loan repayments.

## Technical Questions

### Which blockchain is it on?

UnCollateral can deploy on any EVM chain where Reclaim Protocol is available:
- Ethereum
- Arbitrum
- Polygon
- Optimism
- Base
- And more

### What tokens can I use?

**Lending**: USDC, DAI (depends on deployment)
**Collateral**: WETH, WBTC (depends on deployment)

### How does Reclaim Protocol work?

Reclaim uses zero-knowledge proofs to verify your Twitter data without:
- Exposing your password
- Sharing your API keys
- Revealing private information

You prove you have X followers without revealing who they are.

### Is my Twitter data stored on-chain?

No. Only your reputation score and aggregate metrics (follower count, engagement rate) are stored. The ZK proof is verified and discarded.

### Can I verify without connecting Twitter?

No. Verification requires proving you own the Twitter account via Reclaim Protocol's OAuth flow.

## Economic Questions

### How are interest rates determined?

Based on your reputation score:
- High rep (≥800): 5% APR
- Medium rep (500-799): 10% APR
- Low rep (300-499): 15% APR

### What are the fees?

- Protocol fee: 10% of interest (paid by lenders)
- No origination fees
- No early repayment penalties

### How is the insurance pool funded?

- Protocol fees
- Initial seed funding
- Community contributions

### What if the insurance pool runs out?

The protocol may:
- Pause new loans
- Require higher collateral ratios
- Increase protocol fees to replenish pool

## Privacy & Security

### Is my Twitter account private?

Your Twitter handle is linked to your wallet address on-chain. If you want privacy:
- Use a separate wallet
- Create a professional Twitter account
- Don't connect your main wallet to Twitter

### Can someone steal my Twitter account?

No. Reclaim Protocol only reads public data. It cannot:
- Post tweets
- Access DMs
- Change settings
- Take any action on your account

### What happens if my Twitter gets hacked?

If someone hacks your Twitter and changes metrics:
- They can't update your on-chain reputation (need your wallet)
- Your current loans are unaffected
- Re-verification requires wallet signature

### Are the smart contracts audited?

⚠️ **Not yet audited.** This is experimental software. Professional audit recommended before significant funds are used.

## Troubleshooting

### My transaction failed. Why?

Common reasons:
1. Insufficient gas
2. Token not approved
3. Slippage tolerance too low
4. Nonce error (try resetting MetaMask)

### I can't connect my wallet

- Ensure MetaMask is installed
- Check you're on the correct network
- Try refreshing the page
- Clear browser cache

### Reclaim verification isn't working

- Check your Twitter account is public
- Ensure you have recent tweets (not brand new account)
- Try using Chrome browser
- Contact Reclaim support

### I verified but my score is low

Reputation factors:
- Newer accounts score lower
- Low engagement hurts
- Bot-like following ratios penalized
- Improve metrics and re-verify later

## Future Development

### Will there be a governance token?

Possibly! This would allow:
- Community governance
- Protocol parameter adjustments
- Fee distribution
- Staking rewards

### Will you add more reputation sources?

Yes! Planned additions:
- GitHub contributions
- LinkedIn profile
- On-chain activity
- Attestations (EAS)
- Credit scores

### Can I build on top of UnCollateral?

Yes! The protocol is open-source (MIT license). You can:
- Fork the code
- Build integrations
- Create UIs
- Offer liquidation services

## Still Have Questions?

- Check our [Documentation](../README.md)
- Join our [Discord](#)
- Open a [GitHub Issue](https://github.com/YOUR-REPO/UnCollateral/issues)
- Email: support@uncollateral.app
