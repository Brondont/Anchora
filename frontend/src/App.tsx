import React, { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { useFeedback } from "./FeedbackAlertContext";
import FeedbackAlert from "./components/feedbackAlert/FeedbackAlert";
import { AuthContext } from "./authContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import LoadingPage from "./pages/LoadingPage";
import UserSpace from "./pages/user/UserSpace";
import { lightTheme, darkTheme } from "./theme";
import Navbar from "./components/navbar/Navbar";
import { Role, UserProps } from "./types";
import ProfilePage from "./pages/user/ProfilePage";
import AdminSpace from "./pages/admin/AdminSpace";
import AccountActivationPage from "./pages/AccountActivationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import TransactionTestPage from "./pages/TransactionsTestPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useEthers } from "@usedapp/core";
import OffersPage from "./pages/OffersPage";
import OfferPage from "./pages/OfferPage";
import hasRole from "./util/hasRole";
import ProposalCreationPage from "./pages/entrepreneur/ProposalCreationPage";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const { deactivate } = useEthers();
  const [user, setUser] = useState<UserProps | undefined>({
    ID: 0,
    CreatedAt: "",
    UpdatedAt: "",
    email: "",
    phoneNumber: "",
    firstName: "",
    lastName: "",
    Roles: [],
    publicWalletAddress: "",
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showFeedback } = useFeedback();

  const apiUrl = import.meta.env.VITE_API_URL;

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      localStorage.setItem("theme", prev ? "Light" : "Dark");
      return !prev;
    });
  };

  const handleLogout = () => {
    setIsAuth(false);
    setUser(undefined);
    localStorage.removeItem("token");
    localStorage.removeItem("userID");
    localStorage.removeItem("publicWalletAddress");
    localStorage.removeItem("expiryDate");
    deactivate();
    navigate("/");
  };

  const handleLogin = useCallback(
    async (token: string) => {
      const userID = localStorage.getItem("userID");
      if (!userID) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/user/${userID}`, {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        const resData = await res.json();

        if (resData.error) throw resData.error;

        setUser(resData.user);
        localStorage.setItem(
          "publicWalletAddress",
          resData.user.publicWalletAddress
        );
        setIsAuth(true);
      } catch (err) {
        showFeedback(
          "An error occurred while validating your account. You have been signed out for security reasons.",
          false
        );
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  const handleUpdateUser = (newUser: UserProps) => {
    setUser(newUser);
  };

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
    handleLogin(token);
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
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<PasswordResetPage />} />
              <Route path="/activation" element={<AccountActivationPage />} />
              <Route path="/offers">
                <Route index element={<OffersPage />} />
                <Route path=":offerID" element={<OfferPage user={user} />} />
              </Route>

              {!isAuth ? (
                <>
                  <Route
                    path="/login"
                    element={<LoginPage handleLogin={handleLogin} />}
                  />
                </>
              ) : (
                <>
                  {/* this is for testing purposes only */}
                  <Route
                    path="/transactions"
                    element={<TransactionTestPage />}
                  />

                  <Route
                    path="/profile/:userID"
                    element={<ProfilePage activeUser={user} />}
                  />
                  <Route
                    path="/account/*"
                    element={
                      <UserSpace
                        user={user}
                        handleUpdateUser={handleUpdateUser}
                        handleLogout={handleLogout}
                      />
                    }
                  />
                  {hasRole(user, "admin") && (
                    <Route
                      path="/admin/*"
                      element={
                        <AdminSpace user={user} handleLogout={handleLogout} />
                      }
                    />
                  )}
                  {(hasRole(user, "entrepreneur") ||
                    hasRole(user, "tender")) && (
                    <Route path="/proposals">
                      <Route
                        path="submit/:offerID"
                        element={<ProposalCreationPage user={user} />}
                      />
                    </Route>
                  )}
                </>
              )}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          )}
        </Box>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

export default App;
