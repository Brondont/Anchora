import React, { useState, useEffect, useCallback } from "react";
import {
  // Updated imports for MUI 7
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  DialogActions,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Autocomplete,
  TextField,
  Alert,
  Collapse,
  Paper,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";
import { Role, UserProps } from "../../../types";
import { useFeedback } from "../../../FeedbackAlertContext";
import { getCurrentUserId } from "../../../util/user";

interface UserRolesDialogProps {
  open: boolean;
  onClose: () => void;
  onRoleChange: () => void;
  user: UserProps | undefined;
}

const UserRolesDialog: React.FC<UserRolesDialogProps> = ({
  open,
  onClose,
  onRoleChange,
  user,
}) => {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<{
    type: "add" | "remove";
    role: Role | null;
  } | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const currentUserID = getCurrentUserId();
  const { showFeedback } = useFeedback();

  const fetchAllRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const res = await fetch(`${apiUrl}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.error) throw resData.error;
      setAvailableRoles(resData.roles);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to load roles", false);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [apiUrl, token, showFeedback]);

  useEffect(() => {
    if (open) {
      fetchAllRoles();
    }
  }, [open, fetchAllRoles]);

  const handleAddRole = async () => {
    if (!selectedRole || !user) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/user/${user.ID}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleID: selectedRole.ID }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await res.json();
      if (resData.error) throw resData.error;

      if (user && user.Roles) {
        user.Roles.push(selectedRole);
      }

      setSelectedRole(null);
      showFeedback(`Added role: ${selectedRole.name}`, true);
      onRoleChange();
    } catch (err: any) {
      showFeedback(err.msg || "Failed to add role to user", false);
    } finally {
      setIsProcessing(false);
      setActionPending(null);
      setConfirmMessage(null);
    }
  };

  const handleRemoveRole = async (role: Role) => {
    if (!user) return;

    // Check if this would remove all roles
    if (user.Roles.length === 1) {
      showFeedback("Cannot remove all roles from a user", false);
      return;
    }

    // Check if user is trying to remove their own admin role
    if (user.ID == currentUserID && role.name.toLowerCase() === "admin") {
      showFeedback("Cannot remove your own admin role", false);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/user/${user.ID}/roles/${role.ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.error) throw resData.error;

      if (user && user.Roles) {
        user.Roles = user.Roles.filter((r) => r.ID !== role.ID);
      }

      showFeedback(`Removed role: ${role.name}`, true);
      onRoleChange();
    } catch (err: any) {
      showFeedback(err.msg || "Failed to remove role from user", false);
    } finally {
      setIsProcessing(false);
      setActionPending(null);
      setConfirmMessage(null);
    }
  };

  const confirmAction = () => {
    if (!actionPending) return;

    if (actionPending.type === "add" && actionPending.role) {
      handleAddRole();
    } else if (actionPending.type === "remove" && actionPending.role) {
      handleRemoveRole(actionPending.role);
    }
  };

  const cancelAction = () => {
    setActionPending(null);
    setConfirmMessage(null);
  };

  // Filter out roles that the user already has
  const filteredAvailableRoles = availableRoles.filter(
    (role) => user && !user.Roles.some((userRole) => userRole.ID === role.ID)
  );

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isProcessing) onClose();
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonAddIcon />
          <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
            {user
              ? `Manage Roles: ${user.firstName} ${user.lastName}`
              : "Manage User Roles"}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="close"
          size="small"
          disabled={isProcessing}
          sx={{
            color: "primary.contrastText",
            backgroundColor: "primary.dark",
            "&:hover": {
              backgroundColor: "primary.main",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {!user || isLoadingRoles ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} color="primary" />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Confirmation message */}
            <Collapse in={!!confirmMessage}>
              <Alert
                severity="info"
                icon={<InfoIcon fontSize="inherit" />}
                sx={{
                  borderRadius: 1.5,
                  boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
                  "& .MuiAlert-message": { width: "100%" },
                }}
                action={
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={cancelAction}
                      disabled={isProcessing}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={confirmAction}
                      disabled={isProcessing}
                      startIcon={
                        isProcessing ? (
                          <CircularProgress size={16} />
                        ) : (
                          <CheckIcon />
                        )
                      }
                      sx={{ borderRadius: 1.5, textTransform: "none" }}
                    >
                      Confirm
                    </Button>
                  </Box>
                }
              >
                {confirmMessage}
              </Alert>
            </Collapse>

            {/* Add role section */}
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  color: "text.primary",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AddIcon fontSize="small" color="primary" />
                Add Role
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Autocomplete
                  value={selectedRole}
                  onChange={(_, newValue) => setSelectedRole(newValue)}
                  options={filteredAvailableRoles}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select role"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  )}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  disabled={!selectedRole || isProcessing}
                  onClick={() => {
                    setActionPending({ type: "add", role: selectedRole });
                    setConfirmMessage(
                      `Are you sure you want to add the "${selectedRole?.name}" role to this user?`
                    );
                  }}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: "none",
                    px: 2,
                  }}
                >
                  Add
                </Button>
              </Box>
              {filteredAvailableRoles.length === 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1.5, display: "block" }}
                >
                  No more roles available to add
                </Typography>
              )}
            </Paper>

            {/* Current roles section */}
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  color: "text.primary",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <BadgeIcon fontSize="small" color="primary" />
                Current Roles
              </Typography>

              {user.Roles.length > 0 ? (
                <Stack spacing={1.5}>
                  {user.Roles.map((role) => (
                    <Box
                      key={role.ID}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: "action.hover",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "action.selected",
                        },
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {role.name}
                      </Typography>
                      <Chip
                        label="Remove"
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setActionPending({ type: "remove", role });
                          setConfirmMessage(
                            `Are you sure you want to remove the "${role.name}" role from this user?`
                          );
                        }}
                        disabled={
                          isProcessing ||
                          user.Roles.length === 1 ||
                          (user.ID === currentUserID &&
                            role.name.toLowerCase() === "admin" &&
                            user.Roles.filter(
                              (r) => r.name.toLowerCase() === "admin"
                            ).length === 1)
                        }
                        sx={{
                          borderRadius: 1,
                          "& .MuiChip-label": { px: 1 },
                          "&.Mui-disabled": {
                            opacity: 0.6,
                            borderColor: "text.disabled",
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    py: 3,
                    textAlign: "center",
                    backgroundColor: "action.hover",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    This user has no roles assigned
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2.5, borderTop: 1, borderColor: "divider" }}
      >
        <Button
          onClick={onClose}
          disabled={isProcessing}
          variant="outlined"
          color="primary"
          sx={{
            borderRadius: 1.5,
            textTransform: "none",
            px: 3,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserRolesDialog;
