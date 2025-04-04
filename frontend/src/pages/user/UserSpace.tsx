import React, { useEffect, useState } from "react";
import { UserProps } from "../../types";
import { Box } from "@mui/material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import Sidebar, { Section } from "../../components/sidebar/Sidebar";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  Navigate,
  Outlet,
} from "react-router-dom";
import MainSettings from "../../components/entrepreneur/MainSettings";
import FolderIcon from "@mui/icons-material/Folder";
import EntrepreneurProposals from "../../components/entrepreneur/EntrepreneurProposals";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
// Import the components for different roles
import ExpertEvaluations from "../../components/expert/ExpertEvaluations";
import TenderOffers from "../../components/tender/TenderOffers";
import hasRole from "../../util/hasRole";

interface UserSpaceProps {
  user: UserProps | undefined;
  handleUpdateUser: (newUser: UserProps) => void;
  handleLogout: () => void;
}

const UserSpace: React.FC<UserSpaceProps> = ({
  user,
  handleUpdateUser,
  handleLogout,
}) => {
  const [activeSection, setSelectedSection] = useState("settings");
  const location = useLocation();
  const navigate = useNavigate();

  // Define sections based on user roles
  const getSections = (): Section[] => {
    const sections: Section[] = [
      {
        name: "Settings",
        path: "settings",
        icon: <ManageAccountsIcon />,
      },
    ];

    // Sections for Entrepreneur
    if (hasRole(user, "entrepreneur")) {
      sections.push({
        name: "Your Proposals",
        path: "entrepreneur/proposals",
        icon: <FolderIcon />,
      });
    }

    // Sections for Expert
    if (hasRole(user, "expert")) {
      sections.push({
        name: "Evaluations",
        path: "expert/evaluations",
        icon: <AssessmentIcon />,
      });
    }

    // Sections for Tender
    if (hasRole(user, "tender")) {
      sections.push({
        name: "Offers",
        path: "tender/offers",
        icon: <BusinessCenterIcon />,
      });
    }

    return sections;
  };

  const handleUpdateSelectedSection = (path: string) => {
    setSelectedSection(path);
    navigate(`/account/${path}`);
  };

  useEffect(() => {
    const path = window.location.pathname.split("/account/")[1];
    if (path) {
      setSelectedSection(path);
    }
  }, [location]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar
        user={user}
        sections={getSections()}
        selectedSection={activeSection}
        handleLogout={handleLogout}
        onSelect={handleUpdateSelectedSection}
      />
      <Box sx={{ mt: 2, flexGrow: 1, p: 4 }}>
        <Routes>
          <Route
            path="settings"
            element={
              <MainSettings user={user} handleUpdateUser={handleUpdateUser} />
            }
          />

          {hasRole(user, "entrepreneur") && (
            <Route path="entrepreneur/*" element={<Outlet />}>
              <Route path="proposals" element={<EntrepreneurProposals />} />
              <Route
                path="*"
                element={<Navigate to="/account/entrepreneur/proposals" />}
              />
            </Route>
          )}

          {hasRole(user, "expert") && (
            <Route path="expert/*" element={<Outlet />}>
              <Route path="evaluations" element={<ExpertEvaluations />} />
              <Route
                path="*"
                element={<Navigate to="/account/expert/evaluations" />}
              />
            </Route>
          )}

          {hasRole(user, "tender") && (
            <Route path="tender/*" element={<Outlet />}>
              <Route path="offers" element={<TenderOffers />} />
              <Route
                path="*"
                element={<Navigate to="/account/tender/offers" />}
              />
            </Route>
          )}

          <Route path="*" element={<Navigate to="/account/settings" />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default UserSpace;
