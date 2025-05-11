import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Skeleton,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WarningIcon from "@mui/icons-material/Warning";
import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import { authFileDownload } from "../util/authFileDownload";
import { Offer, UserProps } from "../types";
import { useFeedback } from "../FeedbackAlertContext";
import Footer from "../components/footer/Footer";
import { formatDate, formatPrice } from "../util/formatters";
import hasRole from "../util/hasRole";

interface OfferPageProps {
  user: UserProps | undefined;
}

const OfferPage: React.FC<OfferPageProps> = ({ user }) => {
  const { offerID } = useParams();
  const [offer, setOffer] = useState<Offer>();
  const [isLoading, setIsLoading] = useState(true);
  const { showFeedback } = useFeedback();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchOffer = async () => {
      setIsLoading(true);

      try {
        const res = await fetch(`${apiUrl}/offer/${offerID}`);
        const resData = await res.json();

        if (resData.error) throw resData.Error;

        setOffer(resData.offer);
      } catch (err) {
        showFeedback("Failed to load offer details", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (offerID) {
      fetchOffer();
    }
  }, [offerID, apiUrl, showFeedback]);

  const handleBackToOffers = () => {
    navigate("/offers");
  };

  // Skeleton loader for the entire card
  const CardSkeleton = () => (
    <Box
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="rounded" width={150} height={32} />
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="100%" height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="95%" height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="85%" height={30} sx={{ mb: 3 }} />
      </Box>

      <Divider />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Skeleton variant="rounded" width={200} height={80} />
          <Skeleton variant="rounded" width={200} height={80} />
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 3 }}>
        <Skeleton variant="rounded" width="100%" height={120} />
      </Box>
    </Box>
  );

  if (!isLoading && !offer) {
    return (
      <>
        <Box
          sx={{ maxWidth: "1200px", mx: "auto", py: 4, px: 2, height: "100vh" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton
              onClick={handleBackToOffers}
              sx={{ mr: 2 }}
              aria-label="back to offers"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">Back to Offers</Typography>
          </Box>

          <Alert
            severity="error"
            sx={{
              mt: 4,
              display: "flex",
              alignItems: "center",
              borderRadius: 2,
              boxShadow: 2,
            }}
            icon={<WarningIcon fontSize="large" />}
          >
            <AlertTitle sx={{ fontSize: "1.2rem" }}>
              Error Loading Offer
            </AlertTitle>
            <Typography>
              The offer could not be found or there was an error loading it.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBackToOffers}
              sx={{ mt: 2 }}
            >
              Return to Offers
            </Button>
          </Alert>
        </Box>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: "1200px", mx: "auto", py: 4, px: 2 }}>
        {/* Back button */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={handleBackToOffers}
            sx={{ mr: 2 }}
            aria-label="back to offers"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body1" color="text.secondary">
            Back to Offers
          </Typography>
        </Box>

        {isLoading ? (
          <CardSkeleton />
        ) : offer ? (
          <Box
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 3,
              overflow: "hidden",
              borderTop: 5,
              borderColor:
                offer.status === "Open" ? "success.main" : "grey.400",
            }}
          >
            {/* Header section with tender info and status */}
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {offer.title}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Tender #: {offer.tenderNumber}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Chip
                  color="primary"
                  icon={<CategoryIcon />}
                  label={`${offer.Sector?.description || "Unknown"}`}
                  variant="outlined"
                />
                {offer.location && (
                  <Chip
                    color="success"
                    icon={<LocationOnIcon />}
                    label={offer.location}
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            <Divider />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 2,
                p: 2,
              }}
            >
              <AttachMoneyIcon
                sx={{
                  color: "success.dark",
                  transform: "rotate(15deg)",
                  fontSize: "2rem",
                }}
              />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Estimated Budget
                </Typography>
                <Typography variant="h4" color="success.dark" fontWeight="bold">
                  {formatPrice(offer.budget)}
                </Typography>
              </Box>
            </Box>

            {/* Description section */}
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: "primary.main",
                }}
              >
                <DescriptionIcon sx={{ mr: 1 }} /> Description
              </Typography>

              {/* React-Quill content display */}
              <Box
                className="ql-editor"
                sx={{
                  mb: 3,
                  "& p": { mb: 1.5 },
                  "& ul, & ol": { pl: 4, mb: 2 },
                  "& blockquote": {
                    borderLeft: 4,
                    borderColor: "grey.300",
                    pl: 2,
                    py: 1,
                    my: 2,
                  },
                }}
                dangerouslySetInnerHTML={{ __html: offer.description }}
              />

              {offer.minQualificationLevel && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    fontWeight="medium"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    Minimum Qualification Level
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: "warning.light",
                      bgcolor: "warning.lightest",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body1">
                      {offer.minQualificationLevel}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Timeline section */}
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: "primary.main",
                }}
              >
                <AccessTimeIcon sx={{ mr: 1 }} /> Timeline
              </Typography>

              <Stack spacing={3}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "primary.lightest",
                    border: "1px solid",
                    borderColor: "primary.light",
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      bgcolor: "primary.main",
                      borderRadius: "4px 0 0 4px",
                    },
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    Proposal Submission Phase
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 4, mt: 2 }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(offer.proposalSubmissionStart)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(offer.proposalSubmissionEnd)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "info.lightest",
                    border: "1px solid",
                    borderColor: "info.light",
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      bgcolor: "info.main",
                      borderRadius: "4px 0 0 4px",
                    },
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    Proposal Review Phase
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 4, mt: 2 }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(offer.proposalReviewStart)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(offer.proposalReviewEnd)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Documents section */}
            {user !== undefined && (
              <Box sx={{ p: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 3,
                    color: "primary.main",
                  }}
                >
                  <InsertDriveFileIcon sx={{ mr: 1 }} /> Documents
                </Typography>

                {offer.Documents && offer.Documents.length > 0 ? (
                  <Stack spacing={2}>
                    {offer.Documents.map((doc) => (
                      <Box
                        key={doc.ID}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          p: 2,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "grey.200",
                          "&:hover": {
                            bgcolor: "grey.50",
                            borderColor: "grey.300",
                          },
                        }}
                      >
                        <FileCopyIcon sx={{ mr: 2, color: "primary.main" }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {doc.documentType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Updated: {formatDate(doc.UpdatedAt)}
                          </Typography>
                        </Box>
                        <Button
                          onClick={() => authFileDownload(doc.documentPath)}
                          variant="outlined"
                          size="small"
                        >
                          Download
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No documents are attached to this offer.
                  </Alert>
                )}
              </Box>
            )}

            <Divider />

            {/* Contract Information section */}
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: "primary.main",
                }}
              >
                <InfoIcon sx={{ mr: 1 }} /> Contract Information
              </Typography>

              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    sx={{ minWidth: 150 }}
                  >
                    Contract Address:
                  </Typography>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      fontFamily: "monospace",
                      flex: 1,
                      minWidth: 200,
                      display: "flex",
                      border: "1px solid",
                      borderColor: "grey.300",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2">
                      {offer.contractAddress}
                    </Typography>
                    <Tooltip title="Copy to clipboard">
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(offer.contractAddress);
                          showFeedback(
                            "Contract address copied to clipboard",
                            "success"
                          );
                        }}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    sx={{ minWidth: 150 }}
                  >
                    Created:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <EventIcon
                      sx={{ mr: 1, fontSize: 18, color: "text.secondary" }}
                    />
                    {formatDate(offer.CreatedAt)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    sx={{ minWidth: 150 }}
                  >
                    Last Updated:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <EventIcon
                      sx={{ mr: 1, fontSize: 18, color: "text.secondary" }}
                    />
                    {formatDate(offer.UpdatedAt)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Action buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 3,
                bgcolor: "grey.50",
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={handleBackToOffers}
                >
                  Back to Offers
                </Button>
                {hasRole(user, "entrepreneur") && offer.status === "Open" && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<ReceiptIcon />}
                    onClick={() => navigate(`/proposals/submit/${offer.ID}`)}
                  >
                    Submit Proposal
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        ) : null}
      </Box>

      <Footer />
    </>
  );
};

export default OfferPage;
