import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import brandsRoutes from "./routes/brands.routes";
import campaignsRoutes from "./routes/campaigns.routes";
import creatorsRoutes from "./routes/creators.routes";
import paymentsRoutes from "./routes/payments.routes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "casa-creadores-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/creators", creatorsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
