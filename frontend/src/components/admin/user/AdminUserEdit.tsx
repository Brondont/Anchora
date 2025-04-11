import React, { ChangeEvent, useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Skeleton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
  keyframes,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { matchIsValidTel, MuiTelInput } from "mui-tel-input";
import { UserProps, Role, ServerFormError } from "../../../types";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useFeedback } from "../../../FeedbackAlertContext";
import {
  isEmail,
  isLength,
  isRequired,
  ValidatorFunction,
} from "../../../util/validators";

interface UserResponse {
  user: UserProps;
  error?: string;
}

export type UserFormProps = {
  [key: string]: {
    value: string | number[] | string[];
    validators?: ValidatorFunction[];
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

const AdminUserForm: React.FC = () => {
  const [user, setUser] = useState<UserProps>({
    ID: 0,
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    Roles: [],
    CreatedAt: "",
    UpdatedAt: "",
    publicWalletAddress: "",
  });
  const [editedUserForm, setEditedUserForm] = useState<UserFormProps>({
    email: { value: "", error: "", validators: [isEmail, isRequired] },
    firstName: { value: "", error: "", validators: [isRequired] },
    lastName: { value: "", error: "", validators: [isRequired] },
    phoneNumber: { value: "", error: "", validators: [isRequired] },
    rolesIDs: { value: [], error: "", validators: [isRequired] },
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paramUserID, setParamUserID] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isShake, setIsShake] = useState<boolean>(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const { showFeedback } = useFeedback();

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.error) throw data.error;
      setAvailableRoles(data.roles);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to fetch roles", false);
    }
  }, [apiUrl, token, showFeedback]);

  const fetchUser = useCallback(
    async (userID: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/user/${userID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resData: UserResponse = await res.json();

        if (resData.error) throw resData.error;

        setUser(resData.user);
        updateEditUser(resData.user);
      } catch (err: any) {
        showFeedback(err.msg || "Failed to get user, reload the page.", false);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, token, showFeedback]
  );

  useEffect(() => {
    fetchRoles();
    // get param from url
    const userID = searchParams.get("userID");
    if (!userID) return;
    setParamUserID(userID);

    fetchUser(userID);
  }, [fetchUser, fetchRoles, searchParams]);

  const inputChangeHandler = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setEditedUserForm((prevState: UserFormProps) => {
      const fieldConfig = prevState[name];
      // run all validators and collect error messages
      if (fieldConfig.validators) {
        for (const validator of fieldConfig.validators) {
          const result = validator(value);
          if (!result.isValid) {
            return {
              ...prevState,
              [name]: {
                ...prevState[name],
                value,
                error: result.errorMessage,
              },
            };
          }
        }
      }
      return {
        ...prevState,
        [name]: {
          ...prevState[name],
          value,
          error: "",
        },
      };
    });
  };

  const handlePhoneChange = (value: string) => {
    const isValid = matchIsValidTel(value);
    setEditedUserForm((prev) => ({
      ...prev,
      phoneNumber: {
        ...prev.phoneNumber,
        value,
        error: isValid ? "" : "Please enter a valid phone number",
      },
    }));
  };

  const handleRolesChange = (event: SelectChangeEvent<string[]>) => {
    const selectedRoleIDs = event.target.value as string[];

    setEditedUserForm((prev) => {
      // Check if roles are selected
      let error = "";
      if (prev.rolesIDs.validators) {
        for (const validator of prev.rolesIDs.validators) {
          const result = validator(selectedRoleIDs);
          if (!result.isValid) {
            error = result.errorMessage;
            break;
          }
        }
      }

      return {
        ...prev,
        rolesIDs: {
          ...prev.rolesIDs,
          value: selectedRoleIDs,
          error: error,
        },
      };
    });
  };

  const shakeFields = useCallback(() => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  }, []);

  const handleCancel = () => {
    if (!paramUserID) {
      updateEditUser({
        ID: 0,
        email: "",
        publicWalletAddress: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        Roles: [],
        CreatedAt: "",
        UpdatedAt: "",
      } as UserProps);
    } else {
      updateEditUser(user);
    }
  };

  const updateEditUser = (user: UserProps) => {
    // Extract role IDs from user.Roles
    const roleIDs = user.Roles ? user.Roles.map((role) => String(role.ID)) : [];

    setEditedUserForm({
      email: {
        value: user.email,
        error: "",
        validators: [isEmail, isRequired],
      },
      firstName: {
        value: user.firstName,
        error: "",
        validators: [isRequired, isLength({ min: 5, max: 32 })],
      },
      lastName: {
        value: user.lastName,
        error: "",
        validators: [isRequired, isLength({ min: 5, max: 32 })],
      },
      phoneNumber: {
        value: user.phoneNumber,
        error: "",
        validators: [isRequired],
      },
      rolesIDs: {
        value: roleIDs,
        error: "",
        validators: [isRequired],
      },
    });
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const updatedForm = { ...editedUserForm };

    // Check each field and update errors
    Object.entries(updatedForm).forEach(([fieldName, fieldConfig]) => {
      // Skip if no validators
      if (!fieldConfig.validators) return;

      // Check for empty required fields
      for (const validator of fieldConfig.validators) {
        const result = validator(fieldConfig.value);
        if (!result.isValid) {
          updatedForm[fieldName] = {
            ...fieldConfig,
            error: result.errorMessage,
          };
          isValid = false;
          break;
        }
      }
    });

    // Specific validation for roles (check if any role is selected)
    const selectedRoleIDs = updatedForm.rolesIDs.value as string[];
    if (selectedRoleIDs.length === 0) {
      updatedForm.rolesIDs = {
        ...updatedForm.rolesIDs,
        error: "At least one role is required",
      };
      isValid = false;
    }

    // Shake fields if validation failed
    if (!isValid) {
      setEditedUserForm(updatedForm);
      shakeFields();
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!editedUserForm) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const url = paramUserID
        ? `${apiUrl}/user/${paramUserID}`
        : `${apiUrl}/user`;

      const method = paramUserID ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: editedUserForm.firstName.value,
          lastName: editedUserForm.lastName.value,
          email: editedUserForm.email.value,
          phoneNumber: editedUserForm.phoneNumber.value,
          rolesIDs: editedUserForm.rolesIDs.value, // Send just the role IDs
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        if ([422, 409, 404, 401].includes(res.status)) {
          const updatedForm: UserFormProps = { ...editedUserForm };
          resData.error.forEach((err: ServerFormError) => {
            if (updatedForm[err.path]) {
              updatedForm[err.path].error = err.msg;
            }
          });
          setEditedUserForm(updatedForm);
          shakeFields();
          return;
        }
        throw new Error(resData.error || "An error occurred");
      }

      if (resData.error) throw resData.error;

      showFeedback(
        `User ${paramUserID ? "updated" : "created"} successfully`,
        true
      );
    } catch (err: any) {
      showFeedback(
        err.msg || `Failed to ${paramUserID ? "update" : "create"} user`,
        false
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", padding: 3 }}>
        <Card sx={{ width: "100%", overflow: "hidden" }}>
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
              <Box
                sx={{ mt: 4, display: "flex", gap: 8, flexDirection: "column" }}
              >
                <Skeleton variant="rectangular" height={56} />
                <Box sx={{ display: "flex", gap: 4 }}>
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ flex: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={56} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", padding: 3 }}>
      <Card sx={{ width: "100%", overflow: "hidden" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "column",
              mb: 4,
            }}
          >
            {paramUserID ? (
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Edit User
                </Typography>
                <Button
                  onClick={() => {
                    setSearchParams("");
                    setParamUserID("");
                    handleCancel();
                  }}
                  variant="contained"
                >
                  Add User
                </Button>
              </Box>
            ) : (
              <Typography variant="h5" fontWeight="bold">
                Create New User
              </Typography>
            )}
            <Box
              sx={{ mt: 4, display: "flex", gap: 8, flexDirection: "column" }}
            >
              <TextField
                fullWidth
                label="E-mail"
                name="email"
                value={editedUserForm?.email.value || ""}
                onChange={inputChangeHandler}
                error={editedUserForm.email.error !== ""}
                helperText={editedUserForm.email.error}
                sx={{
                  ...(isShake && editedUserForm.email.error !== ""
                    ? { animation: `${shakeAnimation} 0.35s` }
                    : {}),
                }}
                required
              />
              <Box sx={{ display: "flex", gap: 4 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={editedUserForm?.firstName.value || ""}
                  onChange={inputChangeHandler}
                  error={editedUserForm.firstName.error !== ""}
                  helperText={editedUserForm.firstName.error}
                  sx={{
                    ...(isShake && editedUserForm.firstName.error !== ""
                      ? { animation: `${shakeAnimation} 0.35s` }
                      : {}),
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={editedUserForm?.lastName.value || ""}
                  error={editedUserForm.lastName.error !== ""}
                  helperText={editedUserForm.lastName.error}
                  onChange={inputChangeHandler}
                  sx={{
                    ...(isShake && editedUserForm.lastName.error !== ""
                      ? { animation: `${shakeAnimation} 0.35s` }
                      : {}),
                  }}
                  required
                />
              </Box>
              <MuiTelInput
                value={(editedUserForm?.phoneNumber.value as string) || ""}
                defaultCountry="DZ"
                onChange={handlePhoneChange}
                error={editedUserForm.phoneNumber.error !== ""}
                helperText={editedUserForm.phoneNumber.error}
                sx={{
                  ...(isShake && editedUserForm.phoneNumber.error !== ""
                    ? { animation: `${shakeAnimation} 0.35s` }
                    : {}),
                }}
                label="Phone Number"
                name="phone"
                required
              />
              <FormControl
                fullWidth
                error={editedUserForm.rolesIDs.error !== ""}
                sx={{
                  ...(isShake && editedUserForm.rolesIDs.error !== ""
                    ? { animation: `${shakeAnimation} 0.35s` }
                    : {}),
                }}
              >
                <InputLabel id="roles-label">Roles</InputLabel>
                <Select
                  labelId="roles-label"
                  multiple
                  value={editedUserForm.rolesIDs.value as string[]}
                  onChange={handleRolesChange}
                  input={<OutlinedInput label="Roles" />}
                  required
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.ID} value={String(role.ID)}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {editedUserForm.rolesIDs.error && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ ml: 2, mt: 0.5 }}
                  >
                    {editedUserForm.rolesIDs.error}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 4,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {paramUserID ? "Cancel" : "Clear"}
            </Button>
            <LoadingButton
              variant="contained"
              color="primary"
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {paramUserID ? "Update User" : "Create User"}
            </LoadingButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminUserForm;
