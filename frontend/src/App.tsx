import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { FeedbackProvider } from "./FeedbackAlertContext";
import FeedbackAlert from "./components/feedbackAlert/FeedbackAlert";
import { AuthContext } from "./authContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import LoadingPage from "./pages/user/LoadingPage";
import { lightTheme, darkTheme } from "./theme";
import Navbar from "./components/navbar/Navbar";
import { UserProps } from "./types";

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
    isAdmin: false,
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const location = useLocation();

  const setClientUser = () => {};

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      localStorage.setItem("theme", prev ? "Light" : "Dark"); // if dark true set it to light if false set it to dark
      return !prev;
    });
  };

  const handleLogout = () => {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const getRoutes = () => {
    return (
      <>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage handleLogin={() => {}} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </>
    );
  };

  const shouldRenderNavbar = !location.pathname.startsWith("/login");

  return (
    <FeedbackProvider>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline enableColorScheme />
        <AuthContext.Provider
          value={{
            handleLogout: handleLogout,
            toggleDarkMode: toggleDarkMode,
          }}
        >
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
            {isLoading ? <LoadingPage /> : <Routes>{getRoutes()}</Routes>}
          </Box>
        </AuthContext.Provider>
      </ThemeProvider>
    </FeedbackProvider>
  );
};

export default App;
