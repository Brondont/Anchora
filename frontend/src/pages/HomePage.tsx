import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Step,
  StepLabel,
  StepContent,
  Stepper,
} from "@mui/material";
import TransactionsFeed from "../components/transactionsFeed/TransactionFeed";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SpeedIcon from "@mui/icons-material/Speed";
import StorageIcon from "@mui/icons-material/Storage";
import SecurityIcon from "@mui/icons-material/Security";
import HandshakeIcon from "@mui/icons-material/Handshake";
import Footer from "../components/footer/Footer";

const HomePage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const achievements = [
    {
      label: "Eradicated Bribery",
      description:
        "Our blockchain system has eliminated opportunities for bribery by making all transactions transparent and immutable.",
    },
    {
      label: "Ensured Fair Competition",
      description:
        "Level playing field for all vendors with transparent bidding and evaluation processes.",
    },
    {
      label: "Reduced Processing Time",
      description:
        "Smart contracts have cut procurement processing times by 60%, accelerating public projects.",
    },
    {
      label: "Enhanced Public Trust",
      description:
        "Increased citizen confidence in government procurement through complete transparency.",
    },
    {
      label: "Lowered Operational Costs",
      description:
        "Automated verification and reduced need for intermediaries has decreased procurement costs by 35%.",
    },
  ];

  return (
    <Box sx={{ overflow: "hidden" }}>
      {/* Hero Section */}
      <Box
        ref={heroRef}
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: theme.palette.primary.dark,
          color: "white",
          overflow: "hidden",
          pt: 8,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Abstract background pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            zIndex: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage:
              "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
            backgroundSize: "100px 100px",
          }}
        />

        <Fade in={true} timeout={1000}>
          <Box sx={{ zIndex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: 2,
                fontWeight: 500,
                mb: 1,
                display: "block",
              }}
            >
              BLOCKCHAIN-POWERED
            </Typography>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
              }}
            >
              Transparent Public Procurement
            </Typography>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 300,
                mb: 4,
                maxWidth: "600px",
                lineHeight: 1.5,
              }}
            >
              Revolutionizing government contract bidding with immutable,
              transparent blockchain technology.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="contained" size="large">
                Get Started
              </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 3, mt: 6, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <VerifiedUserIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">Secure & Compliant</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <SpeedIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">Fast Processing</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccountBalanceIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">Public Trust</Typography>
              </Box>
            </Box>
          </Box>
        </Fade>

        <Fade in={true} timeout={1500}>
          <Box
            sx={{
              position: "relative",
              mb: 4,
            }}
          >
            <TransactionsFeed />
          </Box>
        </Fade>
      </Box>

      {/* Key Benefits Section */}
      <Box
        ref={benefitsRef}
        sx={{
          position: "relative",
          py: { xs: 8, md: 12 },
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              mb: 2,
            }}
          >
            Blockchain-Powered Advantages
          </Typography>
          <Typography
            variant="h6"
            component="p"
            sx={{
              fontWeight: 300,
              color: "text.secondary",
              maxWidth: "700px",
              mx: "auto",
            }}
          >
            Our solution transforms public procurement with cutting-edge
            blockchain technology, delivering unprecedented transparency and
            efficiency.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {/* Benefits cards */}
          {[
            {
              icon: <SecurityIcon fontSize="large" color="primary" />,
              title: "Immutable Records",
              description:
                "Every transaction is permanently recorded on the blockchain, providing an unalterable history of all procurement activities.",
            },
            {
              icon: <VerifiedUserIcon fontSize="large" color="primary" />,
              title: "Transparent Bidding",
              description:
                "Real-time visibility into the bidding process builds public trust while ensuring fair competition among vendors.",
            },
            {
              icon: <SpeedIcon fontSize="large" color="primary" />,
              title: "Accelerated Processing",
              description:
                "Smart contracts automatically validate requirements, reducing procurement cycles by up to 60%.",
            },
            {
              icon: <HandshakeIcon fontSize="large" color="primary" />,
              title: "Increased Accountability",
              description:
                "Digital signatures and multi-party verification ensure all stakeholders fulfill their obligations.",
            },
            {
              icon: <StorageIcon fontSize="large" color="primary" />,
              title: "Audit-Ready",
              description:
                "Comprehensive, tamper-proof records make auditing simple and reduce compliance costs.",
            },
            {
              icon: <AccountBalanceIcon fontSize="large" color="primary" />,
              title: "Public Confidence",
              description:
                "Transparent processes rebuild trust in government procurement and reduce corruption concerns.",
            },
          ].map((benefit, index) => (
            <Fade in={true} timeout={1000 + index * 300}>
              <Card sx={{ maxWidth: 500 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          ))}
        </Box>
      </Box>

      {/* achievements section */}

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default HomePage;
