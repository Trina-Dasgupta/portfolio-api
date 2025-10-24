import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { logger } from "./utils/logger.js";
import { getLocalStoragePath } from "./services/s3Services.js";

const app = express();

const allowedOrigins = process.env.FRONTEND_URLS.split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRECT));

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`,
      { ip: req.ip, userAgent: req.get("user-agent"), origin: req.get("origin") }
    );
  });
  next();
});

app.use('/uploads', express.static(getLocalStoragePath()));


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Hello World !!" });
}); 

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT, () => console.log("Server running on port 5000 🚀"));
