# UnCollateral Makefile
# Convenient shortcuts for common development tasks

.PHONY: help install build test deploy clean frontend setup

# Default target
help:
	@echo "UnCollateral Development Commands"
	@echo ""
	@echo "Smart Contract Commands:"
	@echo "  make install       - Install contract dependencies"
	@echo "  make build         - Compile smart contracts"
	@echo "  make test          - Run contract tests"
	@echo "  make test-v        - Run tests with verbose output"
	@echo "  make coverage      - Generate test coverage report"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make deploy-sepolia - Deploy to Sepolia testnet"
	@echo "  make deploy-mainnet - Deploy to mainnet (use with caution!)"
	@echo ""
	@echo "Frontend Commands:"
	@echo "  make frontend      - Start frontend development server"
	@echo "  make setup-frontend - Set up frontend environment"
	@echo "  make export-abis   - Export contract ABIs to frontend"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make format        - Format code"
	@echo "  make lint          - Lint Solidity code"
	@echo "  make setup         - Complete project setup"

# Smart Contract Commands
install:
	@echo "📦 Installing contract dependencies..."
	@cd contracts && forge install

build:
	@echo "🔨 Building contracts..."
	@cd contracts && forge build

test:
	@echo "🧪 Running tests..."
	@cd contracts && forge test

test-v:
	@echo "🧪 Running tests (verbose)..."
	@cd contracts && forge test -vvv

coverage:
	@echo "📊 Generating coverage report..."
	@cd contracts && forge coverage

clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd contracts && forge clean
	@rm -rf contracts/out contracts/cache

deploy-sepolia:
	@echo "🚀 Deploying to Sepolia..."
	@cd contracts && forge script script/Deploy.s.sol --rpc-url $$RPC_URL --broadcast --verify

deploy-mainnet:
	@echo "⚠️  WARNING: Deploying to MAINNET!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@cd contracts && forge script script/Deploy.s.sol --rpc-url $$RPC_URL --broadcast --verify --slow

# Frontend Commands
frontend:
	@echo "🌐 Starting frontend server..."
	@cd frontend && npm run dev

setup-frontend:
	@echo "⚙️  Setting up frontend..."
	@bash scripts/setup-frontend.sh

export-abis:
	@echo "📤 Exporting ABIs..."
	@bash scripts/export-abis.sh

# Utility Commands
format:
	@echo "✨ Formatting code..."
	@cd contracts && forge fmt

lint:
	@echo "🔍 Linting Solidity..."
	@cd contracts && forge fmt --check

setup:
	@echo "🚀 Setting up UnCollateral project..."
	@make install
	@make build
	@make setup-frontend
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Update contracts/.env with your configuration"
	@echo "  2. Update frontend/.env with your Reclaim App ID"
	@echo "  3. Run 'make test' to verify everything works"
	@echo "  4. Run 'make frontend' to start the frontend"

# Development workflow
dev:
	@echo "🔄 Starting development workflow..."
	@make build
	@make test
	@make export-abis
	@make frontend

# Run all checks before committing
pre-commit:
	@echo "✅ Running pre-commit checks..."
	@make format
	@make build
	@make test
	@echo "✅ All checks passed!"
