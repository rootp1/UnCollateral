import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  NETWORK_CONFIG,
  REPUTATION_MANAGER_ABI,
  LOAN_MANAGER_ABI,
  LENDING_POOL_ABI,
  ERC20_ABI
} from '../config/constants';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contracts
  const initializeContracts = (signerInstance) => {
    try {
      const reputationManager = new ethers.Contract(
        CONTRACT_ADDRESSES.REPUTATION_MANAGER,
        REPUTATION_MANAGER_ABI,
        signerInstance
      );

      const loanManager = new ethers.Contract(
        CONTRACT_ADDRESSES.LOAN_MANAGER,
        LOAN_MANAGER_ABI,
        signerInstance
      );

      const lendingPool = new ethers.Contract(
        CONTRACT_ADDRESSES.LENDING_POOL,
        LENDING_POOL_ABI,
        signerInstance
      );

      const lendingToken = new ethers.Contract(
        CONTRACT_ADDRESSES.LENDING_TOKEN,
        ERC20_ABI,
        signerInstance
      );

      const collateralToken = new ethers.Contract(
        CONTRACT_ADDRESSES.COLLATERAL_TOKEN,
        ERC20_ABI,
        signerInstance
      );

      setContracts({
        reputationManager,
        loanManager,
        lendingPool,
        lendingToken,
        collateralToken
      });
    } catch (err) {
      console.error('Error initializing contracts:', err);
      setError('Failed to initialize contracts');
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask to use this application');
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();

      setAccount(accounts[0]);
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setChainId(Number(network.chainId));

      // Initialize contracts
      initializeContracts(ethersSigner);

      // Check if we're on the correct network
      if (Number(network.chainId) !== NETWORK_CONFIG.chainId) {
        await switchNetwork();
      }

      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to the correct network
  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        console.error('Please add the network to MetaMask');
        setError(`Please add ${NETWORK_CONFIG.name} network to MetaMask`);
      } else {
        console.error('Error switching network:', switchError);
        setError('Failed to switch network');
      }
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContracts({});
    setChainId(null);
    setError(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  const value = {
    account,
    provider,
    signer,
    contracts,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isCorrectNetwork: chainId === NETWORK_CONFIG.chainId
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
