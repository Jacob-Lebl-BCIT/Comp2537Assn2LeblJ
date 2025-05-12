import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

// Config imports
import connectDB from './config/database.js';
import { sessionMiddleware } from './config/session.js';

// Middleware imports
import { ensureLoggedIn } from './middleware/auth.js';

// Route imports
import mainRoutes from './routes/main.js';
import authRoutes from './routes/auth.js';
import membersRoutes from './routes/members.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: false })); // Parse form data
// app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(sessionMiddleware); // Session middleware

// Routes
app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/', membersRoutes);


// 404 handle
app.use((req, res) => {
    res.status(404).send('404 Not Found');
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});