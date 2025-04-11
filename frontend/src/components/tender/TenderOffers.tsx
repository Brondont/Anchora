import React, { ChangeEvent, useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
  keyframes,
  Divider,
  Skeleton,
  Chip,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useSearchParams } from "react-router-dom";
import { useFeedback } from "../../FeedbackAlertContext";
import { isLength, isRequired, ValidatorFunction } from "../../util/validators";

interface Sector {
  ID: number;
  Code: string;
  Description: string;
}

interface Document {
  ID: number;
  Name: string;
  URL: string;
  DocumentableID: number;
  DocumentableType: string;
}

interface OfferProps {
  ID: number;
  title: string;
  description: string;
  createdBy: number;
  documents: Document[];
  budget: number;
  currency: string;
  category: string;
  sectors: Sector[];
  qualificationRequired: string;
  location: string;
  proposalSubmissionStart: string;
  proposalSubmissionEnd: string;
  bidDeadline: string;
  offerValidityEnd: string;
  status: string;
  winningBidID: number;
}

export type OfferFormProps = {
  [key: string]: {
    value: string | number | Date | number[] | string[];
    validators?: ValidatorFunction[];
    error: string;
  };
};

interface ServerFormError {
  path: string;
  msg: string;
}

const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

const currencyOptions = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "DZD", label: "Algerian Dinar (DA)" },
];

const categoryOptions = [
  "Construction",
  "IT Services",
  "Consulting",
  "Equipment Supply",
  "Maintenance",
  "Research",
  "Healthcare",
  "Education",
  "Energy",
  "Transportation",
];

const TenderOffers: React.FC = () => {
  const [offer, setOffer] = useState<OfferProps>({
    ID: 0,
    title: "",
    description: "",
    createdBy: 0,
    documents: [],
    budget: 0,
    currency: "",
    category: "",
    sectors: [],
    qualificationRequired: "",
    location: "",
    proposalSubmissionStart: "",
    proposalSubmissionEnd: "",
    bidDeadline: "",
    offerValidityEnd: "",
    status: "open",
    winningBidID: 0,
  });

  const [editedOfferForm, setEditedOfferForm] = useState<OfferFormProps>({
    title: {
      value: "",
      error: "",
      validators: [isRequired, isLength({ min: 5, max: 200 })],
    },
    description: {
      value: "",
      error: "",
      validators: [isRequired, isLength({ min: 10, max: 2000 })],
    },
    budget: { value: 0, error: "", validators: [isRequired] },
    currency: { value: "", error: "", validators: [isRequired] },
    category: { value: "", error: "", validators: [isRequired] },
    sectorIDs: { value: [], error: "", validators: [isRequired] },
    qualificationRequired: { value: "", error: "", validators: [isRequired] },
    location: { value: "", error: "", validators: [isRequired] },
    proposalSubmissionStart: {
      value: new Date(),
      error: "",
      validators: [isRequired],
    },
    proposalSubmissionEnd: {
      value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      error: "",
      validators: [isRequired],
    },
    bidDeadline: {
      value: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      error: "",
      validators: [isRequired],
    },
    offerValidityEnd: {
      value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      error: "",
      validators: [isRequired],
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paramOfferID, setParamOfferID] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isShake, setIsShake] = useState<boolean>(false);
  const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const { showFeedback } = useFeedback();

  const fetchSectors = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/sectors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.error) throw data.error;
      setAvailableSectors(data.sectors);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to fetch sectors", false);
    }
  }, [apiUrl, token, showFeedback]);

  const fetchOffer = useCallback(
    async (offerID: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/offer/${offerID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resData = await res.json();

        if (resData.error) throw resData.error;

        setOffer(resData.offer);
        updateEditOffer(resData.offer);
      } catch (err: any) {
        showFeedback(err.msg || "Failed to get offer, reload the page.", false);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, token, showFeedback]
  );

  useEffect(() => {
    fetchSectors();
    // get param from url
    const offerID = searchParams.get("offerID");
    if (!offerID) return;
    setParamOfferID(offerID);

    fetchOffer(offerID);
  }, [fetchSectors, fetchOffer, searchParams]);

  const inputChangeHandler = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setEditedOfferForm((prevState: OfferFormProps) => {
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

  const handleNumberInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    const numValue = parseFloat(value);

    setEditedOfferForm((prevState: OfferFormProps) => {
      const fieldConfig = prevState[name];
      // run all validators and collect error messages
      if (fieldConfig.validators) {
        for (const validator of fieldConfig.validators) {
          const result = validator(numValue);
          if (!result.isValid) {
            return {
              ...prevState,
              [name]: {
                ...prevState[name],
                value: numValue,
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
          value: numValue,
          error: "",
        },
      };
    });
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (!date) return;

    setEditedOfferForm((prevState: OfferFormProps) => {
      const fieldConfig = prevState[name];
      // run all validators and collect error messages
      if (fieldConfig.validators) {
        for (const validator of fieldConfig.validators) {
          const result = validator(date);
          if (!result.isValid) {
            return {
              ...prevState,
              [name]: {
                ...prevState[name],
                value: date,
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
          value: date,
          error: "",
        },
      };
    });
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;

    setEditedOfferForm((prevState: OfferFormProps) => {
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

  const handleSectorsChange = (event: SelectChangeEvent<number[]>) => {
    const selectedSectorIDs = event.target.value as number[];

    setEditedOfferForm((prev) => {
      // Check if sectors are selected
      let error = "";
      if (prev.sectorIDs.validators) {
        for (const validator of prev.sectorIDs.validators) {
          const result = validator(selectedSectorIDs);
          if (!result.isValid) {
            error = result.errorMessage;
            break;
          }
        }
      }

      return {
        ...prev,
        sectorIDs: {
          ...prev.sectorIDs,
          value: selectedSectorIDs,
          error: error,
        },
      };
    });
  };

  const shakeFields = useCallback(() => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  }, []);

  const handleCancel = () => {
    if (!paramOfferID) {
      // Clear form for new offer
      setEditedOfferForm({
        title: {
          value: "",
          error: "",
          validators: [isRequired, isLength({ min: 5, max: 200 })],
        },
        description: {
          value: "",
          error: "",
          validators: [isRequired, isLength({ min: 10, max: 2000 })],
        },
        budget: {
          value: 0,
          error: "",
          validators: [isRequired],
        },
        currency: { value: "", error: "", validators: [isRequired] },
        category: { value: "", error: "", validators: [isRequired] },
        sectorIDs: { value: [], error: "", validators: [isRequired] },
        qualificationRequired: {
          value: "",
          error: "",
          validators: [isRequired],
        },
        location: { value: "", error: "", validators: [isRequired] },
        proposalSubmissionStart: {
          value: new Date(),
          error: "",
          validators: [isRequired],
        },
        proposalSubmissionEnd: {
          value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          error: "",
          validators: [isRequired],
        },
        bidDeadline: {
          value: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          error: "",
          validators: [isRequired],
        },
        offerValidityEnd: {
          value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          error: "",
          validators: [isRequired],
        },
      });
    } else {
      // Reset to saved offer
      updateEditOffer(offer);
    }
  };

  const updateEditOffer = (offer: OfferProps) => {
    // Extract sector IDs
    const sectorIDs = offer.sectors
      ? offer.sectors.map((sector) => sector.ID)
      : [];

    const proposalSubmissionStart = offer.proposalSubmissionStart
      ? new Date(offer.proposalSubmissionStart)
      : new Date();
    const proposalSubmissionEnd = offer.proposalSubmissionEnd
      ? new Date(offer.proposalSubmissionEnd)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const bidDeadline = offer.bidDeadline
      ? new Date(offer.bidDeadline)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const offerValidityEnd = offer.offerValidityEnd
      ? new Date(offer.offerValidityEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    setEditedOfferForm({
      title: {
        value: offer.title,
        error: "",
        validators: [isRequired, isLength({ min: 5, max: 200 })],
      },
      description: {
        value: offer.description,
        error: "",
        validators: [isRequired, isLength({ min: 10, max: 2000 })],
      },
      budget: {
        value: offer.budget,
        error: "",
        validators: [isRequired],
      },
      currency: {
        value: offer.currency,
        error: "",
        validators: [isRequired],
      },
      category: {
        value: offer.category,
        error: "",
        validators: [isRequired],
      },
      sectorIDs: {
        value: sectorIDs,
        error: "",
        validators: [isRequired],
      },
      qualificationRequired: {
        value: offer.qualificationRequired,
        error: "",
        validators: [isRequired],
      },
      location: {
        value: offer.location,
        error: "",
        validators: [isRequired],
      },
      proposalSubmissionStart: {
        value: proposalSubmissionStart,
        error: "",
        validators: [isRequired],
      },
      proposalSubmissionEnd: {
        value: proposalSubmissionEnd,
        error: "",
        validators: [isRequired],
      },
      bidDeadline: {
        value: bidDeadline,
        error: "",
        validators: [isRequired],
      },
      offerValidityEnd: {
        value: offerValidityEnd,
        error: "",
        validators: [isRequired],
      },
    });
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const updatedForm = { ...editedOfferForm };

    // Check each field and update errors
    Object.entries(updatedForm).forEach(([fieldName, fieldConfig]) => {
      // Skip if no validators
      if (!fieldConfig.validators) return;

      // Check for empty required fields
      for (const validator of fieldConfig.validators) {
        const result = validator(fieldConfig.value);
        if (!result.isValid) {
          updatedForm[fieldName] = {
            ...fieldConfig,
            error: result.errorMessage,
          };
          isValid = false;
          break;
        }
      }
    });

    // Specific validation for sectors (check if any sector is selected)
    const selectedSectorIDs = updatedForm.sectorIDs.value as number[];
    if (selectedSectorIDs.length === 0) {
      updatedForm.sectorIDs = {
        ...updatedForm.sectorIDs,
        error: "At least one sector is required",
      };
      isValid = false;
    }

    // Date validations
    const startDate = updatedForm.proposalSubmissionStart.value as Date;
    const endDate = updatedForm.proposalSubmissionEnd.value as Date;
    const bidDeadline = updatedForm.bidDeadline.value as Date;
    const validityEndDate = updatedForm.offerValidityEnd.value as Date;

    if (endDate <= startDate) {
      updatedForm.proposalSubmissionEnd = {
        ...updatedForm.proposalSubmissionEnd,
        error: "End date must be after start date",
      };
      isValid = false;
    }

    if (bidDeadline <= endDate) {
      updatedForm.bidDeadline = {
        ...updatedForm.bidDeadline,
        error: "Bid deadline must be after submission end date",
      };
      isValid = false;
    }

    if (validityEndDate <= bidDeadline) {
      updatedForm.offerValidityEnd = {
        ...updatedForm.offerValidityEnd,
        error: "Validity end date must be after bid deadline",
      };
      isValid = false;
    }

    // Shake fields if validation failed
    if (!isValid) {
      setEditedOfferForm(updatedForm);
      shakeFields();
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!editedOfferForm) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const url = paramOfferID
        ? `${apiUrl}/offer/${paramOfferID}`
        : `${apiUrl}/offer`;

      const method = paramOfferID ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedOfferForm.title.value,
          description: editedOfferForm.description.value,
          budget: editedOfferForm.budget.value,
          currency: editedOfferForm.currency.value,
          category: editedOfferForm.category.value,
          sectorIDs: editedOfferForm.sectorIDs.value,
          qualificationRequired: editedOfferForm.qualificationRequired.value,
          location: editedOfferForm.location.value,
          proposalSubmissionStart: (
            editedOfferForm.proposalSubmissionStart.value as Date
          ).toISOString(),
          proposalSubmissionEnd: (
            editedOfferForm.proposalSubmissionEnd.value as Date
          ).toISOString(),
          bidDeadline: (
            editedOfferForm.bidDeadline.value as Date
          ).toISOString(),
          offerValidityEnd: (
            editedOfferForm.offerValidityEnd.value as Date
          ).toISOString(),
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        if ([422, 409, 404, 401].includes(res.status)) {
          const updatedForm: OfferFormProps = { ...editedOfferForm };
          resData.error.forEach((err: ServerFormError) => {
            if (updatedForm[err.path]) {
              updatedForm[err.path].error = err.msg;
            }
          });
          setEditedOfferForm(updatedForm);
          shakeFields();
          return;
        }
        throw new Error(resData.error || "An error occurred");
      }

      if (resData.error) throw resData.error;

      showFeedback(
        `Offer ${paramOfferID ? "updated" : "created"} successfully`,
        true
      );

      if (!paramOfferID) {
        // Clear form after successful creation
        handleCancel();
      }
    } catch (err: any) {
      showFeedback(
        err.msg || `Failed to ${paramOfferID ? "update" : "create"} offer`,
        false
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", padding: 3 }}>
        <Card sx={{ width: "100%", overflow: "hidden" }}>
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
              <Box
                sx={{ mt: 4, display: "flex", gap: 8, flexDirection: "column" }}
              >
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={100} />
                <Box sx={{ display: "flex", gap: 4 }}>
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ flex: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={56} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", padding: 3 }}>
      <Card sx={{ width: "100%", overflow: "hidden" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "column",
              mb: 4,
            }}
          >
            {paramOfferID ? (
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Edit Tender Offer
                </Typography>
                <Button
                  onClick={() => {
                    setSearchParams("");
                    setParamOfferID("");
                    handleCancel();
                  }}
                  variant="contained"
                >
                  Create New Offer
                </Button>
              </Box>
            ) : (
              <Typography variant="h5" fontWeight="bold">
                Create New Tender Offer
              </Typography>
            )}

            {/* Basic Information Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: "flex", gap: 3, flexDirection: "column" }}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={editedOfferForm?.title.value || ""}
                  onChange={inputChangeHandler}
                  error={editedOfferForm.title.error !== ""}
                  helperText={editedOfferForm.title.error}
                  sx={{
                    ...(isShake && editedOfferForm.title.error !== ""
                      ? { animation: `${shakeAnimation} 0.35s` }
                      : {}),
                  }}
                  required
                />

                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={editedOfferForm?.description.value || ""}
                  onChange={inputChangeHandler}
                  error={editedOfferForm.description.error !== ""}
                  helperText={editedOfferForm.description.error}
                  multiline
                  rows={4}
                  sx={{
                    ...(isShake && editedOfferForm.description.error !== ""
                      ? { animation: `${shakeAnimation} 0.35s` }
                      : {}),
                  }}
                  required
                />

                <Box sx={{ display: "flex", gap: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Budget"
                    name="budget"
                    value={editedOfferForm?.budget.value || ""}
                    onChange={handleNumberInputChange}
                    error={editedOfferForm.budget.error !== ""}
                    helperText={editedOfferForm.budget.error}
                    sx={{
                      ...(isShake && editedOfferForm.budget.error !== ""
                        ? { animation: `${shakeAnimation} 0.35s` }
                        : {}),
                    }}
                    required
                  />

                  <FormControl
                    fullWidth
                    error={editedOfferForm.currency.error !== ""}
                    sx={{
                      ...(isShake && editedOfferForm.currency.error !== ""
                        ? { animation: `${shakeAnimation} 0.35s` }
                        : {}),
                    }}
                  >
                    <InputLabel id="currency-label">Currency</InputLabel>
                    <Select
                      labelId="currency-label"
                      name="currency"
                      value={editedOfferForm?.currency.value as string}
                      onChange={handleSelectChange}
                      input={<OutlinedInput label="Currency" />}
                      required
                    >
                      {currencyOptions.map((option) => (
                        <MenuItem key={option.code} value={option.code}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {editedOfferForm.currency.error && (
                      <Typography
                        color="error"
                        variant="caption"
                        sx={{ ml: 2, mt: 0.5 }}
                      >
                        {editedOfferForm.currency.error}
                      </Typography>
                    )}
                  </FormControl>
                </Box>

                <Box sx={{ display: "flex", gap: 3 }}>
                  <FormControl
                    fullWidth
                    error={editedOfferForm.category.error !== ""}
                    sx={{
                      ...(isShake && editedOfferForm.category.error !== ""
                        ? { animation: `${shakeAnimation} 0.35s` }
                        : {}),
                    }}
                  >
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={editedOfferForm?.category.value as string}
                      onChange={handleSelectChange}
                      input={<OutlinedInput label="Category" />}
                      required
                    >
                      {categoryOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    {editedOfferForm.category.error && (
                      <Typography
                        color="error"
                        variant="caption"
                        sx={{ ml: 2, mt: 0.5 }}
                      >
                        {editedOfferForm.category.error}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={editedOfferForm.sectorIDs.error !== ""}
                    sx={{
                      ...(isShake && editedOfferForm.sectorIDs.error !== ""
                        ? { animation: `${shakeAnimation} 0.35s` }
                        : {}),
                    }}
                  >
                    <InputLabel id="sectors-label">Sectors</InputLabel>
                    <Select
                      labelId="sectors-label"
                      multiple
                      value={editedOfferForm.sectorIDs.value as number[]}
                      onChange={handleSectorsChange}
                      input={<OutlinedInput label="Sectors" />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {(selected as number[]).map((value) => {
                            const sector = availableSectors.find(
                              (s) => s.ID === value
                            );
                            return (
                              <Chip
                                key={value}
                                label={sector ? sector.Code : value}
                              />
                            );
                          })}
                        </Box>
                      )}
                      required
                    >
                      {availableSectors.map((sector) => (
                        <MenuItem key={sector.ID} value={sector.ID}>
                          <Box>
                            <Typography variant="body1">
                              {sector.Code}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {sector.Description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {editedOfferForm.sectorIDs.error && (
                      <Typography
                        color="error"
                        variant="caption"
                        sx={{ ml: 2, mt: 0.5 }}
                      >
                        {editedOfferForm.sectorIDs.error}
                      </Typography>
                    )}
                  </FormControl>
                </Box>

                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={editedOfferForm?.location.value || ""}
                  onChange={inputChangeHandler}
                  error={editedOfferForm.location.error !== ""}
                  helperText={editedOfferForm.location.error}
                  sx={{
                    ...(isShake && editedOfferForm.location.error !== ""
                      ? { animation: `${shakeAnimation} 0.35s` }
                      : {}),
                  }}
                  required
                />

                <TextField
                  fullWidth
                  label="Qualification Requirements"
                  name="qualificationRequired"
                  value={editedOfferForm?.qualificationRequired.value || ""}
                  onChange={inputChangeHandler}
                  error={editedOfferForm.qualificationRequired.error !== ""}
                  helperText={editedOfferForm.qualificationRequired.error}
                  multiline
                  rows={3}
                  sx={{
                    ...(isShake &&
                    editedOfferForm.qualificationRequired.error !== ""
                      ? { animation: `${shakeAnimation} 0.35s` }
                      : {}),
                  }}
                  required
                />
              </Box>
            </Box>

            {/* Timeline Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Timeline
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: "flex", gap: 3, flexDirection: "column" }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ display: "flex", gap: 3 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Box sx={{ display: "flex", gap: 3 }}>
                        <DateTimePicker
                          label="Proposal Submission Start"
                          value={
                            editedOfferForm?.proposalSubmissionStart
                              .value instanceof Date
                              ? editedOfferForm.proposalSubmissionStart.value
                              : null
                          }
                          onChange={(date) =>
                            handleDateChange("proposalSubmissionStart", date)
                          }
                          sx={{
                            width: "100%",
                            ...(isShake &&
                            editedOfferForm.proposalSubmissionStart.error !== ""
                              ? { animation: `${shakeAnimation} 0.35s` }
                              : {}),
                          }}
                          slotProps={{
                            textField: {
                              error:
                                editedOfferForm.proposalSubmissionStart
                                  .error !== "",
                              helperText:
                                editedOfferForm.proposalSubmissionStart.error,
                              required: true,
                            },
                          }}
                        />
                        <DateTimePicker
                          label="Proposal Submission End"
                          value={
                            editedOfferForm?.proposalSubmissionEnd
                              .value instanceof Date
                              ? editedOfferForm.proposalSubmissionEnd.value
                              : null
                          }
                          onChange={(date) =>
                            handleDateChange("proposalSubmissionEnd", date)
                          }
                          sx={{
                            width: "100%",
                            ...(isShake &&
                            editedOfferForm.proposalSubmissionEnd.error !== ""
                              ? { animation: `${shakeAnimation} 0.35s` }
                              : {}),
                          }}
                          slotProps={{
                            textField: {
                              error:
                                editedOfferForm.proposalSubmissionEnd.error !==
                                "",
                              helperText:
                                editedOfferForm.proposalSubmissionEnd.error,
                              required: true,
                            },
                          }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 3 }}>
                        <DateTimePicker
                          label="Bid Deadline"
                          value={
                            editedOfferForm?.bidDeadline.value instanceof Date
                              ? editedOfferForm.bidDeadline.value
                              : null
                          }
                          onChange={(date) =>
                            handleDateChange("bidDeadline", date)
                          }
                          sx={{
                            width: "100%",
                            ...(isShake &&
                            editedOfferForm.bidDeadline.error !== ""
                              ? { animation: `${shakeAnimation} 0.35s` }
                              : {}),
                          }}
                          slotProps={{
                            textField: {
                              error: editedOfferForm.bidDeadline.error !== "",
                              helperText: editedOfferForm.bidDeadline.error,
                              required: true,
                            },
                          }}
                        />
                        <DateTimePicker
                          label="Offer Validity End"
                          value={
                            editedOfferForm?.offerValidityEnd.value instanceof
                            Date
                              ? editedOfferForm.offerValidityEnd.value
                              : null
                          }
                          onChange={(date) =>
                            handleDateChange("offerValidityEnd", date)
                          }
                          sx={{
                            width: "100%",
                            ...(isShake &&
                            editedOfferForm.offerValidityEnd.error !== ""
                              ? { animation: `${shakeAnimation} 0.35s` }
                              : {}),
                          }}
                          slotProps={{
                            textField: {
                              error:
                                editedOfferForm.offerValidityEnd.error !== "",
                              helperText:
                                editedOfferForm.offerValidityEnd.error,
                              required: true,
                            },
                          }}
                        />
                      </Box>
                    </LocalizationProvider>
                  </Box>
                </LocalizationProvider>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {paramOfferID ? "Cancel" : "Clear"}
              </Button>
              <LoadingButton
                variant="contained"
                color="primary"
                loading={isSubmitting}
                onClick={handleSubmit}
              >
                {paramOfferID ? "Update Offer" : "Create Offer"}
              </LoadingButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TenderOffers;
