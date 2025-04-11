import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import { ethers } from "ethers";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
}

const TransactionTestPage: React.FC = () => {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [senderAddress, setSenderAddress] = useState<string>("");
  const [senderPrivateKey, setSenderPrivateKey] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("0.01");
  const [senderBalance, setSenderBalance] = useState<string>("");
  const [recipientBalance, setRecipientBalance] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const ETH_NETWORK = import.meta.env.VITE_ETH_NETWORK;

  // Predefined Ganache accounts
  const hardHatAccounts = [
    {
      privateKey:
        "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
      address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    },
    {
      privateKey:
        "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897",
      address: "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
    },
    {
      privateKey:
        "0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82",
      address: "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
    },
    {
      privateKey:
        "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1",
      address: "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
    },
    {
      privateKey:
        "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd",
      address: "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
    },
  ];

  useEffect(() => {
    const setupProvider = async () => {
      try {
        // Connect to local Ganache instance
        const ethProvider = new ethers.JsonRpcProvider(ETH_NETWORK);
        setProvider(ethProvider);

        // Pre-fill the first account
        if (hardHatAccounts.length > 0) {
          setSenderAddress(hardHatAccounts[0].address);
          setSenderPrivateKey(hardHatAccounts[0].privateKey);

          if (hardHatAccounts.length > 1) {
            setRecipientAddress(hardHatAccounts[1].address);
          }
        }
      } catch (error) {
        console.error("Failed to connect to Ethereum provider:", error);
        setError(
          "Failed to connect to Ganache. Make sure it's running on port 8545."
        );
      }
    };

    setupProvider();
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!provider) return;

      try {
        if (senderAddress) {
          const balance = await provider.getBalance(senderAddress);
          setSenderBalance(ethers.formatEther(balance));
        }

        if (recipientAddress) {
          const balance = await provider.getBalance(recipientAddress);
          setRecipientBalance(ethers.formatEther(balance));
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
    // Set up an interval to refresh balances
    const intervalId = setInterval(fetchBalances, 5000);

    return () => clearInterval(intervalId);
  }, [provider, senderAddress, recipientAddress, transactionHash]);

  const handleSendTransaction = async () => {
    if (!provider || !senderPrivateKey || !recipientAddress || !amount) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create wallet instance with private key
      const wallet = new ethers.Wallet(senderPrivateKey, provider);

      // Validate sender address
      if (wallet.address.toLowerCase() !== senderAddress.toLowerCase()) {
        throw new Error("Private key does not match sender address");
      }

      // Send transaction
      const tx = await wallet.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount),
        gasLimit: 6721975,
      });

      setTransactionHash(tx.hash);

      // Add to transactions list
      setTransactions((prev) => [
        {
          hash: tx.hash,
          from: senderAddress,
          to: recipientAddress,
          amount: amount,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      try {
        await tx.wait(1);
        console.log("Transaction confirmed");
      } catch (waitError) {
        console.error("Error waiting for transaction:", waitError);
      }
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setError(error.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = (index: number, type: "sender" | "recipient") => {
    if (index >= 0 && index < hardHatAccounts.length) {
      if (type === "sender") {
        setSenderAddress(hardHatAccounts[index].address);
        setSenderPrivateKey(hardHatAccounts[index].privateKey);
      } else {
        setRecipientAddress(hardHatAccounts[index].address);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ethereum Transaction Test Page
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Send Transaction
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                Select Sender:
              </Typography>
              <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
                {hardHatAccounts.map((account, index) => (
                  <Button
                    key={index}
                    variant={
                      senderAddress === account.address
                        ? "contained"
                        : "outlined"
                    }
                    size="small"
                    onClick={() => handleSelectAccount(index, "sender")}
                  >
                    Account {index + 1}
                  </Button>
                ))}
              </Box>

              <TextField
                label="Sender Address"
                fullWidth
                margin="normal"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
              />

              <TextField
                label="Sender Private Key"
                fullWidth
                margin="normal"
                type="password"
                value={senderPrivateKey}
                onChange={(e) => setSenderPrivateKey(e.target.value)}
              />

              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Balance:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {senderBalance ? `${senderBalance} ETH` : "Loading..."}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <TextField
                label="Recipient Address"
                fullWidth
                margin="normal"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />

              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Balance:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {recipientBalance ? `${recipientBalance} ETH` : "Loading..."}
                </Typography>
              </Box>

              <TextField
                label="Amount (ETH)"
                fullWidth
                margin="normal"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{ inputProps: { min: 0, step: 0.001 } }}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleSendTransaction}
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isLoading ? "Processing..." : "Send Transaction"}
              </Button>

              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}

              {transactionHash && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Transaction Hash:</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: "break-all",
                      bgcolor: "background.paper",
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    {transactionHash}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction History
              </Typography>

              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map((tx, index) => (
                        <TableRow key={index}>
                          <TableCell
                            sx={{
                              maxWidth: 100,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {tx.from.substring(0, 6)}...
                            {tx.from.substring(tx.from.length - 4)}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 100,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {tx.to.substring(0, 6)}...
                            {tx.to.substring(tx.to.length - 4)}
                          </TableCell>
                          <TableCell>{tx.amount} ETH</TableCell>
                          <TableCell>
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransactionTestPage;
