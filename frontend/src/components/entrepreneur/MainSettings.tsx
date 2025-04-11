import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Avatar,
  Chip,
  useTheme,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  keyframes,
  alpha,
  IconButton,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PhoneIcon from "@mui/icons-material/Phone";
import SecurityIcon from "@mui/icons-material/Security";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { UserProps } from "../../types";
import { useFeedback } from "../../FeedbackAlertContext";
import { isEmail, isRequired, ValidatorFunction } from "../../util/validators";
import { matchIsValidTel, MuiTelInput } from "mui-tel-input";
import { generateWallet, WalletInfo } from "../../util/ethereum";
import ConfirmationDialog from "../confirmationDialog/ConfirmationDialog";

export type EditFormProps = {
  [key: string]: {
    value: string;
    validators?: ValidatorFunction[];
    error: string;
  };
};

const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface MainSettingsProps {
  user: UserProps | undefined;
  handleUpdateUser: (newUser: UserProps) => void;
}

interface ServerFormError {
  path: string;
  msg: string;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const MainSettings: React.FC<MainSettingsProps> = ({
  user,
  handleUpdateUser,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const { showFeedback } = useFeedback();
  const [isShake, setIsShake] = useState<boolean>(false);

  const token = localStorage.getItem("token");
  const publicWalletAddress = localStorage.getItem("publicWalletAddress") || "";
  const apiUrl = import.meta.env.VITE_API_URL;

  // Form states
  const [editForm, setEditForm] = useState<EditFormProps>({
    email: {
      value: "",
      validators: [isEmail, isRequired],
      error: "",
    },
    phoneNumber: {
      value: "",
      validators: [isRequired],
      error: "",
    },
  });
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
  const [editPhone, setEditPhone] = useState(false);

  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState(false);
  const [tempWallet, setTempWallet] = useState<WalletInfo | null>(null);
  const [walletIsVisible, setWalletIsVisible] = useState(false);

  const toggleVisibility = () => setWalletIsVisible(!walletIsVisible);

  const handleCreateWallet = () => {
    const newWallet: WalletInfo = generateWallet();
    setTempWallet(newWallet);
    setShowPrivateKeyDialog(true);
  };

  const handlePrivateKeyConfirmation = async () => {
    if (!tempWallet) return;

    try {
      const res = await fetch(`${apiUrl}/user/wallet`, {
        method: "PUT",
        body: JSON.stringify({ publicWalletAddress: tempWallet.publicAddress }),
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const resData = await res.json();

      if (resData.error) throw resData.error;

      localStorage.setItem("publicWalletAddress", tempWallet.publicAddress);
      showFeedback("Wallet created successfully", true);
      setShowPrivateKeyDialog(false);
      setTabValue(3);
      setTempWallet(null);
    } catch (err: any) {
      showFeedback(
        err.msg ||
          "Something went wrong with creating your wallet, try again later",
        false
      );
    } finally {
      setTempWallet(null);
      setShowPrivateKeyDialog(false);
    }
  };

  const handleClosePrivateKeyDialog = () => {
    setShowPrivateKeyDialog(false);
    setTempWallet(null);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const shakeFields = useCallback(() => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  }, []);

  // Initialize form values
  useEffect(() => {
    if (user) {
      setEditForm({
        email: {
          error: "",
          validators: [isEmail, isRequired],
          value: user.email,
        },
        phoneNumber: {
          error: "",
          validators: [isRequired],
          value: user.phoneNumber,
        },
      });
    }
  }, [user]);

  const inputChangeHandler = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setEditForm((prevState: EditFormProps) => {
      const fieldConfig = prevState[name];
      // run all validators and collect error messages
      if (fieldConfig.validators) {
        for (const validator of fieldConfig.validators) {
          const result = validator(value);
          if (!result.isValid) {
            return {
              ...prevState,
              [name]: {
                ...prevState[name],
                value,
                error: result.errorMessage,
              },
            };
          }
        }
      }
      return {
        ...prevState,
        [name]: {
          ...prevState[name],
          value,
          error: "",
        },
      };
    });
  };

  const handlePhoneChange = (value: string) => {
    const isValid = matchIsValidTel(value);
    setEditForm((prev) => ({
      ...prev,
      phoneNumber: {
        ...prev.phoneNumber,
        value,
        error: isValid ? "" : "Please enter a valid phone number",
      },
    }));
  };

  const handleSaveEmail = async () => {
    if (!user) return;

    setIsSubmittingEmail(true);

    try {
      const res = await fetch(`${apiUrl}/user/email`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: editForm.email.value,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        if ([422, 409, 404, 401].includes(res.status)) {
          const updatedForm: EditFormProps = { ...editForm };
          resData.error.forEach((err: ServerFormError) => {
            if (updatedForm[err.path]) {
              updatedForm[err.path].error = err.msg;
            }
          });
          setEditForm(updatedForm);
          shakeFields();
          return;
        }
        throw resData.error;
      }

      // Success
      showFeedback("Email updated successfully", true);
      handleUpdateUser({ ...user, email: editForm.email.value });
      setEditEmail(false);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to update email", false);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleSavePhone = async () => {
    if (!user) return;

    setIsSubmittingPhone(true);

    try {
      const res = await fetch(`${apiUrl}/user/phone-number`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: editForm.phoneNumber.value,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        if ([422, 409, 404, 401].includes(res.status)) {
          const updatedForm: EditFormProps = { ...editForm };
          resData.error.forEach((err: ServerFormError) => {
            if (updatedForm[err.path]) {
              updatedForm[err.path].error = err.msg;
            }
          });
          setEditForm(updatedForm);
          shakeFields();
          return;
        }
        throw resData.error;
      }

      showFeedback("Phone number updated successfully", true);
      handleUpdateUser({ ...user, phoneNumber: editForm.phoneNumber.value });
      setEditPhone(false);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to update phone number", false);
    } finally {
      setIsSubmittingPhone(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state UI components
  const LoadingHeader = () => (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
        color: "white",
        p: { xs: 2, md: 4 },
        borderRadius: "8px 8px 0 0",
        position: "relative",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Skeleton
          variant="circular"
          width={100}
          height={100}
          sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
        />
        <Box sx={{ ml: 2, width: "100%" }}>
          <Skeleton
            variant="text"
            sx={{ bgcolor: "rgba(255,255,255,0.2)", width: "60%", height: 40 }}
          />
          <Box sx={{ display: "flex", mt: 1, flexWrap: "wrap", gap: 1 }}>
            <Skeleton
              variant="rounded"
              width={80}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
            />
            <Skeleton
              variant="rounded"
              width={80}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const LoadingListItem = () => (
    <>
      <ListItem sx={{ display: "flex" }}>
        <ListItemIcon>
          <Skeleton variant="circular" width={24} height={24} />
        </ListItemIcon>
        <ListItemText
          primary={<Skeleton width="30%" />}
          secondary={<Skeleton width="50%" />}
        />
        <Box sx={{ ml: "auto" }}>
          <Skeleton variant="rounded" width={60} height={30} />
        </Box>
      </ListItem>
      <Divider component="li" />
    </>
  );

  const LoadingPanel = () => (
    <Box sx={{ px: 3, pb: 3 }}>
      <Skeleton width="40%" height={40} sx={{ mb: 2 }} />
      <List
        sx={{
          bgcolor: theme.palette.background.default,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <LoadingListItem />
        <LoadingListItem />
        <LoadingListItem />
      </List>
    </Box>
  );

  if (!user) {
    return (
      <Box sx={{ width: "100%" }}>
        <Card elevation={3} sx={{ overflow: "visible", borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <LoadingHeader />
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                textColor="primary"
                indicatorColor="primary"
                variant="fullWidth"
              >
                <Tab label="Profile" />
                <Tab label="Contact Info" />
                <Tab label="Security" />
              </Tabs>
            </Box>
            <TabPanel value={tabValue} index={0}>
              <LoadingPanel />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <LoadingPanel />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <LoadingPanel />
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Card elevation={3} sx={{ overflow: "visible", borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {/* User Profile Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              color: "white",
              p: { xs: 2, md: 4 },
              borderRadius: "8px 8px 0 0",
              position: "relative",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  width: { xs: 70, md: 100 },
                  height: { xs: 70, md: 100 },
                  bgcolor: theme.palette.primary.light,
                  border: `4px solid ${theme.palette.common.white}`,
                  fontSize: { xs: 28, md: 36 },
                  boxShadow: `0 4px 10px rgba(0,0,0,0.1)`,
                }}
              >
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </Avatar>
              <Box sx={{ ml: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {user.firstName} {user.lastName}
                </Typography>
                <Box sx={{ display: "flex", mt: 1, flexWrap: "wrap", gap: 1 }}>
                  {user.Roles.map((role, index) => (
                    <Chip
                      key={index}
                      color="secondary"
                      size="small"
                      label={role.name}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
            >
              <Tab label="Profile" />
              <Tab label="Contact Info" />
              <Tab label="Security" />
              <Tab label="Wallet" />
            </Tabs>
          </Box>

          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              >
                Account Information
              </Typography>
              <List
                sx={{
                  bgcolor: theme.palette.background.default,
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <ListItem sx={{ display: "flex" }}>
                  <ListItemIcon>
                    <BadgeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="First Name"
                    secondary={user.firstName}
                    slotProps={{
                      primary: {
                        variant: "subtitle2",
                        color: "text.secondary",
                      },
                      secondary: { variant: "body1", fontWeight: 500 },
                    }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem sx={{ display: "flex" }}>
                  <ListItemIcon>
                    <BadgeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Name"
                    secondary={user.lastName}
                    slotProps={{
                      primary: {
                        variant: "subtitle2",
                        color: "text.secondary",
                      },
                      secondary: { variant: "body1", fontWeight: 500 },
                    }}
                  />
                </ListItem>
                <Divider component="li" />
                <Divider component="li" />
                <ListItem sx={{ display: "flex" }}>
                  <ListItemIcon>
                    <CalendarTodayIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Member Since"
                    secondary={formatDate(user.CreatedAt)}
                    slotProps={{
                      primary: {
                        variant: "subtitle2",
                        color: "text.secondary",
                      },
                      secondary: { variant: "body1", fontWeight: 500 },
                    }}
                  />
                </ListItem>
              </List>
            </Box>
          </TabPanel>

          {/* Contact Info Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              >
                Contact Information
              </Typography>
              <List
                sx={{
                  bgcolor: theme.palette.background.default,
                  borderRadius: 2,
                }}
              >
                <ListItem alignItems="flex-start" sx={{ display: "flex" }}>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  {editEmail ? (
                    <Box sx={{ flexGrow: 1 }}>
                      <TextField
                        fullWidth
                        label="E-mail"
                        name="email"
                        value={editForm.email.value || ""}
                        onChange={inputChangeHandler}
                        error={editForm.email.error !== ""}
                        helperText={editForm.email.error}
                        sx={{
                          ...(isShake && editForm.email.error !== ""
                            ? { animation: `${shakeAnimation} 0.35s` }
                            : {}),
                        }}
                        required
                        disabled={isSubmittingEmail}
                      />

                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setEditEmail(false);
                          }}
                          sx={{ mr: 1 }}
                          disabled={isSubmittingEmail}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveEmail}
                          disabled={
                            isSubmittingEmail || editForm.email.error !== ""
                          }
                        >
                          {isSubmittingEmail ? "Saving..." : "Save"}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <ListItemText
                        primary="Email Address"
                        secondary={user.email}
                        slotProps={{
                          primary: {
                            variant: "subtitle2",
                            color: "text.secondary",
                          },
                          secondary: { variant: "body1", fontWeight: 500 },
                        }}
                      />
                      <Box sx={{ ml: "auto" }}>
                        <Button
                          startIcon={<EditIcon />}
                          onClick={() => setEditEmail(true)}
                          color="primary"
                          size="small"
                        >
                          Edit
                        </Button>
                      </Box>
                    </>
                  )}
                </ListItem>
                <Divider />
                <ListItem alignItems="flex-start" sx={{ display: "flex" }}>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  {editPhone ? (
                    <Box sx={{ flexGrow: 1 }}>
                      <MuiTelInput
                        value={(editForm.phoneNumber.value as string) || ""}
                        defaultCountry="DZ"
                        onChange={handlePhoneChange}
                        error={editForm.phoneNumber.error !== ""}
                        helperText={editForm.phoneNumber.error}
                        sx={{
                          ...(isShake && editForm.phoneNumber.error !== ""
                            ? { animation: `${shakeAnimation} 0.35s` }
                            : {}),
                        }}
                        label="Phone Number"
                        name="phone"
                        required
                        margin="dense"
                        disabled={isSubmittingEmail}
                      />
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setEditPhone(false);
                          }}
                          sx={{ mr: 1 }}
                          disabled={isSubmittingPhone}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleSavePhone}
                          disabled={
                            isSubmittingPhone ||
                            editForm.phoneNumber.error !== ""
                          }
                        >
                          {isSubmittingPhone ? "Saving..." : "Save"}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <ListItemText
                        primary="Phone Number"
                        secondary={user.phoneNumber}
                        slotProps={{
                          primary: {
                            variant: "subtitle2",
                            color: "text.secondary",
                          },
                          secondary: { variant: "body1", fontWeight: 500 },
                        }}
                      />
                      <Box sx={{ ml: "auto" }}>
                        <Button
                          startIcon={<EditIcon />}
                          onClick={() => setEditPhone(true)}
                          color="primary"
                          size="small"
                        >
                          Edit
                        </Button>
                      </Box>
                    </>
                  )}
                </ListItem>
              </List>
            </Box>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              >
                Security Settings
              </Typography>
              <List
                sx={{
                  bgcolor: theme.palette.background.default,
                  borderRadius: 2,
                }}
              >
                <ListItem sx={{ display: "flex" }}>
                  <ListItemIcon>
                    <LockIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Password"
                    slotProps={{
                      primary: {
                        variant: "subtitle2",
                        color: "text.secondary",
                      },
                      secondary: { variant: "body2" },
                    }}
                  />
                  <Box sx={{ ml: "auto" }}>
                    <Button
                      startIcon={<EditIcon />}
                      endIcon={<ArrowForwardIosIcon />}
                      href={`/forgot-password?email=${user.email}`}
                      target="_blank"
                      color="primary"
                      variant="outlined"
                      sx={{
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      Change Password
                    </Button>
                  </Box>
                </ListItem>
              </List>
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: "info.light",
                  borderRadius: 2,
                  color: "info.contrastText",
                }}
              >
                <Typography variant="body2">
                  For enhanced security, we recommend changing your password
                  every 90 days and using a combination of letters, numbers, and
                  special characters.
                </Typography>
              </Box>
            </Box>
          </TabPanel>

          {/* Wallet Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              >
                Wallet Information
              </Typography>
              {publicWalletAddress === "" ? (
                <Box>
                  <Card>
                    <CardContent
                      sx={{
                        p: 4,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <AccountBalanceWalletIcon
                        sx={{
                          fontSize: 60,
                          color: theme.palette.primary.main,
                          opacity: 0.8,
                        }}
                      />
                      <Typography variant="h6" color="text.primary">
                        You don't have a wallet yet
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 500, mb: 2 }}
                      >
                        Create a wallet to start interacting with our website
                        securely. Your wallet will be encrypted and accessible
                        only by you.
                      </Typography>
                      <Button
                        onClick={handleCreateWallet}
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 8,
                          boxShadow: `0 4px 14px 0 ${alpha(
                            theme.palette.primary.main,
                            0.3
                          )}`,
                        }}
                      >
                        Create Wallet
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ) : (
                <Box>
                  <List
                    sx={{
                      bgcolor: theme.palette.background.default,
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                      }}
                    >
                      <ListItemIcon>
                        <AccountBalanceWalletIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Your Public Wallet Address"
                        secondary={
                          <Box
                            sx={{
                              mt: 0.5,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Card sx={{ p: 0 }}>
                              <CardContent
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "cetner",
                                }}
                              >
                                <Typography
                                  component="span"
                                  variant="body2"
                                  fontFamily="monospace"
                                  sx={{
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {walletIsVisible ? (
                                    publicWalletAddress
                                  ) : (
                                    <>
                                      {publicWalletAddress.substring(0, 6)}...
                                      {publicWalletAddress.substring(
                                        publicWalletAddress.length - 4
                                      )}
                                    </>
                                  )}
                                </Typography>
                              </CardContent>
                            </Card>
                            <IconButton
                              onClick={() =>
                                setWalletIsVisible(!walletIsVisible)
                              }
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                              aria-label={
                                walletIsVisible
                                  ? "Hide wallet address"
                                  : "Show wallet address"
                              }
                            >
                              {walletIsVisible ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </Box>
                        }
                        slotProps={{
                          primary: {
                            variant: "subtitle2",
                            color: "text.secondary",
                          },
                        }}
                      />
                    </ListItem>
                  </List>
                  <Box sx={{ mt: 3 }}>
                    <Card>
                      <CardContent sx={{ p: 0 }}>
                        <List disablePadding>
                          <ListItem sx={{ display: "flex" }}>
                            <ListItemIcon>
                              <SecurityIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Privacy Warning"
                              secondary="Never share your public wallet address with anyone. Sharing your wallet address can link your identity to your activity, violating our Terms of Service regarding user privacy."
                            />
                          </ListItem>
                          <Divider component="li" />
                          <ListItem sx={{ display: "flex" }}>
                            <ListItemIcon>
                              <LockIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Security Notice"
                              secondary="Never share your wallet's private key or seed phrase. Be cautious of phishing attempts and always verify the website URL before connecting your wallet."
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showPrivateKeyDialog}
        onClose={handleClosePrivateKeyDialog}
        onConfirm={handlePrivateKeyConfirmation}
        title="Important: Save Your Private Key"
        confirmButtonText="I've Saved My Private Key"
        maxWidth={500}
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          Please store your private key in a secure location. If you lose it,
          you will lose access to your wallet forever. Never share your private
          key with anyone.
        </Typography>

        <Card>
          <CardContent>
            <Typography
              variant="body2"
              fontFamily="monospace"
              fontWeight="medium"
              color="error"
              sx={{ wordBreak: "break-all" }}
            >
              {tempWallet?.privateKey}
            </Typography>
          </CardContent>
        </Card>

        <Typography
          variant="subtitle2"
          color="error"
          sx={{ display: "flex", alignItems: "center", mt: 1 }}
        >
          <SecurityIcon sx={{ mr: 1, fontSize: "small" }} />
          This is the only time we will show you your private key
        </Typography>
      </ConfirmationDialog>
    </Box>
  );
};

export default MainSettings;
