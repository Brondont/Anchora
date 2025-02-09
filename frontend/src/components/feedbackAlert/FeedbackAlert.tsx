import React from "react";
import { useFeedback } from "../../FeedbackAlertContext";
import { Alert, AlertTitle, Box, Slide } from "@mui/material";

const FeedbackAlert: React.FC = () => {
  const { feedback, success, alertIsOn } = useFeedback();

  return (
    <Slide in={alertIsOn} direction="down" mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          width: "400px",
          height: "200px",
          top: "15%",
          left: "50%",
          marginTop: "-100px", // Negative half of height.
          marginLeft: "-200px",
          zIndex: 99999,
        }}
      >
        <Alert severity={success ? "success" : "error"}>
          <AlertTitle>{success ? "Success" : "Error "}</AlertTitle>
          {feedback}
        </Alert>
      </Box>
    </Slide>
  );
};

export default FeedbackAlert;
