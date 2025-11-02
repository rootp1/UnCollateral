# Troubleshooting Guide

Common issues and solutions for UnCollateral.

## Smart Contract Issues

### Build Errors

#### Error: "Compiler version mismatch"

**Solution**:
```bash
cd contracts
foundryup  # Update Foundry to latest
forge build
```

#### Error: "Library not found"

**Solution**:
```bash
cd contracts
forge install  # Reinstall dependencies
forge build
```

#### Error: "Stack too deep"

**Cause**: Too many local variables in a function

**Solution**:
- Move some variables to a struct
- Split function into multiple smaller functions
- Use fewer local variables

### Deployment Issues

#### Error: "Insufficient funds"

**Solution**:
- Ensure deployer wallet has enough ETH for gas
- Check network is correct
- Lower gas price if on testnet

#### Error: "Nonce too low"

**Solution**:
```bash
# Reset nonce in MetaMask: Settings → Advanced → Reset Account
# Or wait and retry
```

#### Error: "Contract verification failed"

**Solution**:
```bash
# Manual verification
forge verify-contract \
    --chain-id 1 \
    --compiler-version v0.8.20 \
    $CONTRACT_ADDRESS \
    src/ContractName.sol:ContractName \
    --etherscan-api-key $API_KEY
```

## Frontend Issues

### Wallet Connection

#### Error: "MetaMask not detected"

**Solution**:
- Install MetaMask extension
- Refresh page
- Check browser compatibility

#### Error: "Wrong network"

**Solution**:
- Switch network in MetaMask
- Or add network manually:
  ```
  Network Name: Sepolia
  RPC URL: https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY
  Chain ID: 11155111
  Currency: ETH
  ```

#### Error: "User rejected transaction"

**Solution**:
- Retry transaction
- Check gas fees
- Ensure sufficient balance

### Reclaim Protocol Issues

#### Error: "Reclaim verification failed"

**Solutions**:
- Ensure Twitter account is public
- Check you have recent tweets
- Try different browser (Chrome recommended)
- Clear browser cache
- Contact Reclaim support

#### Error: "Invalid proof"

**Causes**:
- Proof expired (24h validity)
- Wrong network
- Proof for different address

**Solution**:
- Generate new proof
- Verify network matches
- Use same wallet for verification

### Transaction Issues

#### Error: "Transaction failed"

**Common Causes**:
1. Insufficient gas
2. Token not approved
3. Contract reverted

**Debug Steps**:
```bash
# 1. Check transaction on explorer
# 2. Look for revert reason
# 3. Check contract state
# 4. Verify approvals
```

#### Error: "Gas estimation failed"

**Solution**:
- Manually set gas limit
- Check contract state is valid
- Verify all prerequisites met

## Common User Errors

### Borrowing Issues

#### "Reputation expired"

**Solution**:
- Re-verify Twitter account
- Reputation valid for 30 days

#### "Insufficient collateral"

**Solution**:
```javascript
// Check required ratio
const ratio = await reputationManager.getRequiredCollateralRatio(address);
// Calculate needed collateral
const needed = loanAmount * ratio / 10000;
```

#### "Reputation score too low"

**Solution**:
- Improve Twitter metrics
- Wait and re-verify
- Minimum score: 300

#### "Insufficient liquidity"

**Solution**:
- Try smaller loan amount
- Wait for repayments
- Check pool statistics

### Lending Issues

#### "Cannot withdraw"

**Causes**:
- Insufficient available liquidity
- All funds are loaned out

**Solution**:
- Wait for loan repayments
- Withdraw partial amount
- Check utilization rate

#### "Interest not showing"

**Solution**:
- Wait for loan activity
- Interest accrues on active loans
- Check pool has loans

## Development Issues

### Testing

#### "Tests failing"

**Debug**:
```bash
# Run with verbose output
forge test -vvvv

# Run specific test
forge test --match-test testFunctionName -vvv

# Use console.log
import "forge-std/console.sol";
console.log("Value:", value);
```

#### "Coverage not working"

**Solution**:
```bash
# Install lcov
sudo apt-get install lcov

# Generate coverage
forge coverage --report lcov
```

### Local Development

#### "Anvil not starting"

**Solution**:
```bash
# Kill existing instance
pkill anvil

# Start fresh
anvil
```

#### "Frontend can't connect to contracts"

**Checklist**:
- [ ] Contracts deployed?
- [ ] Addresses updated in .env?
- [ ] Network correct?
- [ ] MetaMask connected?
- [ ] ABIs exported?

## Performance Issues

### Slow Transactions

**Solutions**:
- Increase gas price
- Use faster RPC endpoint
- Try different time of day
- Consider L2 deployment

### High Gas Costs

**Solutions**:
- Batch operations
- Deploy on L2
- Optimize contract calls
- Use multicall

## Error Messages

### Contract Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid or expired reputation" | Reputation not valid | Re-verify |
| "Insufficient collateral" | Not enough collateral | Add more collateral |
| "Only LoanManager can call" | Wrong caller | Use correct contract |
| "Loan not active" | Loan already settled | Check loan status |
| "Insufficient liquidity" | Pool empty | Wait or reduce amount |
| "User is blacklisted" | Defaulted before | Cannot borrow |

### Frontend Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| "Please connect wallet" | No wallet | Connect MetaMask |
| "Wrong network" | Incorrect chain | Switch network |
| "Insufficient balance" | Not enough tokens | Get more tokens |
| "Transaction failed" | TX reverted | Check error details |

## Getting Help

### Before Asking

1. Check this troubleshooting guide
2. Search GitHub issues
3. Read relevant documentation
4. Check transaction on block explorer
5. Verify contract addresses

### Where to Ask

- **GitHub Issues**: Bug reports, feature requests
- **Discord**: General questions, help
- **Telegram**: Quick questions
- **Twitter**: Updates, announcements

### Information to Provide

When reporting issues:

```
- Issue description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Network (mainnet/testnet)
- Transaction hash (if applicable)
- Error messages
- Screenshots
- Browser/wallet version
- Contract addresses used
```

### Debug Checklist

Before reporting:

- [ ] Tried in different browser?
- [ ] Cleared cache?
- [ ] Updated MetaMask?
- [ ] Checked network?
- [ ] Verified contract addresses?
- [ ] Checked token approvals?
- [ ] Tried lower amount?
- [ ] Checked block explorer?
- [ ] Read error message?
- [ ] Searched existing issues?

## Emergency Procedures

### If You Lost Funds

1. **Don't panic**
2. Check transaction on explorer
3. Verify addresses used
4. Contact support with TX hash
5. Provide wallet address

### If Contract Exploited

1. Stop using immediately
2. Report to team
3. Provide details
4. Monitor announcements
5. Follow recovery plan

### If Blacklisted Incorrectly

1. Check loan status
2. Verify not defaulted
3. Contact team with proof
4. Provide wallet address
5. Wait for review

## Recovery Procedures

### Stuck Transaction

```bash
# Speed up in MetaMask
# Or replace with higher gas

# Cancel transaction
# Send 0 ETH to yourself with same nonce
```

### Lost Private Key

- Cannot recover funds
- Use seed phrase if available
- Contact wallet provider

### Contract Upgrade

- Wait for migration plan
- Follow official instructions
- Don't rush
- Verify contract addresses

## Prevention

### Best Practices

1. **Test on testnet first**
2. **Start with small amounts**
3. **Double-check addresses**
4. **Verify transactions**
5. **Keep software updated**
6. **Secure private keys**
7. **Monitor positions**
8. **Set up alerts**

### Security Tips

1. **Never share private keys**
2. **Use hardware wallet**
3. **Verify contract addresses**
4. **Check permissions**
5. **Revoke unused approvals**
6. **Use strong passwords**
7. **Enable 2FA**
8. **Backup seed phrase**

## Resources

- Documentation: See `/docs` folder
- GitHub: Issues and discussions
- Discord: Community support
- Email: support@uncollateral.app
