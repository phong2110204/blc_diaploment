import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getContract = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    return contract;
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  return new BrowserProvider(window.ethereum);
};

export const signMessage = async (message) => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

export const getCurrentAccount = async () => {
  try {
    if (!window.ethereum) {
      return null;
    }
    
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });
    
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

export const switchNetwork = async (chainId) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
  } catch (error) {
    if (error.code === 4902) {
      // Network not added, user needs to add it manually
      console.log('Network not found in MetaMask');
    }
    throw error;
  }
};
