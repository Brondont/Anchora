import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Card,
  CardContent,
  FormControl,
  keyframes,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedback } from "../FeedbackAlertContext";
import { isEmail, ValidatorFunction } from "../util/validators";

export type ForgotPasswordForm = {
  email: {
    value: string | number[] | string[];
    validators: ValidatorFunction[];
    error: string;
  };
};

const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

const ForgotPasswordPage = () => {
  const [emailForm, setEmailForm] = useState<ForgotPasswordForm>({
    email: {
      value: "",
      validators: [isEmail],
      error: "",
    },
  });
  const [searchParams] = useSearchParams();
  const [isShake, setIsShake] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const { showFeedback } = useFeedback();

  const apiUrl = import.meta.env.VITE_API_URL;

  const inputChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    let error = "";
    emailForm.email.validators.map((validator) => {
      const result = validator(value);
      if (!result.isValid) {
        error = result.errorMessage;
      }
    });
    setEmailForm({
      email: {
        ...emailForm.email,
        value,
        error,
      },
    });
    setGeneralError("");
  };

  const shakeFields = useCallback(() => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  }, []);

  const validateForm = (): boolean => {
    const updatedForm = { ...emailForm };
    let isValid = true;

    if (!updatedForm.email.value) {
      updatedForm.email.error = "Email is required";
      isValid = false;
    }

    if (!isValid) {
      setEmailForm(updatedForm);
      shakeFields();
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSending || !validateForm()) return;
    setIsSending(true);

    const formData = {
      email: emailForm.email.value,
    };

    try {
      const res = await fetch(`${apiUrl}/user/forgot-password`, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const resData = await res.json();

      if (!res.ok) {
        if ([422, 409, 404, 401].includes(res.status)) {
          const updatedForm = { ...emailForm };

          resData.error.forEach((err: { path: string; msg: string }) => {
            if (err.path === "general") {
              setGeneralError(err.msg);
              return;
            }
            if (err.path === "email") {
              updatedForm.email.error = err.msg;
            }
          });

          setEmailForm(updatedForm);
          shakeFields();
          return;
        }
        throw new Error(resData.error || "An error occurred");
      }

      // On successful submission
      setIsSubmitted(true);
      showFeedback("Password reset instructions sent to your email!", true);
    } catch (err) {
      showFeedback("An error occurred. Please try again shortly.", false);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    if (!urlEmail) return;

    setEmailForm({
      email: {
        ...emailForm.email,
        value: urlEmail,
      },
    });
  }, [searchParams]);

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
          {!isSubmitted ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Link href="/" underline="none" sx={{ textDecoration: "none" }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    Trust
                  </Typography>
                </Link>
              </Box>

              <Typography
                variant="h5"
                component="h1"
                fontWeight={600}
                sx={{ mb: 1 }}
              >
                Forgot Password
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Enter your email address and we'll send you instructions to
                reset your password.
              </Typography>

              <form onSubmit={handleSubmit}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "24px" }}
                >
                  <FormControl fullWidth>
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={emailForm.email.value}
                      onChange={inputChangeHandler}
                      error={emailForm.email.error !== ""}
                      helperText={emailForm.email.error || ""}
                      sx={{
                        ...(isShake && emailForm.email.error
                          ? { animation: `${shakeAnimation} 0.35s` }
                          : {}),
                      }}
                    />
                  </FormControl>

                  {generalError !== "" && (
                    <Typography
                      variant="body1"
                      color="error"
                      textAlign="center"
                      sx={{
                        ...(isShake
                          ? { animation: `${shakeAnimation} 0.35s` }
                          : {}),
                      }}
                    >
                      {generalError}
                    </Typography>
                  )}

                  <LoadingButton
                    loading={isSending}
                    variant="contained"
                    type="submit"
                    size="large"
                    sx={{ mt: 2, fontSize: "16px" }}
                  >
                    Send Reset Instructions
                  </LoadingButton>

                  <Typography variant="body1" textAlign="center" sx={{ mt: 1 }}>
                    Remember your password?{" "}
                    <Link
                      href="/login"
                      style={{ color: "#1976d2", textDecoration: "none" }}
                    >
                      Back to Login
                    </Link>
                  </Typography>
                </Box>
              </form>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                textAlign: "center",
                py: 2,
              }}
            >
              <Box>
                <Link href="/" underline="none" sx={{ textDecoration: "none" }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    Trust
                  </Typography>
                </Link>
              </Box>

              <Typography
                variant="h5"
                component="h1"
                fontWeight={600}
                sx={{ mb: 1 }}
              >
                Check Your Email
              </Typography>

              <Typography variant="body1" sx={{ mb: 3, px: 2 }}>
                We've sent password reset instructions to{" "}
                <Box component="span" fontWeight="medium">
                  {emailForm.email.value.toString()}
                </Box>
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Check your spam folder if you don't see the email in your inbox.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <LoadingButton
                  variant="outlined"
                  size="large"
                  sx={{ fontSize: "16px", maxWidth: "300px", width: "100%" }}
                  onClick={() => setIsSubmitted(false)}
                >
                  Resend Instructions
                </LoadingButton>

                <Link href="/login" style={{ textDecoration: "none" }}>
                  <LoadingButton
                    variant="contained"
                    size="large"
                    sx={{ fontSize: "16px", maxWidth: "300px", width: "100%" }}
                  >
                    Back to Login
                  </LoadingButton>
                </Link>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 3, textAlign: "center" }}
      >
        Need help?{" "}
        <Typography
          component="span"
          color="primary"
          sx={{ cursor: "pointer", fontWeight: "medium" }}
        >
          Contact Support
        </Typography>
      </Typography>
    </Box>
  );
};

export default ForgotPasswordPage;
