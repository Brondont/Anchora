import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import React from "react";
import { VariantData } from "../../components/admin/products/VariantsTable";

interface ImageGalleryProps {
  variant: VariantData;
  currentImageIndex: number;
  onCurrentImageIndexChange: (index: number) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  variant,
  currentImageIndex,
  onCurrentImageIndexChange,
}) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column-reverse", sm: "row" },
        gap: 2,
        width: "100%",
        height: "100%",
      }}
    >
      {/* Thumbnails */}
      {variant.images.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", sm: "column" },
            gap: 1,
            width: { xs: "100%", sm: "80px" },
            height: { xs: "80px", sm: "100%" },
            overflowX: { xs: "auto", sm: "hidden" },
            overflowY: { xs: "hidden", sm: "auto" },
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {variant.images.map((image, index) => (
            <Box
              key={index}
              onClick={() => onCurrentImageIndexChange(index)}
              sx={{
                width: "80px",
                height: "80px",
                flexShrink: 0,
                borderRadius: 1,
                border: currentImageIndex === index ? "2px solid" : "1px solid",
                borderColor:
                  currentImageIndex === index ? "primary.main" : "divider",
                overflow: "hidden",
                cursor: "pointer",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Box
                component="img"
                src={apiUrl.split("/api/")[0] + image.imagePath}
                alt={`Thumbnail ${index + 1}`}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Main Image */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: { xs: "calc(100% - 100px)", sm: "100%" },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {variant.images.length > 0 ? (
          <Box
            component="img"
            src={
              apiUrl.split("/api/")[0] +
              variant.images[currentImageIndex].imagePath
            }
            alt={`Variant Image ${currentImageIndex + 1}`}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <Typography variant="body1" color="text.secondary">
            No images available
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ImageGallery;
