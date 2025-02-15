import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Box,
  DialogActions,
  Button,
  FormHelperText,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { Role } from "../../../types";
import ConfirmationDialog from "../../confirmationDialog/ConfirmationDialog";
import { useFeedback } from "../../../FeedbackAlertContext";

interface RolesDialogProps {
  open: boolean;
  onClose: () => void;
  onRolesChange?: (roles: Role[]) => void;
  isProcessing?: boolean;
}

const RolesDialog: React.FC<RolesDialogProps> = ({
  open,
  onClose,
  onRolesChange,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingName, setEditingName] = useState<string>("");
  const [newRoleName, setNewRoleName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const { showFeedback } = useFeedback();

  const [confirmationDialogData, setConfirmationDialogData] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fetchRoles = useCallback(async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.error) throw resData.error;
      setRoles(resData.roles);

      if (onRolesChange) {
        onRolesChange(resData.roles);
      }
    } catch (err: any) {
      showFeedback(err.msg || "Failed to load roles", false);
    } finally {
      setIsProcessing(false);
    }
  }, [apiUrl, token, showFeedback, onRolesChange]);

  useEffect(() => {
    if (open) {
      fetchRoles();
      setError("");
      setNewRoleName("");
      setEditingName("");
    }
  }, [open, fetchRoles]);

  const validateRoleName = (name: string): boolean => {
    if (!name.trim()) {
      setError("Role name cannot be empty");
      return false;
    }

    if (name.trim().length < 2) {
      setError("Role name must be at least 2 characters long");
      return false;
    }

    if (name.trim().length > 50) {
      setError("Role name cannot exceed 50 characters");
      return false;
    }

    // Check if role name already exists (only for new roles, not when editing)
    if (
      !editingName &&
      roles.some(
        (role) => role.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setError("This role name already exists");
      return false;
    }

    // For editing: check if the new name already exists and is different from current name
    if (
      editingName &&
      editingName.toLowerCase() !== name.trim().toLowerCase() &&
      roles.some(
        (role) => role.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setError("This role name already exists");
      return false;
    }

    setError("");
    return true;
  };

  const handleAddRole = async () => {
    if (!validateRoleName(newRoleName)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      const resData = await res.json();
      if (resData.error) throw resData.error;

      const updatedRoles = [...roles, resData.role];
      setRoles(updatedRoles);

      if (onRolesChange) {
        onRolesChange(updatedRoles);
      }

      setNewRoleName("");
      showFeedback("Role added successfully", true);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to add role", false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!validateRoleName(newRoleName)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/roles/${editingName}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      const resData = await res.json();
      if (resData.error) throw resData.error;

      const updatedRoles = roles.map((r) =>
        r.name === editingName ? resData.role : r
      );
      setRoles(updatedRoles);

      if (onRolesChange) {
        onRolesChange(updatedRoles);
      }

      setEditingName("");
      setNewRoleName("");
      showFeedback("Role updated successfully", true);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to update role", false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/roles/${roleName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await res.json();

      if (resData.error) throw resData.error;

      const updatedRoles = roles.filter((r) => r.name !== roleName);
      setRoles(updatedRoles);

      if (onRolesChange) {
        onRolesChange(updatedRoles);
      }

      showFeedback("Role deleted successfully", true);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to delete role", false);
    } finally {
      setIsProcessing(false);
      setConfirmationDialogData((prev) => ({ ...prev, open: false }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewRoleName(e.target.value);
    if (error) validateRoleName(e.target.value);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: "medium" }}
          >
            Manage Roles
          </Typography>
          <Tooltip title="Close">
            <IconButton
              onClick={onClose}
              aria-label="close"
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ p: 2 }}>
            <TextField
              label={editingName ? "Edit Role Name" : "New Role Name"}
              fullWidth
              size="small"
              value={newRoleName}
              onChange={handleNameChange}
              error={!!error}
              onBlur={() => validateRoleName(newRoleName)}
              disabled={isProcessing}
              sx={{ mb: 1 }}
            />
            {error && (
              <FormHelperText error sx={{ ml: 1, mb: 1 }}>
                {error}
              </FormHelperText>
            )}
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1, ml: 1 }}
              >
                {roles.length} {roles.length === 1 ? "role" : "roles"}
              </Typography>

              <List disablePadding>
                {roles.map((role, index) => (
                  <React.Fragment key={role.name}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      disablePadding
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderRadius: 1,
                        transition: "background-color 0.2s",
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                      secondaryAction={
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => {
                                setEditingName(role.name);
                                setNewRoleName(role.name);
                                setError("");
                              }}
                              edge="end"
                              aria-label="edit"
                              size="small"
                              sx={{ mr: 1 }}
                              disabled={isProcessing}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => {
                                setConfirmationDialogData({
                                  open: true,
                                  title: "Delete Role",
                                  message: `Are you sure you want to delete the "${role.name}" role?`,
                                  onConfirm: () => handleDeleteRole(role.name),
                                });
                              }}
                              edge="end"
                              aria-label="delete"
                              color="error"
                              size="small"
                              disabled={isProcessing}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      }
                    >
                      <ListItemText primary={role.name} />
                    </ListItem>
                  </React.Fragment>
                ))}
                {roles.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      py: 3,
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    No roles available. Add a new role to get started.
                  </Typography>
                )}
              </List>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditingName("");
              setNewRoleName("");
              setError("");
            }}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={editingName === "" ? handleAddRole : handleUpdateRole}
            variant="contained"
            loading={isProcessing}
            disabled={!!error}
          >
            {editingName === "" ? "Create" : "Update"}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={confirmationDialogData.open}
        onClose={() =>
          setConfirmationDialogData((prev) => ({ ...prev, open: false }))
        }
        onConfirm={confirmationDialogData.onConfirm}
        title={confirmationDialogData.title}
        message={confirmationDialogData.message}
      />
    </>
  );
};

export default RolesDialog;
