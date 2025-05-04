import React, { useEffect, useState, useRef } from "react";
import {
  Switch,
  AppBar,
  TextField,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Link,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  ListItemButton,
  Menu,
  Avatar,
  MenuItem,
  Tooltip,
  Alert,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import CallIcon from "@mui/icons-material/Call";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SettingsIcon from "@mui/icons-material/Settings";
import PublicIcon from "@mui/icons-material/Public";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserProps } from "../../types";
import { useNavigate } from "react-router-dom";
import { Logout } from "@mui/icons-material";
import { useEthers } from "@usedapp/core";

// Keep your existing MaterialUISwitch styled component...
const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          "#fff"
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#aab4be",
        ...theme.applyStyles("dark", {
          backgroundColor: "#8796A5",
        }),
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.primary.main,
    width: 32,
    height: 32,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        "#fff"
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
    ...theme.applyStyles("dark", {
      backgroundColor: theme.palette.primary.main,
    }),
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: "#aab4be",
    borderRadius: 20 / 2,
    ...theme.applyStyles("dark", {
      backgroundColor: "#8796A5",
    }),
  },
}));

const SearchDrawer = styled(Drawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    width: "100%",
    height: "auto",
    padding: theme.spacing(2),
  },
}));

type NavbarProps = {
  user: UserProps;
  isAuth: boolean;
  handleLogout: () => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
};

const Navbar: React.FC<NavbarProps> = ({
  user,
  isAuth = false,
  handleLogout = () => {},
  toggleDarkMode = () => {},
  isDarkMode = false,
}) => {
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const userSettingsOpen = Boolean(anchorEl);
  const navbarRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { account, chainId, switchNetwork } = useEthers();

  const chainID = parseInt(import.meta.env.VITE_ETH_NETWORK_CHAINID, 10);
  const rpcURL = import.meta.env.VITE_ETH_NETWORK;

  const HARDHAT_NETWORK_PARAMS = {
    chainId: `0x${chainID.toString(16)}`,
    chainName: "Hardhat Local Network",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcURL],
    blockExplorerUrls: [],
  };

  // Check if user is on the wrong network
  useEffect(() => {
    if (account && chainId !== chainID) {
      setShowNetworkWarning(true);
    } else {
      setShowNetworkWarning(false);
    }
  }, [account, chainId]);

  const handleSwitchNetwork = async () => {
    try {
      // First try to just switch to the network if already added
      await switchNetwork(chainID);
    } catch (error) {
      // If switching fails, try to add the network first
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HARDHAT_NETWORK_PARAMS],
          });
        } catch (addError) {
          console.error("Error adding Hardhat network to MetaMask:", addError);
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
  };

  const handleRedirectToSettings = () => {
    navigate("/account/settings");
  };

  const handleClickUserSettings = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseUserSettings = () => {
    setAnchorEl(null);
  };

  // for updating the icon fo log in after the user logs in
  useEffect(() => {}, [isAuth]);

  useEffect(() => {
    const handleScroll = () => {
      const currentNavHeight = navbarRef.current?.offsetHeight || 0;

      if (window.scrollY > currentNavHeight) {
        setIsFixed(true);
      } else {
        setIsFixed(false);
      }

      if (window.scrollY > lastScrollY && window.scrollY > currentNavHeight) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      setLastScrollY(window.scrollY);
    };

    setNavbarHeight(navbarRef.current?.offsetHeight || 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${searchQuery}`);
    setSearchDrawerOpen(false);
  };

  const renderDesktopTopBar = () => (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        justifyContent: "space-between",
        px: { md: 4, lg: 20 },
      }}
    ></Box>
  );

  const renderNetworkWarning = () => (
    <Collapse in={showNetworkWarning}>
      <Alert
        severity="warning"
        icon={<ErrorOutlineIcon />}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<SwapHorizIcon />}
            onClick={handleSwitchNetwork}
          >
            Switch
          </Button>
        }
        sx={{
          borderRadius: 0,
          width: "100%",
        }}
      >
        You are connected to the wrong network. Please switch to our used
        network.
      </Alert>
    </Collapse>
  );

  // Render inline wallet warning when not in WalletWarning component
  const renderWalletWarning = () => (
    <Collapse in={isAuth && !account}>
      <Alert
        severity="warning"
        icon={<ErrorOutlineIcon />}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<AccountBalanceWalletIcon />}
            onClick={handleRedirectToSettings}
          >
            Connect
          </Button>
        }
        sx={{
          borderRadius: 0,
          width: "100%",
        }}
      >
        You don't have a wallet connected. Please connect a wallet in your
        account settings.
      </Alert>
    </Collapse>
  );

  const renderMobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{
        sx: {
          width: "100%",
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography color="primary" variant="h6" sx={{ fontWeight: "bold" }}>
            Trust
          </Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
      </Box>

      {account && showNetworkWarning && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleSwitchNetwork}
              >
                Switch
              </Button>
            }
          >
            Wrong network. Switch to Hardhat.
          </Alert>
        </Box>
      )}

      {isAuth && !account && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRedirectToSettings}
              >
                Connect
              </Button>
            }
          >
            No wallet connected. Connect wallet.
          </Alert>
        </Box>
      )}

      <List>
        {isAuth ? (
          <>
            <ListItemButton href="/account">
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={user.email} secondary="My Account" />
            </ListItemButton>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Log out" />
            </ListItemButton>
          </>
        ) : (
          <>
            <ListItemButton href="/login">
              <ListItemIcon>
                <LoginIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Login" />
            </ListItemButton>
          </>
        )}
        <Divider sx={{ my: 2 }} />
        <ListItem>
          <ListItemIcon>
            <CallIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Contact Us" secondary="+213731355019" />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <EmailIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Email Support"
            secondary="byteforgesupport@gmail.com"
          />
        </ListItem>
        <Divider sx={{ my: 2 }} />
        <ListItem>
          <ListItemText primary="Dark Mode" secondary="Toggle theme" />
          <MaterialUISwitch checked={isDarkMode} onChange={toggleDarkMode} />
        </ListItem>
      </List>
    </Drawer>
  );

  const renderSearchDrawer = () => (
    <SearchDrawer
      anchor="top"
      open={searchDrawerOpen}
      onClose={() => setSearchDrawerOpen(false)}
    >
      <Box sx={{ p: 2 }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Search Our Store"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
            <Button
              variant="contained"
              type="submit"
              sx={{ minWidth: "100px" }}
            >
              Search
            </Button>
            <IconButton size="small" onClick={() => setSearchDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </form>
      </Box>
    </SearchDrawer>
  );

  const renderDesktopNavbar = () => (
    <>
      {renderNetworkWarning()}
      {renderWalletWarning()}
      <Toolbar
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "space-between",
          backgroundColor: theme.palette.background.default,
          p: "6px",
          px: { md: 4, lg: 4 },
        }}
      >
        <Box
          sx={{
            textAlign: "left",
            color: isDarkMode ? theme.palette.primary.contrastText : "black",
          }}
          component={Link}
          href="/"
          underline="none"
        >
          <Box display="flex">
            <Typography
              color="primary"
              variant="h5"
              sx={{ fontWeight: "bold" }}
            >
              Trust
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", width: "50%" }}>
          <form onSubmit={handleSearchSubmit} style={{ width: "100%" }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                label="Search Contracts"
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
              />
            </Box>
          </form>
          <IconButton>
            <SearchIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {isAuth ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {account ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        mr: 1,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      {`${account.substring(0, 6)}...${account.substring(
                        account.length - 4
                      )}`}
                    </Typography>
                    {showNetworkWarning && (
                      <Tooltip title="Wrong network. Click to switch to Hardhat">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={handleSwitchNetwork}
                        >
                          <ErrorOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={handleRedirectToSettings}
                    sx={{ mr: 2 }}
                  >
                    Connect Wallet
                  </Button>
                )}
                <Button href="/transactions" variant="text">
                  ETH
                </Button>
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleClickUserSettings}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={
                      userSettingsOpen ? "account-menu" : undefined
                    }
                    aria-haspopup="true"
                    aria-expanded={userSettingsOpen ? "true" : undefined}
                  >
                    <Avatar color="primary" sx={{ width: 32, height: 32 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={userSettingsOpen}
                onClose={handleCloseUserSettings}
                onClick={handleCloseUserSettings}
                slotProps={{
                  paper: {
                    elevation: 0,
                    sx: {
                      overflow: "visible",
                      mt: 1.5,
                      "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      "&::before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: "background.paper",
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: 0,
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem
                  onClick={() => {
                    navigate(`/profile/${user.ID}`);
                    handleCloseUserSettings();
                  }}
                >
                  <ListItemIcon>
                    <PublicIcon color="primary" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    navigate(`/account/settings`);
                    handleCloseUserSettings();
                  }}
                >
                  <ListItemIcon>
                    <SettingsIcon color="primary" />
                  </ListItemIcon>
                  My Account
                </MenuItem>
                {user.Roles.some((role) => role.name === "admin") && (
                  <MenuItem
                    onClick={() => {
                      navigate(`/admin`);
                      handleCloseUserSettings();
                    }}
                  >
                    <ListItemIcon>
                      <AdminPanelSettingsIcon color="error" />
                    </ListItemIcon>
                    Admin Space
                  </MenuItem>
                )}
                <Divider />
                <MenuItem
                  onClick={() => {
                    handleCloseUserSettings();
                    handleLogout();
                  }}
                >
                  <ListItemIcon>
                    <Logout color="error" fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button variant="contained" href="/login" size="small">
              Log in
            </Button>
          )}
          <MaterialUISwitch
            sx={{ m: 1 }}
            checked={isDarkMode}
            onChange={toggleDarkMode}
          />
        </Box>
      </Toolbar>
    </>
  );

  return (
    <>
      {isFixed && <Box sx={{ height: navbarHeight }} />}
      <Box
        ref={navbarRef}
        sx={{
          width: "100%",
          zIndex: 1200,
          transition: "transform 0.3s ease",
          transform:
            isFixed && isHidden ? "translateY(-100%)" : "translateY(0)",
          position: isFixed ? "fixed" : "relative",
          top: 0,
        }}
      >
        <AppBar position="static" elevation={0}>
          {renderDesktopTopBar()}
          {isMobile ? (
            <>
              {renderNetworkWarning()}
              {renderWalletWarning()}
              <Toolbar
                sx={{
                  justifyContent: "space-between",
                  background: theme.palette.background.default,
                  color: isDarkMode
                    ? theme.palette.primary.contrastText
                    : "black",
                  minHeight: { xs: 56, sm: 64 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <Link href="/" underline="none" color="inherit">
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      Trust
                    </Typography>
                  </Link>
                  {account && showNetworkWarning && (
                    <IconButton
                      color="warning"
                      size="small"
                      onClick={handleSwitchNetwork}
                    >
                      <ErrorOutlineIcon />
                    </IconButton>
                  )}
                  {isAuth && !account && (
                    <IconButton
                      color="warning"
                      size="small"
                      onClick={handleRedirectToSettings}
                    >
                      <AccountBalanceWalletIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="start"
                    color="inherit"
                    onClick={() => setMobileMenuOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
              </Toolbar>
            </>
          ) : (
            renderDesktopNavbar()
          )}
        </AppBar>
      </Box>

      {renderMobileDrawer()}
      {renderSearchDrawer()}
    </>
  );
};

export default Navbar;
