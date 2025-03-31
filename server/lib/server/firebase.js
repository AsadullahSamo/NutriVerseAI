import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found-handler';
const app = express();
// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://nutriverseai.web.app', 'https://nutriverseai.firebaseapp.com']
        : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 24 * 60 * 60 // 24 hours
}));
app.use(express.json());
// Routes
app.use('/api', router);
// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
//# sourceMappingURL=firebase.js.map