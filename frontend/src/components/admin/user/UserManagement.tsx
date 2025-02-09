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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardContent,
  Card,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useFeedback } from "../../../FeedbackAlertContext";
import { UserProps } from "../../../pages/user/ProfilePage";
import ConfirmationDialog from "../../confirmationDialog/ConfirmationDialog";

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
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<UserProps | null>(null);
  const [dialogData, setDialogData] = useState<UserDialogData>({
    username: "",
    email: "",
    phoneNumber: "",
    isAdmin: false,
    password: "",
  });

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

  const { showFeedback } = useFeedback();
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

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
      setTotalUsers(resData.total);
    } catch (err) {
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

  const handleOpenDialog = (mode: "create" | "edit", user?: UserProps) => {
    setDialogMode(mode);
    if (mode === "edit" && user) {
      setSelectedUser(user);
      setDialogData({
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
      });
    } else {
      setSelectedUser(null);
      setDialogData({
        username: "",
        email: "",
        phoneNumber: "",
        isAdmin: false,
        password: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogData({
      username: "",
      email: "",
      phoneNumber: "",
      isAdmin: false,
      password: "",
    });
  };

  const handleSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const method = dialogMode === "create" ? "POST" : "PUT";
      const url = apiUrl + (dialogMode === "create" ? "/signup" : "/user");

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dialogData),
      });

      const resData = await res.json();

      if (resData.error) {
        throw resData.error;
      }

      showFeedback(
        `User ${dialogMode === "create" ? "created" : "updated"} successfully`,
        true
      );
      if (dialogMode === "create") {
        setUsers((prev) => [...prev, resData.user]);
      } else {
        setUsers((prev) =>
          prev.map((user) => {
            if (user.email === dialogData.email) {
              return resData.user;
            }
            return user;
          })
        );
      }

      handleCloseDialog();
    } catch (err) {
      if (err.length > 0) {
        showFeedback(err[0].msg, false);
      } else if (err.msg) showFeedback(err.msg, false);
      else showFeedback(`Failed to ${dialogMode} user`, false);
    } finally {
      setIsProcessing(false);
    }
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
    } catch (err) {
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
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Card
        sx={{
          flex: "1 1 80%",
          maxWidth: "80%",
          width: "100%",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            p: 4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h4">User Management</Typography>
            <LoadingButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog("create")}
              loading={isProcessing}
            >
              Add User
            </LoadingButton>
          </Box>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by Username, Email or Phone Number"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ mb: 3 }}
          />

          <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.ID}>
                    <TableCell>{user.ID}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>{user.isAdmin ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {new Date(user.CreatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenDialog("edit", user)}
                        disabled={isProcessing}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteClick(user.ID)}
                        disabled={isProcessing}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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

          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {dialogMode === "create" ? "Create New User" : "Edit User"}
              <IconButton
                onClick={handleCloseDialog}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box
                sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
              >
                <TextField
                  label="Username"
                  fullWidth
                  value={dialogData.username}
                  onChange={(e) =>
                    setDialogData({ ...dialogData, username: e.target.value })
                  }
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={dialogData.email}
                  onChange={(e) =>
                    setDialogData({ ...dialogData, email: e.target.value })
                  }
                />
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={dialogData.phoneNumber}
                  onChange={(e) =>
                    setDialogData({
                      ...dialogData,
                      phoneNumber: e.target.value,
                    })
                  }
                />
                {dialogMode === "create" && (
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={dialogData.password}
                    onChange={(e) =>
                      setDialogData({ ...dialogData, password: e.target.value })
                    }
                  />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <LoadingButton
                onClick={handleSubmit}
                loading={isProcessing}
                variant="contained"
                startIcon={<SaveIcon />}
              >
                {dialogMode === "create" ? "Create" : "Update"}
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserManagement;
