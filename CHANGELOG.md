# Changelog

All notable changes to UnCollateral will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Multi-collateral token support
- Variable interest rates based on pool utilization
- Governance token and DAO
- Mobile application
- Additional reputation sources (GitHub, LinkedIn)
- Liquidation bot implementation
- Advanced analytics dashboard

## [0.1.0] - 2025-11-02

### Added
- Initial release of UnCollateral protocol
- ReputationManager contract for Twitter-based reputation scoring
- LendingPool contract for liquidity management
- LoanManager contract for loan lifecycle management
- InsurancePool contract for default coverage
- Reclaim Protocol integration for ZK proof verification
- Dynamic collateralization (50-150% based on reputation)
- Reputation-based interest rates (5-15% APR)
- Basic HTML/CSS/JS frontend
- Foundry development environment
- Comprehensive documentation
- Unit tests for core contracts
- Deployment scripts
- Security documentation
- API reference
- Contributing guidelines

### Smart Contract Features
- Reputation scoring algorithm (0-1000 scale)
- 30-day reputation validity period
- Blacklist system for defaulters
- ReentrancyGuard protection
- SafeERC20 for token operations
- Ownable access control

### Frontend Features
- Wallet connection (MetaMask)
- Reputation verification tab
- Loan request interface
- Lending pool deposit/withdraw
- User loan dashboard
- Pool statistics display

### Documentation
- README with complete overview
- Deployment guide
- API reference
- Security documentation
- Contributing guidelines
- Example interaction scripts

### Development Tools
- GitHub Actions CI/CD
- Makefile for common commands
- Setup scripts
- ABI export utilities
- Interaction examples

## Version History

- **v0.1.0** - Initial MVP release
  - Core lending functionality
  - Twitter reputation integration
  - Basic frontend interface

---

## Release Notes Template

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing functionality

#### Deprecated
- Features marked for removal

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security patches and updates
