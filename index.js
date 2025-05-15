import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import flash from 'connect-flash'; // Import connect-flash

// Config imports
import connectDB from './config/database.js';
import { sessionMiddleware } from './config/session.js';

// Middleware imports
import { ensureLoggedIn } from './middleware/auth.js';

// Route imports
import mainRoutes from './routes/main.js';
import authRoutes from './routes/auth.js';
import membersRoutes from './routes/members.js';
import adminRoutes from './routes/admin.js'; // Import admin routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8100;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set views directory

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: false })); // Parse form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(sessionMiddleware); // Session middleware
app.use(flash()); // Use connect-flash middleware

// Middleware to make flash messages available in templates
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Routes
app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/', membersRoutes);
app.use('/', adminRoutes); // Use admin routes

// 403 route for forbidden access
app.get('/403', (req, res) => {
    res.status(403).render('403');
});

// 404 handle
app.use((req, res) => {
    res.status(404).render('404');
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});