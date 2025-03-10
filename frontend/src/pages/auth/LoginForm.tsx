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
import React from "react";

export type LoginFormProps = {
  [key: string]: {
    value: string;
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

type LoginFormContentProps = {
  loginForm: LoginFormProps;
  isShake: boolean;
  isSending: boolean;
  generalError: string;
  inputChangeHandler: (value: string, name: string) => void;
  handleSubmitLogin: (event: React.FormEvent) => void;
};

const LoginForm: React.FC<LoginFormContentProps> = ({
  loginForm,
  isShake,
  isSending,
  generalError,
  inputChangeHandler,
  handleSubmitLogin,
}) => {
  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: "400px",
        p: 4,
      }}
    >
      <CardContent>
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
        <form onSubmit={handleSubmitLogin}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <FormControl fullWidth>
              <TextField
                label="Email"
                value={loginForm.email.value}
                onChange={(event) =>
                  inputChangeHandler(event.target.value, "email")
                }
                error={loginForm.email.error !== ""}
                helperText={loginForm.email.error || ""}
                sx={{
                  ...(isShake && loginForm.email.error
                    ? { animation: `${shakeAnimation} 0.35s` }
                    : {}),
                }}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                type="password"
                value={loginForm.password.value}
                label="Password"
                error={loginForm.password.error !== ""}
                helperText={loginForm.password.error || ""}
                onChange={(event) =>
                  inputChangeHandler(event.target.value, "password")
                }
                sx={{
                  ...(isShake && loginForm.password.error
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
                  ...(isShake ? { animation: `${shakeAnimation} 0.35s` } : {}),
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
              Login
            </LoadingButton>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
