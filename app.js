import express from "express";
import product from "./routes/productRoutes.js";
import user from "./routes/userRoutes.js";
import order from "./routes/orderRoutes.js";
import payment from "./routes/paymentRoutes.js";
import help from "./routes/helpRoutes.js";
import notification from "./routes/notificationRoutes.js";
import search from "./routes/searchRoutes.js";
import errorHandleMiddleware from "./middleware/error.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import cors from "cors";

dotenv.config({ path: "./config/config.env" });

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const swaggerDocument = YAML.load("./swagger.yaml");

const swaggerServerUrl =
  process.env.SWAGGER_BASE_URL ||
  (swaggerDocument.servers &&
    swaggerDocument.servers[0] &&
    swaggerDocument.servers[0].url) ||
  "/api/v1";

swaggerDocument.servers = [
  { url: swaggerServerUrl, description: "API Server" },
];

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (req) => {
        try {
          req.credentials = "include";
        } catch (e) {
          return req;
        }
        return req;
      },
    },
  })
);

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.use("/api/v1", help);
app.use("/api/v1", notification);
app.use("/api/v1", search);

app.get("/", (req, res) => {
  res.status(200).send("Backend API is running!");
});

app.use(errorHandleMiddleware);

export default app;
