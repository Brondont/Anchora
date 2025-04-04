import { ethers } from "ethers";

export interface WalletInfo {
  publicAddress: string;
  privateKey: string;
}

export default function enerateWallet(): WalletInfo {
  const wallet = ethers.Wallet.createRandom();
  return {
    publicAddress: wallet.address,
    privateKey: wallet.privateKey,
  };
}
