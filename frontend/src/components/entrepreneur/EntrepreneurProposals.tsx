import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  InputAdornment,
  Chip,
  Divider,
  TablePagination,
  SelectChangeEvent,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Define proposal type
interface Proposal {
  id: string;
  name: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  amount: number;
  category: string;
  submittedBy: string;
}

const EntrepreneurProposals: React.FC = () => {
  const theme = useTheme();

  // Sample data - replace with actual API call
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: "1",
      name: "Tech Startup Expansion",
      date: "2025-03-15",
      status: "pending",
      amount: 50000,
      category: "Technology",
      submittedBy: "John Doe",
    },
    {
      id: "2",
      name: "Sustainable Food Packaging",
      date: "2025-03-10",
      status: "approved",
      amount: 25000,
      category: "Sustainability",
      submittedBy: "Jane Smith",
    },
    {
      id: "3",
      name: "Mobile App Development",
      date: "2025-03-01",
      status: "rejected",
      amount: 35000,
      category: "Technology",
      submittedBy: "Alex Johnson",
    },
    {
      id: "4",
      name: "Organic Farm Expansion",
      date: "2025-02-28",
      status: "pending",
      amount: 45000,
      category: "Agriculture",
      submittedBy: "Sarah Williams",
    },
    {
      id: "5",
      name: "AI-powered Analytics Tool",
      date: "2025-02-20",
      status: "approved",
      amount: 60000,
      category: "AI",
      submittedBy: "Mike Brown",
    },
  ]);

  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);

  // Get all unique categories for filter
  const categories = Array.from(new Set(proposals.map((p) => p.category)));

  // Handle delete confirmation
  const handleDeleteClick = (id: string) => {
    setProposalToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (proposalToDelete) {
      setProposals(proposals.filter((p) => p.id !== proposalToDelete));
    }
    setDeleteDialogOpen(false);
    setProposalToDelete(null);
  };

  // Handle sorting change
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Handle filter changes
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleCategoryFilterChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter((proposal) => {
      const matchesSearch =
        proposal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || proposal.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || proposal.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "amount") {
        return sortDirection === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      return 0;
    });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return theme.palette.success.main;
      case "rejected":
        return theme.palette.error.main;
      default:
        return theme.palette.warning.main;
    }
  };

  // Calculate pagination
  const paginatedProposals = filteredProposals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Proposals
          </Typography>

          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            {/* Search Field */}
            <TextField
              label="Search Proposals"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Filter by Status */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            {/* Filter by Category */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Category"
                onChange={handleCategoryFilterChange}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sort Options */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1.5 }}
            >
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel id="sort-by-label">Sort By</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortChange}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="amount">Amount</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Toggle Sort Direction">
                <IconButton onClick={toggleSortDirection} color="primary">
                  <SortIcon
                    sx={{
                      transform:
                        sortDirection === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)",
                      transition: "transform 0.3s",
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={3}>
            <Table sx={{ minWidth: 650 }} aria-label="proposals table">
              <TableHead sx={{ backgroundColor: theme.palette.primary.light }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Proposal Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Category
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProposals.length > 0 ? (
                  paginatedProposals.map((proposal) => (
                    <TableRow key={proposal.id} hover>
                      <TableCell component="th" scope="row">
                        {proposal.name}
                      </TableCell>
                      <TableCell>
                        {new Date(proposal.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            proposal.status.charAt(0).toUpperCase() +
                            proposal.status.slice(1)
                          }
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(proposal.status),
                            color: "white",
                          }}
                        />
                      </TableCell>
                      <TableCell>{proposal.category}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex" }}>
                          <Tooltip title="View Details">
                            <IconButton color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Proposal">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(proposal.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No proposals found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProposals.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this proposal? This action
                cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmDelete} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EntrepreneurProposals;
