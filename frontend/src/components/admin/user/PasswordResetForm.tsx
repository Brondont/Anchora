import React, { ChangeEvent, useState, useEffect } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  keyframes,
  Typography,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { ValidatorFunction } from "../../../util/validators";

const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

export type PasswordResetFormState = {
  [key: string]: {
    value: string | number[] | string[];
    validators?: ValidatorFunction[];
    error: string;
  };
};

interface PasswordResetFormProps {
  passwordFormState: PasswordResetFormState;
  setPasswordFormState: React.Dispatch<
    React.SetStateAction<PasswordResetFormState>
  >;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitButtonText?: string;
  generalError: string;
  isShake: boolean;
}

type Requirement = {
  label: string;
  completed: boolean;
};

const CustomStepIcon = (props: { active: boolean; completed: boolean }) => {
  const { completed } = props;
  return completed ? (
    <CheckCircleIcon fontSize="small" color="success" />
  ) : (
    <CancelIcon fontSize="small" color="error" />
  );
};

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  passwordFormState,
  setPasswordFormState,
  onSubmit,
  generalError,
  isSubmitting,
  submitButtonText = "Submit",
  isShake,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [requirementResults, setRequirementResults] = useState<Requirement[]>(
    []
  );
  const [isFormValid, setIsFormValid] = useState(false);

  const handlePasswordRequirements = (password: string) => {
    const results =
      passwordFormState.password.validators?.map((validator) => {
        const result = validator(password);
        const label = result.errorMessage;
        return {
          label: label.charAt(0).toUpperCase() + label.slice(1),
          completed: result.isValid,
        };
      }) || [];
    setRequirementResults(results);

    // Check if at least (n-1) requirements are met
    const totalRequirements = results.length;
    if (totalRequirements > 0) {
      const completedRequirements = results.filter(
        (req) => req.completed
      ).length;
      const isPasswordValid = completedRequirements >= totalRequirements - 1;

      // Update password field error state based on n-1 validation
      setPasswordFormState((prevState) => {
        let passwordError = isPasswordValid
          ? ""
          : "Password must meet at least " +
            (totalRequirements - 1) +
            " requirements";

        return {
          ...prevState,
          password: {
            ...prevState.password,
            error: passwordError,
          },
        };
      });

      // Check overall form validity (password meets n-1 requirements AND passwords match)
      const passwordsMatch =
        passwordFormState.confirmPassword.value === password &&
        password.length > 0;

      setIsFormValid(isPasswordValid && passwordsMatch);
    }
  };

  const inputChangeHandler = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setPasswordFormState((prevState) => {
      const fieldConfig = prevState[name];
      let error = "";

      // For confirm password field, check if passwords match
      if (name === "confirmPassword") {
        const passwordsMatch = prevState.password.value === value;
        error =
          !passwordsMatch && value.length > 0 ? "Passwords do not match" : "";

        // Update form validity when confirm password changes
        setIsFormValid(
          passwordsMatch &&
            value.length > 0 &&
            prevState.password.error.length === 0
        );
      }

      return {
        ...prevState,
        [name]: { ...fieldConfig, value, error },
      };
    });

    if (name === "password") {
      handlePasswordRequirements(value);
    }
  };

  // Initial validation when component mounts
  useEffect(() => {
    if (passwordFormState.password.value) {
      handlePasswordRequirements(passwordFormState.password.value as string);
    }
  }, []);

  // Calculate how many requirements are needed
  const totalRequirements = requirementResults.length;
  const requiredCount = totalRequirements > 0 ? totalRequirements - 1 : 0;
  const completedCount = requirementResults.filter(
    (req) => req.completed
  ).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <TextField
        fullWidth
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={passwordFormState.password.value}
        onChange={inputChangeHandler}
        error={passwordFormState.password.error.length > 0}
        helperText={passwordFormState.password.error || " "}
        sx={{
          animation:
            isShake && passwordFormState.password.error.length > 0
              ? `${shakeAnimation} 0.35s`
              : "",
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {requirementResults.length > 0 && (
        <Box sx={{ mt: -1, mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Password must meet at least {requiredCount} of the following{" "}
            {totalRequirements} requirements: ({completedCount}/
            {totalRequirements} completed)
          </Typography>
          <Stepper orientation="vertical" connector={null}>
            {requirementResults.map((req, index) => (
              <Step key={index} completed={req.completed}>
                <StepLabel
                  slots={{
                    stepIcon: CustomStepIcon,
                  }}
                  slotProps={{
                    stepIcon: {
                      active: false,
                      completed: req.completed,
                    },
                  }}
                  sx={{
                    "& .MuiStepLabel-labelContainer": {
                      color: req.completed ? "text.primary" : "text.secondary",
                    },
                  }}
                >
                  <Typography variant="body2">{req.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      <TextField
        fullWidth
        label="Confirm Password"
        name="confirmPassword"
        type={showPassword ? "text" : "password"}
        value={passwordFormState.confirmPassword.value}
        onChange={inputChangeHandler}
        error={passwordFormState.confirmPassword.error.length > 0}
        helperText={passwordFormState.confirmPassword.error || " "}
        sx={{
          animation:
            isShake && passwordFormState.confirmPassword.error.length > 0
              ? `${shakeAnimation} 0.35s`
              : "",
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
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
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        loading={isSubmitting}
        onClick={onSubmit}
        disabled={!isFormValid}
        sx={{ mt: 1 }}
      >
        {submitButtonText}
      </LoadingButton>
    </Box>
  );
};

export default PasswordResetForm;
