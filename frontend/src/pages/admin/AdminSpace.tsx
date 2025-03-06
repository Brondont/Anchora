import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import Dashboard from "../../components/admin/dashboard/Dashboard";
import Sidebar, { Section } from "../../components/sidebar/Sidebar";
import { UserProps } from "../../types";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import UserManagement from "../../components/admin/user/UserManagement";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EditIcon from "@mui/icons-material/Edit";
import PeopleIcon from "@mui/icons-material/People";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AdminUserEdit from "../../components/admin/user/AdminUserEdit";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ContractCreation from "../../components/contracts/ContractsCreation";

interface AdminSpaceProps {
  handleLogout: () => void;
  user: UserProps | undefined;
}

const SideBarSections: Section[] = [
  { name: "Dashboard", path: "dashboard", icon: <DashboardIcon /> },
  { name: "Contracts", path: "contracts", icon: <HandshakeIcon /> },
  {
    name: "Users Managment",
    path: "users-managment",
    icon: <ManageAccountsIcon />,
    subSection: {
      sections: [
        {
          name: "Users",
          path: "users",
          icon: <PeopleIcon />,
        },
        {
          name: "User Details",
          path: "user-details",
          icon: <EditIcon />,
        },
      ],
    },
  },
];

const AdminSpace: React.FC<AdminSpaceProps> = ({ handleLogout, user }) => {
  const [activeSection, setSelectedSection] = useState("dashboard");
  const location = useLocation();
  const navigate = useNavigate();

  const handleUpdateSelectedSection = (path: string) => {
    setSelectedSection(path);
    navigate(`/admin/${path}`);
  };

  useEffect(() => {
    const path = window.location.pathname.split("/admin/")[1];
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="user-details" element={<AdminUserEdit />} />
          <Route path="contracts" element={<ContractCreation />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminSpace;
