export const decodeToken = (token: string | null): any => {
  if (!token) return null;

  try {
    // Split the token into parts
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const getCurrentUserId = (): number | null => {
  const token = localStorage.getItem("token");
  const decodedToken = decodeToken(token);

  return decodedToken?.userId || null;
};
