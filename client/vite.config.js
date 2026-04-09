import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    port: 3000
  }
});
