import React from "react";
import {
  Box,
  Avatar,
  Typography,
  Button,
  Card,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import { Email, Edit, CalendarToday, LocationOn } from "@mui/icons-material";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MyBreadcrumbs from "../../components/myBreadcrumbs/MyBreadcrumbs";

export interface UserProps {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  username: string;
  email: string;
  phoneNumber: string;
  isAdmin: boolean;
}

interface UserProfileProps {
  user: UserProps;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  console.log(user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Box sx={{ minHeight: "70vh", py: 3 }}>
      <MyBreadcrumbs />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 3,
          mt: 4,
        }}
      >
        <Card
          sx={{
            p: 4,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 4,
            position: "relative",
            minHeight: "300px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: isMobile ? "auto" : "200px",
            }}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: "primary.main",
                fontSize: "3rem",
                mb: 2,
                boxShadow: 2,
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, textAlign: "center" }}
            >
              {user.username}
            </Typography>
            {user.isAdmin && (
              <Box
                sx={{
                  mt: 1,
                  px: 2,
                  py: 0.5,
                  bgcolor: theme.palette.error.main,
                  borderRadius: 1,
                  color: "white",
                }}
              >
                Admin
              </Box>
            )}
          </Box>

          {!isMobile && <Divider orientation="vertical" flexItem />}
          {isMobile && <Divider sx={{ my: 2 }} />}

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Profile Information
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                E-mail
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Email sx={{ fontSize: 20, mr: 1, color: "primary.main" }} />
                <Typography>{user.email}</Typography>
              </Box>
            </Box>

            {user.phoneNumber && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Phone Number
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocalPhoneIcon
                    sx={{ fontSize: 20, mr: 1, color: "primary.main" }}
                  />
                  <Typography>{user.phoneNumber}</Typography>
                </Box>
              </Box>
            )}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Member Since
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarToday
                  sx={{ fontSize: 20, mr: 1, color: "primary.main" }}
                />
                <Typography>{formatDate(user.CreatedAt)}</Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: isMobile ? "auto" : "300px",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Quick Actions
          </Typography>

          <Button
            href="/account/addresses"
            variant="contained"
            startIcon={<LocationOn />}
            fullWidth
            sx={{ textTransform: "none" }}
          >
            Manage Addresses
          </Button>

          <Button
            variant="outlined"
            startIcon={<Edit />}
            fullWidth
            sx={{ textTransform: "none" }}
          >
            Edit Profile
          </Button>

          {user.isAdmin && (
            <Button
              href="/admin/dashboard"
              variant="outlined"
              color="error"
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ textTransform: "none" }}
            >
              Admin Space
            </Button>
          )}
        </Card>
      </Box>
    </Box>
  );
};

export default UserProfile;
