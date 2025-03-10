export type LengthConfig = {
  min?: number;
  max?: number;
};

export type ValidatorFunction = (value: any) => {
  isValid: boolean;
  errorMessage: string;
};

export type IsLengthFunction = (config: LengthConfig) => ValidatorFunction;

export const isRequired: ValidatorFunction = (value) => {
  // Handle arrays (like Roles)
  if (Array.isArray(value)) {
    return {
      isValid: value.length > 0,
      errorMessage: "This field is required",
    };
  }

  // Handle strings
  if (typeof value === "string") {
    return {
      isValid: value.trim() !== "",
      errorMessage: "This field is required",
    };
  }

  // Handle other types
  return {
    isValid: value !== null && value !== undefined,
    errorMessage: "This field is required",
  };
};

export const isLength = (config: LengthConfig) => {
  return (value: string) => {
    let isValid = true;
    let errorMessage = config.min
      ? `Must be at least ${config.min} characters.`
      : `Must be no more than ${config.max} characters.`;

    if (config.min && value.trim().length < config.min) {
      isValid = false;
    }
    if (config.max && value.trim().length > config.max) {
      isValid = false;
    }

    return { isValid, errorMessage };
  };
};

export const isEmail: ValidatorFunction = (value: string) => ({
  isValid:
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(
      value
    ),
  errorMessage: "Please enter a valid email address.",
});

export const isGender: ValidatorFunction = (value: string) => ({
  isValid: value === "Male" || value === "Female",
  errorMessage: "Please select a valid gender.",
});

export const isPostalCode: ValidatorFunction = (value: string) => ({
  isValid: /^\d{5}(-\d{4})?$/.test(value),
  errorMessage: "Please enter a valid postal code.",
});

// Individual validation functions
export const isPasswordLengthValid: ValidatorFunction = (password) => ({
  isValid: password.length >= 8,
  errorMessage: "Password must be at least 8 characters long.",
});

export const hasUppercase: ValidatorFunction = (password) => ({
  isValid: /[A-Z]/.test(password),
  errorMessage: "Password must contain at least one uppercase letter.",
});

export const hasNumber: ValidatorFunction = (password) => ({
  isValid: /\d/.test(password),
  errorMessage: "Password must contain at least one number.",
});

export const hasSpecialChar: ValidatorFunction = (password) => ({
  isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  errorMessage: "Password must contain at least one special character.",
});
