import { Box, Card, CardContent, Chip, Divider, Grid, TextField, Typography } from "@mui/material";
import AmazonTopbar from "../components/AmazonTopbar";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Box minHeight="100vh">
      <AmazonTopbar />
      <Box className="page-shell" sx={{ maxWidth: 920 }}>
        <Typography variant="h4" fontWeight={900} mb={0.5}>Profile</Typography>
        <Typography color="text.secondary" mb={2}>
          Review your account identity and role authorization details.
        </Typography>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800} mb={1.3}>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField label="Name" value={user?.name || ""} fullWidth disabled /></Grid>
              <Grid item xs={12} md={6}><TextField label="Email" value={user?.email || ""} fullWidth disabled /></Grid>
              <Grid item xs={12}>
                <Chip
                  label={`Role: ${user?.role || "customer"}`}
                  color={user?.role === "admin" ? "error" : user?.role === "seller" ? "primary" : "success"}
                  sx={{ textTransform: "capitalize", fontWeight: 700 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
