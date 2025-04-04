import React, { ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmButtonText: string;
  cancelButtonText?: string;
  maxWidth?: string | number;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  children,
  confirmButtonText = "Confirm",
  cancelButtonText,
  maxWidth = 400,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: "100%",
          maxWidth,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        {message && <Typography sx={{ mb: 2 }}>{message}</Typography>}
        {children}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        {cancelButtonText && (
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {cancelButtonText}
          </Button>
        )}
        <Button
          onClick={onConfirm}
          color="primary"
          variant="contained"
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
