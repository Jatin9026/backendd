import express from 'express';
import product from './routes/productRoutes.js';
import user from './routes/userRoutes.js';
import order from './routes/orderRoutes.js';
import payment from './routes/paymentRoutes.js';
import help from './routes/helpRoutes.js';
import notification from './routes/notificationRoutes.js';
import search from './routes/searchRoutes.js';
import errorHandleMiddleware from './middleware/error.js';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors';

dotenv.config({ path: './config/config.env' });
const app = express();

const allowedOrigins = ["http://localhost:4000", "http://localhost:3000", "http://localhost:8000", "http://localhost:5000"];
app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));


// Swagger setup
const swaggerDocument = YAML.load('./swagger.yaml');
// prefer relative path for same-origin requests; use env only if explicitly provided
const swaggerServerUrl = process.env.SWAGGER_BASE_URL || (swaggerDocument.servers && swaggerDocument.servers[0] && swaggerDocument.servers[0].url) || '/api/v1';
swaggerDocument.servers = [{ url: swaggerServerUrl, description: 'API Server' }];

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      // include cookies (works for same-origin; use include if cross-origin and CORS allows credentials)
      requestInterceptor: (req) => {
        try {
          req.credentials = 'include';
        } catch (e) {
          // ignore if not supported
        }
        return req;
      },
    },
  })
);


// Routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.use("/api/v1", help);
app.use("/api/v1", notification);
app.use("/api/v1", search);

// Root route
app.get("/", (req, res) => {
    res.send("Backend API is running!");
});

// Error middleware
app.use(errorHandleMiddleware);

export default app;