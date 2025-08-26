import express from 'express';
import product from './routes/productRoutes.js';
import user from './routes/userRoutes.js';
import order from './routes/orderRoutes.js';
import payment from './routes/paymentRoutes.js';
import errorHandleMiddleware from './middleware/error.js';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';

// Swagger imports
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Load environment variables
dotenv.config({ path: './config/config.env' });

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerDocument = YAML.load('./swagger.yaml'); // make sure swagger.yaml is in the root or adjust path
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

// Root route
app.get("/", (req, res) => {
    res.send("Backend API is running!");
});

// Error middleware
app.use(errorHandleMiddleware);

export default app;
