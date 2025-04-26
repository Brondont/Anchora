import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WarningIcon from "@mui/icons-material/Warning";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useEthers } from "@usedapp/core";
import { useFeedback } from "../../FeedbackAlertContext";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletTabProps {
  publicUserAddress?: string;
}

const WalletTab: React.FC<WalletTabProps> = ({ publicUserAddress }) => {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showCopySuccess, setShowCopySuccess] = useState<boolean>(false);
  const { activateBrowserWallet, account, deactivate } = useEthers();
  const { ethereum } = window as any;
  const { showFeedback } = useFeedback();

  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const revokeAccountsPermission = async () => {
    if (ethereum?.request) {
      try {
        await ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (err) {
        showFeedback(
          "Failed to revoke permission. Please disconnect your wallet manually from the extension.",
          false
        );
      }
    }
  };

  const handleConnect = async () => {
    if (!window.ethereum || isConnecting) return;
    setIsConnecting(true);

    try {
      // user picks an account
      const [wallet] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!wallet) throw new Error("No account selected");

      // check if wallet matches the preexisting wallet that the user owns
      if (publicUserAddress) {
        if (wallet.toLowerCase() !== publicUserAddress.toLowerCase()) {
          throw new Error(
            `Please connect with the same wallet you originally linked: ${publicUserAddress.slice(
              0,
              6
            )}...${publicUserAddress.slice(-4)}`
          );
        }
      } else {
        // if not its the first the time save the users wallet
        const res = await fetch(`${apiUrl}/user/wallet`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ publicWalletAddress: wallet }),
        });
        const resData = await res.json();
        if (resData.error) throw resData.error;
      }

      activateBrowserWallet();
      showFeedback("Wallet connected successfully!", true);
    } catch (err: any) {
      revokeAccountsPermission();
      deactivate();
      showFeedback(
        err.message || "Could not link wallet—connection rolled back",
        false
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 3,
        mx: "auto",
      }}
    >
      {/* Privacy Warning */}
      <Card>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 4,
          }}
        >
          {isConnecting ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Connecting to wallet...
              </Typography>
            </Box>
          ) : (
            <>
              <AccountBalanceWalletIcon
                sx={{ fontSize: 70, color: "primary.main", mb: 2 }}
              />

              {ethereum ? (
                account ? (
                  <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                      Wallet Connected
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        mb: 3,
                        backgroundColor: "action.hover",
                        py: 1.5,
                        px: 2,
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "monospace", fontWeight: "medium" }}
                      >
                        {truncateAddress(account)}
                      </Typography>

                      <Tooltip
                        title={showCopySuccess ? "Copied!" : "Copy address"}
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(account)}
                          sx={{ ml: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip
                        title="Your full wallet address is hidden for privacy reasons. Only you can see this truncated version."
                        arrow
                        placement="top"
                      >
                        <IconButton size="small">
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Typography variant="h6" gutterBottom>
                      Connect Your Wallet
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
                    >
                      Connect your MetaMask wallet securely. Your wallet address
                      will remain private and only visible to you.
                    </Typography>

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleConnect}
                      startIcon={<AccountBalanceWalletIcon />}
                      size="large"
                      sx={{ px: 3, py: 1 }}
                    >
                      Connect Wallet
                    </Button>
                  </Box>
                )
              ) : (
                <Box sx={{ width: "100%", textAlign: "center" }}>
                  <Typography variant="h6" gutterBottom>
                    MetaMask Not Detected
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    To connect your wallet, you need to install the MetaMask
                    extension first.
                  </Typography>

                  <Button
                    variant="contained"
                    color="primary"
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener"
                    sx={{ px: 3 }}
                  >
                    Install MetaMask
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {account && (
        <Box sx={{ maxWidth: "60%" }}>
          <Alert
            severity="warning"
            variant="outlined"
            icon={<WarningIcon />}
            sx={{ mb: 2 }}
          >
            <AlertTitle>Privacy Warning</AlertTitle>
            <Typography variant="body2">
              Sharing your wallet address with others may compromise your
              anonymity and violates our Terms of Service. Keep your wallet
              information private to protect your identity.
            </Typography>
          </Alert>

          {/* Additional wallet information */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Security Recommendations
              </Typography>
              <Typography variant="body2">
                • Never share your wallet address or seed phrase with anyone
              </Typography>
              <Typography variant="body2">
                • Always verify transactions before signing them
              </Typography>
              <Typography variant="body2">
                • Consider using a hardware wallet for additional security
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default WalletTab;
