# Contributing to UnCollateral

Thank you for your interest in contributing to UnCollateral! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Pull Request Process](#pull-request-process)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/UnCollateral.git
   cd UnCollateral
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/UnCollateral.git
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Process

### Setting Up Development Environment

1. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install dependencies**:
   ```bash
   cd contracts
   forge install
   ```

3. **Compile contracts**:
   ```bash
   forge build
   ```

4. **Run tests**:
   ```bash
   forge test -vv
   ```

### Making Changes

1. **Keep changes focused**: One feature/fix per pull request
2. **Write tests**: Add tests for new features
3. **Update documentation**: Keep docs in sync with code changes
4. **Follow coding standards**: See below for details

### Commit Messages

Use clear, descriptive commit messages:

```
Good examples:
- "add liquidation incentive mechanism"
- "fix interest calculation rounding error"
- "update deployment guide with L2 networks"

Bad examples:
- "fix bug"
- "updates"
- "WIP"
```

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**:
   ```bash
   forge test
   ```

3. **Check formatting**:
   ```bash
   forge fmt --check
   ```

4. **Update documentation** if needed

### Submitting Pull Request

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR** on GitHub with:
   - Clear title describing the change
   - Detailed description of what and why
   - Link to related issues
   - Screenshots/examples if relevant

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   Describe tests you've added/run

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] Tests added/updated
   - [ ] All tests pass
   ```

### Review Process

1. Maintainers will review your PR
2. Address feedback in new commits
3. Once approved, PR will be merged
4. Your branch can be deleted after merge

## Coding Standards

### Solidity

1. **Follow Solidity Style Guide**:
   - [Official Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
   - Use 4 spaces for indentation
   - Order: SPDX, pragma, imports, contracts

2. **Naming Conventions**:
   ```solidity
   // Contracts: PascalCase
   contract LoanManager { }

   // Functions: camelCase
   function calculateInterest() { }

   // Variables: camelCase
   uint256 totalDeposits;

   // Constants: UPPER_SNAKE_CASE
   uint256 constant MAX_LOAN_AMOUNT = 100000;

   // Internal/Private: leading underscore
   function _updateState() internal { }
   ```

3. **Documentation**:
   ```solidity
   /**
    * @dev Clear description of function
    * @param amount The amount to deposit
    * @return success Whether deposit succeeded
    */
   function deposit(uint256 amount) external returns (bool success) {
       // Implementation
   }
   ```

4. **Security Best Practices**:
   - Use `SafeERC20` for token transfers
   - Add `ReentrancyGuard` on state-changing functions
   - Follow Checks-Effects-Interactions pattern
   - Validate all inputs
   - Use `require` with clear error messages

### JavaScript/TypeScript

1. **Use ES6+ features**
2. **Prefer const/let over var**
3. **Use async/await over callbacks**
4. **Add JSDoc comments for functions**

### Git Workflow

1. **Branch naming**:
   - feature/description - for new features
   - fix/description - for bug fixes
   - docs/description - for documentation
   - refactor/description - for refactoring

2. **Keep commits atomic**: One logical change per commit

3. **Squash commits** before final merge if needed

## Testing Guidelines

### Smart Contract Tests

1. **Test Coverage**:
   - Aim for >80% coverage
   - Test happy paths and edge cases
   - Test failure scenarios

2. **Test Structure**:
   ```solidity
   contract MyContractTest is Test {
       MyContract myContract;

       function setUp() public {
           // Setup code
       }

       function testFeatureName() public {
           // Arrange
           // Act
           // Assert
       }

       function testFeatureNameRevertsWhen() public {
           vm.expectRevert("Error message");
           // Action that should revert
       }
   }
   ```

3. **Use Foundry Features**:
   - `vm.prank()` for caller simulation
   - `vm.expectRevert()` for failure testing
   - `vm.warp()` for time manipulation
   - Fuzz testing for edge cases

### Frontend Tests

1. Test user interactions
2. Test Web3 integration
3. Mock contract calls in tests

## Documentation

### What to Document

1. **Code Comments**:
   - Why, not what (code shows what)
   - Complex algorithms
   - Non-obvious decisions
   - Security considerations

2. **README Updates**:
   - New features
   - Changed workflows
   - New dependencies

3. **API Documentation**:
   - New contracts/functions
   - Changed parameters
   - New events

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams for complex concepts
- Keep examples up-to-date

## Areas for Contribution

### High Priority

- [ ] Additional unit tests
- [ ] Integration tests
- [ ] Gas optimization
- [ ] Frontend React migration
- [ ] Multi-collateral support

### Medium Priority

- [ ] Additional reputation sources
- [ ] Improved liquidation bot
- [ ] Analytics dashboard
- [ ] Mobile app

### Documentation Needed

- [ ] Video tutorials
- [ ] Example use cases
- [ ] Troubleshooting guide
- [ ] Architecture diagrams

## Questions?

- Open an issue for questions
- Join our Discord/Telegram
- Email: dev@[domain].com

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor NFTs/tokens (if applicable)

Thank you for contributing to UnCollateral!
