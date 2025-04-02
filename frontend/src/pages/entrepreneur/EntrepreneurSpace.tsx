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
} from "react-router-dom";
import MainSettings from "../../components/entrepreneur/MainSettings";
import FolderIcon from "@mui/icons-material/Folder";
import EntrepreneurProposals from "../../components/entrepreneur/EntrepreneurProposals";

interface UserSpaceProps {
  user: UserProps | undefined;
  handleUpdateUser: (newUser: UserProps) => void;
  handleLogout: () => void;
}

const SideBarSections: Section[] = [
  {
    name: "Settings",
    path: "settings",
    icon: <ManageAccountsIcon />,
  },
  {
    name: "Your Proposals",
    path: "proposals",
    icon: <FolderIcon />,
  },
];

const EntrepreneurSpace: React.FC<UserSpaceProps> = ({
  user,
  handleUpdateUser,
  handleLogout,
}) => {
  const [activeSection, setSelectedSection] = useState("settings");
  const location = useLocation();
  const navigate = useNavigate();

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
        sections={SideBarSections}
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
          <Route path="proposals" element={<EntrepreneurProposals />} />
          <Route path="*" element={<Navigate to="/account/settings" />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default EntrepreneurSpace;
