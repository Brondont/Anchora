import React, { useState, ChangeEvent } from "react";
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
  InputAdornment,
  SelectChangeEvent,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

interface ContractFormData {
  title: string;
  description: string;
  budget: string;
  currency: string;
  category: string;
  location: string;
  bidDeadline: Dayjs | null;
  contractStart: Dayjs | null;
  contractEnd: Dayjs | null;
  status: "open" | "closed" | "awarded" | "completed";
}

const ContractCreation: React.FC = () => {
  const [contract, setContract] = useState<ContractFormData>({
    title: "",
    description: "",
    budget: "",
    currency: "USD",
    category: "",
    location: "",
    bidDeadline: null,
    contractStart: null,
    contractEnd: null,
    status: "open",
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContract((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setContract((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (
    field: keyof Pick<
      ContractFormData,
      "bidDeadline" | "contractStart" | "contractEnd"
    >,
    newValue: Dayjs | null
  ) => {
    setContract((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const handleSubmit = (): void => {
    // Here you would typically handle the contract creation
    // Convert Dayjs objects to ISO strings for API submission
    const submissionData = {
      ...contract,
      bidDeadline: contract.bidDeadline?.toISOString(),
      contractStart: contract.contractStart?.toISOString(),
      contractEnd: contract.contractEnd?.toISOString(),
    };
    console.log("Contract to be created:", submissionData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", minHeight: "100vh", padding: 3 }}>
        <Card sx={{ width: "100%", overflow: "hidden" }}>
          <CardContent>
            {/* Basic Details */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
                Contract Details
              </Typography>
              <Box sx={{ display: "flex", gap: 4, flexDirection: "column" }}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={contract.title}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={contract.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  required
                />
                <Box sx={{ display: "flex", gap: 4 }}>
                  <TextField
                    fullWidth
                    label="Budget"
                    name="budget"
                    type="number"
                    value={contract.budget}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      name="currency"
                      value={contract.currency}
                      label="Currency"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", gap: 4 }}>
                  <TextField
                    fullWidth
                    label="Category"
                    name="category"
                    value={contract.category}
                    onChange={handleInputChange}
                  />
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={contract.location}
                    onChange={handleInputChange}
                  />
                </Box>
              </Box>
            </Box>

            {/* Timeline Details */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
                Timeline
              </Typography>
              <Box sx={{ display: "flex", gap: 4, flexDirection: "column" }}>
                <DateTimePicker
                  label="Bid Deadline"
                  value={contract.bidDeadline}
                  onChange={(newValue) =>
                    handleDateChange("bidDeadline", newValue)
                  }
                  slotProps={{
                    textField: { fullWidth: true },
                  }}
                />
                <Box sx={{ display: "flex", gap: 4 }}>
                  <DateTimePicker
                    label="Contract Start Date"
                    value={contract.contractStart}
                    onChange={(newValue) =>
                      handleDateChange("contractStart", newValue)
                    }
                    slotProps={{
                      textField: { fullWidth: true },
                    }}
                  />
                  <DateTimePicker
                    label="Contract End Date"
                    value={contract.contractEnd}
                    onChange={(newValue) =>
                      handleDateChange("contractEnd", newValue)
                    }
                    slotProps={{
                      textField: { fullWidth: true },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSubmit}
              >
                Create Contract
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ContractCreation;
