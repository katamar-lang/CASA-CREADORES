import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { getAllowedOrigins } from "./lib/cors";
import { assertRequiredEnv } from "./lib/env";

assertRequiredEnv();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Casa Creadores backend escuchando en el puerto ${PORT}`);
  console.log(`[CONFIG] Orígenes CORS configurados: ${getAllowedOrigins().join(", ")}`);
});
