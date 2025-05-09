import { TransactionStatus, useEthers, useSigner } from "@usedapp/core";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";

const ABI = new Interface([
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]);

export interface UseOffer {
  offerContract: Contract | null;
}

interface UseOfferError {
  msg: string;
}

export function useOffer(offerAddress: string): UseOffer {
  const { account } = useEthers();
  const [error, setError] = useState<UseOfferError>();
  const [offerContract, setOfferContract] = useState<Contract | null>(null);
  const signer = useSigner();
  const provider = useMemo(() => signer?.provider, [signer]);

  useEffect(() => {
    if (!provider || !offerAddress) {
      setOfferContract(null);
      return;
    }

    (async () => {
      try {
        const code = await provider.getCode(offerAddress);
        if (code === "0x") {
          throw new Error(
            "No smart contract found at the given address, please refersh your page"
          );
        }
        // If code exists, instantiate the Contract
        const newContract = new Contract(offerAddress, ABI, signer);
        setOfferContract(newContract);
      } catch (err: any) {
        console.error("Contract existence check failed:", err);
        setError({ msg: err.message });
        setOfferContract(null);
      }
    })();
  }, [provider, signer, offerAddress]);

  return { offerContract };
}
