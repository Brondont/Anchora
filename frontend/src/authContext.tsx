import { createContext } from "react";

export type AuthContextType = {
  handleLogout: () => void;
  toggleDarkMode: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
