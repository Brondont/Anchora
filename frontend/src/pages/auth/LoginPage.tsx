import React, { useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  Typography,
  keyframes,
  useTheme,
  Link,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFeedback } from "../../FeedbackAlertContext";

const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

type ServerFormError = {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
};

type LoginForm = {
  [key: string]: {
    value: string;
    valid: boolean;
    error: string;
  };
};

type LoginPageProps = {
  handleLogin: (token: string) => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ handleLogin }) => {
  const theme = useTheme();

  const [signupForm, setSignupForm] = useState<LoginForm>({
    email: {
      value: "",
      valid: true,
      error: "",
    },
    password: {
      value: "",
      valid: true,
      error: "",
    },
  });
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isShake, setIsShake] = useState<boolean>(false);
  const { showFeedback } = useFeedback();

  const apiUrl = "";

  const inputChangeHandler = (value: string, name: string) => {
    setSignupForm((prevState: LoginForm) => ({
      ...prevState,
      [name]: {
        ...prevState[name],
        value: value,
      },
    }));
  };

  const shakeFields = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  };

  const handleSubmitSignup = (event: React.FormEvent) => {
    event.preventDefault();

    if (isSending) return;
    setIsSending(true);

    const formData = {
      email: signupForm.email.value,
      password: signupForm.password.value,
    };

    let statusCode: number;

    fetch(`${apiUrl}/login`, {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        statusCode = res.status;
        return res.json();
      })
      .then((resData) => {
        if (resData.error) {
          const error = resData.error;
          if (
            statusCode === 422 ||
            statusCode === 409 ||
            statusCode === 404 ||
            statusCode === 401
          ) {
            const updatedForm = { ...signupForm };

            error.forEach((err: ServerFormError) => {
              if (updatedForm[err.path]) {
                updatedForm[err.path].error = err.msg;
                updatedForm[err.path].valid = false;
              }
            });
            shakeFields();
            setSignupForm(updatedForm);
            setIsSending(false);
            return;
          }
          throw error;
        }
        localStorage.setItem("token", resData.token);
        const remainingMiliseconds = 60 * 60 * 12 * 1000;
        const expiryDate = new Date(
          new Date().getTime() + remainingMiliseconds
        );
        localStorage.setItem("expiryDate", expiryDate.toISOString());
        setIsSending(false);
        showFeedback(
          "You are logged in! Redirecting to your dashboard...",
          true
        );
        setTimeout(() => {
          handleLogin(resData.token);
        }, 2500);
      })
      .catch(() => {
        setIsSending(false);
        showFeedback("An error occurred. Please try again shortly.", false);
      });
  };

  const LoginFormContent = () => (
    <Box
      sx={{
        width: "100%",
        maxWidth: "400px",
        p: 4,
        borderRadius: "16px",
        bgcolor: "background.paper",
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.1)",
        border: `1px solid ${theme.borderColor.primary}`,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Link href="/" underline="none" sx={{ textDecoration: "none" }}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            Trust
          </Typography>
        </Link>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Log in
      </Typography>
      <form onSubmit={handleSubmitSignup}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <FormControl fullWidth>
            <TextField
              label="Email"
              value={signupForm.email.value}
              onChange={(event) =>
                inputChangeHandler(event.target.value, "email")
              }
              error={!signupForm.email.valid}
              helperText={signupForm.email.error || ""}
              sx={{
                ...(isShake && !signupForm.email.valid
                  ? { animation: `${shakeAnimation} 0.35s` }
                  : {}),
              }}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              type="password"
              value={signupForm.password.value}
              label="Password"
              error={!signupForm.password.valid}
              helperText={signupForm.password.error || ""}
              onChange={(event) =>
                inputChangeHandler(event.target.value, "password")
              }
              sx={{
                ...(isShake && !signupForm.password.valid
                  ? { animation: `${shakeAnimation} 0.35s` }
                  : {}),
              }}
            />
          </FormControl>
          <LoadingButton
            loading={isSending}
            variant="contained"
            type="submit"
            size="large"
            sx={{ mt: 2, fontSize: "16px" }}
          >
            Login
          </LoadingButton>
        </Box>
      </form>
    </Box>
  );

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 4,
        p: 2,
      }}
    >
      <LoginFormContent />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography>Learn how to partner with us</Typography>
        <Link href="/faq" color={theme.customColors.goldDark} underline="hover">
          Here
        </Link>
      </Box>
    </Box>
  );
};

export default LoginPage;
