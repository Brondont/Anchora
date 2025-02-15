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
  // Allow configuration using `createTheme`
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
          borderRadius: "8px", // Rounded buttons
          // On hover, brighten the button instead of darkening
          "&:hover": {
            backgroundColor: lighten(theme.palette.primary.main, 0.2),
          },
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
          borderRadius: "12px", // Rounded corners
          border: `1px solid ${theme.palette.divider}`, // Light border for subtle effect
          backgroundColor: theme.palette.background.paper, // Ensure it's white
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)", // Binance has a very soft shadow
          padding: "24px", // Adds some internal spacing
        }),
      },
    },
  },
};

const lightThemeOptions: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#1976D2", // Trustworthy blue (Blue 700)
      contrastText: "#FFFFFF", // White text for high contrast
    },
    secondary: {
      main: "#D1C4E9", // Soft Lavender for secondary elements
      contrastText: "#000000",
    },
    background: {
      default: "#FFFFFF", // Pure white background
      paper: "#FFFFFF", // Clean white for paper elements
    },
    error: {
      main: "#D32F2F", // Red
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FFA000", // Amber
      contrastText: "#000000",
    },
    info: {
      main: "#0288D1", // Light Blue (for informational elements)
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#388E3C", // Green
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#333333", // Dark, easy-to-read text on white
      secondary: "#666666",
    },
  },
  background: {
    damp: "#F9F9F9", // Very light gray for subtle section backgrounds
  },
  borderColor: {
    primary: "#1976D2", // Matching the blue for borders
  },
  customColors: {
    goldDark: "#DF9800", // You can keep this for accents if needed
  },
};

const darkThemeOptions: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#1976D2", // Same trustworthy blue in dark mode
      contrastText: "#FFFFFF", // White text for readability
    },
    secondary: {
      main: "#9575CD", // Lilac for secondary elements
      contrastText: "#000000",
    },
    background: {
      default: "#2C2C2C", // Deep dark background
      paper: "#424242", // Slightly lighter for cards/paper
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
