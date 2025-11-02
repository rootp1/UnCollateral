#!/bin/bash

# Test deployment script for local testing

echo "🧪 Testing UnCollateral Deployment Locally..."

# Check if Anvil is running
if ! pgrep -x "anvil" > /dev/null; then
    echo "❌ Anvil is not running. Please start anvil first:"
    echo "   anvil"
    exit 1
fi

echo "✅ Anvil detected"

# Navigate to contracts directory
cd contracts || exit 1

echo "📝 Deploying contracts to local network..."

# Deploy contracts
forge script script/Deploy.s.sol \
    --rpc-url http://localhost:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --broadcast \
    -vvv

if [ $? -eq 0 ]; then
    echo "✅ Contracts deployed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "   Network: Localhost (Anvil)"
    echo "   RPC: http://localhost:8545"
    echo ""
    echo "📂 Deployment artifacts saved to:"
    echo "   contracts/broadcast/Deploy.s.sol/31337/run-latest.json"
    echo ""
    echo "🔍 Next steps:"
    echo "   1. Update frontend/.env with deployed addresses"
    echo "   2. Run 'make frontend' to start the frontend"
    echo "   3. Test the application at http://localhost:8000"
else
    echo "❌ Deployment failed"
    exit 1
fi
