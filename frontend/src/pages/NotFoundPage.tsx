import React from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
        px: 2,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: "6rem", sm: "10rem" },
          fontWeight: 700,
          color: theme.palette.primary.main,
          mb: 2,
        }}
      >
        404
      </Typography>

      <Typography
        variant="h4"
        sx={{
          mb: 2,
          fontWeight: 600,
        }}
      >
        Page Not Found
      </Typography>

      <Typography
        variant="body1"
        sx={{
          mb: 4,
          maxWidth: "600px",
          color: "text.secondary",
        }}
      >
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/")}
        >
          Go to Homepage
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
