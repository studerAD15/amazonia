import {
  Alert,
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Button,
  Typography
} from "@mui/material";
import AmazonTopbar from "../components/AmazonTopbar";
import { useAuth } from "../context/AuthContext";

const roleStats = {
  admin: ["Total Users", "Active Sessions", "Products", "Orders"],
  seller: ["My Listings", "Pending Orders", "Delivered Orders", "Revenue"],
  customer: ["Order History", "Delivered", "Processing", "Recommendations"]
};

const recommendedProducts = [
  {
    id: "p1",
    title: "Echo Dot (5th Gen)",
    price: "Rs 4,499",
    image:
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=800&q=60",
    badge: "Best Seller"
  },
  {
    id: "p2",
    title: "Wireless Bluetooth Headphones",
    price: "Rs 2,999",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=60",
    badge: "Deal"
  },
  {
    id: "p3",
    title: "Smart Fitness Watch",
    price: "Rs 5,299",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=60",
    badge: "Top Rated"
  },
  {
    id: "p4",
    title: "Portable SSD 1TB",
    price: "Rs 7,899",
    image:
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=60",
    badge: "Limited Stock"
  }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const stats = roleStats[user?.role] || roleStats.customer;
  const isCustomer = (user?.role || "customer") === "customer";

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

        {isCustomer ? (
          <Box mt={3}>
            <Typography variant="h5" fontWeight={900} mb={1.5}>
              Recommended Products
            </Typography>
            <Grid container spacing={2}>
              {recommendedProducts.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product.id}>
                  <Card sx={{ borderRadius: 3, height: "100%" }}>
                    <CardMedia
                      component="img"
                      image={product.image}
                      alt={product.title}
                      sx={{ height: 170, objectFit: "cover" }}
                    />
                    <CardContent>
                      <StackedLabel label={product.badge} />
                      <Typography fontWeight={700} sx={{ mt: 1 }}>
                        {product.title}
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="primary.main">
                        {product.price}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button variant="contained" fullWidth>
                        Add to Cart
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

function StackedLabel({ label }) {
  return <Chip size="small" color="warning" label={label} />;
}
