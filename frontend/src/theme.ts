import { createTheme, ThemeOptions, lighten } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    borderColor: {
      primary: string;
    };
    background: {
      damp: string;
    };
    customColors: {
      goldDark: string;
    };
  }
  interface ThemeOptions {
    borderColor?: {
      primary?: string;
    };
    background?: {
      damp?: string;
    };
    customColors?: {
      goldDark?: string;
    };
  }
}

const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: 16,
    button: {
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: "8px",
        }),
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: "4px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: "12px",
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
          padding: "24px",
        }),
      },
    },
    // Add stronger shadow to the Menu component
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: "10px",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)", // Increased shadow
          overflow: "hidden",
        },
      },
    },
    // Style the menu items
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: "6px",
          margin: "2px 4px",
          "&:hover": {
            backgroundColor:
              theme.palette.mode === "light"
                ? lighten(theme.palette.primary.light, 0.9)
                : lighten(theme.palette.primary.dark, 0.1),
          },
        }),
      },
    },
    // Add stronger shadow to the Popover component
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: "10px",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)", // Increased shadow
        },
      },
    },
  },
};

const lightThemeOptions: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#1976D2",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D1C4E9",
      contrastText: "#000000",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    error: {
      main: "#D32F2F",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FFA000",
      contrastText: "#000000",
    },
    info: {
      main: "#0288D1",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#388E3C",
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
  },
  background: {
    damp: "#F9F9F9",
  },
  borderColor: {
    primary: "#1976D2",
  },
  customColors: {
    goldDark: "#DF9800",
  },
};

const darkThemeOptions: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#1976D2",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#9575CD",
      contrastText: "#000000",
    },
    background: {
      default: "#2C2C2C",
      paper: "#424242",
    },
    error: {
      main: "#D32F2F",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FFA000",
      contrastText: "#000000",
    },
    info: {
      main: "#0288D1",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#388E3C",
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#E0E0E0",
      secondary: "#B0B0B0",
    },
  },
  background: {
    damp: "#2C2C2C",
  },
  borderColor: {
    primary: "#1976D2",
  },
  customColors: {
    goldDark: "#D4AF37",
  },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);
