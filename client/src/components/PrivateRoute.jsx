import { Navigate, Outlet } from "react-router-dom";
import { CircularProgress, Stack } from "@mui/material";
import { useAuth } from "../context/AuthContext";

function decodePayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function PrivateRoute({ roles }) {
  const { token, user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <Stack minHeight="100vh" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Stack>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  const payload = decodePayload(token);
  if (!payload?.exp || payload.exp * 1000 < Date.now()) {
    logout();
    return <Navigate to="/login" replace state={{ message: "Session expired" }} />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
