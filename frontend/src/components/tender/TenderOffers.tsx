import React, { ChangeEvent, useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import dayjs, { Dayjs } from "dayjs";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FileUpload from "../fileUpload/FileUpload";
import { isRequired, ValidatorFunction } from "../../util/validators";
import { useFeedback } from "../../FeedbackAlertContext";
import { useOfferFactory } from "../../hooks/useOfferFactory";
import { useEthers } from "@usedapp/core";

type OfferFormProps = {
  [key: string]: {
    value: string | number | undefined;
    validators?: ValidatorFunction[];
    error: string;
  };
};

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

type SectorOption = {
  code: string;
  description: string;
};

const localizer = dayjsLocalizer(dayjs);

const currencyOptions = [{ code: "DZD", label: "Algerian Dinar (DA)" }];

const eventStyleGetter = (_: CalendarEvent) => ({
  style: {
    backgroundColor: "#3174ad",
    borderRadius: "5px",
    opacity: 0.9,
    color: "white",
    border: "1px solid #2a5985",
    display: "block",
    padding: "4px 8px",
    fontWeight: 500,
  },
});

const isAfterDate = (
  date: Dayjs | null,
  compareDate: Dayjs | null
): boolean => {
  if (!date || !compareDate) return false;
  return date.isAfter(compareDate);
};

const TenderOffers: React.FC = () => {
  const [offerForm, setOfferForm] = useState<OfferFormProps>({
    title: { value: "", error: "", validators: [isRequired] },
    description: { value: "", error: "", validators: [isRequired] },
    budget: { value: 0, error: "", validators: [isRequired] },
    currency: { value: "", error: "", validators: [isRequired] },
    category: { value: "", error: "", validators: [isRequired] },
    proposalSubmissionStart: { value: "", error: "", validators: [isRequired] },
    proposalSubmissionEnd: { value: "", error: "", validators: [isRequired] },
    proposalReviewStart: { value: "", error: "", validators: [isRequired] },
    proposalReviewEnd: { value: "", error: "", validators: [isRequired] },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectorOptions, setSectorOptions] = useState<SectorOption[]>([]);
  const [offerContractHash, setOfferContractHash] = useState<string>("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">(
    "week"
  );
  const [files, setFiles] = useState<File[]>([]);
  const { showFeedback } = useFeedback();

  const {
    factoryContract,
    createOffer,
    createOfferState,
    resetStates,
    hasRole,
    error,
  } = useOfferFactory();
  const { account } = useEthers();

  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchSectors = async () => {
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
  };

  useEffect(() => {
    if (error) {
      showFeedback(
        error.msg || "Contract interaction failed. Please try again.",
        "error"
      );
    }
  }, [error, showFeedback]);

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    const newEvents: CalendarEvent[] = [];
    const {
      proposalSubmissionStart,
      proposalSubmissionEnd,
      proposalReviewStart,
      proposalReviewEnd,
    } = offerForm;

    if (proposalSubmissionStart.value) {
      newEvents.push({
        id: 1,
        title: "Offer Publication Phase",
        start: new Date(),
        end: new Date(proposalSubmissionStart.value as string),
      });
    }

    if (proposalSubmissionStart.value && proposalSubmissionEnd.value) {
      newEvents.push({
        id: 2,
        title: "Proposal Submission Phase",
        start: new Date(proposalSubmissionStart.value as string),
        end: new Date(proposalSubmissionEnd.value as string),
      });
    }

    if (proposalSubmissionEnd.value && proposalReviewStart.value) {
      newEvents.push({
        id: 3,
        title: "Evaluation Phase",
        start: new Date(proposalReviewStart.value as string),
        end: new Date(proposalReviewEnd.value as string),
      });
    }

    setEvents(newEvents);
  }, [
    offerForm.proposalSubmissionStart.value,
    offerForm.proposalSubmissionEnd.value,
    offerForm.proposalReviewEnd.value,
    offerForm.proposalReviewStart.value,
  ]);

  const inputChangeHandler = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    validateField(name, value);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    validateField(name, value);
  };

  const validateField = (name: string, value: any) => {
    setOfferForm((prev) => {
      const field = prev[name];
      if (field.validators) {
        for (const validator of field.validators) {
          const result = validator(value);
          if (!result.isValid) {
            return {
              ...prev,
              [name]: { ...field, value, error: result.errorMessage },
            };
          }
        }
      }
      return { ...prev, [name]: { ...field, value, error: "" } };
    });
  };

  const validateDate = (name: string, date: Dayjs | null): string => {
    if (!date) return "Date is required";

    if (!date.isAfter(dayjs())) {
      return "Date must be after current date";
    }

    switch (name) {
      case "proposalSubmissionStart":
        if (!isAfterDate(date, dayjs(new Date()))) {
          return "Submission start must be after the current date";
        }
        return "";

      case "proposalSubmissionEnd":
        const proposalStartDate = offerForm.proposalSubmissionStart.value
          ? dayjs(offerForm.proposalSubmissionStart.value)
          : null;

        if (proposalStartDate && !isAfterDate(date, proposalStartDate)) {
          return "Submission end must be after submission start";
        }
        return "";

      case "proposalReviewEnd":
        const proposalEndDate = offerForm.proposalSubmissionEnd.value
          ? dayjs(offerForm.proposalSubmissionEnd.value)
          : null;

        if (proposalEndDate && !isAfterDate(date, proposalEndDate)) {
          return "Reviews end must be after Reviews start";
        }
        return "";

      case "proposalReviewStart":
        const proposalSubmissionEnd = offerForm.proposalSubmissionEnd.value
          ? dayjs(offerForm.proposalSubmissionEnd.value)
          : null;

        if (
          proposalSubmissionEnd &&
          !isAfterDate(date, proposalSubmissionEnd)
        ) {
          return "Reviews start must be after proposals end";
        }
        return "";

      default:
        return "";
    }
  };

  const handleDateChange = (name: string, date: Dayjs | null) => {
    if (!date) return;

    const error = validateDate(name, date);

    setOfferForm((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        value: date.toISOString(),
        error: error,
      },
    }));
  };

  const validateAllDates = (): boolean => {
    let isValid = true;
    const dateFields = [
      "proposalSubmissionStart",
      "proposalSubmissionEnd",
      "proposalReviewEnd",
      "proposalReviewStart",
    ];

    const updatedForm = { ...offerForm };

    dateFields.forEach((field) => {
      if (updatedForm[field].value) {
        const date = dayjs(updatedForm[field].value as string);
        const error = validateDate(field, date);

        if (error) {
          updatedForm[field] = {
            ...updatedForm[field],
            error,
          };
          isValid = false;
        }
      } else {
        updatedForm[field] = {
          ...updatedForm[field],
          error: "Date is required",
        };
        isValid = false;
      }
    });

    setOfferForm(updatedForm);
    return isValid;
  };

  const handleFileUpload = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const vlaidateOfferForm = () => {
    let isValid = true;
    const updated = { ...offerForm };

    const textFields: Array<keyof OfferFormProps> = [
      "title",
      "description",
      "budget",
      "currency",
      "category",
    ];
    textFields.forEach((name) => {
      const field = updated[name];
      // run custom validators (e.g. isRequired)
      if (field.validators) {
        for (const validator of field.validators) {
          const { isValid: ok, errorMessage } = validator(field.value);
          if (!ok) {
            updated[name] = { ...field, error: errorMessage };
            isValid = false;
            return;
          }
        }
      }
      // catch any still‐empty values
      if (
        field.value === "" ||
        field.value === undefined ||
        field.value === null
      ) {
        updated[name] = { ...field, error: "This field is required" };
        isValid = false;
      }
    });
  };

  const handleSubmit = async () => {
    if (!validateAllDates()) {
      return; // Stop submission if validation fails
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

    const isTender = hasRole("TENDER", account);

    if (!isTender) {
      showFeedback("Tender permissions required for offer creation", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      showFeedback(
        "Intiating blockchain transaction to create the offer",
        "info"
      );

      const subStartIso = offerForm.proposalSubmissionStart.value as string;
      const subEndIso = offerForm.proposalSubmissionEnd.value as string;
      const revStartIso = offerForm.proposalReviewStart.value as string;
      const revEndIso = offerForm.proposalReviewEnd.value as string;

      // we must use unix times on the smart contracts
      const subStart = dayjs(subStartIso).unix();
      const subEnd = dayjs(subEndIso).unix();
      const revStart = dayjs(revStartIso).unix();
      const revEnd = dayjs(revEndIso).unix();

      await createOffer(subStart, subEnd, revStart, revEnd);

      showFeedback("Offer created on‑chain. Transaction sent!", "success");
    } catch (err: any) {
      showFeedback(
        err.msg || "something went wrong with creating the offer, try again",
        "error"
      );
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (createOfferState.status === "Mining") {
      showFeedback(`Waiting for the offer to be created`, "pending");
    } else if (createOfferState.status === "Success") {
      const tx = createOfferState.transaction;

      if (!tx) {
        showFeedback(
          "Offer creation failed during off-chain synchronization",
          "error"
        );
        setIsSubmitting(false);
        return;
      }

      // wait for transaction to happen
      tx.wait().then((receipt) => {
        // go through the logs and look for the created offers new address
        const iface = factoryContract!.interface;
        const event = receipt.logs
          .map((log) => {
            try {
              return iface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((parsed) => parsed?.name === "OfferCreated");

        if (!event) {
          showFeedback("Could not find OfferCreated event", "error");
          setIsSubmitting(false);
          return;
        }

        const newOfferAddress: string = event.args?.offerAddress;

        // build the form data
        const formData = new FormData();
        formData.append("contractAddress", newOfferAddress);
        formData.append("title", offerForm.title.value as string);
        formData.append("description", offerForm.description.value as string);
        formData.append("budget", String(offerForm.budget.value));
        formData.append("currency", offerForm.currency.value as string);
        formData.append("category", offerForm.category.value as string);
        formData.append(
          "proposalSubmissionStart",
          offerForm.proposalSubmissionStart.value as string
        );
        formData.append(
          "proposalSubmissionEnd",
          offerForm.proposalSubmissionEnd.value as string
        );
        formData.append(
          "proposalReviewStart",
          offerForm.proposalReviewStart.value as string
        );
        formData.append(
          "proposalReviewEnd",
          offerForm.proposalReviewEnd.value as string
        );
        files.forEach((file) => formData.append("documents", file, file.name));

        fetch(`${apiUrl}/tender/offer`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })
          .then(async (res) => {
            const resData = await res.json();

            if (resData.error) throw resData.error;

            showFeedback("Offer has been successfully created!", "success");
          })
          .catch((err: any) => {
            showFeedback(err.msg || "Failed to sync offer to server.", "error");
          })
          .finally(() => {
            setIsSubmitting(false);
            resetStates();
          });
      });
    }

    if (
      createOfferState.status === "Fail" ||
      createOfferState.status === "Exception"
    ) {
      showFeedback(
        createOfferState.errorMessage ||
          "Offer creation failed failed. Transaction was not completed.",
        "error"
      );
      setIsSubmitting(false);
      resetStates();
    }
  }, [createOfferState, token, apiUrl, showFeedback]);

  const handleCancel = () => {
    setOfferForm({
      title: { value: "", error: "", validators: [isRequired] },
      description: { value: "", error: "", validators: [isRequired] },
      budget: { value: 0, error: "", validators: [isRequired] },
      currency: { value: "", error: "", validators: [isRequired] },
      category: { value: "", error: "", validators: [isRequired] },
      proposalSubmissionStart: {
        value: "",
        error: "",
        validators: [isRequired],
      },
      proposalSubmissionEnd: { value: "", error: "", validators: [isRequired] },
      proposalReviewStart: { value: "", error: "", validators: [isRequired] },
      proposalReviewEnd: { value: "", error: "", validators: [isRequired] },
    });
    setFiles([]);
    setEvents([]);
  };

  const shouldDisableDate = (date: Dayjs) => {
    return date.isBefore(dayjs(), "day");
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Card elevation={3} sx={{ overflow: "visible", borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Typography color="primary" variant="h5" fontWeight="bold">
              Create New Tender Offer
            </Typography>
            <Tooltip title="Creating a tender offer will publish it to potential bidders once activated">
              <IconButton>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Basic Information
              </Typography>
              <Tooltip title="Enter the fundamental details of your tender offer">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={offerForm.title.value || ""}
                onChange={inputChangeHandler}
                error={!!offerForm.title.error}
                helperText={
                  offerForm.title.error ||
                  "Enter a clear, concise title for your tender offer"
                }
                required
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={offerForm.description.value || ""}
                onChange={inputChangeHandler}
                error={!!offerForm.description.error}
                helperText={
                  offerForm.description.error ||
                  "Provide detailed information about the tender requirements"
                }
                multiline
                rows={4}
                required
              />

              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <FormControl sx={{ flexGrow: 1, minWidth: "200px" }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Budget"
                    name="budget"
                    value={offerForm.budget.value || ""}
                    onChange={inputChangeHandler}
                    error={!!offerForm.budget.error}
                    helperText={
                      offerForm.budget.error ||
                      "Specify the budget allocated for this tender"
                    }
                    required
                  />
                </FormControl>

                <FormControl
                  sx={{ flexGrow: 1, minWidth: "200px" }}
                  error={!!offerForm.currency.error}
                  required
                >
                  <InputLabel>Currency</InputLabel>
                  <Select
                    name="currency"
                    value={offerForm.currency.value as string}
                    onChange={handleSelectChange}
                    input={<OutlinedInput label="Currency" />}
                  >
                    {currencyOptions.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  sx={{ flexGrow: 1, minWidth: "200px" }}
                  error={!!offerForm.category.error}
                  required
                >
                  <InputLabel>Sector</InputLabel>
                  <Select
                    name="category"
                    value={offerForm.category.value as string}
                    onChange={handleSelectChange}
                    input={<OutlinedInput label="Sector" />}
                  >
                    {sectorOptions.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {`${option.code}: ${option.description}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <FileUpload
                files={files}
                onFileUpload={handleFileUpload}
                onFileRemove={handleRemoveFile}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Timeline
              </Typography>
              <Tooltip title="Define the key dates for your tender process">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <EventNoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
                <Card
                  variant="outlined"
                  sx={{ p: 3, width: "100%", bgcolor: "background.default" }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    <DateTimePicker
                      label="Proposal Submission Start"
                      value={
                        offerForm.proposalSubmissionStart.value
                          ? dayjs(offerForm.proposalSubmissionStart.value)
                          : null
                      }
                      onChange={(date) =>
                        handleDateChange("proposalSubmissionStart", date)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!offerForm.proposalSubmissionStart.error,
                          helperText:
                            offerForm.proposalSubmissionStart.error || "",
                        },
                      }}
                      shouldDisableDate={shouldDisableDate}
                      sx={{ minWidth: 250, flexGrow: 1 }}
                    />
                    <DateTimePicker
                      label="Proposal Submission End"
                      value={
                        offerForm.proposalSubmissionEnd.value
                          ? dayjs(offerForm.proposalSubmissionEnd.value)
                          : null
                      }
                      onChange={(date) =>
                        handleDateChange("proposalSubmissionEnd", date)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!offerForm.proposalSubmissionEnd.error,
                          helperText:
                            offerForm.proposalSubmissionEnd.error || "",
                        },
                      }}
                      shouldDisableDate={shouldDisableDate}
                      sx={{ minWidth: 250, flexGrow: 1 }}
                    />
                    <DateTimePicker
                      label="Proposal Review Start"
                      value={
                        offerForm.proposalReviewStart.value
                          ? dayjs(offerForm.proposalReviewStart.value)
                          : null
                      }
                      onChange={(date) =>
                        handleDateChange("proposalReviewStart", date)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!offerForm.proposalReviewStart.error,
                          helperText: offerForm.proposalReviewStart.error || "",
                        },
                      }}
                      shouldDisableDate={shouldDisableDate}
                      sx={{ minWidth: 250, flexGrow: 1 }}
                    />

                    <DateTimePicker
                      label="Proposal Review End"
                      value={
                        offerForm.proposalReviewEnd.value
                          ? dayjs(offerForm.proposalReviewEnd.value)
                          : null
                      }
                      onChange={(date) =>
                        handleDateChange("proposalReviewEnd", date)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!offerForm.proposalReviewEnd.error,
                          helperText: offerForm.proposalReviewEnd.error || "",
                        },
                      }}
                      shouldDisableDate={shouldDisableDate}
                      sx={{ minWidth: 250, flexGrow: 1 }}
                    />
                  </Box>
                </Card>
              </Box>
            </LocalizationProvider>

            <Box sx={{ display: "flex", flexDirection: "column", mt: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight={500}>
                  Timeline Visualization
                </Typography>
              </Box>

              <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                {events.length > 0 ? (
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                    eventPropGetter={eventStyleGetter}
                    view={calendarView}
                    views={["month", "week", "day"]}
                    onView={(view) =>
                      setCalendarView(view as "month" | "week" | "day")
                    }
                  />
                ) : (
                  <Box
                    sx={{
                      height: 500,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "background.default",
                      borderRadius: 1,
                      gap: 2,
                    }}
                  >
                    <EventNoteIcon
                      sx={{
                        fontSize: 48,
                        color: "text.secondary",
                        opacity: 0.5,
                      }}
                    />
                    <Typography color="text.secondary" textAlign="center">
                      Select timeline dates above to visualize your tender offer
                      schedule
                    </Typography>
                  </Box>
                )}
              </Card>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 5,
              pt: 3,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancel}
              disabled={isSubmitting}
              startIcon={<DeleteOutlineIcon />}
            >
              Clear Form
            </Button>
            <LoadingButton
              variant="contained"
              color="primary"
              size="large"
              loading={isSubmitting}
              onClick={handleSubmit}
              sx={{ px: 4 }}
            >
              Create Tender Offer
            </LoadingButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TenderOffers;
