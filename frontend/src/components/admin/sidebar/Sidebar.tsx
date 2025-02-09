import React, { ReactElement, useState, useCallback, useEffect } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Divider,
  useTheme,
  Tooltip,
  Button,
  Collapse,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { UserProps } from "../../../pages/user/ProfilePage";

const DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 64;
const TRANSITION_DURATION = 200;

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: TRANSITION_DURATION,
    }),
    backgroundColor: theme.palette.background.default,
    overflowX: "hidden",
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  minHeight: 64,
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
    "& .MuiListItemIcon-root": {
      color: "inherit",
    },
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const UserSection = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  width: "100%",
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export interface Section {
  name: string;
  path: string;
  icon: ReactElement;
  subSection?: {
    sections: Section[];
  };
}

interface SidebarProps {
  onSelect: (section: string) => void;
  sections: Section[];
  selectedSection: string;
  user: UserProps;
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onSelect,
  sections,
  selectedSection,
  user,
  handleLogout,
}) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const theme = useTheme();

  // Find and expand the section containing the selected item on mount
  useEffect(() => {
    if (selectedSection) {
      sections.forEach((section) => {
        if (
          section.subSection?.sections.some(
            (sub) => sub.path === selectedSection
          )
        ) {
          if (!expandedSections.includes(section.path)) {
            setExpandedSections((prev) => [...prev, section.path]);
          }
        }
      });
    }
  }, [selectedSection, sections]);

  const toggleDrawer = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const toggleSection = useCallback((sectionPath: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionPath)
        ? prev.filter((path) => path !== sectionPath)
        : [...prev, sectionPath]
    );
  }, []);

  const handleSectionClick = useCallback(
    (section: Section) => {
      if (section.subSection) {
        toggleSection(section.path);
      } else {
        onSelect(section.path);
      }
    },
    [onSelect, toggleSection]
  );

  const renderListItem = (section: Section, isSubSection = false) => (
    <ListItem
      disablePadding
      sx={{
        display: "block",
        pl: isSubSection && open ? 2 : 0,
      }}
    >
      <Tooltip title={!open ? section.name : ""} placement="right" arrow>
        <StyledListItemButton
          selected={section.path === selectedSection}
          onClick={() => handleSectionClick(section)}
          sx={{
            minHeight: 48,
            justifyContent: open ? "initial" : "center",
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 2 : "auto",
              justifyContent: "center",
            }}
          >
            {section.icon}
          </ListItemIcon>
          <ListItemText
            primary={section.name}
            sx={{
              opacity: open ? 1 : 0,
              "& .MuiTypography-root": {
                fontWeight: 500,
              },
            }}
          />
          {section.subSection && open && (
            <Box component="span" sx={{ ml: "auto" }}>
              {expandedSections.includes(section.path) ? (
                <ExpandLess />
              ) : (
                <ExpandMore />
              )}
            </Box>
          )}
        </StyledListItemButton>
      </Tooltip>

      {section.subSection && (
        <Collapse
          in={open && expandedSections.includes(section.path)}
          timeout="auto"
        >
          <List disablePadding>
            {section.subSection.sections.map((subSection) =>
              renderListItem(subSection, true)
            )}
          </List>
        </Collapse>
      )}
    </ListItem>
  );

  return (
    <StyledDrawer variant="permanent" open={open}>
      <DrawerHeader>
        <IconButton onClick={toggleDrawer}>
          {open ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </DrawerHeader>

      <Divider />

      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <Tooltip title={!open ? "Home" : ""} placement="right" arrow>
            <StyledListItemButton
              onClick={() => navigate("/")}
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : "auto",
                  justifyContent: "center",
                }}
              >
                <HomeIcon />
              </ListItemIcon>
              <ListItemText
                primary="Home"
                sx={{
                  opacity: open ? 1 : 0,
                  "& .MuiTypography-root": {
                    fontWeight: 500,
                  },
                }}
              />
            </StyledListItemButton>
          </Tooltip>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        {sections.map((section) => renderListItem(section))}
      </List>

      {user && (
        <UserSection>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 40,
                  height: 40,
                }}
              >
                {user.email.charAt(0).toUpperCase()}
              </Avatar>
              {open && (
                <Box sx={{ overflow: "hidden" }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              )}
            </Box>

            {open ? (
              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                color="error"
                fullWidth
                size="small"
              >
                Logout
              </Button>
            ) : (
              <Tooltip title="Logout" placement="right" arrow>
                <IconButton
                  onClick={handleLogout}
                  size="small"
                  sx={{ width: "100%" }}
                >
                  <LogoutIcon color="error" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </UserSection>
      )}
    </StyledDrawer>
  );
};

export default Sidebar;
