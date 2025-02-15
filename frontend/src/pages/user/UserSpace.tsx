import React, { useEffect, useState } from "react";
import { UserProps } from "../../types";
import { Box } from "@mui/material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import Sidebar, { Section } from "../../components/sidebar/Sidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainSettings from "../../components/user/MainSettings";

interface UserSpaceProps {
  user: UserProps | undefined;
  handleLogout: () => void;
}

const UserSpace: React.FC<UserSpaceProps> = ({ user, handleLogout }) => {
  const [selectedSection, setSelectedSection] = useState("settings"); // State to manage active page
  const { section } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const sections: Section[] = [
    {
      name: "My Settings",
      path: "settings",
      icon: <ManageAccountsIcon />,
    },
  ];

  useEffect(() => {
    if (section) {
      setSelectedSection(section);
    } else {
      hanldeUpdateSelectedSection("settings");
    }
  }, [location]);

  const hanldeUpdateSelectedSection = (path: string) => {
    setSelectedSection(path);
    navigate(`/account/${path}`);
  };

  const renderContent = () => {
    switch (selectedSection) {
      case "settings":
        return <MainSettings />;
      default:
        return <MainSettings />;
    }
  };

  return (
    <Box sx={{ minWidth: "100%" }}>
      <Sidebar
        onSelect={hanldeUpdateSelectedSection}
        sections={sections}
        selectedSection={selectedSection}
        user={user}
        handleLogout={handleLogout}
      />
      <Box>{renderContent()}</Box>
    </Box>
  );
};

export default UserSpace;
