import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/duoduo-maze/",
  server: {
    port: 9999,
    host: "0.0.0.0"
  },
});
