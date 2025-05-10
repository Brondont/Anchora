import React from "react";
import {
  Box,
  Card,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Chip,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import GridOnIcon from "@mui/icons-material/GridOn";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useFeedback } from "../../FeedbackAlertContext";

interface FileUploadProps {
  files: File[];
  onFileUpload: (files: File[]) => void;
  onFileRemove: (index: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFileUpload,
  onFileRemove,
}) => {
  const { showFeedback } = useFeedback();
  // Allowed file types
  const allowedFileTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/csv",
  ];

  // File type extensions for display
  const allowedExtensions = ".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .csv";

  // Maximum file size (10MB)
  const maxFileSize = 10 * 1024 * 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);

      // Validate file types and sizes
      const invalidFiles = newFiles.filter(
        (file) => !allowedFileTypes.includes(file.type)
      );

      const oversizedFiles = newFiles.filter((file) => file.size > maxFileSize);

      if (invalidFiles.length > 0) {
        showFeedback(
          "Failed to upload file, make sure you're uploading proper file types.",
          false
        );
        return;
      }

      if (oversizedFiles.length > 0) {
        showFeedback("File must be smaller than 10MB.", false);
        return;
      }

      onFileUpload(newFiles);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <PictureAsPdfIcon color="error" />;
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return <DescriptionIcon color="primary" />;
    } else if (
      fileType.includes("sheet") ||
      fileType.includes("excel") ||
      fileType.includes("csv")
    ) {
      return <GridOnIcon color="success" />;
    } else {
      return <InsertDriveFileIcon color="action" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Fixed border styling for the upload box */}
      <Box
        component="label"
        sx={{
          display: "block",
          position: "relative",
          width: "100%",
          cursor: "pointer",
          borderRadius: 1,
          "&:hover .upload-area": {
            borderColor: "primary.main",
            backgroundColor: "action.hover",
          },
        }}
      >
        <Box
          className="upload-area"
          sx={{
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 1,
            backgroundColor: "background.default",
            transition: "all 0.2s ease-in-out",
            p: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "text.secondary",
              py: 2,
            }}
          >
            <AttachFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body1" textAlign="center" fontWeight={500}>
              Drop files here or click to upload
            </Typography>
            <Typography variant="caption" textAlign="center" sx={{ mt: 1 }}>
              Accepted formats: {allowedExtensions}
            </Typography>
            <Typography variant="caption" textAlign="center">
              Maximum size: 10MB per file
            </Typography>
          </Box>
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept={allowedExtensions}
          />
        </Box>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Uploaded Documents ({files.length})
          </Typography>
          <Stack spacing={1}>
            {files.map((file, index) => (
              <Card
                key={index}
                variant="outlined"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexGrow: 1,
                    overflow: "hidden",
                  }}
                >
                  {getFileIcon(file.type)}
                  <Box sx={{ ml: 1, overflow: "hidden" }}>
                    <Typography variant="body2" noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    size="small"
                    label={file.type.split("/").pop()?.toUpperCase()}
                    sx={{ mr: 1, textTransform: "uppercase" }}
                  />
                  <Tooltip title="Remove file">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(index);
                      }}
                      aria-label="Remove file"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
