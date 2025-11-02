#!/bin/bash

# Export contract ABIs for frontend use

echo "📦 Exporting contract ABIs..."

# Check if we're in the right directory
if [ ! -d "contracts/out" ]; then
    echo "❌ Error: Contracts not compiled. Run 'cd contracts && forge build' first"
    exit 1
fi

# Create abis directory in frontend
mkdir -p frontend/abis

# Export ABIs
echo "📄 Extracting ReputationManager ABI..."
jq '.abi' contracts/out/ReputationManager.sol/ReputationManager.json > frontend/abis/ReputationManager.json

echo "📄 Extracting LendingPool ABI..."
jq '.abi' contracts/out/LendingPool.sol/LendingPool.json > frontend/abis/LendingPool.json

echo "📄 Extracting LoanManager ABI..."
jq '.abi' contracts/out/LoanManager.sol/LoanManager.json > frontend/abis/LoanManager.json

echo "📄 Extracting InsurancePool ABI..."
jq '.abi' contracts/out/InsurancePool.sol/InsurancePool.json > frontend/abis/InsurancePool.json

echo "✅ ABIs exported to frontend/abis/"
echo ""
echo "You can now import these ABIs in your frontend:"
echo "  import ReputationManagerABI from './abis/ReputationManager.json';"
