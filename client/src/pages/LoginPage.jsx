import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Snackbar,
  Stack,
  Typography
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { axiosInstance } from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const schema = yup.object({
  email: yup.string().required("Email is required").email("Enter a valid email"),
  password: yup.string().required("Password is required")
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" }
  });

  async function onSubmit(values) {
    try {
      const res = await axiosInstance.post("/api/auth/login", values);
      login(res.data);
      setSnack({ open: true, severity: "success", message: "Login successful! Redirecting..." });
      setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
    } catch (e) {
      const message = !e.response
        ? "Network error. Please check your connection."
        : "Invalid email or password. Please try again.";
      setSnack({ open: true, severity: "error", message });
    }
  }

  return (
    <Box minHeight="100vh" display="grid" placeItems="center" px={2} py={3}>
      <Grid container spacing={2} sx={{ width: "100%", maxWidth: 980 }} alignItems="stretch">
        <Grid item xs={12} md={7}>
          <Card sx={{ width: "100%", borderRadius: 4, height: "100%" }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2.2}>
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-0.02em" }}>
                  Amazonia Admin
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to manage operations, inventory, and customer activity.
                </Typography>
                <Divider />
                {location.state?.message ? <Alert severity="warning">{location.state.message}</Alert> : null}
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={2}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={Boolean(errors.email)}>
                          <InputLabel htmlFor="email">Email</InputLabel>
                          <OutlinedInput {...field} id="email" label="Email" />
                          <FormHelperText role="alert">{errors.email?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={Boolean(errors.password)}>
                          <InputLabel htmlFor="password">Password</InputLabel>
                          <OutlinedInput
                            {...field}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            label="Password"
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword((p) => !p)}>
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                          <FormHelperText role="alert">{errors.password?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Link href="#">Forgot password?</Link>
                      <Link component={RouterLink} to="/register">
                        Create account
                      </Link>
                    </Stack>
                    <Button
                      type="submit"
                      variant="contained"
                      aria-label="Sign in to your account"
                      disabled={isSubmitting}
                      sx={{ py: 1.2, bgcolor: "#f59e0b", color: "#111827", "&:hover": { bgcolor: "#d97706" } }}
                    >
                      {isSubmitting ? (
                        <>
                          <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </Stack>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Secure session uses JWT with protected route access controls.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, height: "100%", bgcolor: "#fffaf2" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Demo Credentials
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use any of the following accounts to sign in:
              </Typography>
              <Stack spacing={1.2}>
                <Typography variant="body2">
                  Admin: <strong>admin@amazonclone.com</strong> / <strong>Admin1234</strong>
                </Typography>
                <Typography variant="body2">
                  Seller: <strong>seller@amazonclone.com</strong> / <strong>Seller1234</strong>
                </Typography>
                <Typography variant="body2">
                  Customer: <strong>customer@amazonclone.com</strong> / <strong>Customer1234</strong>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
