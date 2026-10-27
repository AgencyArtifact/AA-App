import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { appBasePath } from "./src/config.ts";

export default defineConfig({
  // Derived from config.appUrl.
  base: appBasePath,
  plugins: [react()],
  // Build stamp shown in the diagnostic report, so a report always says which version ran.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        // Blank page for browser popup sign-in. Loads only the MSAL bridge, not the app.
        auth: "auth.html",
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
