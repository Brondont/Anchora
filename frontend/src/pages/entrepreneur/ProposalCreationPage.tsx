import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Divider,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DescriptionIcon from "@mui/icons-material/Description";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import FileUpload from "../../components/fileUpload/FileUpload";
import { useFeedback } from "../../FeedbackAlertContext";
import Footer from "../../components/footer/Footer";
import { Offer, UserProps } from "../../types";
import { formatDate, formatPrice } from "../../util/formatters";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useEthers } from "@usedapp/core";
import { useOfferFactory } from "../../hooks/useOfferFactory";

interface ProposalCreationPageProps {
  user: UserProps | undefined;
}

const ProposalCreationPage: React.FC<ProposalCreationPageProps> = ({
  user,
}) => {
  const { offerID } = useParams();
  const navigate = useNavigate();
  const { showFeedback } = useFeedback();

  // State variables
  const [offer, setOffer] = useState<Offer>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsContent, setDetailsContent] = useState("");

  // File uploads for different document types
  const [adminFiles, setAdminFiles] = useState<File[]>([]);
  const [technicalFiles, setTechnicalFiles] = useState<File[]>([]);
  const [financialFiles, setFinancialFiles] = useState<File[]>([]);

  const { account } = useEthers();
  const { hasRole } = useOfferFactory();

  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Validation
  const [formErrors, setFormErrors] = useState({
    details: false,
    admin: false,
    technical: false,
    financial: false,
  });

  // Fetch offer details
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

  // Handle file uploads
  const handleAdminFileUpload = (files: File[]) => {
    setAdminFiles([...adminFiles, ...files]);
    setFormErrors({ ...formErrors, admin: false });
  };

  const handleTechnicalFileUpload = (files: File[]) => {
    setTechnicalFiles([...technicalFiles, ...files]);
    setFormErrors({ ...formErrors, technical: false });
  };

  const handleFinancialFileUpload = (files: File[]) => {
    setFinancialFiles([...financialFiles, ...files]);
    setFormErrors({ ...formErrors, financial: false });
  };

  // Handle file removals
  const handleAdminFileRemove = (index: number) => {
    setAdminFiles(adminFiles.filter((_, i) => i !== index));
  };

  const handleTechnicalFileRemove = (index: number) => {
    setTechnicalFiles(technicalFiles.filter((_, i) => i !== index));
  };

  const handleFinancialFileRemove = (index: number) => {
    setFinancialFiles(financialFiles.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const errors = {
      details: !detailsContent.trim(),
      admin: adminFiles.length === 0,
      technical: technicalFiles.length === 0,
      financial: financialFiles.length === 0,
    };

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Handle proposal submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showFeedback(
        "Please fill in all required fields and upload all required documents",
        "error"
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    if (!account) {
      showFeedback(
        "No connected wallet detected. Please connect your wallet to proceed.",
        "error"
      );
      return;
    }

    const isEntrepreneur = hasRole("ENTREPRENEUR", account);

    if (!isEntrepreneur) {
      showFeedback("Tender permissions required for offer creation", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      showFeedback(
        "Intiating blockchain transaction to create the proposal",
        "info"
      );

      showFeedback("Offer created on‑chain. Transaction sent!", "success");
    } catch (err: any) {
      showFeedback(
        err.msg || "something went wrong with creating the offer, try again",
        "error"
      );
      setIsSubmitting(false);
    }

    // try {
    //   // Create form data
    //   const formData = new FormData();
    //   formData.append("contractID", offerID || "");
    //   formData.append("details", detailsContent);

    //   // Append admin documents
    //   adminFiles.forEach((file) => {
    //     formData.append("administrativeFiles", file);
    //   });

    //   // Append technical documents
    //   technicalFiles.forEach((file) => {
    //     formData.append("technicalFiles", file);
    //   });

    //   // Append financial documents
    //   financialFiles.forEach((file) => {
    //     formData.append("financialFiles", file);
    //   });

    //   // Send the proposal to the API
    //   const response = await fetch(`${apiUrl}/proposal`, {
    //     method: "POST",
    //     credentials: "include",
    //     body: formData,
    //   });

    //   const result = await response.json();

    //   if (result.error) {
    //     throw new Error(result.error);
    //   }

    //   showFeedback("Proposal submitted successfully", "success");
    //   navigate(`/proposals`);
    // } catch (error) {
    //   console.error("Error submitting proposal:", error);
    //   showFeedback(
    //     `Failed to submit proposal: ${
    //       error instanceof Error ? error.message : "Unknown error"
    //     }`,
    //     "error"
    //   );
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  // Handle back button
  const handleBack = () => {
    navigate(`/offers/${offerID}`);
  };

  // Skeleton loader
  const LoadingSkeleton = () => (
    <Box sx={{ p: 3 }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading offer details...</Typography>
    </Box>
  );

  if (!isLoading && !offer) {
    return (
      <>
        <Box
          sx={{
            maxWidth: "1200px",
            mx: "auto",
            py: 4,
            px: 2,
            minHeight: "100vh",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton
              onClick={() => navigate("/offers")}
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
              onClick={() => navigate("/offers")}
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
            onClick={handleBack}
            sx={{ mr: 2 }}
            aria-label="back to offer"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body1" color="text.secondary">
            Back to Offer
          </Typography>
        </Box>

        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
          Submit Proposal
        </Typography>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Offer Summary */}
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 2,
                mb: 4,
                overflow: "hidden",
                borderLeft: 5,
                borderColor: "primary.main",
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  {offer?.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Tender #: {offer?.tenderNumber}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 2 }}
                  >
                    Submission Deadline:
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    color="error.main"
                  >
                    {formatDate(offer?.proposalSubmissionEnd || "")}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 2 }}
                  >
                    Budget:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatPrice(offer?.budget || 0)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Proposal Form - Single Scrollable View */}
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 2,
                overflow: "hidden",
              }}
            >
              {/* Proposal Details Section */}
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Proposal Details
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Provide a detailed description of your proposal including
                    your approach, timeline, and how your solution meets the
                    requirements.
                  </Typography>
                </Alert>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Details*
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ReactQuill
                      theme="snow"
                      value={detailsContent}
                      onChange={setDetailsContent}
                      style={{ height: 250 }}
                    />
                  </Box>
                  {formErrors.details && (
                    <Typography variant="caption" color="error">
                      Please provide proposal details
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Documents Section */}
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <InsertDriveFileIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Required Documents
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 4 }}>
                  <Typography variant="body2">
                    You must upload all three required document types for your
                    proposal to be considered complete.
                  </Typography>
                </Alert>

                {/* Administrative Document Upload */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Administrative Documents*
                    </Typography>
                    <Tooltip title="Documents related to your company credentials, registrations, certificates, etc.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FileUpload
                    files={adminFiles}
                    onFileUpload={handleAdminFileUpload}
                    onFileRemove={handleAdminFileRemove}
                  />
                  {formErrors.admin && (
                    <Typography variant="caption" color="error">
                      Please upload administrative documents
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Technical Document Upload */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Technical Documents*
                    </Typography>
                    <Tooltip title="Documents detailing your technical solution, specifications, methodologies, etc.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FileUpload
                    files={technicalFiles}
                    onFileUpload={handleTechnicalFileUpload}
                    onFileRemove={handleTechnicalFileRemove}
                  />
                  {formErrors.technical && (
                    <Typography variant="caption" color="error">
                      Please upload technical documents
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Financial Document Upload */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Financial Documents*
                    </Typography>
                    <Tooltip title="Documents including pricing details, cost breakdowns, budget plans, etc.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FileUpload
                    files={financialFiles}
                    onFileUpload={handleFinancialFileUpload}
                    onFileRemove={handleFinancialFileRemove}
                  />
                  {formErrors.financial && (
                    <Typography variant="caption" color="error">
                      Please upload financial documents
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleBack}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : undefined
                    }
                  >
                    {isSubmitting ? "Submitting..." : "Submit Proposal"}
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
      <Footer />
    </>
  );
};

export default ProposalCreationPage;
