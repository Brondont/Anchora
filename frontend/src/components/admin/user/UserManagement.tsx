import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Chip,
  CardContent,
  Card,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Button,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useFeedback } from "../../../FeedbackAlertContext";
import { Role, UserProps } from "../../../types";
import ConfirmationDialog from "../../confirmationDialog/ConfirmationDialog";
import RolesDialog from "./RolesDialog";
import { useNavigate } from "react-router-dom";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProps[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUserID, setSelectedUserID] = useState<number>();
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // Combined confirmation dialog state
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
  const [openRolesDialog, setOpenRolesDialog] = useState(false);
  const { showFeedback } = useFeedback();
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const [actionsAnchorEl, setActionsAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const isActionsOpen = Boolean(actionsAnchorEl);

  const handleActionsClick = (
    event: React.MouseEvent<HTMLElement>,
    userID: number
  ) => {
    setActionsAnchorEl(event.currentTarget);
    setSelectedUserID(userID);
  };
  const handleActionsClose = () => {
    setActionsAnchorEl(null);
  };

  const handleRolesChange = (updatedRoles: Role[]) => {};

  const fetchUsers = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        search: searchQuery,
      });

      const res = await fetch(`${apiUrl}/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await res.json();

      if (resData.error) {
        throw resData.error;
      }

      setUsers(resData.users);
      setTotalUsers(resData.pagination.totalItems);
    } catch (err: any) {
      if (err) showFeedback(err.msg, false);
      else showFeedback("Failed to load users", false);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [apiUrl, page, rowsPerPage, searchQuery, token, showFeedback]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleDelete = async (userID: number) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/users/${userID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await res.json();

      if (resData.error) {
        throw resData.error;
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user.ID !== userID));
      showFeedback("User deleted successfully", true);
    } catch (err: any) {
      if (err.msg) showFeedback(err.msg, false);
      else showFeedback("Failed to delete user", false);
    } finally {
      setIsProcessing(false);
      setConfirmationDialogData((prev) => ({ ...prev, open: false }));
    }
  };

  const handleDeleteClick = (userId: number | undefined) => {
    if (!userId) return;
    setConfirmationDialogData({
      open: true,
      title: "Confirm Delete",
      message: `Are you sure you want to delete the user with ID ${userId}?`,
      onConfirm: () => handleDelete(userId),
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        padding: 3,
      }}
    >
      <Card
        sx={{
          width: "100%",
          overflow: "hidden",
        }}
      >
        <CardContent>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold">
              User Management
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                All Users
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalUsers}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearch}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/admin/user-details")}
              >
                Add User
              </Button>
              <LoadingButton
                variant="outlined"
                onClick={() => {
                  setOpenRolesDialog(true);
                }}
                loading={isProcessing}
              >
                Manage Roles
              </LoadingButton>
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.ID} hover>
                    <TableCell>{user.ID}</TableCell>
                    <TableCell>
                      {`${user.firstName} ${user.lastName}`}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {user.Roles?.map((role) => (
                          <Chip
                            key={role.name}
                            label={role.name}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(user.CreatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="more"
                        id="long-button"
                        aria-controls={isActionsOpen ? "long-menu" : undefined}
                        aria-expanded={isActionsOpen ? "true" : undefined}
                        aria-haspopup="true"
                        onClick={(event) => {
                          handleActionsClick(event, user.ID);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {isLoadingUsers && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Loading users...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoadingUsers && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalUsers}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
          <Menu
            id="long-menu"
            MenuListProps={{
              "aria-labelledby": "long-button",
            }}
            anchorEl={actionsAnchorEl}
            open={isActionsOpen}
            onClose={handleActionsClose}
            slotProps={{
              paper: {
                style: {
                  maxHeight: 100,
                  width: "20ch",
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                navigate(`/admin/user-details?userID=${selectedUserID}`);
              }}
              key={`edit-${selectedUserID}`}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Details</ListItemText>
            </MenuItem>
            <MenuItem
              key={`delete-${selectedUserID}`}
              onClick={() => {
                handleDeleteClick(selectedUserID);
                handleActionsClose();
              }}
            >
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete User</ListItemText>
            </MenuItem>
          </Menu>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmationDialogData.open}
        onClose={() =>
          setConfirmationDialogData((prev) => ({ ...prev, open: false }))
        }
        onConfirm={confirmationDialogData.onConfirm}
        title={confirmationDialogData.title}
        message={confirmationDialogData.message}
      />

      <RolesDialog
        open={openRolesDialog}
        onClose={() => setOpenRolesDialog(false)}
        onRolesChange={handleRolesChange}
      />
    </Box>
  );
};

export default UserManagement;
