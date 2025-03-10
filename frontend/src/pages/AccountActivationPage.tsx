import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import PasswordResetForm, {
  PasswordResetFormState,
} from "../components/admin/user/PasswordResetForm";
import {
  hasNumber,
  hasSpecialChar,
  hasUppercase,
  isLength,
} from "../util/validators";
import { useFeedback } from "../FeedbackAlertContext";

const AccountActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isShake, setIsShake] = useState<boolean>(false);
  const { showFeedback } = useFeedback();

  const [passwordFormState, setPasswordFormState] =
    useState<PasswordResetFormState>({
      password: {
        value: "",
        error: "",
        validators: [
          isLength({ min: 8 }),
          hasNumber,
          hasSpecialChar,
          hasUppercase,
        ],
      },
      confirmPassword: { value: "", error: "" },
    });

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  }, [searchParams]);

  const shakeFields = useCallback(() => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const token = searchParams.get("token");

    try {
      const response = await fetch(`${apiUrl}/user/activate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: passwordFormState.password.value,
        }),
      });

      const resData = await response.json();

      if (resData.error) {
        throw resData.error;
      }

      // Redirect to login page after 3 seconds
      showFeedback(
        "Your account has been successfully activated. You can now log in. Redirecting...",
        true
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      showFeedback(
        err.msg ||
          "Something went wrong with activating your account, try again later.",
        false
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "#f5f5f5",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Verifying your account...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: "100%" }}>
        <CardContent>
          <Typography
            variant="h5"
            component="h1"
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            Activate Your Account
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Please create a password to activate your account.
          </Typography>

          <PasswordResetForm
            passwordFormState={passwordFormState}
            setPasswordFormState={setPasswordFormState}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Activate Account"
            isShake={isShake}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccountActivationPage;
