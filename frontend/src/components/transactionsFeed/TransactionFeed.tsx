import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Skeleton,
  Tooltip,
} from "@mui/material";
import { useEthers } from "@usedapp/core";
import { ethers } from "ethers";
import dayjs from "dayjs";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";

interface TxInfo {
  hash: string;
  fullHash: string;
  time: string;
  value: string;
  from: string;
  fullFrom: string;
  to: string | null;
  fullTo: string | null;
  isPending: boolean;
  addedAt: number;
}

const MAX_TRANSACTIONS = 15; // Maximum number of transactions to display

const TransactionsFeed: React.FC = () => {
  const { library, chainId } = useEthers();
  const [txs, setTxs] = useState<TxInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoad = useRef(true);

  // Format transaction data consistently
  const formatTransaction = useCallback(
    (
      tx: ethers.providers.TransactionResponse,
      isPending = false,
      blockTimestamp?: number
    ): TxInfo => {
      try {
        // Format ETH with 4-6 decimals
        const raw = parseFloat(ethers.utils.formatEther(tx.value || 0));
        const ethVal = raw.toLocaleString(undefined, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 6,
        });

        const now = Math.floor(Date.now() / 1000);
        const timestamp = blockTimestamp || now;

        // Safely handle transaction data
        const hash = tx.hash || "unknown";
        const from = tx.from || "unknown";

        return {
          hash: hash.slice(0, 8) + "-" + hash.slice(-6),
          fullHash: hash,
          time: dayjs.unix(timestamp).format("HH:mm:ss"),
          value: `${ethVal} ETH`,
          from: from ? from.slice(0, 6) + "-" + from.slice(-4) : "unknown",
          fullFrom: from || "unknown",
          to: tx.to
            ? tx.to.slice(0, 6) + "-" + tx.to.slice(-4)
            : "Contract Creation",
          fullTo: tx.to || null,
          isPending,
          addedAt: Date.now(),
        };
      } catch (error) {
        console.error("Error formatting transaction:", error);
        // Return a fallback transaction object
        return {
          hash: "error-hash",
          fullHash: tx.hash || "unknown",
          time: dayjs().format("HH:mm:ss"),
          value: "0 ETH",
          from: "error",
          fullFrom: "error",
          to: "error",
          fullTo: null,
          isPending,
          addedAt: Date.now(),
        };
      }
    },
    []
  );

  // Fetch pending transactions
  const fetchPendingTransactions = useCallback(async () => {
    if (!library) return [];

    try {
      // Cast the provider to access the send method properly
      const provider = library as ethers.providers.JsonRpcProvider;

      // Check if the provider supports direct RPC calls
      if (typeof provider.send !== "function") {
        console.log("Provider doesn't support direct RPC calls");
        return [];
      }

      // Try different methods to get pending transactions
      const methods = [
        { method: "eth_pendingTransactions", params: [] },
        { method: "txpool_content", params: [] },
      ];

      for (const { method, params } of methods) {
        try {
          const result = await provider.send(method, params);

          if (method === "eth_pendingTransactions" && Array.isArray(result)) {
            return result
              .slice(0, 10)
              .map((tx) =>
                formatTransaction(
                  tx as unknown as ethers.providers.TransactionResponse,
                  true
                )
              );
          }

          if (
            method === "txpool_content" &&
            result &&
            (result.pending || result.queued)
          ) {
            const pendingList: ethers.providers.TransactionResponse[] = [];

            // Process pending transactions
            if (result.pending) {
              Object.values(result.pending).forEach((addressTxs: any) => {
                Object.values(addressTxs).forEach((tx: any) => {
                  pendingList.push(tx as ethers.providers.TransactionResponse);
                });
              });
            }

            // Process queued transactions
            if (result.queued) {
              Object.values(result.queued).forEach((addressTxs: any) => {
                Object.values(addressTxs).forEach((tx: any) => {
                  pendingList.push(tx as ethers.providers.TransactionResponse);
                });
              });
            }

            return pendingList
              .slice(0, 10)
              .map((tx) => formatTransaction(tx, true));
          }
        } catch (methodError) {
          console.log(`${method} not supported by this provider:`, methodError);
        }
      }

      // If all methods fail, try to fetch from mempool directly if available
      try {
        const pendingCount = await provider.getTransactionCount("pending");
        const latestCount = await provider.getTransactionCount("latest");

        if (pendingCount > latestCount) {
          console.log(
            `Detected ${
              pendingCount - latestCount
            } pending transactions in mempool`
          );
          // We can't actually get the transactions this way, but we know they exist
        }
      } catch (e) {
        console.log("Error checking mempool:", e);
      }

      // Return empty array if all methods fail
      return [];
    } catch (e) {
      console.error("Error fetching pending transactions:", e);
      return [];
    }
  }, [library, formatTransaction]);

  // Fetch recent transactions
  const fetchRecentTransactions = useCallback(async () => {
    if (!library) return [];

    try {
      const provider = library as ethers.providers.Provider;
      const blockNumber = await provider.getBlockNumber();
      const recentTxs: TxInfo[] = [];

      // Fetch transactions from the last 2 blocks
      for (let i = 0; i < 2; i++) {
        if (blockNumber - i < 0) break;

        try {
          const block = await provider.getBlockWithTransactions(
            blockNumber - i
          );
          if (!block || !Array.isArray(block.transactions)) {
            console.log(
              `Block ${blockNumber - i} not found or has no transactions`
            );
            continue;
          }

          const blockTxs = block.transactions.map((tx) =>
            formatTransaction(tx, false, block.timestamp)
          );

          recentTxs.push(...blockTxs);

          if (recentTxs.length >= MAX_TRANSACTIONS) break;
        } catch (blockError) {
          console.error(`Error fetching block ${blockNumber - i}:`, blockError);
        }
      }

      return recentTxs;
    } catch (e) {
      console.error("Error fetching recent transactions:", e);
      return [];
    }
  }, [library, formatTransaction]);

  const refreshTransactions = useCallback(async () => {
    if (!library) return;

    try {
      if (initialLoad.current) {
        setLoading(true);
      }

      // Fetch both pending and recent transactions
      const [pendingTxs, recentTxs] = await Promise.all([
        fetchPendingTransactions(),
        fetchRecentTransactions(),
      ]);

      // Combine and deduplicate transactions
      const allTxs = [...pendingTxs, ...recentTxs];
      const uniqueTxs = allTxs.filter(
        (tx, index, self) =>
          index === self.findIndex((t) => t.fullHash === tx.fullHash)
      );

      // Sort by most recent first and limit to MAX_TRANSACTIONS
      const sortedTxs = uniqueTxs
        .sort((a, b) => b.addedAt - a.addedAt)
        .slice(0, MAX_TRANSACTIONS);

      setTxs(sortedTxs);
      setError(null); // Clear any previous errors
    } catch (e) {
      console.error("Error refreshing transactions:", e);
      setError("Error processing transactions");
    } finally {
      if (initialLoad.current) {
        setLoading(false);
        initialLoad.current = false;
      }
    }
  }, [library, fetchPendingTransactions, fetchRecentTransactions]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!library) {
      setError("No provider available - please connect your wallet");
      return;
    }

    setLoading(true);
    setError(null);

    const provider = library as ethers.providers.Provider;
    let isMounted = true;
    let blockListener: ethers.providers.Listener;
    let pendingTxListener: ethers.providers.Listener;

    const handleNewBlock = async (blockNumber: number) => {
      if (!isMounted || !library) return;
      console.log(`New block detected: ${blockNumber}`);

      try {
        const block = await provider.getBlockWithTransactions(blockNumber);
        if (!block || !Array.isArray(block.transactions)) {
          console.log(`Block ${blockNumber} not found or has no transactions`);
          return;
        }

        const blockTxs = block.transactions.map((tx) =>
          formatTransaction(tx, false, block.timestamp)
        );

        // Update transactions without setting loading state
        setTxs((prev) => {
          // Mark any previously pending transactions as confirmed
          const updatedPrev = prev.map((tx) => {
            const matchingConfirmedTx = blockTxs.find(
              (confirmedTx) => confirmedTx.fullHash === tx.fullHash
            );
            if (matchingConfirmedTx && tx.isPending) {
              return { ...tx, isPending: false };
            }
            return tx;
          });

          const combined = [...blockTxs, ...updatedPrev];
          // Deduplicate transactions
          const uniqueTxs = combined.filter(
            (tx, index, self) =>
              index === self.findIndex((t) => t.fullHash === tx.fullHash)
          );
          return uniqueTxs.slice(0, MAX_TRANSACTIONS);
        });
      } catch (err) {
        console.error("Error processing new block:", err);
      }
    };

    const handlePendingTx = async (txHash: string) => {
      if (!isMounted || !library) return;
      console.log(`New pending transaction detected: ${txHash}`);

      try {
        // Get transaction details
        const tx = await provider.getTransaction(txHash);
        if (tx) {
          // Format the new transaction
          const formattedTx = formatTransaction(tx, true);

          // Add to existing transactions
          setTxs((prev) => {
            // Only add if not already in the list
            if (!prev.some((t) => t.fullHash === formattedTx.fullHash)) {
              const newTxs = [formattedTx, ...prev].slice(0, MAX_TRANSACTIONS);
              return newTxs;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error processing pending transaction:", err);
      }
    };

    const setupListeners = async () => {
      try {
        // Initial load
        await refreshTransactions();

        // Listen for new blocks
        blockListener = (blockNumber: number) => handleNewBlock(blockNumber);
        provider.on("block", blockListener);

        // Listen for new pending transactions if supported
        try {
          pendingTxListener = (txHash: string) => handlePendingTx(txHash);
          provider.on("pending", pendingTxListener);
        } catch (pendingError) {
          console.log("Pending transaction event not supported:", pendingError);
        }
      } catch (e) {
        console.error("Error setting up blockchain listeners:", e);
        if (isMounted) {
          setError("Failed to connect to the blockchain");
          setLoading(false);
        }
      }
    };

    setupListeners();

    // Periodic refresh as a fallback for networks that don't support events well
    const refreshInterval = setInterval(() => {
      refreshTransactions();
    }, 30000); // Every 30 seconds

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);

      if (provider) {
        // Safely remove listeners
        try {
          if (blockListener) provider.off("block", blockListener);
        } catch (e) {
          console.log("Error removing block listener:", e);
        }

        try {
          if (pendingTxListener) provider.off("pending", pendingTxListener);
        } catch (e) {
          console.log("Error removing pending listener:", e);
        }
      }
    };
  }, [library, chainId, refreshTransactions, formatTransaction]);

  // Skeleton loader table rows
  const renderSkeletonRows = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell sx={{ py: 1 }}>
            <Skeleton variant="text" width={100} height={20} />
          </TableCell>
          <TableCell sx={{ py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AccessTimeIcon
                sx={{ fontSize: 12, mr: 0.5, color: "text.disabled" }}
              />
              <Skeleton variant="text" width={60} height={20} />
            </Box>
          </TableCell>
          <TableCell sx={{ py: 1 }}>
            <Skeleton variant="text" width={80} height={20} />
          </TableCell>
          <TableCell sx={{ py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ArrowRightAltIcon
                sx={{ fontSize: 12, mr: 0.5, color: "text.disabled" }}
              />
              <Skeleton variant="text" width={80} height={20} />
            </Box>
          </TableCell>
        </TableRow>
      ));
  };

  return (
    <Card sx={{ maxWidth: 600, width: "100%", p: 0 }}>
      <CardContent>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <ReceiptLongIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">Latest Transactions</Typography>
            <Typography variant="caption">
              {chainId ? `Chain ID: ${chainId}` : "Ethereum"}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Box sx={{ textAlign: "center", py: 3, color: "error.main" }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        {!error && (
          <TableContainer>
            <Table size="small" aria-label="transaction table">
              <TableBody>
                {loading && txs.length === 0 ? (
                  renderSkeletonRows()
                ) : txs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{
                        textAlign: "center",
                        py: 3,
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="body2">
                        No transactions yet. Waiting for new transactions...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  txs.map((tx) => (
                    <TableRow
                      key={tx.hash + "-" + tx.addedAt}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.03)" },
                        backgroundColor: tx.isPending
                          ? "rgba(255, 244, 229, 0.4)"
                          : "inherit",
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          py: 1,
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          color: "primary.main",
                        }}
                      >
                        <Tooltip title={tx.fullHash} arrow placement="top">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {tx.isPending ? (
                              <PendingIcon
                                sx={{ fontSize: 14, color: "warning.main" }}
                              />
                            ) : (
                              <CheckCircleIcon
                                sx={{ fontSize: 14, color: "success.main" }}
                              />
                            )}
                            <span>{tx.hash}</span>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <AccessTimeIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              color: "text.secondary",
                            }}
                          />
                          {tx.time}
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          width: "90px",
                          maxWidth: "90px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Tooltip title={tx.fullFrom} arrow placement="top">
                          <span>{tx.from}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          width: "90px",
                          maxWidth: "90px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <ArrowRightAltIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              color: "text.secondary",
                            }}
                          />
                          <Tooltip
                            title={tx.fullTo || "Contract Creation"}
                            arrow
                            placement="top"
                          >
                            <span>{tx.to}</span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          py: 1,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      >
                        {tx.value}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsFeed;
