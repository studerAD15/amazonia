import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../context/AuthContext";

export default function AmazonTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box>
      <AppBar position="sticky" sx={{ bgcolor: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Toolbar sx={{ display: "flex", gap: 2, minHeight: 70 }}>
          <Typography variant="h6" fontWeight={900} sx={{ minWidth: 132 }}>
            Amazonia
          </Typography>

          <TextField
            size="small"
            placeholder="Search users, products, orders"
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "#64748b" }} />
            }}
            sx={{
              width: "100%",
              maxWidth: 520,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                background: "#fff"
              }
            }}
          />

          <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
            <Button component={RouterLink} to="/dashboard" sx={{ color: "#fff", fontWeight: 600 }}>
              Dashboard
            </Button>
            {user?.role === "admin" ? (
              <Button component={RouterLink} to="/admin" sx={{ color: "#fff", fontWeight: 600 }}>
                Admin
              </Button>
            ) : null}
            <Button component={RouterLink} to="/profile" sx={{ color: "#fff", fontWeight: 600 }}>
              Profile
            </Button>
            <Chip
              label={(user?.role || "customer").toUpperCase()}
              size="small"
              sx={{ bgcolor: "#f59e0b", color: "#111827", fontWeight: 800 }}
            />
            <Avatar sx={{ width: 30, height: 30, bgcolor: "#334155" }}>
              {user?.name?.[0] || "U"}
            </Avatar>
            <Button
              variant="contained"
              sx={{ bgcolor: "#f59e0b", color: "#111827", "&:hover": { bgcolor: "#d97706" } }}
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
