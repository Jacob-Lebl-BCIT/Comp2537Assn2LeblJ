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
        res.sendFile('signup.html', { root: path.join(__dirname, 'public') });
    }
});

router.post('/signupSubmit', async (req, res) => {
    const { email, password, name } = req.body;

    let missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
        return res.status(400).send(`Missing fields: ${missingFields.join(', ')}
         <br><br> <a href="/signup">Try again</a>`);
    }

    const validationResult = signupSchema.validate({ name, email, password });
    if (validationResult.error) {
        return res.status(400).send(`Validation error: ${validationResult.error.details[0].message}
         <br><br> <a href="/signup">Try again</a>`);
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send(`Email already in use
             <br><br> <a href="/signup">Try again</a>`);
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
        res.status(500).send("An internal server error occurred. Please try again later.");
    }
});

router.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/members');
    } else {
        res.sendFile('login.html', { root: path.join(__dirname, 'public') });
    }
});

router.post('/loginSubmit', async (req, res) => {
    const { email, password } = req.body;

    const validationResult = loginSchema.validate({ email, password });
    if (validationResult.error) {
        return res.status(400).send(`Validation error: ${validationResult.error.details[0].message}
         <br><br> <a href="/login">Try again</a>`);
    }

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).send(`Invalid email or password
             <br><br> <a href="/login">Try again</a>`);
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
            return res.status(401).send(`Invalid email or password
             <br><br> <a href="/login">Try again</a>`);
        }
    } catch (error) {
        console.error("login error:", error);
        res.status(500).send("Something went wrong during login.");
    }
});

export default router;
