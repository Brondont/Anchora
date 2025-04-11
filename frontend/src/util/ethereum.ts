import { ethers } from "ethers";

export interface WalletInfo {
  publicAddress: string;
  privateKey: string;
}

const ETH_NETWORK = import.meta.env.VITE_ETH_NETWORK;

const provider = new ethers.JsonRpcProvider(ETH_NETWORK);

export const generateWallet = (): WalletInfo => {
  const wallet = ethers.Wallet.createRandom();
  return {
    publicAddress: wallet.address,
    privateKey: wallet.privateKey,
  };
};

export const getEthBalance = async (walletAddress: string): Promise<string> => {
  if (walletAddress) {
    let ethBalance: string = "0.0";
    try {
      const balance = await provider.getBalance(walletAddress);
      ethBalance = ethers.formatEther(balance);
    } catch (error) {
      return "";
    }
    return ethBalance;
  }
  return "";
};
