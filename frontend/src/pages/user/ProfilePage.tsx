import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Divider,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import { Email, CalendarToday } from "@mui/icons-material";
import { useFeedback } from "../../FeedbackAlertContext";
import { useParams } from "react-router-dom";
import { UserProps } from "../../types";

interface UserPageProps {
  activeUser: UserProps | undefined;
}

const ProfilePage: React.FC<UserPageProps> = ({ activeUser }) => {
  const [user, setUser] = useState<UserProps | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const { showFeedback } = useFeedback();
  const { userID } = useParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchUser = useCallback(async () => {
    if (!userID) {
      showFeedback("Invalid user ID", false);
      setLoadingUserData(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/user-profile/${userID}`);
      const resData = await res.json();

      if (!res.ok) throw new Error(resData.error || "Failed to fetch user");

      setUser(resData.user);
    } catch (err: any) {
      showFeedback(err.msg || "Failed to load user details", false);
      setUser(null);
    } finally {
      setLoadingUserData(false);
    }
  }, [apiUrl, userID, showFeedback]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loadingUserData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6" color="error">
          User not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "70vh", p: theme.spacing(3) }}>
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          mt: 4,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 4,
          alignItems: "flex-start",
        }}
      >
        {/* Profile Section */}
        <Card
          sx={{
            flex: 1,
            width: "100%",
            p: 4,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 4,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: "primary.main",
                    fontSize: "3rem",
                    mb: 2,
                  }}
                >
                  {user.firstName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" fontWeight="bold">
                  {user.firstName}
                </Typography>
                {user.Roles?.some((role) => role.name === "admin") && (
                  <Box
                    sx={{
                      mt: 1,
                      px: 2,
                      py: 0.5,
                      bgcolor: "error.main",
                      borderRadius: 1,
                      color: "white",
                      fontSize: theme.typography.caption,
                    }}
                  >
                    Admin
                  </Box>
                )}
              </Box>

              {!isMobile && <Divider orientation="vertical" flexItem />}
              {isMobile && <Divider sx={{ width: "100%", my: 2 }} />}

              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>
                  Profile Information
                </Typography>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Email
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Email
                      sx={{ fontSize: 20, mr: 1, color: "primary.main" }}
                    />
                    <Typography variant="body1">{user.email}</Typography>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Member Since
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <CalendarToday
                      sx={{ fontSize: 20, mr: 1, color: "primary.main" }}
                    />
                    <Typography variant="body1">
                      {formatDate(user.CreatedAt)}
                    </Typography>
                  </Box>
                </Box>

                {activeUser && activeUser.ID === user.ID && (
                  <Box>
                    <Button href="/account" variant="contained">
                      Edit your account.
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ProfilePage;
