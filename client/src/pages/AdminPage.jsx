import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Select,
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

const colorByRole = { admin: "error", seller: "primary", customer: "success" };

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const res = await axiosInstance.get("/api/admin/users");
      setUsers(res.data.users);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load users.");
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function changeRole(id, role) {
    await axiosInstance.patch(`/api/admin/users/${id}/role`, { role });
    loadUsers();
  }

  return (
    <Box minHeight="100vh">
      <AmazonTopbar />
      <Box className="page-shell">
        <Typography variant="h4" fontWeight={900} mb={0.5}>Admin Panel</Typography>
        <Typography color="text.secondary" mb={2}>
          Manage user lifecycle, role assignments, and account moderation.
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>
                User Accounts
              </Typography>
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
                  {users.map((u) => (
                    <TableRow key={u._id} hover>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Chip label={u.role} color={colorByRole[u.role]} size="small" /></TableCell>
                      <TableCell>{u.isActive ? "Active" : "Inactive"}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Select size="small" value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                            <MenuItem value="admin">admin</MenuItem>
                            <MenuItem value="seller">seller</MenuItem>
                            <MenuItem value="customer">customer</MenuItem>
                          </Select>
                          <Button color="warning" onClick={() => axiosInstance.patch(`/api/admin/users/${u._id}/deactivate`).then(loadUsers)}>Deactivate</Button>
                          <Button color="error" onClick={() => axiosInstance.delete(`/api/admin/users/${u._id}`).then(loadUsers)}>Delete</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
