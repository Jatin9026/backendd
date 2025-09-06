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

app.use(cors({
    origin: ["http://localhost:4000","http://localhost:3000","http://localhost:8000","http://localhost:5000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));  
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Swagger setup
const swaggerDocument = YAML.load('./swagger.yaml');

app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,  
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