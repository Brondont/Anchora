import React from "react";
import { Breadcrumbs, Link } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useLocation } from "react-router-dom";

type BreadcrumbPath = "home" | "account" | "addresses";

const MyBreadcrumbs = () => {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    return pathnames;
  };

  // Mapping of paths to icons
  const breadcrumbIcons: Record<BreadcrumbPath, React.ReactNode> = {
    home: <HomeIcon color="primary" />,
    account: <AccountCircleIcon color="primary" />,
    addresses: <LocationOnIcon color="primary" />,
  };

  return (
    <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ p: 3 }}>
      <Link sx={{ display: "flex", alignItems: "center", gap: "4px" }} color="inherit" href="/" underline="none">
        {breadcrumbIcons.home} Home
      </Link>
      {getBreadcrumbs().map((path, index) => {
        const to = "/" + getBreadcrumbs().slice(0, index + 1).join("/");
        return (
          <Link sx={{ display: "flex", alignItems: "center", gap: "8px" }} key={to} color="inherit" href={to} underline="none">
            {breadcrumbIcons[path as BreadcrumbPath] || null} {path.charAt(0).toUpperCase() + path.slice(1)}
          </Link>
        );
      })}
    </Breadcrumbs>


  )
}

export default MyBreadcrumbs;
