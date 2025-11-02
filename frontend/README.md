# UnCollateral Frontend

Basic frontend interface for the UnCollateral lending protocol.

## Overview

This is a simple HTML/CSS/JavaScript frontend that interacts with UnCollateral smart contracts.

## Features

- Wallet connection (MetaMask)
- Twitter reputation verification via Reclaim Protocol
- Loan borrowing interface
- Liquidity pool deposits/withdrawals
- User loan dashboard

## Getting Started

### Prerequisites

- Modern web browser
- MetaMask wallet extension
- Node.js (optional, for local server)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (optional)
npm install
```

### Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```bash
   # Reclaim Protocol
   VITE_RECLAIM_APP_ID=your_app_id
   VITE_RECLAIM_PROVIDER_ID=twitter-analytics

   # Contract addresses (after deployment)
   VITE_REPUTATION_MANAGER_ADDRESS=0x...
   VITE_LENDING_POOL_ADDRESS=0x...
   VITE_LOAN_MANAGER_ADDRESS=0x...
   ```

3. Update contract addresses in `app.js`:
   ```javascript
   const CONFIG = {
       REPUTATION_MANAGER: '0x...',
       LENDING_POOL: '0x...',
       // ... etc
   };
   ```

### Run

```bash
# Using npm script
npm run dev

# Or using Python
python3 -m http.server 8000

# Or using Node
npx http-server -p 8000
```

Open http://localhost:8000 in your browser.

## Project Structure

```
frontend/
├── index.html          # Main HTML file
├── styles.css          # Styles
├── app.js              # Application logic
├── constants.js        # Configuration constants
├── utils/
│   └── helpers.js      # Helper functions
├── abis/               # Contract ABIs (generated)
├── package.json        # Dependencies
└── .env.example        # Environment template
```

## Usage

### Connect Wallet

1. Click "Connect Wallet"
2. Approve MetaMask connection
3. Ensure you're on the correct network

### Verify Reputation

1. Go to "Verify Reputation" tab
2. Click "Verify Twitter Account"
3. Complete Reclaim Protocol flow
4. View your reputation score

### Borrow

1. Navigate to "Borrow" tab
2. Enter loan amount and duration
3. See required collateral based on your score
4. Approve collateral token
5. Request loan

### Lend

1. Go to "Lend" tab
2. Enter deposit amount
3. Approve USDC
4. Deposit to pool
5. Earn interest automatically

### View Loans

1. Navigate to "My Loans" tab
2. See all your active loans
3. Repay loans
4. Track repayment progress

## Integration

### Using ethers.js

For production, replace the basic Web3 integration with ethers.js:

```javascript
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const contract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
);
```

### Using Reclaim SDK

```javascript
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

const proofRequest = await ReclaimProofRequest.init(
    APP_ID,
    APP_SECRET,
    PROVIDER_ID
);

await proofRequest.startSession({
    onSuccess: (proofs) => {
        // Handle successful verification
    },
    onFailure: (error) => {
        // Handle error
    }
});
```

## Upgrading to React/Vue

For a production application, consider migrating to React or Vue:

### React Example

```bash
npx create-vite uncollateral-frontend --template react
cd uncollateral-frontend
npm install ethers @reclaimprotocol/js-sdk
```

### Vue Example

```bash
npx create-vite uncollateral-frontend --template vue
cd uncollateral-frontend
npm install ethers @reclaimprotocol/js-sdk
```

## Development

### Adding Features

1. Edit HTML in `index.html`
2. Add styles to `styles.css`
3. Implement logic in `app.js`
4. Add helpers to `utils/helpers.js`
5. Update constants in `constants.js`

### Testing

Open the browser console to see logs and debug.

## Deployment

### Static Hosting

Deploy to:
- Vercel
- Netlify
- GitHub Pages
- IPFS
- Fleek

### Example: Vercel

```bash
npm install -g vercel
vercel
```

### Example: GitHub Pages

```bash
# Build (if using bundler)
npm run build

# Push to gh-pages branch
git subtree push --prefix dist origin gh-pages
```

## Troubleshooting

### MetaMask not detected

- Install MetaMask extension
- Refresh page
- Try different browser

### Wrong network

- Switch network in MetaMask
- Check network configuration
- Verify RPC URL

### Transactions failing

- Check gas settings
- Verify approvals
- Ensure sufficient balance
- Check contract addresses

## Security

- Never expose private keys
- Always verify transaction details
- Use hardware wallet for large amounts
- Double-check contract addresses

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT License - see [LICENSE](../LICENSE)
