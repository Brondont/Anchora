// TODO work in progress dik if i'll even use this
import { providers, ethers } from "ethers";

interface EnhancedTransactionResponse extends providers.TransactionResponse {
  provider: providers.Provider;
}

const DEFAULT_CONFIRMATIONS = 3; // Number of blocks to wait after transaction

interface TransactionResult {
  receipt: ethers.providers.TransactionReceipt;
  success: boolean;
  confirmations: number;
}

export async function sendAndConfirmTransaction(
  transactionPromise: Promise<providers.TransactionResponse>,
  confirmations: number = DEFAULT_CONFIRMATIONS
): Promise<TransactionResult> {
  const tx = (await transactionPromise) as EnhancedTransactionResponse;

  const receipt = await tx.wait(1);

  if (receipt.status === 0) {
    return { receipt, success: false, confirmations: 0 };
  }

  const latestBlock = await tx.provider.getBlockNumber();
  while (latestBlock + confirmations > receipt.blockNumber) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return {
    receipt,
    success: true,
    confirmations: (await tx.provider.getBlockNumber()) - receipt.blockNumber,
  };
}
