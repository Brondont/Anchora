import React, { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { FeedbackProvider } from "./FeedbackAlertContext";
import FeedbackAlert from "./components/feedbackAlert/FeedbackAlert";
import { AuthContext } from "./authContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import LoadingPage from "./pages/user/LoadingPage";
import UserSpace from "./pages/user/UserSpace";
import { lightTheme, darkTheme } from "./theme";
import Navbar from "./components/navbar/Navbar";
import { UserProps } from "./types";
import ProfilePage from "./pages/user/ProfilePage";
import AdminSpace from "./pages/admin/AdminSpace";
import AdminUserEdit from "./components/admin/user/AdminUserEdit";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [user, setUser] = useState<UserProps>({
    ID: 0,
    CreatedAt: "",
    UpdatedAt: "",
    DeletedAt: "",
    username: "",
    email: "",
    phoneNumber: "",
    Roles: [],
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  const apiUrl = import.meta.env.VITE_API_URL;

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      localStorage.setItem("theme", prev ? "Light" : "Dark");
      return !prev;
    });
  };

  const handleLogout = () => {
    setIsAuth(false);
    localStorage.removeItem("token");
    localStorage.removeItem("userID");
    localStorage.removeItem("expiryDate");
    navigate("/");
  };

  const handleLogin = useCallback(async () => {
    const userID = localStorage.getItem("userID");
    if (!userID) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/user/${userID}`);

      const resData = await res.json();

      if (resData.error) throw resData.error;

      setUser(resData.user);
      setIsAuth(true);
    } catch (err) {
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const themeChoice = localStorage.getItem("theme") === "Dark";
    setIsDarkMode(themeChoice);

    // check expiry date of token
    // Retrieve the expiry date from localStorage
    const expiryDateStr = localStorage.getItem("expiryDate");

    if (!expiryDateStr) {
      return;
    }
    // Convert the expiry date string to a Date object
    const expiryDate = new Date(expiryDateStr);

    // Compare current time with expiry time
    if (Date.now() > expiryDate.getTime()) {
      // Token is expired. Clear it and redirect to login or handle appropriately.
      handleLogout();
      return;
    }

    if (!token) {
      setIsLoading(false);
      return;
    }
    handleLogin();
  }, [handleLogin]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // List of paths where the navbar should not be displayed
  const routesWithoutNavbar = ["/login", "/account", "/admin"]; // add other routes as needed

  const shouldRenderNavbar = !routesWithoutNavbar.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  return (
    <FeedbackProvider>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline enableColorScheme />
        <AuthContext.Provider value={{ handleLogout, toggleDarkMode }}>
          {shouldRenderNavbar && (
            <Navbar
              user={user}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
              handleLogout={handleLogout}
              isAuth={isAuth}
            />
          )}
          <Box sx={{ position: "relative", width: "100%", minHeight: "80vh" }}>
            <FeedbackAlert />
            {isLoading ? (
              <LoadingPage />
            ) : (
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/login"
                  element={<LoginPage handleLogin={handleLogin} />}
                />
                <Route
                  path="/profile/:userID"
                  element={<ProfilePage activeUser={user} />}
                />
                {/* Nested account routes */}
                <Route path="/account">
                  {/* Default route: redirect to settings */}
                  <Route index element={<Navigate to="settings" replace />} />
                  <Route
                    path=":section"
                    element={
                      <UserSpace handleLogout={handleLogout} user={user} />
                    }
                  />
                </Route>
                <Route path="/admin">
                  {/* Default route: redirect to settings */}
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route
                    path=":dashbaord"
                    element={
                      <AdminSpace handleLogout={handleLogout} user={user} />
                    }
                  />
                  <Route
                    path=":users"
                    element={
                      <AdminSpace handleLogout={handleLogout} user={user} />
                    }
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </Box>
        </AuthContext.Provider>
      </ThemeProvider>
    </FeedbackProvider>
  );
};

export default App;
