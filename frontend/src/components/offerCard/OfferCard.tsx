import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  alpha,
  CardActionArea,
} from "@mui/material";
import { Offer } from "../../types";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useNavigate } from "react-router-dom";

// Function to safely parse HTML and strip tags for plain text
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

// Function to truncate text to a specific length
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  const plainText = stripHtml(text);
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + "...";
};

// Calculate time left for proposal submission
const calculateTimeLeft = (endDate: string): string => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();

  if (diffTime <= 0) return "Closed";

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} left`;

  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  if (diffHours > 0)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} left`;

  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} left`;
};

interface OfferCardProps {
  offer: Offer;
  onView?: (id: number) => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onView }) => {
  const navigate = useNavigate();

  const timeLeft = calculateTimeLeft(offer.proposalSubmissionEnd);

  const handleCardClick = () => {
    if (onView) {
      onView(offer.ID);
    } else {
      navigate(`/offers/${offer.ID}`);
    }
  };

  return (
    <Card sx={{ p: 0, width: 500 }}>
      <CardActionArea onClick={handleCardClick}>
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {offer.title}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Chip
                  color="primary"
                  icon={<ScheduleIcon fontSize="small" />}
                  label={timeLeft}
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: "-webkit-box",
              overflow: "hidden",
              textOverflow: "ellipsis",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              height: "40px",
            }}
          >
            {truncateText(offer.description, 150)}
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <BusinessCenterIcon color="primary" fontSize="small" />
              {offer.Sector.code}
            </Box>

            {offer.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LocationOnIcon color="success" fontSize="small" />
                {offer.location}
              </Box>
            )}
            <Typography variant="caption" color="text.secondary">
              Tender #{offer.tenderNumber}
            </Typography>
          </Box>

          <Button
            size="small"
            variant="contained"
            color="primary"
            disableElevation
            onClick={(e) => {
              e.stopPropagation();
              onView && onView(offer.ID);
            }}
            sx={{
              borderRadius: 6,
              px: 2,
              fontWeight: 500,
            }}
          >
            View Details
          </Button>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default OfferCard;
