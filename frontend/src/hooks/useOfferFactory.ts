import { Contract } from "ethers";
import {
  TransactionState,
  TransactionStatus,
  useContractFunction,
  useEthers,
  useSigner,
} from "@usedapp/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Interface, keccak256, toUtf8Bytes } from "ethers/lib/utils";

const ABI = new Interface([
  {
    inputs: [],
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
    inputs: [],
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

const factoryAddress = localStorage.getItem("factoryAddress");

export interface UseOfferFactory {
  factoryContract: Contract | null;
  grantRole: (role: string, address: string) => Promise<void>;
  revokeRole: (role: string, address: string) => Promise<void>;
  hasRole: (role: string, address: string) => Promise<boolean>;
  createOffer: () => Promise<void>;
  error?: UseOfferError;
  grantState: TransactionStatus;
  revokeState: TransactionStatus;
}

interface UseOfferError {
  msg: string;
}

export function useOfferFactory(): UseOfferFactory {
  const { account } = useEthers();
  const [error, setError] = useState<UseOfferError>();
  const signer = useSigner();

  const factoryContract = useMemo(() => {
    if (!signer || !factoryAddress) return null;
    return new Contract(factoryAddress, ABI, signer);
  }, [signer, factoryAddress]);

  const { send: grant, state: grantState } = useContractFunction(
    factoryContract,
    "grantRole"
  );
  const { send: revoke, state: revokeState } = useContractFunction(
    factoryContract,
    "revokeRole"
  );
  const { send: createOffer, state: createOfferState } = useContractFunction(
    factoryContract,
    "createOffer"
  );

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
      if (!factoryContract) throw new Error("Contract not initialized");
      const role = getRoleBytes32(roleName);
      return await factoryContract.hasRole(role, address);
    },
    [factoryContract, getRoleBytes32]
  );

  return {
    factoryContract,
    grantRole,
    revokeRole,
    hasRole,
    createOffer: async () => {
      if (!createOffer)
        throw new Error("Create offer function not initialized");
      await createOffer();
    },
    error,
    grantState,
    revokeState,
  };
}
