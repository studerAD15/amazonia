import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <Box minHeight="100vh" display="grid" placeItems="center" px={2}>
      <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
        <Typography variant="h2" fontWeight={900}>403</Typography>
        <Typography variant="h5" fontWeight={800}>Unauthorized Access</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
          You do not have permission to access this module. Contact an administrator if this is unexpected.
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ px: 3 }}>
          Back to dashboard
        </Button>
      </Stack>
    </Box>
  );
}
