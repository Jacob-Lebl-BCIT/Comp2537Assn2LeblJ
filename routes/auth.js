import express from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { signupSchema, loginSchema } from '../utils/validation.js';
import { TTL } from '../config/session.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Navigate up to the main project directory


router.get('/signup', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/members');
    } else {
        // messages are available via res.locals.messages from middleware
        res.render('signup', { title: 'Sign Up' });
    }
});

router.post('/signupSubmit', async (req, res) => {
    const { email, password, name } = req.body;

    let missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
        req.flash('error', `Missing fields: ${missingFields.join(', ')}`);
        return res.redirect('/signup');
    }

    const validationResult = signupSchema.validate({ name, email, password });
    if (validationResult.error) {
        req.flash('error', `Validation error: ${validationResult.error.details[0].message}`);
        return res.redirect('/signup');
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            req.flash('error', 'Email already in use');
            return res.redirect('/signup');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        console.log("User created:", newUser);

        req.session.authenticated = true;
        req.session.email = email;
        req.session.name = name;
        req.session.userId = newUser._id;
        req.session.cookie.maxAge = TTL * 1000;

        res.redirect('/members');
    } catch (error) {
        console.error("Error during signup:", error);
        req.flash('error', 'An internal server error occurred. Please try again later.');
        res.redirect('/signup');
    }
});

router.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/members');
    } else {
        // messages are available via res.locals.messages from middleware
        res.render('login', { title: 'Log In' });
    }
});

router.post('/loginSubmit', async (req, res) => {
    const { email, password } = req.body;

    const validationResult = loginSchema.validate({ email, password });
    if (validationResult.error) {
        req.flash('error', `Validation error: ${validationResult.error.details[0].message}`);
        return res.redirect('/login');
    }

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            req.session.authenticated = true;
            req.session.email = email;
            req.session.name = user.name;
            req.session.userID = user._id;
            req.session.cookie.maxAge = TTL * 1000;

            console.log("User logged in:", user);
            res.redirect('/members');
        } else {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }
    } catch (error) {
        console.error("login error:", error);
        req.flash('error', 'Something went wrong during login.');
        res.redirect('/login');
    }
});

export default router;
