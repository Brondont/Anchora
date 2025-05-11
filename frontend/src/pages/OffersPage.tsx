import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Pagination,
  Button,
  Drawer,
  IconButton,
  Chip,
  Skeleton,
  Divider,
  Card,
  CardContent,
  Stack,
  Fade,
  Collapse,
  SelectChangeEvent,
  Autocomplete,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import OfferCard from "../components/offerCard/OfferCard";
import { Offer, Sector } from "../types";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "../FeedbackAlertContext";
import Footer from "../components/footer/Footer";
import { IState, State } from "country-state-city";

const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sectorOptions, setSectorOptions] = useState<Sector[]>([]);
  const [availableStates, setAvailableStates] = useState<IState[]>([]);

  const [sectorFilter, setSectorFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { showFeedback } = useFeedback();

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchSectors = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/sectors`, {
        method: "GET",
      });

      const resData = await res.json();

      if (resData.error) {
        throw resData.error;
      }

      setSectorOptions(resData.sectors);
    } catch (err: any) {
      showFeedback(
        err.msg || "something went wrong loading data, reload your page",
        false
      );
    }
  }, [apiUrl]);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sector: sectorFilter,
        location: locationFilter,
      });
      const res = await fetch(`${apiUrl}/offers?${params}`);
      const resData = await res.json();
      if (resData.error) throw resData.error;

      setOffers(resData.offers);

      setTotalPages(resData.totalPages);
    } catch (err: any) {
      console.log(err);
      showFeedback(
        err.msg || "failed to fetch offers, please reload your page",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchSectors();

    const states = State.getStatesOfCountry("DZ");
    setAvailableStates(states);
  }, [page, search, sectorFilter, locationFilter]);

  useEffect(() => {
    const newActiveFilters = [];
    if (sectorFilter) newActiveFilters.push(`Sector: ${sectorFilter}`);
    if (locationFilter) newActiveFilters.push(`Location: ${locationFilter}`);
    setActiveFilters(newActiveFilters);
  }, [sectorFilter, locationFilter]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSectorChange = (e: SelectChangeEvent<string>) => {
    setSectorFilter(e.target.value);
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleView = (id: number) => {
    navigate(`/offers/${id}`);
  };

  const clearFilter = (filter: string) => {
    if (filter.startsWith("Sector:")) {
      setSectorFilter("");
    } else if (filter.startsWith("Location:")) {
      setLocationFilter("");
    }
  };

  const toggleFilterDrawer = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };

  const SkeletonLoader = () => (
    <Stack spacing={2} direction="row" sx={{ justifyContent: "center" }}>
      {[...Array(3)].map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 1,
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="80%" height={20} />
            </Box>
            <Box
              sx={{ width: 120, display: "flex", justifyContent: "flex-end" }}
            >
              <Skeleton
                variant="rectangular"
                width={100}
                height={40}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", mt: 2, gap: 1 }}>
            <Skeleton
              variant="rectangular"
              width={80}
              height={30}
              sx={{ borderRadius: 4 }}
            />
            <Skeleton
              variant="rectangular"
              width={100}
              height={30}
              sx={{ borderRadius: 4 }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );

  const EmptyStateMessage = () => (
    <Fade in timeout={800}>
      <Card
        sx={{
          textAlign: "center",
          py: 6,
          px: 3,
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
          mt: 4,
        }}
      >
        <CardContent>
          <ErrorOutlineIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h5" gutterBottom fontWeight="medium">
            No Offers Found
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 500, mx: "auto", mb: 3 }}
          >
            We couldn't find any offers matching your current filters. Try
            adjusting your search criteria or check back later for new
            opportunities.
          </Typography>
          {activeFilters.length > 0 && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setSectorFilter("");
                setLocationFilter("");
                setSearch("");
              }}
            >
              Clear All Filters
            </Button>
          )}
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
          Available Offers
        </Typography>

        <Box
          sx={{
            p: 2,
            mb: 8,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                flex: { xs: "1 1 auto", md: 3 },
                display: "flex",
                position: "relative",
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search offers by title, company or description..."
                value={search}
                onChange={handleSearchChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    pl: 1,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 auto", md: 1 } }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FilterListIcon />}
                onClick={toggleFilterDrawer}
                fullWidth
                sx={{ height: "56px", borderRadius: 2 }}
              >
                Filter Options
              </Button>
            </Box>
          </Box>

          {/* Active filters display */}
          <Collapse in={activeFilters.length > 0}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  onDelete={() => clearFilter(filter)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Collapse>
        </Box>

        {isLoading ? (
          <SkeletonLoader />
        ) : offers.length === 0 ? (
          <EmptyStateMessage />
        ) : (
          <Stack
            spacing={2}
            direction="row"
            sx={{ justifyContent: "center", flexWrap: "wrap", gap: 8 }}
          >
            {offers.map((offer) => (
              <Fade key={offer.ID} in timeout={500}>
                <Box>
                  <OfferCard offer={offer} onView={handleView} />
                </Box>
              </Fade>
            ))}
          </Stack>
        )}

        {/* Pagination */}
        {!isLoading && offers.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              siblingCount={1}
            />
          </Box>
        )}

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={toggleFilterDrawer}
          PaperProps={{
            sx: { width: { xs: "100%", sm: 400 }, p: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Filter Offers
            </Typography>
            <IconButton onClick={toggleFilterDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Filter Options */}
          <Stack spacing={3}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CategoryIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Sector
                </Typography>
              </Box>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Select Sector</InputLabel>
                <Select
                  value={sectorFilter}
                  onChange={handleSectorChange}
                  label="Select Sector"
                >
                  {sectorOptions.map((sector) => {
                    return (
                      <MenuItem value={sector.code}>{sector.code}</MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <LocationOnIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Location
                </Typography>
              </Box>
              {availableStates.length > 0 && (
                <Autocomplete
                  fullWidth
                  options={availableStates}
                  getOptionLabel={(option) => option.name}
                  value={
                    availableStates.find(
                      (s) => s.countryCode === locationFilter
                    ) || null
                  }
                  onChange={(_, state) => {
                    if (state) setLocationFilter(state.name);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select State"
                      variant="outlined"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.countryCode === value.countryCode
                  }
                />
              )}
            </Box>
          </Stack>

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setSectorFilter("");
                setLocationFilter("");
              }}
            >
              Clear Filters
            </Button>
            <Button variant="contained" fullWidth onClick={toggleFilterDrawer}>
              Apply Filters
            </Button>
          </Box>
        </Drawer>
      </Box>
      <Footer />
    </>
  );
};

export default OffersPage;
