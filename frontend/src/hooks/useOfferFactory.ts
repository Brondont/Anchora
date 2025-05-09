import { Contract } from "ethers";
import {
  TransactionStatus,
  useContractFunction,
  useEthers,
  useSigner,
} from "@usedapp/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Interface, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import type { TransactionReceipt } from "@ethersproject/providers";

const ABI = new Interface([
  {
    inputs: [
      {
        internalType: "address",
        name: "initialAdmin",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "offerAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "tender",
        type: "address",
      },
    ],
    name: "OfferCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ENTREPRENEUR_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "EXPERT_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TENDER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "allOffers",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "submissionStart",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "submissionEnd",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reviewStart",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reviewEnd",
        type: "uint256",
      },
    ],
    name: "createOffer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
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
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
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

const factoryAddress = import.meta.env.VITE_OFFER_FACTORY_ADDRESS || "";

export interface UseOfferFactory {
  factoryContract: Contract | null;
  grantRole: (role: string, address: string) => Promise<void>;
  revokeRole: (role: string, address: string) => Promise<void>;
  hasRole: (role: string, address: string) => Promise<boolean>;
  createOffer: (
    submissionStart: number,
    submissionEnd: number,
    reviewStart: number,
    reviewEnd: number
  ) => Promise<void>;
  error?: UseOfferError;
  grantState: TransactionStatus;
  revokeState: TransactionStatus;
  createOfferState: TransactionStatus;
  resetStates: () => void;
}

interface UseOfferError {
  msg: string;
}

export function useOfferFactory(): UseOfferFactory {
  const { account } = useEthers();
  const [error, setError] = useState<UseOfferError>();
  const [factoryContract, setFactoryContract] = useState<Contract | null>(null);
  const signer = useSigner();
  const provider = useMemo(() => signer?.provider, [signer]);

  useEffect(() => {
    if (!provider || !factoryAddress) {
      setFactoryContract(null);
      return;
    }

    (async () => {
      try {
        const code = await provider.getCode(factoryAddress);
        if (code === "0x") {
          throw new Error(
            "No smart contract found at the given address, please refersh your page"
          );
        }
        // If code exists, instantiate the Contract
        const newContract = new Contract(factoryAddress, ABI, signer);
        setFactoryContract(newContract);
      } catch (err: any) {
        console.error("Contract existence check failed:", err);
        setError({ msg: err.message });
        setFactoryContract(null);
      }
    })();
  }, [provider, signer, factoryAddress]);

  const {
    send: grant,
    state: grantState,
    resetState: resetGrantState,
  } = useContractFunction(factoryContract, "grantRole");
  const {
    send: revoke,
    state: revokeState,
    resetState: resetRevokeState,
  } = useContractFunction(factoryContract, "revokeRole");
  const {
    send: createOfferSend,
    state: createOfferState,
    resetState: resetOfferState,
  } = useContractFunction(factoryContract, "createOffer");

  // Add a function to reset states
  const resetStates = useCallback(() => {
    resetGrantState();
    resetRevokeState();
    resetOfferState();
  }, [resetGrantState, resetRevokeState]);

  useEffect(() => {
    const errorState = [grantState, revokeState, createOfferState].find(
      (s) => s.status === "Fail" || s.status === "Exception"
    );
    setError(errorState ? { msg: errorState.errorMessage || "" } : undefined);
  }, [grantState, revokeState, createOfferState]);

  const getRoleBytes32 = useCallback((roleName: string): string => {
    switch (roleName.toUpperCase()) {
      case "TENDER":
        return keccak256(toUtf8Bytes("TENDER_ROLE"));
      case "ENTREPRENEUR":
        return keccak256(toUtf8Bytes("ENTREPRENEUR_ROLE"));
      case "EXPERT":
        return keccak256(toUtf8Bytes("EXPERT_ROLE"));
      case "ADMIN":
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
      default:
        throw new Error("Invalid role name");
    }
  }, []);

  // role managment handling

  const handleRoleAction = useCallback(
    async (action: "grant" | "revoke", roleName: string, address: string) => {
      if (!factoryContract) throw new Error("Contract not initialized");
      if (!account) throw new Error("No connected account");

      try {
        const role = getRoleBytes32(roleName);

        if (action === "grant") {
          const tx = await grant(role, address);
          return tx;
        } else if (action === "revoke") {
          const tx = await revoke(role, address);
          return tx;
        }
      } catch (err) {
        console.error(`Failed to ${action} role:`, err);
        setError({
          msg: `Failed to ${action} role: ${(err as Error).message}`,
        });
        throw err;
      }
    },
    [factoryContract, account, getRoleBytes32, grant, revoke]
  );

  const grantRole = useCallback(
    async (role: string, address: string) => {
      await handleRoleAction("grant", role, address);
    },
    [handleRoleAction]
  );

  const revokeRole = useCallback(
    async (role: string, address: string) => {
      await handleRoleAction("revoke", role, address);
    },
    [handleRoleAction]
  );

  const hasRole = useCallback(
    async (roleName: string, address: string) => {
      if (!factoryContract) {
        setError({ msg: "contract is not intialized" });
        return false;
      }
      const role = getRoleBytes32(roleName);
      return await factoryContract.hasRole(role, address);
    },
    [factoryContract, getRoleBytes32]
  );

  // offer creation handling
  const createOffer = useCallback(
    async (
      submissionStart: number,
      submissionEnd: number,
      reviewStart: number,
      reviewEnd: number
    ) => {
      if (!factoryContract) throw new Error("Contract not initialized");
      // Forward the four args into the solidity function
      await createOfferSend(
        submissionStart,
        submissionEnd,
        reviewStart,
        reviewEnd
      );
    },
    [factoryContract, createOfferSend]
  );

  return {
    factoryContract,
    grantRole,
    revokeRole,
    hasRole,
    createOffer,
    createOfferState,
    error,
    grantState,
    revokeState,
    resetStates,
  };
}
