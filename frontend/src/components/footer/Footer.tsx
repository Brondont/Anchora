import { Box, Typography, Link, Divider, IconButton } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CallIcon from "@mui/icons-material/Call";
import EmailIcon from "@mui/icons-material/Email";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import React from "react";

const Footer: React.FC = () => {
  const scrollUp = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "primary.contrastText",
        py: 6,
        position: "relative",
        px: 4,
      }}
    >
      {/* Scroll-to-Top Button */}
      <IconButton
        onClick={scrollUp}
        sx={{
          position: "absolute",
          bottom: 20,
          right: 20,
          bgcolor: "secondary.main",
          color: "white",
        }}
      >
        <ArrowUpwardIcon />
      </IconButton>

      <Divider sx={{ bgcolor: "primary.contrastText", mb: 4 }} />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          gap: 4,
          mb: 4,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <Link href="/about-us" color="inherit" underline="hover">
              About Us
            </Link>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <Link href="/contact-us" color="inherit" underline="hover">
              Contact Us
            </Link>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <Link href="/privacy-policy" color="inherit" underline="hover">
              Privacy Policy
            </Link>
          </Typography>
          <Typography variant="body2">
            <Link href="/terms" color="inherit" underline="hover">
              Terms & Conditions
            </Link>
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Follow Us
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <IconButton
              href="https://www.facebook.com"
              target="_blank"
              color="inherit"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </IconButton>
            <IconButton
              href="https://www.twitter.com"
              target="_blank"
              color="inherit"
              aria-label="Twitter"
            >
              <TwitterIcon />
            </IconButton>
            <IconButton
              href="https://www.instagram.com"
              target="_blank"
              color="inherit"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Contact Us
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <CallIcon sx={{ mr: 1 }} />
            <Typography variant="body2" color="inherit">
              +213731323389
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <EmailIcon sx={{ mr: 1 }} />
            <Typography variant="body2" color="inherit">
              contact@university.com
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ bgcolor: "primary.contrastText", my: 4 }} />

      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} Ibn Khaldoun University. All Rights
          Reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
