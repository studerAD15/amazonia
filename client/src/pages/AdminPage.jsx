import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import AmazonTopbar from "../components/AmazonTopbar";
import { axiosInstance } from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const colorByRole = { admin: "error", seller: "primary", customer: "success" };

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyMap, setBusyMap] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const stats = useMemo(() => {
    const total = users.length;
    const sellers = users.filter((u) => u.role === "seller").length;
    const customers = users.filter((u) => u.role === "customer").length;
    const inactive = users.filter((u) => !u.isActive).length;
    return { total, sellers, customers, inactive };
  }, [users]);

  async function loadUsers() {
    try {
      setError("");
      const res = await axiosInstance.get("/api/admin/users");
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load users.");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function setBusy(id, value) {
    setBusyMap((prev) => ({ ...prev, [id]: value }));
  }

  async function changeRole(id, role) {
    try {
      setBusy(id, true);
      setError("");
      await axiosInstance.patch(`/api/admin/users/${id}/role`, { role });
      setSuccess("Role updated successfully.");
      await loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update role.");
    } finally {
      setBusy(id, false);
    }
  }

  async function toggleUserStatus(targetUser) {
    try {
      setBusy(targetUser.id, true);
      setError("");
      await axiosInstance.patch(`/api/admin/users/${targetUser.id}/deactivate`, {
        isActive: !targetUser.isActive
      });
      setSuccess(targetUser.isActive ? "User deactivated." : "User activated.");
      await loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update user status.");
    } finally {
      setBusy(targetUser.id, false);
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return;

    try {
      setBusy(deleteTarget.id, true);
      setError("");
      await axiosInstance.delete(`/api/admin/users/${deleteTarget.id}`);
      setSuccess("User deleted successfully.");
      setDeleteTarget(null);
      await loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete user.");
    } finally {
      setBusy(deleteTarget.id, false);
    }
  }

  return (
    <Box minHeight="100vh">
      <AmazonTopbar />
      <Box className="page-shell">
        <Typography variant="h4" fontWeight={900} mb={0.5}>
          Admin Panel
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Manage users, seller accounts, and account lifecycle controls.
        </Typography>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">Total Users</Typography>
                <Typography variant="h4" fontWeight={900}>{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">Total Sellers</Typography>
                <Typography variant="h4" fontWeight={900}>{stats.sellers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">Customers</Typography>
                <Typography variant="h4" fontWeight={900}>{stats.customers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">Inactive Accounts</Typography>
                <Typography variant="h4" fontWeight={900}>{stats.inactive}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>User Accounts</Typography>
              <Chip label={`${users.length} total users`} color="primary" />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const isCurrentUser = currentUser?.id === u.id;
                    const isBusy = !!busyMap[u.id];

                    return (
                      <TableRow key={u.id} hover>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Chip label={u.role} color={colorByRole[u.role]} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.isActive ? "Active" : "Inactive"}
                            color={u.isActive ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Select
                              size="small"
                              value={u.role}
                              disabled={isBusy || isCurrentUser}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                            >
                              <MenuItem value="admin">admin</MenuItem>
                              <MenuItem value="seller">seller</MenuItem>
                              <MenuItem value="customer">customer</MenuItem>
                            </Select>
                            <Button
                              color={u.isActive ? "warning" : "success"}
                              variant="outlined"
                              disabled={isBusy || isCurrentUser}
                              onClick={() => toggleUserStatus(u)}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              color="error"
                              variant="outlined"
                              disabled={isBusy || isCurrentUser}
                              onClick={() => setDeleteTarget(u)}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleteTarget?.email}</strong>? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteUser}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={2500}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
