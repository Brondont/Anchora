import React, { useState, useCallback } from "react";
import { Box, Typography, Link, CardContent, Card } from "@mui/material";
import LoginForm, { LoginFormProps } from "./LoginForm";
import { useFeedback } from "../../FeedbackAlertContext";
import { useNavigate } from "react-router-dom";
import { ServerFormError } from "../../types";
type LoginPageProps = {
  handleLogin: (toke: string) => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ handleLogin }) => {
  const [loginForm, setLoginForm] = useState<LoginFormProps>({
    email: { value: "", error: "" },
    password: { value: "", error: "" },
  });
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isShake, setIsShake] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string>("");
  const navigate = useNavigate();
  const { showFeedback } = useFeedback();

  const apiUrl = import.meta.env.VITE_API_URL;

  const inputChangeHandler = useCallback(
    (value: string, name: keyof LoginFormProps) => {
      setLoginForm((prevState: LoginFormProps) => ({
        ...prevState,
        [name]: {
          ...prevState[name],
          value: value,
          valid: true,
          error: "",
        },
      }));
    },
    []
  );

  const shakeFields = useCallback(() => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  }, []);

  const validateForm = (): boolean => {
    const updatedForm = { ...loginForm };
    let isValid = true;

    if (!updatedForm.email.value) {
      updatedForm.email.error = "Email is required";
      isValid = false;
    }

    if (!updatedForm.password.value) {
      updatedForm.password.error = "Password is required";
      isValid = false;
    }

    if (!isValid) {
      setLoginForm(updatedForm);
      shakeFields();
    }

    return isValid;
  };

  const handleSubmitLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSending || !validateForm()) return;
    setIsSending(true);

    const formData = {
      email: loginForm.email.value,
      password: loginForm.password.value,
    };

    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const resData = await res.json();

      if (!res.ok) {
        if ([422, 409, 404, 401].includes(res.status)) {
          const updatedForm: LoginFormProps = { ...loginForm };
          resData.error.forEach((err: ServerFormError) => {
            if (err.path === "general") {
              setGeneralError(err.msg);
              return;
            }
            if (updatedForm[err.path]) {
              updatedForm[err.path].error = err.msg;
            }
          });
          setLoginForm(updatedForm);
          shakeFields();
          return;
        }
        throw resData.error;
      }

      localStorage.setItem("token", resData.token);
      const expiryDate = new Date(new Date().getTime() + 60 * 60 * 12 * 1000);
      localStorage.setItem("expiryDate", expiryDate.toISOString());
      localStorage.setItem("publicWalletAddress", resData.publicWalletAddress);
      localStorage.setItem("userID", resData.userID);

      showFeedback("You are logged in! Redirecting to your dashboard...", true);
      setTimeout(() => {
        handleLogin(resData.token);
        navigate("/");
      }, 2500);
    } catch (err) {
      showFeedback("An error occurred. Please try again shortly.", false);
    } finally {
      setIsSending(false);
    }
  };

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
          <LoginForm
            loginForm={loginForm}
            isShake={isShake}
            isSending={isSending}
            generalError={generalError}
            inputChangeHandler={inputChangeHandler}
            handleSubmitLogin={handleSubmitLogin}
          />
        </CardContent>
      </Card>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography>Learn how to partner with us</Typography>
        <Link href="/faq" color="primary" underline="hover">
          Here
        </Link>
      </Box>
    </Box>
  );
};

export default LoginPage;
