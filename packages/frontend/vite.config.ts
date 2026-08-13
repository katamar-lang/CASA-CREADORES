import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Importa el código fuente TS del paquete compartido directamente, en vez del
      // build CJS en dist/. Evita problemas de interop CJS/ESM con Rollup en el bundle.
      "@casa-creadores/shared": path.resolve(__dirname, "../shared/src/index.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
