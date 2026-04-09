import { Alert, Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";
import AmazonTopbar from "../components/AmazonTopbar";
import { useAuth } from "../context/AuthContext";

const roleStats = {
  admin: ["Total Users", "Active Sessions", "Products", "Orders"],
  seller: ["My Listings", "Pending Orders", "Delivered Orders", "Revenue"],
  customer: ["Order History", "Delivered", "Processing", "Recommendations"]
};

export default function DashboardPage() {
  const { user } = useAuth();
  const stats = roleStats[user?.role] || roleStats.customer;

  return (
    <Box minHeight="100vh">
      <AmazonTopbar />
      <Box className="page-shell">
        <Typography variant="h4" fontWeight={900} mb={0.5}>
          Welcome back, {user?.name}
        </Typography>
        <Typography color="text.secondary" mb={1.2}>
          Your operational summary is ready. Monitor platform activity and take action.
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Signed in as {user?.role || "customer"}.
        </Alert>
        <Grid container spacing={2}>
          {stats.map((title, i) => (
            <Grid item xs={12} sm={6} md={3} key={title}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography color="text.secondary" fontWeight={600}>
                    {title}
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>{(i + 1) * 12}</Typography>
                  <Chip
                    label={i % 2 === 0 ? "+12.5% MoM" : "Stable"}
                    size="small"
                    color={i % 2 === 0 ? "success" : "default"}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
