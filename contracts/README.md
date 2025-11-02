# UnCollateral Smart Contracts

Solidity smart contracts for the UnCollateral lending protocol, built with Foundry.

## Overview

UnCollateral enables undercollateralized lending by using verified social reputation from Twitter (via Reclaim Protocol) to reduce collateral requirements.

## Contracts

- **ReputationManager**: Verifies Reclaim proofs and manages user reputation scores
- **LendingPool**: Manages liquidity deposits and withdrawals
- **LoanManager**: Handles loan lifecycle (creation, repayment, liquidation)
- **InsurancePool**: Provides coverage for under-collateralized defaults

## Quick Start

### Prerequisites

Install Foundry:
```shell
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Setup

```shell
# Install dependencies
forge install

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Build contracts
forge build
```

### Test

```shell
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Generate coverage report
forge coverage
```

### Deploy

```shell
# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# Deploy to mainnet (verify first!)
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
```

## Documentation

- Main Docs: [../README.md](../README.md)
- API Reference: [../docs/API.md](../docs/API.md)
- Deployment Guide: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- Security: [../docs/SECURITY.md](../docs/SECURITY.md)
- Foundry Book: https://book.getfoundry.sh/

## Gas Reporting

```shell
forge test --gas-report
```

## Foundry Commands

```shell
forge --help       # General help
forge build        # Compile contracts
forge test         # Run tests
forge fmt          # Format code
forge snapshot     # Gas snapshots
anvil              # Local testnet
cast               # Blockchain utilities
```
