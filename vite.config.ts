import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
      serverModuleFormat: "cjs",
    }),
    tsconfigPaths(),
    viteCommonjs(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
    include: ["@mui/material", "@mui/icons-material", "@mui/utils"], // Add specific dependencies if needed
  },
});
