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
  CardHeader,
  Divider,
  InputAdornment,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useFeedback } from "../../../FeedbackAlertContext";
import { Role, UserProps } from "../../../types";
import ConfirmationDialog from "../../confirmationDialog/ConfirmationDialog";
import RolesDialog from "./RolesDialog";
import { useNavigate } from "react-router-dom";

interface UserDialogData {
  username: string;
  email: string;
  phoneNumber: string;
  isAdmin: boolean;
  password?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProps[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

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
  const navigate = useNavigate();

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

  const handleDeleteClick = (userId: number) => {
    setConfirmationDialogData({
      open: true,
      title: "Confirm Delete",
      message: `Are you sure you want to delete the user with ID ${userId}?`,
      onConfirm: () => handleDelete(userId),
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">User Management</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
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
              <LoadingButton
                variant="contained"
                startIcon={<AddIcon />}
                loading={isProcessing}
              >
                Add User
              </LoadingButton>
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
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.ID} hover>
                    <TableCell>{user.ID}</TableCell>
                    <TableCell>{user.username}</TableCell>
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
                        size="small"
                        onClick={() => navigate(`admin/user/${user.ID}`)}
                        disabled={isProcessing}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(user.ID)}
                        disabled={isProcessing}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
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
