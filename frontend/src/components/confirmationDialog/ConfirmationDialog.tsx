import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to perform this action?",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: "100%",
          maxWidth: 400,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          {cancelButtonText}
        </Button>
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
