import React from "react";
import { Alert, AlertTitle, Box, CircularProgress, Slide } from "@mui/material";
import {
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { useFeedback } from "../../FeedbackAlertContext";

// Define the possible status types
export type FeedbackStatus = "success" | "error" | "info" | "pending" | boolean;

const FeedbackAlert: React.FC = () => {
  const { feedback, status, alertIsOn } = useFeedback();

  // Handle legacy boolean values for backward compatibility
  const resolveStatus = (): "success" | "error" | "info" | "pending" => {
    if (status === true) return "success";
    if (status === false) return "error";
    return status as "success" | "error" | "info" | "pending";
  };

  const currentStatus = resolveStatus();

  // Map status to icon component
  const getStatusIcon = () => {
    switch (currentStatus) {
      case "success":
        return <SuccessIcon />;
      case "error":
        return <ErrorIcon />;
      case "info":
        return <InfoIcon />;
      case "pending":
        return <CircularProgress size={20} thickness={4} />;
      default:
        return null;
    }
  };

  // Map status to title
  const getStatusTitle = () => {
    switch (currentStatus) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "info":
        return "Information";
      case "pending":
        return "In Progress";
      default:
        return "";
    }
  };

  return (
    <Slide in={alertIsOn} direction="down" mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          width: "400px",
          top: "15%",
          left: "50%",
          marginTop: "-100px",
          marginLeft: "-200px",
          zIndex: 99999,
        }}
      >
        <Alert
          severity={currentStatus === "pending" ? "info" : currentStatus}
          icon={getStatusIcon()}
        >
          <AlertTitle>{getStatusTitle()}</AlertTitle>
          {feedback}
        </Alert>
      </Box>
    </Slide>
  );
};

export default FeedbackAlert;
