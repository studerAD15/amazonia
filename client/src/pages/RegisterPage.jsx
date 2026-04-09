import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { axiosInstance } from "../api/axiosInstance";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup.string().required("Password is required").min(8, "Minimum 8 chars"),
  role: yup.string().oneOf(["seller", "customer"]).required()
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "customer" }
  });

  async function onSubmit(values) {
    try {
      await axiosInstance.post("/api/auth/register", values);
      setSnack({ open: true, severity: "success", message: "Account created." });
      setTimeout(() => navigate("/login"), 900);
    } catch (e) {
      setSnack({ open: true, severity: "error", message: e.response?.data?.message || "Registration failed." });
    }
  }

  return (
    <Box minHeight="100vh" display="grid" placeItems="center" px={2} py={3}>
      <Card sx={{ width: "100%", maxWidth: 470, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.1}>
            <Typography variant="h5" fontWeight={900}>Create account</Typography>
            <Typography variant="body2" color="text.secondary">
              Register as seller or customer to access your role dashboard.
            </Typography>
            <Divider />
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Name" error={Boolean(errors.name)} helperText={errors.name?.message} />} />
                <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email" error={Boolean(errors.email)} helperText={errors.email?.message} />} />
                <Controller name="password" control={control} render={({ field }) => <TextField {...field} type="password" label="Password" error={Boolean(errors.password)} helperText={errors.password?.message} />} />
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Role" error={Boolean(errors.role)} helperText={errors.role?.message}>
                      <MenuItem value="customer">Customer</MenuItem>
                      <MenuItem value="seller">Seller</MenuItem>
                    </TextField>
                  )}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ py: 1.2, bgcolor: "#f59e0b", color: "#111827", "&:hover": { bgcolor: "#d97706" } }}
                >
                  Register
                </Button>
                <Button component={RouterLink} to="/login" color="inherit">Back to login</Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
