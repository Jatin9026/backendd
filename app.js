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

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(fileUpload());

// Swagger setup
const swaggerDocument = YAML.load('./swagger.yaml');
// prefer relative path for same-origin requests; use env only if explicitly provided
const swaggerServerUrl = process.env.SWAGGER_BASE_URL || (swaggerDocument.servers && swaggerDocument.servers[0] && swaggerDocument.servers[0].url) || '/api/v1';
swaggerDocument.servers = [{ url: swaggerServerUrl, description: 'API Server' }];

// // Add GitHub info to swagger document
// swaggerDocument.info = {
//   ...swaggerDocument.info,
//   description: `${swaggerDocument.info?.description || 'API Documentation'}\n\n[![GitHub](https://img.shields.io/badge/GitHub-View%20Source-black?logo=github)](https://github.com/Jatin9026/backendd)`,
//   contact: {
//     ...swaggerDocument.info?.contact,
//     name: 'GitHub Repository',
//     url: 'https://github.com/Jatin9026/backendd'
//   }
// };

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    // customSiteTitle: "Backend API Documentation",
    // customCss: `
    //   .swagger-ui .topbar { display: none }
    //   .swagger-ui .info .info__extdocs {
    //     margin-top: 20px;
    //   }
    //   .github-link {
    //     display: inline-flex;
    //     align-items: center;
    //     gap: 8px;
    //     margin-top: 15px;
    //     padding: 10px 16px;
    //     background-color: #24292e;
    //     color: white !important;
    //     text-decoration: none;
    //     border-radius: 6px;
    //     font-size: 14px;
    //     font-weight: 500;
    //   }
    //   .github-link:hover {
    //     background-color: #3b4252;
    //   }
    // `,
    swaggerOptions: {
      persistAuthorization: true,
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
