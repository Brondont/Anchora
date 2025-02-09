export type LengthConfig = {
  min?: number;
  max?: number;
};

export type ValidatorFunction = (value: string) => boolean;

export type IsLengthFunction = (config: LengthConfig) => ValidatorFunction;

export const isRequired = (value: string) => value.trim() !== "";

export const isLength = (config: LengthConfig) => {
  return (value: string) => {
    let isValid = true;
    if (config.min) {
      isValid = isValid && value.trim().length >= config.min;
    }
    if (config.max) {
      isValid = isValid && value.trim().length <= config.max;
    }
    return isValid;
  };
};

export const isEmail = (value: string) =>
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(
    value
  );

export const isGender = (value: string) => {
  return value === "Male" || value === "Female";
};

export const isPostalCode = (value: string): boolean => /^\d{5}(-\d{4})?$/.test(value);

